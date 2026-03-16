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
  reports: [],  // { key, type, report, simulationId, created_at }
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

// ── Persistent report storage ──

export function saveReport(key, type, report, simulationId) {
  load();
  // Ensure reports array exists (migration from older DB files)
  if (!data.reports) data.reports = [];
  // Remove old report for this key
  data.reports = data.reports.filter(r => r.key !== key);
  data.reports.push({
    key,
    type, // 'district' | 'estate'
    report,
    simulationId,
    created_at: new Date().toISOString(),
  });
  // Keep max 500 reports to prevent unbounded growth
  if (data.reports.length > 500) {
    data.reports = data.reports
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 500);
  }
  save();
}

export function getLatestReport(key, maxAgeMs) {
  load();
  if (!data.reports) return null;
  const report = data.reports.find(r => r.key === key);
  if (!report) return null;
  if (maxAgeMs && Date.now() - new Date(report.created_at).getTime() > maxAgeMs) {
    return null; // expired
  }
  return report;
}
