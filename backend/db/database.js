// backend/db/database.js — JSON file-based database (no native dependencies)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';

const dbDir = dirname(resolve(config.db.path));
const dbFile = resolve(dbDir, 'hk18prophet.json');

let data = {
  simulations: [],
  district_predictions: [],
  actual_outcomes: [],
  seed_data: [],
};

function load() {
  if (existsSync(dbFile)) {
    try {
      data = JSON.parse(readFileSync(dbFile, 'utf-8'));
    } catch {
      // corrupted file, start fresh
    }
  }
}

function save() {
  writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
}

export function initDatabase() {
  mkdirSync(dbDir, { recursive: true });
  load();
  save(); // ensure file exists
}

export function saveSimulation({ id, status, rounds, seedData, predictionQuery }) {
  load();
  data.simulations.push({
    id,
    status,
    rounds,
    seed_data: seedData,
    prediction_query: predictionQuery,
    report: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  save();
}

export function updateSimulationStatus(simulationId, status, report = null) {
  load();
  const sim = data.simulations.find(s => s.id === simulationId);
  if (sim) {
    sim.status = status;
    sim.updated_at = new Date().toISOString();
    if (report) sim.report = report;
  }
  save();
}

export function getSimulation(simulationId) {
  load();
  return data.simulations.find(s => s.id === simulationId) || null;
}

export function listSimulations(limit = 20) {
  load();
  return data.simulations
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(({ id, status, rounds, prediction_query, created_at, updated_at }) => ({
      id, status, rounds, prediction_query, created_at, updated_at,
    }));
}

export function saveDistrictPredictions(simulationId, predictions) {
  load();
  for (const p of predictions) {
    data.district_predictions.push({
      simulation_id: simulationId,
      district_code: p.districtCode || '',
      district_name: p.districtName || '',
      direction: p.direction || 'stable',
      predicted_change_3m: p.predictedChange3m || '0%',
      predicted_change_6m: p.predictedChange6m || '0%',
      predicted_change_12m: p.predictedChange12m || '0%',
      confidence: p.confidence || 0,
      key_factors: p.keyFactors || [],
      risks: p.risks || [],
      agent_consensus: p.agentConsensus || 'low',
      narrative: p.narrative || '',
      created_at: new Date().toISOString(),
    });
  }
  save();
}

export function getDistrictHistory(districtCode, limit = 50) {
  load();
  return data.district_predictions
    .filter(p => p.district_code === districtCode)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function getSimulationPredictions(simulationId) {
  load();
  return data.district_predictions
    .filter(p => p.simulation_id === simulationId)
    .sort((a, b) => (a.district_code || '').localeCompare(b.district_code || ''));
}
