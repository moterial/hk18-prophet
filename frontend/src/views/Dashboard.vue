<template>
  <div class="dashboard">
    <!-- Simulation Controls -->
    <section class="control-panel">
      <h2>🔮 New Prediction Simulation</h2>
      <div class="form-group">
        <label>Prediction Query</label>
        <textarea
          v-model="predictionQuery"
          rows="3"
          placeholder="e.g., Predict HK property price trends for the next 3-12 months, considering recent stamp duty removal and rate cuts..."
        ></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Debate Rounds</label>
          <select v-model.number="rounds">
            <option :value="1">1 (Quick)</option>
            <option :value="2">2</option>
            <option :value="3">3 (Balanced)</option>
            <option :value="5">5 (Deep)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Seed Data (optional JSON)</label>
          <textarea v-model="seedDataRaw" rows="2" placeholder='{"notes": "any extra context..."}'></textarea>
        </div>
      </div>
      <button @click="startSimulation" :disabled="isRunning" class="btn-primary">
        {{ isRunning ? '⏳ Simulation Running...' : '🚀 Start Simulation' }}
      </button>
    </section>

    <!-- Status -->
    <section v-if="currentStatus" class="status-panel">
      <h2>📡 Simulation Status</h2>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">Status</span>
          <span :class="['value', 'status-' + currentStatus.status]">{{ currentStatus.status }}</span>
        </div>
        <div class="status-item">
          <span class="label">Phase</span>
          <span class="value">{{ currentStatus.currentPhase }}</span>
        </div>
        <div class="status-item">
          <span class="label">Round</span>
          <span class="value">{{ currentStatus.currentRound }} / {{ currentStatus.totalRounds }}</span>
        </div>
        <div class="status-item">
          <span class="label">Agents</span>
          <span class="value">{{ currentStatus.agentsCompleted }} / {{ currentStatus.totalAgents }}</span>
        </div>
      </div>
      <div v-if="currentStatus.error" class="error-box">❌ {{ currentStatus.error }}</div>
    </section>

    <!-- Report Results -->
    <section v-if="report" class="report-panel">
      <h2>📋 Prediction Report</h2>
      <div class="report-summary">
        <div class="summary-header">
          <span class="direction-badge" :class="'dir-' + report.overallDirection">
            {{ directionEmoji(report.overallDirection) }} {{ report.overallDirection?.toUpperCase() }}
          </span>
          <span class="confidence">Confidence: {{ (report.overallConfidence * 100).toFixed(0) }}%</span>
        </div>
        <p class="summary-text">{{ report.summary }}</p>
        <div v-if="report.keyThemes?.length" class="themes">
          <strong>Key Themes:</strong>
          <span v-for="theme in report.keyThemes" :key="theme" class="theme-tag">{{ theme }}</span>
        </div>
      </div>

      <!-- 18-District Grid -->
      <h3>🗺️ 18-District Predictions</h3>
      <div class="district-grid">
        <div
          v-for="dp in report.districtPredictions"
          :key="dp.districtCode"
          class="district-card"
          :class="'dir-' + dp.direction"
        >
          <div class="card-header">
            <span class="district-code">{{ dp.districtCode }}</span>
            <span class="direction-arrow">{{ directionEmoji(dp.direction) }}</span>
          </div>
          <div class="card-name">{{ dp.districtName }}</div>
          <div class="card-predictions">
            <div class="pred"><span>3m</span> {{ dp.predictedChange3m }}</div>
            <div class="pred"><span>6m</span> {{ dp.predictedChange6m }}</div>
            <div class="pred"><span>12m</span> {{ dp.predictedChange12m }}</div>
          </div>
          <div class="card-confidence">
            Confidence: {{ ((dp.confidence || 0) * 100).toFixed(0) }}%
            <span class="consensus">{{ dp.agentConsensus }}</span>
          </div>
          <div class="card-factors" v-if="dp.keyFactors?.length">
            <div v-for="f in dp.keyFactors.slice(0, 3)" :key="f" class="factor">{{ f }}</div>
          </div>
          <div class="card-narrative" v-if="dp.narrative">{{ dp.narrative }}</div>
        </div>
      </div>

      <!-- Top Insights -->
      <div class="insights-row" v-if="report.topOpportunities?.length || report.topRisks?.length">
        <div class="insight-box opportunities" v-if="report.topOpportunities?.length">
          <h4>🟢 Top Opportunities</h4>
          <ul><li v-for="o in report.topOpportunities" :key="o">{{ o }}</li></ul>
        </div>
        <div class="insight-box risks" v-if="report.topRisks?.length">
          <h4>🔴 Top Risks</h4>
          <ul><li v-for="r in report.topRisks" :key="r">{{ r }}</li></ul>
        </div>
      </div>
    </section>

    <!-- Past Simulations -->
    <section class="history-panel">
      <h2>📜 Past Simulations</h2>
      <div v-if="pastSimulations.length === 0" class="empty">No simulations yet. Run one above!</div>
      <div v-else class="history-list">
        <div v-for="sim in pastSimulations" :key="sim.id" class="history-item" @click="loadSimulation(sim.id)">
          <span class="hist-status" :class="'status-' + sim.status">{{ sim.status }}</span>
          <span class="hist-query">{{ sim.prediction_query?.slice(0, 80) || 'No query' }}</span>
          <span class="hist-date">{{ formatDate(sim.created_at) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const predictionQuery = ref('Predict Hong Kong property price trends for the next 3-12 months across all 18 districts.');
const rounds = ref(3);
const seedDataRaw = ref('');
const isRunning = ref(false);
const currentStatus = ref(null);
const report = ref(null);
const pastSimulations = ref([]);
let pollInterval = null;

function directionEmoji(dir) {
  if (dir === 'up') return '⬆️';
  if (dir === 'down') return '⬇️';
  if (dir === 'stable') return '➡️';
  return '🔄';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function startSimulation() {
  isRunning.value = true;
  report.value = null;

  let seedData = {};
  if (seedDataRaw.value.trim()) {
    try {
      seedData = JSON.parse(seedDataRaw.value);
    } catch {
      seedData = { notes: seedDataRaw.value };
    }
  }

  try {
    const res = await fetch('/api/simulation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictionQuery: predictionQuery.value,
        rounds: rounds.value,
        seedData,
      }),
    });
    const data = await res.json();

    if (data.simulationId) {
      currentStatus.value = { id: data.simulationId, status: 'started', currentPhase: 'Initializing...', currentRound: 0, totalRounds: rounds.value, agentsCompleted: 0, totalAgents: 0 };
      startPolling(data.simulationId);
    }
  } catch (err) {
    currentStatus.value = { status: 'failed', error: err.message, currentPhase: 'Error' };
    isRunning.value = false;
  }
}

function startPolling(simulationId) {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/simulation/${simulationId}/status`);
      const data = await res.json();
      currentStatus.value = data;

      if (data.status === 'completed') {
        clearInterval(pollInterval);
        pollInterval = null;
        isRunning.value = false;
        await loadReport(simulationId);
        await loadPastSimulations();
      } else if (data.status === 'failed') {
        clearInterval(pollInterval);
        pollInterval = null;
        isRunning.value = false;
      }
    } catch {
      // polling error, will retry
    }
  }, 2000);
}

async function loadReport(simulationId) {
  try {
    const res = await fetch(`/api/simulation/${simulationId}/report`);
    const data = await res.json();
    if (data.report) {
      report.value = data.report;
    }
  } catch {
    // report load error
  }
}

async function loadSimulation(simulationId) {
  currentStatus.value = { id: simulationId, status: 'loading', currentPhase: 'Loading...' };
  await loadReport(simulationId);
  currentStatus.value = { id: simulationId, status: 'completed', currentPhase: 'Complete' };
}

async function loadPastSimulations() {
  try {
    const res = await fetch('/api/simulations');
    pastSimulations.value = await res.json();
  } catch {
    // load error
  }
}

onMounted(() => {
  loadPastSimulations();
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

section {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 24px;
}

h2 {
  margin-bottom: 16px;
  font-size: 1.2rem;
  color: #f0f6fc;
}

h3 {
  margin: 20px 0 12px;
  color: #f0f6fc;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.85rem;
  color: #8b949e;
}

.form-group textarea,
.form-group select {
  width: 100%;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #e1e4e8;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group textarea:focus,
.form-group select:focus {
  border-color: #58a6ff;
  outline: none;
}

.form-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
}

.btn-primary {
  background: #238636;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: #2ea043;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.status-item {
  background: #0d1117;
  border-radius: 6px;
  padding: 12px;
}

.status-item .label {
  display: block;
  font-size: 0.75rem;
  color: #8b949e;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.status-item .value {
  font-size: 1.1rem;
  font-weight: 600;
}

.status-completed { color: #3fb950; }
.status-running, .status-started { color: #d29922; }
.status-failed { color: #f85149; }
.status-loading { color: #58a6ff; }

.error-box {
  margin-top: 12px;
  padding: 12px;
  background: #1c0b0b;
  border: 1px solid #f85149;
  border-radius: 6px;
  color: #f85149;
}

.report-summary {
  background: #0d1117;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.direction-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.dir-up { background: rgba(63, 185, 80, 0.15); color: #3fb950; border: 1px solid #3fb950; }
.dir-down { background: rgba(248, 81, 73, 0.15); color: #f85149; border: 1px solid #f85149; }
.dir-stable { background: rgba(88, 166, 255, 0.15); color: #58a6ff; border: 1px solid #58a6ff; }
.dir-mixed { background: rgba(210, 153, 34, 0.15); color: #d29922; border: 1px solid #d29922; }

.confidence {
  color: #8b949e;
  font-size: 0.9rem;
}

.summary-text {
  color: #c9d1d9;
  line-height: 1.6;
}

.themes {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.theme-tag {
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 16px;
  padding: 2px 10px;
  font-size: 0.8rem;
  color: #8b949e;
}

.district-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.district-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  transition: border-color 0.15s;
}

.district-card:hover {
  border-color: #58a6ff;
}

.district-card.dir-up { border-left: 3px solid #3fb950; }
.district-card.dir-down { border-left: 3px solid #f85149; }
.district-card.dir-stable { border-left: 3px solid #58a6ff; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.district-code {
  font-weight: 700;
  font-size: 1rem;
  color: #f0f6fc;
}

.direction-arrow {
  font-size: 1.2rem;
}

.card-name {
  font-size: 0.85rem;
  color: #8b949e;
  margin-bottom: 8px;
}

.card-predictions {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.pred {
  font-weight: 600;
  font-size: 0.9rem;
}

.pred span {
  display: block;
  font-size: 0.7rem;
  color: #8b949e;
  font-weight: 400;
}

.card-confidence {
  font-size: 0.75rem;
  color: #8b949e;
  margin-bottom: 6px;
}

.consensus {
  margin-left: 8px;
  text-transform: uppercase;
  font-weight: 600;
}

.card-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.factor {
  background: #21262d;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.7rem;
  color: #8b949e;
}

.card-narrative {
  font-size: 0.8rem;
  color: #8b949e;
  line-height: 1.4;
  margin-top: 4px;
}

.insights-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.insight-box {
  background: #0d1117;
  border-radius: 8px;
  padding: 16px;
}

.insight-box h4 {
  margin-bottom: 8px;
}

.insight-box ul {
  list-style: none;
  padding: 0;
}

.insight-box li {
  padding: 4px 0;
  font-size: 0.85rem;
  color: #c9d1d9;
}

.insight-box li::before {
  content: '•';
  margin-right: 8px;
}

.opportunities { border: 1px solid #238636; }
.risks { border: 1px solid #f85149; }

.empty {
  color: #8b949e;
  text-align: center;
  padding: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.history-item:hover {
  border-color: #58a6ff;
}

.hist-status {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  min-width: 80px;
}

.hist-query {
  flex: 1;
  font-size: 0.85rem;
  color: #c9d1d9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hist-date {
  font-size: 0.8rem;
  color: #8b949e;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  .district-grid {
    grid-template-columns: 1fr;
  }
  .insights-row {
    grid-template-columns: 1fr;
  }
}
</style>
