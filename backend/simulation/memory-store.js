// backend/simulation/memory-store.js — In-memory store for past simulation results
const store = {
  simulations: new Map(),
  predictions: new Map(),
};

export function saveSimulationMemory(simulationId, data) {
  store.simulations.set(simulationId, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

export function getSimulationMemory(simulationId) {
  return store.simulations.get(simulationId) || null;
}

export function savePredictionMemory(districtCode, prediction) {
  if (!store.predictions.has(districtCode)) {
    store.predictions.set(districtCode, []);
  }
  store.predictions.get(districtCode).push({
    ...prediction,
    timestamp: new Date().toISOString(),
  });
}

export function getPredictionHistory(districtCode) {
  return store.predictions.get(districtCode) || [];
}

export function getAllPredictionHistory() {
  const result = {};
  for (const [code, predictions] of store.predictions) {
    result[code] = predictions;
  }
  return result;
}

export function getMemoryContext() {
  const history = getAllPredictionHistory();
  if (Object.keys(history).length === 0) return '';
  
  let ctx = '\n--- Historical Prediction Memory ---\n';
  for (const [code, preds] of Object.entries(history)) {
    const latest = preds[preds.length - 1];
    ctx += `${code}: Last predicted ${latest.direction} (${latest.timestamp})\n`;
  }
  return ctx;
}
