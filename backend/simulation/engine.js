// backend/simulation/engine.js — Core simulation loop: thematic → district → moderator
import { v4 as uuidv4 } from 'uuid';
import { createAgentTeam } from '../agents/index.js';
import { config } from '../config.js';
import { saveSimulationMemory, savePredictionMemory, getMemoryContext } from './memory-store.js';
import { saveSimulation, updateSimulationStatus, saveDistrictPredictions } from '../db/database.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const DELAY_BETWEEN_AGENTS = parseInt(process.env.DELAY_BETWEEN_AGENTS || '6000', 10); // 6s default (~10 req/min, safe for Gemini free tier)

// In-memory tracking of running simulations
const activeSimulations = new Map();

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
  const seedContext = seedData ? `\n--- Seed Data ---\n${JSON.stringify(seedData, null, 2)}` : '';
  const basePrompt = `${predictionQuery}\n${seedContext}${memoryCtx}`;

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

export default { startSimulation, getSimulationStatus };
