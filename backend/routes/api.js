// backend/routes/api.js — REST API routes
import { Router } from 'express';
import { config } from '../config.js';
import { startSimulation, getSimulationStatus } from '../simulation/engine.js';
import { getAgentManifest } from '../agents/index.js';
import { NewsFetcher } from '../data-sources/news-fetcher.js';
import {
  getSimulation,
  listSimulations,
  getDistrictHistory,
  getSimulationPredictions,
} from '../db/database.js';

export const apiRouter = Router();
const newsFetcher = new NewsFetcher();

// POST /api/simulation/start — Start a new simulation
apiRouter.post('/simulation/start', async (req, res) => {
  try {
    const { seedData, predictionQuery, rounds } = req.body;

    // Optionally fetch live news to augment seed data
    let enrichedSeedData = seedData || {};
    try {
      const articles = await newsFetcher.fetchNews();
      const newsContext = newsFetcher.buildContext(articles);
      enrichedSeedData.newsContext = newsContext;
      enrichedSeedData.articlesCount = articles.length;
    } catch (err) {
      console.warn('⚠️ News fetch skipped:', err.message);
      enrichedSeedData.newsContext = newsFetcher.buildContext([]);
    }

    const result = await startSimulation({
      seedData: enrichedSeedData,
      predictionQuery: predictionQuery || 'Predict Hong Kong property price trends for the next 3-12 months across all 18 districts.',
      rounds: rounds || config.simulation.rounds,
    });

    res.json(result);
  } catch (err) {
    console.error('❌ Simulation start error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/simulation/:id/status — Poll simulation progress
apiRouter.get('/simulation/:id/status', (req, res) => {
  const status = getSimulationStatus(req.params.id);
  if (!status) {
    // Check DB as fallback
    const dbSim = getSimulation(req.params.id);
    if (dbSim) {
      return res.json({
        id: dbSim.id,
        status: dbSim.status,
        currentPhase: dbSim.status === 'completed' ? 'Complete' : dbSim.status,
      });
    }
    return res.status(404).json({ error: 'Simulation not found' });
  }
  res.json({
    id: status.id,
    status: status.status,
    currentRound: status.currentRound,
    totalRounds: status.totalRounds,
    currentPhase: status.currentPhase,
    agentsCompleted: status.agentsCompleted,
    totalAgents: status.totalAgents,
    startedAt: status.startedAt,
    completedAt: status.completedAt,
    error: status.error,
  });
});

// GET /api/simulation/:id/report — Get final prediction report
apiRouter.get('/simulation/:id/report', (req, res) => {
  const status = getSimulationStatus(req.params.id);
  if (status?.report) {
    return res.json({ id: status.id, report: status.report });
  }

  // Check DB
  const dbSim = getSimulation(req.params.id);
  if (dbSim?.report) {
    return res.json({ id: dbSim.id, report: dbSim.report });
  }

  if (status && status.status !== 'completed') {
    return res.json({ id: req.params.id, status: status.status, message: 'Simulation still running' });
  }

  res.status(404).json({ error: 'Report not found' });
});

// GET /api/simulation/:id/transcript — Full agent debate transcript
apiRouter.get('/simulation/:id/transcript', (req, res) => {
  const status = getSimulationStatus(req.params.id);
  if (!status) {
    return res.status(404).json({ error: 'Simulation not found or transcript expired' });
  }
  res.json({ id: status.id, transcript: status.transcript });
});

// GET /api/districts — List all 18 districts
apiRouter.get('/districts', (req, res) => {
  res.json(config.districts.map(d => ({
    code: d.code,
    name: d.name,
    nameCn: d.nameCn,
    region: d.region,
    keyAreas: d.keyAreas,
    priceRange: d.priceRange,
  })));
});

// GET /api/districts/:code/history — Historical predictions for a district
apiRouter.get('/districts/:code/history', (req, res) => {
  const code = req.params.code.toUpperCase();
  const district = config.districts.find(d => d.code === code);
  if (!district) {
    return res.status(404).json({ error: 'District not found' });
  }

  const history = getDistrictHistory(code);
  res.json({ district, history });
});

// GET /api/agents — Agent manifest
apiRouter.get('/agents', (req, res) => {
  res.json(getAgentManifest());
});

// GET /api/simulations — List past simulations
apiRouter.get('/simulations', (req, res) => {
  const simulations = listSimulations();
  res.json(simulations);
});

// GET /api/simulation/:id/predictions — District predictions for a simulation
apiRouter.get('/simulation/:id/predictions', (req, res) => {
  const predictions = getSimulationPredictions(req.params.id);
  res.json(predictions);
});
