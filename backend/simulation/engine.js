// backend/simulation/engine.js — Core simulation loop: thematic → district → moderator
import { v4 as uuidv4 } from 'uuid';
import { createAgentTeam, createSingleDistrictTeam, createEstateTeam } from '../agents/index.js';
import { config } from '../config.js';
import { saveSimulationMemory, savePredictionMemory, getMemoryContext } from './memory-store.js';
import { saveSimulation, updateSimulationStatus, saveDistrictPredictions, saveReport, getLatestReport } from '../db/database.js';
import { ragRetrieve } from '../data-sources/rag-store.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const DELAY_BETWEEN_AGENTS = parseInt(process.env.DELAY_BETWEEN_AGENTS || '1000', 10); // 1s default (Grok/OpenAI have generous limits)

// ── Global LLM concurrency semaphore ──
// Limits total simultaneous LLM calls across ALL users/analyses to prevent proxy overload
const LLM_MAX_CONCURRENT = config.llmConcurrency || 3;
let llmRunning = 0;
const llmQueue = [];

export function acquireLLMSlot() {
  return new Promise(resolve => {
    if (llmRunning < LLM_MAX_CONCURRENT) {
      llmRunning++;
      resolve();
    } else {
      llmQueue.push(resolve);
    }
  });
}

export function releaseLLMSlot() {
  if (llmQueue.length > 0) {
    const next = llmQueue.shift();
    next();
  } else {
    llmRunning--;
  }
}

// In-memory tracking of running simulations
const activeSimulations = new Map();

// Track which districts currently have a running simulation
const runningDistricts = new Map(); // districtCode -> simulationId

// Track which estates currently have a running simulation (in-flight dedup)
const runningEstates = new Map(); // estateKey -> simulationId

// District result cache: { report, timestamp }
const districtCache = new Map();
const CACHE_TTL = (config.cache?.ttlHours || 1) * 60 * 60 * 1000;

// Cleanup completed simulations from memory after 2 hours to prevent leaks
const SIM_CLEANUP_AGE = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, sim] of activeSimulations.entries()) {
    if ((sim.status === 'completed' || sim.status === 'failed') && sim.completedAt) {
      const age = now - new Date(sim.completedAt).getTime();
      if (age > SIM_CLEANUP_AGE) activeSimulations.delete(id);
    }
  }
}, 10 * 60 * 1000); // check every 10 min

export function getCachedDistrictResult(districtCode) {
  const code = districtCode.toUpperCase();
  // Check in-memory cache first
  const cached = districtCache.get(code);
  if (cached && Date.now() - cached.timestamp <= CACHE_TTL) return cached;
  if (cached) districtCache.delete(code);

  // Check persistent DB
  const dbReport = getLatestReport(`district:${code}`, CACHE_TTL);
  if (dbReport) {
    // Re-hydrate memory cache
    const entry = { report: dbReport.report, timestamp: new Date(dbReport.created_at).getTime(), simulationId: dbReport.simulationId };
    districtCache.set(code, entry);
    return entry;
  }
  return null;
}

export function getRunningDistricts() {
  const running = {};
  for (const [code, simId] of runningDistricts.entries()) {
    const status = activeSimulations.get(simId);
    if (status && status.status === 'running') {
      running[code] = { simulationId: simId, agentsCompleted: status.agentsCompleted, totalAgents: status.totalAgents, currentPhase: status.currentPhase };
    } else {
      runningDistricts.delete(code);
    }
  }
  return running;
}

export function getRunningEstates() {
  const running = {};
  for (const [key, simId] of runningEstates.entries()) {
    const status = activeSimulations.get(simId);
    if (status && status.status === 'running') {
      running[key] = { simulationId: simId, agentsCompleted: status.agentsCompleted, totalAgents: status.totalAgents, currentPhase: status.currentPhase };
    } else {
      runningEstates.delete(key);
    }
  }
  return running;
}

export function getSimulationStatus(simulationId) {
  return activeSimulations.get(simulationId) || null;
}

export async function startSimulation({ seedData, predictionQuery, rounds }) {
  const simulationId = uuidv4();
  const numRounds = rounds || config.simulation.rounds;

  const status = {
    id: simulationId,
    status: 'starting',
    currentRound: 0,
    totalRounds: numRounds,
    currentPhase: 'initializing',
    agentsCompleted: 0,
    totalAgents: 0,
    transcript: [],
    report: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };

  activeSimulations.set(simulationId, status);

  // Save to DB
  saveSimulation({
    id: simulationId,
    status: 'running',
    rounds: numRounds,
    seedData: JSON.stringify(seedData || {}),
    predictionQuery: predictionQuery || 'Predict HK property prices for the next 3-12 months',
  });

  // Run simulation asynchronously
  runSimulation(simulationId, { seedData, predictionQuery, rounds: numRounds }).catch(err => {
    console.error(`❌ Simulation ${simulationId} failed:`, err);
    status.status = 'failed';
    status.error = err.message;
    updateSimulationStatus(simulationId, 'failed');
  });

  return { simulationId, status: 'started' };
}

async function runSimulation(simulationId, { seedData, predictionQuery, rounds }) {
  const status = activeSimulations.get(simulationId);
  status.status = 'running';
  const { thematicAgents, districtAgents, moderator } = createAgentTeam();

  status.totalAgents = thematicAgents.length + districtAgents.length + 1;

  const memoryCtx = getMemoryContext();
  const ragCtx = await ragRetrieve(predictionQuery);
  const seedContext = seedData ? `\n--- Seed Data ---\n${JSON.stringify(seedData, null, 2)}` : '';
  const basePrompt = `${predictionQuery}\n${seedContext}${memoryCtx}${ragCtx}`;

  let allThematicResults = [];
  let allDistrictResults = [];

  for (let round = 1; round <= rounds; round++) {
    status.currentRound = round;
    status.currentPhase = `Round ${round}/${rounds} — Thematic Analysis`;
    console.log(`\n🔄 Round ${round}/${rounds} — Thematic agents...`);

    // Phase 1: Thematic agents analyze sequentially (rate-limit safe)
    const previousRoundContext = round > 1
      ? `\n--- Previous Round Results ---\n${JSON.stringify(allThematicResults.slice(-thematicAgents.length), null, 2)}`
      : '';

    const thematicResults = [];
    for (const agent of thematicAgents) {
      console.log(`    🤖 ${agent.name}...`);
      const result = await agent.analyze(basePrompt, previousRoundContext);
      thematicResults.push(result);
      status.agentsCompleted += 1;
      status.transcript.push({ round, phase: 'thematic', agent: result.agent, role: result.role, result: result.result });
      if (agent !== thematicAgents[thematicAgents.length - 1]) {
        await sleep(DELAY_BETWEEN_AGENTS);
      }
    }
    allThematicResults.push(...thematicResults);

    console.log(`  ✅ ${thematicResults.length} thematic agents completed`);

    // Phase 2: District agents analyze in batches (seeing thematic results)
    status.currentPhase = `Round ${round}/${rounds} — District Analysis`;
    console.log(`  🏘️ District agents (batches of ${config.simulation.districtBatchSize})...`);

    const thematicSummary = thematicResults.map(r =>
      `[${r.role}] ${r.result.analysis || 'No analysis'}`
    ).join('\n\n');
    const districtContext = `\n--- Thematic Agent Views (Round ${round}) ---\n${thematicSummary}`;

    const roundDistrictResults = [];

    for (const agent of districtAgents) {
      console.log(`    🏘️ ${agent.name}...`);
      const result = await agent.analyze(basePrompt, districtContext);
      roundDistrictResults.push(result);
      status.agentsCompleted += 1;
      await sleep(DELAY_BETWEEN_AGENTS);
    }

    allDistrictResults = roundDistrictResults;

    roundDistrictResults.forEach(r => {
      status.transcript.push({ round, phase: 'district', agent: r.agent, role: r.role, result: r.result });
    });

    console.log(`  ✅ ${roundDistrictResults.length} district agents completed`);
  }

  // Phase 3: Moderator synthesizes final report
  status.currentPhase = 'Moderator Synthesis';
  console.log('\n🎯 Moderator synthesizing final report...');

  const allViews = [
    ...allThematicResults.map(r => `[${r.agent}]\n${JSON.stringify(r.result, null, 2)}`),
    ...allDistrictResults.map(r => `[${r.agent}]\n${JSON.stringify(r.result, null, 2)}`),
  ].join('\n\n---\n\n');

  const moderatorContext = `\n--- All Agent Views ---\n${allViews}`;
  const moderatorResult = await moderator.analyze(
    `Synthesize all agent views into a final prediction report for all 18 Hong Kong districts.\n\nOriginal query: ${predictionQuery}`,
    moderatorContext
  );

  status.agentsCompleted += 1;
  status.transcript.push({ round: 'final', phase: 'moderator', agent: moderatorResult.agent, result: moderatorResult.result });

  // Save results
  status.report = moderatorResult.result;
  status.status = 'completed';
  status.completedAt = new Date().toISOString();
  status.currentPhase = 'Complete';

  // Save to memory store
  saveSimulationMemory(simulationId, { query: predictionQuery, report: moderatorResult.result });

  // Save district predictions to memory and DB
  const districtPredictions = moderatorResult.result.districtPredictions || [];
  districtPredictions.forEach(dp => {
    savePredictionMemory(dp.districtCode, dp);
  });

  try {
    saveDistrictPredictions(simulationId, districtPredictions);
    updateSimulationStatus(simulationId, 'completed');
  } catch (err) {
    console.error('⚠️ DB save error (simulation still completed):', err.message);
  }

  console.log(`\n✅ Simulation ${simulationId} completed!`);
  return moderatorResult.result;
}

// ── Single-district simulation (lightweight: 6 thematic + 1 district + 1 moderator = 8 LLM calls) ──

export async function startDistrictSimulation({ districtCode }) {
  const district = config.districts.find(d => d.code === districtCode.toUpperCase());
  if (!district) throw new Error(`Unknown district code: ${districtCode}`);

  const simulationId = uuidv4();
  const predictionQuery = `Provide a detailed prediction for ${district.name} (${district.nameCn}) real estate prices over the next 1 year, 5 years, and 10 years. Include analysis of major housing estates (屋苑) in this district with specific price predictions.`;

  const status = {
    id: simulationId,
    status: 'starting',
    districtCode: district.code,
    districtName: district.name,
    currentRound: 0,
    totalRounds: 1,
    currentPhase: 'initializing',
    agentsCompleted: 0,
    totalAgents: 0,
    transcript: [],
    report: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };

  activeSimulations.set(simulationId, status);

  saveSimulation({
    id: simulationId,
    status: 'running',
    rounds: 1,
    seedData: JSON.stringify({ districtCode: district.code }),
    predictionQuery,
  });

  runDistrictSimulation(simulationId, district, predictionQuery).catch(err => {
    console.error(`❌ District simulation ${simulationId} failed:`, err);
    status.status = 'failed';
    status.error = err.message;
    runningDistricts.delete(district.code);
    updateSimulationStatus(simulationId, 'failed');
  });

  // Track this district as running
  runningDistricts.set(district.code, simulationId);

  return { simulationId, status: 'started', districtCode: district.code };
}

async function runDistrictSimulation(simulationId, district, predictionQuery) {
  const status = activeSimulations.get(simulationId);
  status.status = 'running';

  const { thematicAgents, districtAgent, moderator } = createSingleDistrictTeam(district);
  status.totalAgents = thematicAgents.length + 1 + 1; // thematic + district + moderator

  const memoryCtx = getMemoryContext();
  const ragCtx = await ragRetrieve(`${district.name} ${district.nameCn} property real estate`);
  const basePrompt = `${predictionQuery}\n${memoryCtx}${ragCtx}`;

  // Phase 1: Thematic agents — run sequentially to avoid proxy rate limits
  status.currentRound = 1;
  status.currentPhase = 'Thematic Analysis';
  console.log(`\n🔄 District simulation for ${district.name} — Thematic agents...`);

  const thematicResults = [];
  for (const agent of thematicAgents) {
    console.log(`    🤖 ${agent.name}...`);
    const result = await agent.analyze(basePrompt, '');
    thematicResults.push(result);
    status.agentsCompleted += 1;
    console.log(`    ✅ ${agent.name} done`);
    if (agent !== thematicAgents[thematicAgents.length - 1]) {
      await sleep(DELAY_BETWEEN_AGENTS);
    }
  }
  thematicResults.forEach(result => {
    status.transcript.push({ round: 1, phase: 'thematic', agent: result.agent, role: result.role, result: result.result });
  });

  // Phase 2: District agent
  status.currentPhase = `District Analysis — ${district.name}`;
  console.log(`  🏘️ District agent: ${district.name}...`);

  const thematicSummary = thematicResults.map(r =>
    `[${r.role}] ${r.result.analysis || 'No analysis'}`
  ).join('\n\n');
  const districtContext = `\n--- Thematic Agent Views ---\n${thematicSummary}`;

  await sleep(DELAY_BETWEEN_AGENTS);
  const districtResult = await districtAgent.analyze(basePrompt, districtContext);
  status.agentsCompleted += 1;
  status.transcript.push({ round: 1, phase: 'district', agent: districtResult.agent, role: districtResult.role, result: districtResult.result });

  // Phase 3: Moderator synthesizes — estate-level predictions + news
  status.currentPhase = 'Moderator Synthesis';
  console.log(`  🎯 Moderator synthesizing for ${district.name}...`);

  const allViews = [
    ...thematicResults.map(r => `[${r.agent}]\n${JSON.stringify(r.result, null, 2)}`),
    `[${districtResult.agent}]\n${JSON.stringify(districtResult.result, null, 2)}`,
  ].join('\n\n---\n\n');

  await sleep(DELAY_BETWEEN_AGENTS);
  const moderatorResult = await moderator.analyze(
    `Synthesize all agent views into a detailed prediction report for ${district.name} (${district.nameCn}). Include per-estate (屋苑) predictions and cite major news/causes with sources.\n\nOriginal query: ${predictionQuery}`,
    `\n--- All Agent Views ---\n${allViews}`
  );

  status.agentsCompleted += 1;
  status.transcript.push({ round: 'final', phase: 'moderator', agent: moderatorResult.agent, result: moderatorResult.result });

  status.report = moderatorResult.result;
  status.status = 'completed';
  status.completedAt = new Date().toISOString();
  status.currentPhase = 'Complete';

  saveSimulationMemory(simulationId, { query: predictionQuery, report: moderatorResult.result });

  try {
    const districtPredictions = moderatorResult.result.districtPredictions || [moderatorResult.result];
    saveDistrictPredictions(simulationId, districtPredictions);
    updateSimulationStatus(simulationId, 'completed');
  } catch (err) {
    console.error('⚠️ DB save error:', err.message);
  }

  // Cache the result (memory + DB)
  districtCache.set(district.code, { report: moderatorResult.result, timestamp: Date.now(), simulationId });
  try { saveReport(`district:${district.code}`, 'district', moderatorResult.result, simulationId); } catch {}
  runningDistricts.delete(district.code);

  console.log(`\n✅ District simulation for ${district.name} completed!`);
  return moderatorResult.result;
}

// ── Single-estate simulation (lightweight: 3 thematic + 1 estate analyst = 4 LLM calls) ──

const estateCache = new Map();

export function getCachedEstateResult(estateKey) {
  // Check in-memory cache first
  const cached = estateCache.get(estateKey);
  if (cached && Date.now() - cached.timestamp <= CACHE_TTL) return cached;
  if (cached) estateCache.delete(estateKey);

  // Check persistent DB
  const dbReport = getLatestReport(`estate:${estateKey}`, CACHE_TTL);
  if (dbReport) {
    const entry = { report: dbReport.report, timestamp: new Date(dbReport.created_at).getTime(), simulationId: dbReport.simulationId };
    estateCache.set(estateKey, entry);
    return entry;
  }
  return null;
}

export async function startEstateSimulation({ estateName, districtCode, query }) {
  let estate, district, estateKey, predictionQuery;

  if (query) {
    // Free-text mode — optionally with user-selected district
    estate = { name: query, nameCn: query, area: 'Hong Kong' };

    if (districtCode) {
      // User picked a district — use full district profile for better accuracy
      district = config.districts.find(d => d.code === districtCode.toUpperCase());
      estateKey = `custom:${districtCode.toUpperCase()}:${query}`;
      predictionQuery = district
        ? `Provide an in-depth prediction report for the Hong Kong property/estate "${query}" in ${district.name} (${district.nameCn}). This property is located in the ${district.name} district (${district.region}). Include detailed price predictions for 1 year, 5 years, and 10 years, key factors, risks, opportunities, comparable estates, and relevant news.`
        : `Provide an in-depth prediction report for the Hong Kong property/estate "${query}". First identify which district this property is in. Then provide detailed price predictions for 1 year, 5 years, and 10 years, key factors, risks, opportunities, comparable estates, and relevant news.`;
    } else {
      // No district selected — LLM figures it out
      district = null;
      estateKey = `custom:${query}`;
      predictionQuery = `Provide an in-depth prediction report for the Hong Kong property/estate "${query}". First identify which district this property is in. Then provide detailed price predictions for 1 year, 5 years, and 10 years, key factors, risks, opportunities, comparable estates, and relevant news. If you cannot identify this property, provide your best analysis based on available knowledge.`;
    }
  } else {
    // Known estate mode
    district = config.districts.find(d => d.code === districtCode.toUpperCase());
    if (!district) throw new Error(`Unknown district code: ${districtCode}`);

    estate = district.majorEstates.find(e =>
      e.name.toLowerCase() === estateName.toLowerCase() ||
      e.nameCn === estateName
    );
    if (!estate) throw new Error(`Estate not found in district ${districtCode}: ${estateName}`);

    estateKey = `${district.code}:${estate.name}`;
    predictionQuery = `Provide an in-depth prediction report for ${estate.name} (${estate.nameCn}) in ${district.name} (${district.nameCn}). Include detailed price predictions for 1 year, 5 years, and 10 years, key factors, risks, opportunities, comparable estates, and relevant news.`;
  }

  const simulationId = uuidv4();
  const status = {
    id: simulationId,
    status: 'starting',
    estateKey,
    estateName: estate.name,
    districtCode: district?.code || '',
    districtName: district?.name || '',
    currentRound: 0,
    totalRounds: 1,
    currentPhase: 'initializing',
    agentsCompleted: 0,
    totalAgents: 0,
    transcript: [],
    report: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };

  activeSimulations.set(simulationId, status);

  saveSimulation({
    id: simulationId,
    status: 'running',
    rounds: 1,
    seedData: JSON.stringify({ estateKey, estateName: estate.name, districtCode: district?.code || '' }),
    predictionQuery,
  });

  runEstateSimulation(simulationId, estate, district, predictionQuery).catch(err => {
    console.error(`❌ Estate simulation ${simulationId} failed:`, err);
    status.status = 'failed';
    status.error = err.message;
    runningEstates.delete(status.estateKey);
    updateSimulationStatus(simulationId, 'failed');
  });

  // Track this estate as running (in-flight dedup)
  runningEstates.set(estateKey, simulationId);

  return { simulationId, status: 'started', estateKey };
}

async function runEstateSimulation(simulationId, estate, district, predictionQuery) {
  const status = activeSimulations.get(simulationId);
  status.status = 'running';

  const { thematicAgents, estateAgent } = createEstateTeam(estate, district);
  status.totalAgents = thematicAgents.length + 1;

  const memoryCtx = getMemoryContext();
  const ragCtx = await ragRetrieve(`${estate.name} Hong Kong property estate`);
  const basePrompt = `${predictionQuery}\n${memoryCtx}${ragCtx}`;

  // Phase 1: Run 3 key thematic agents sequentially
  status.currentRound = 1;
  status.currentPhase = 'Thematic Analysis';
  console.log(`\n🏠 Estate simulation for ${estate.name} (${district?.name || 'Custom'}) — Thematic agents...`);

  const thematicResults = [];
  for (const agent of thematicAgents) {
    console.log(`    🤖 ${agent.name}...`);
    const result = await agent.analyze(basePrompt, '');
    thematicResults.push(result);
    status.agentsCompleted += 1;
    console.log(`    ✅ ${agent.name} done`);
    if (agent !== thematicAgents[thematicAgents.length - 1]) {
      await sleep(DELAY_BETWEEN_AGENTS);
    }
  }

  // Phase 2: Estate analyst synthesizes
  status.currentPhase = 'Estate Analysis';
  console.log(`  🏠 Estate analyst: ${estate.name}...`);

  const thematicSummary = thematicResults.map(r =>
    `[${r.role}] ${r.result.analysis || 'No analysis'}`
  ).join('\n\n');
  const estateContext = `\n--- Thematic Agent Views ---\n${thematicSummary}`;

  await sleep(DELAY_BETWEEN_AGENTS);
  const estateResult = await estateAgent.analyze(basePrompt, estateContext);
  status.agentsCompleted += 1;

  status.report = estateResult.result;
  status.status = 'completed';
  status.completedAt = new Date().toISOString();
  status.currentPhase = 'Complete';

  // Cache the result (memory + DB)
  const estateKey = district ? `${district.code}:${estate.name}` : `custom:${estate.name}`;
  estateCache.set(estateKey, { report: estateResult.result, timestamp: Date.now(), simulationId });
  try { saveReport(`estate:${estateKey}`, 'estate', estateResult.result, simulationId); } catch {}
  runningEstates.delete(status.estateKey);

  try {
    updateSimulationStatus(simulationId, 'completed');
  } catch (err) {
    console.error('⚠️ DB save error:', err.message);
  }

  console.log(`\n✅ Estate simulation for ${estate.name} completed!`);
  return estateResult.result;
}

export default { startSimulation, startDistrictSimulation, startEstateSimulation, getSimulationStatus, getRunningDistricts, getRunningEstates };
