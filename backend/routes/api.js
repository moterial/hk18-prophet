// backend/routes/api.js — REST API routes
import { Router } from 'express';
import { config } from '../config.js';
import { startSimulation, startDistrictSimulation, startEstateSimulation, getSimulationStatus, getCachedDistrictResult, getCachedEstateResult, getRunningDistricts } from '../simulation/engine.js';
import { getAgentManifest } from '../agents/index.js';
import { NewsFetcher } from '../data-sources/news-fetcher.js';
import { ragStats } from '../data-sources/rag-store.js';
import {
  getSimulation,
  listSimulations,
  getDistrictHistory,
  getSimulationPredictions,
} from '../db/database.js';

export const apiRouter = Router();
const newsFetcher = new NewsFetcher();

// RAG stats
apiRouter.get('/rag/stats', async (req, res) => {
  const stats = await ragStats();
  res.json(stats);
});

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

// GET /api/districts/status — Get running/cached status for all districts
apiRouter.get('/districts/status', (req, res) => {
  const statuses = {};
  for (const d of config.districts) {
    const cached = getCachedDistrictResult(d.code);
    if (cached) {
      statuses[d.code] = { status: 'completed', direction: cached.report?.direction || 'stable', simulationId: cached.simulationId, cachedAt: new Date(cached.timestamp).toISOString() };
    }
  }
  const running = getRunningDistricts();
  for (const [code, info] of Object.entries(running)) {
    statuses[code] = { status: 'running', ...info };
  }
  res.json(statuses);
});

// GET /api/estates/search — Search estates across all districts
apiRouter.get('/estates/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q || q.length < 2) {
    return res.json([]);
  }

  const results = [];
  for (const d of config.districts) {
    for (const e of (d.majorEstates || [])) {
      if (
        e.name.toLowerCase().includes(q) ||
        e.nameCn.includes(q) ||
        e.area.toLowerCase().includes(q)
      ) {
        results.push({
          name: e.name,
          nameCn: e.nameCn,
          area: e.area,
          districtCode: d.code,
          districtName: d.name,
          districtNameCn: d.nameCn,
          region: d.region,
        });
      }
    }
  }
  res.json(results);
});

// POST /api/estate/analyze — Start single-estate analysis (known or free-text)
apiRouter.post('/estate/analyze', async (req, res) => {
  try {
    const { estateName, districtCode, query } = req.body;
    const force = req.query.force === 'true';

    // Free-text mode: user typed any building name
    if (query) {
      const q = query.trim();
      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'query must be at least 2 characters' });
      }
      // Include district code in cache key if provided
      const cacheDistrict = districtCode ? districtCode.toUpperCase() : '';
      const estateKey = cacheDistrict ? `custom:${cacheDistrict}:${q}` : `custom:${q}`;
      if (!force) {
        const cached = getCachedEstateResult(estateKey);
        if (cached) {
          return res.json({ cached: true, report: cached.report, simulationId: cached.simulationId });
        }
      }
      const result = await startEstateSimulation({
        query: q,
        districtCode: cacheDistrict || undefined,
      });
      return res.json(result);
    }

    // Known estate mode: from config
    if (!estateName || !districtCode) {
      return res.status(400).json({ error: 'estateName + districtCode or query is required' });
    }

    const code = districtCode.toUpperCase();
    const district = config.districts.find(d => d.code === code);
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    const estate = district.majorEstates.find(e =>
      e.name.toLowerCase() === estateName.toLowerCase() || e.nameCn === estateName
    );
    if (!estate) {
      return res.status(404).json({ error: 'Estate not found in district' });
    }

    const estateKey = `${code}:${estate.name}`;
    if (!force) {
      const cached = getCachedEstateResult(estateKey);
      if (cached) {
        return res.json({ cached: true, report: cached.report, simulationId: cached.simulationId });
      }
    }

    const result = await startEstateSimulation({ estateName: estate.name, districtCode: code });
    res.json(result);
  } catch (err) {
    console.error('❌ Estate simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/district/:code/analyze — Start single-district analysis
apiRouter.post('/district/:code/analyze', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const district = config.districts.find(d => d.code === code);
    if (!district) {
      return res.status(404).json({ error: 'District not found' });
    }

    // Check cache first — return cached result if < 1 hour old (unless force=true)
    const force = req.query.force === 'true';
    if (!force) {
      const cached = getCachedDistrictResult(code);
      if (cached) {
        return res.json({ cached: true, report: cached.report, simulationId: cached.simulationId, cachedAt: new Date(cached.timestamp).toISOString() });
      }
      // If already running, return the existing simulation ID
      const running = getRunningDistricts();
      if (running[code]) {
        return res.json({ status: 'running', simulationId: running[code].simulationId, districtCode: code });
      }
    }

    const result = await startDistrictSimulation({ districtCode: code });
    res.json(result);
  } catch (err) {
    console.error('❌ District simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});
