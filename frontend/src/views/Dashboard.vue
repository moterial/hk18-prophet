<template>
  <div class="fullpage-map">
    <!-- Full-page SVG Map -->
    <HKMap
      :districts="districts"
      :selectedCode="selectedDistrict"
      :analyzedDistricts="analyzedDistricts"
      :runningDistricts="runningDistricts"
      @select="onDistrictSelect"
    />

    <!-- Legend -->
    <div class="map-legend">
      <div class="legend-item"><span class="dot dot-up"></span> Price Up</div>
      <div class="legend-item"><span class="dot dot-down"></span> Price Down</div>
      <div class="legend-item"><span class="dot dot-stable"></span> Stable</div>
      <div class="legend-item"><span class="dot dot-loading"></span> Analyzing...</div>
      <div class="legend-item"><span class="dot dot-none"></span> Not Analyzed</div>
    </div>

    <!-- Modal Overlay -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <button class="modal-close" @click="closeModal">&times;</button>

          <!-- Loading/Running state -->
          <div v-if="isDistrictRunning(selectedDistrict)" class="modal-loading">
            <div class="loading-spinner"></div>
            <h3>Analyzing {{ getDistrictName(selectedDistrict) }}...</h3>
            <p class="loading-hint">You can close this and come back anytime</p>
            <div v-if="getDistrictProgress(selectedDistrict)" class="loading-detail">
              <div class="status-phase">{{ getDistrictProgress(selectedDistrict).currentPhase }}</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: getProgressPercent(selectedDistrict) + '%' }"></div>
              </div>
              <div class="status-agents">{{ getDistrictProgress(selectedDistrict).agentsCompleted || 0 }} / {{ getDistrictProgress(selectedDistrict).totalAgents || 8 }} agents</div>
            </div>
          </div>

          <!-- Result state -->
          <div v-else-if="districtReports[selectedDistrict]" class="modal-result">
            <div class="modal-header">
              <div>
                <h2>{{ districtReports[selectedDistrict].districtNameCn || getDistrictNameCn(selectedDistrict) }} {{ districtReports[selectedDistrict].districtName || getDistrictName(selectedDistrict) }}</h2>
                <span class="code-badge">{{ selectedDistrict }}</span>
              </div>
              <div class="header-badges">
                <span class="direction-badge" :class="'dir-' + districtReports[selectedDistrict].direction">
                  {{ directionEmoji(districtReports[selectedDistrict].direction) }} {{ districtReports[selectedDistrict].direction?.toUpperCase() }}
                </span>
                <span class="confidence-badge">{{ ((districtReports[selectedDistrict].confidence || 0) * 100).toFixed(0) }}% confidence</span>
              </div>
            </div>

            <div class="summary-box">{{ districtReports[selectedDistrict].summary }}</div>

            <!-- Price Predictions: 1yr, 5yr, 10yr -->
            <div class="predictions-row">
              <div class="pred-card" v-for="(p, key) in districtReports[selectedDistrict].predictions" :key="key">
                <div class="pred-label">{{ formatPeriod(key) }}</div>
                <div class="pred-change" :class="changeClass(p.change)">{{ p.change }}</div>
                <div class="pred-range" v-if="p.priceRange">
                  HK${{ p.priceRange[0]?.toLocaleString() }} – HK${{ p.priceRange[1]?.toLocaleString() }}/sqft
                </div>
                <div class="pred-narrative">{{ p.narrative }}</div>
              </div>
            </div>

            <!-- Estates -->
            <h3 class="section-title">🏘️ Major Housing Estates 主要屋苑</h3>
            <div class="estates-grid">
              <div v-for="estate in districtReports[selectedDistrict].estates" :key="estate.name" class="estate-card">
                <div class="estate-top">
                  <div>
                    <strong>{{ estate.nameCn || estate.name }}</strong>
                    <span class="estate-en" v-if="estate.nameCn"> {{ estate.name }}</span>
                  </div>
                  <span class="rec-badge" :class="'rec-' + estate.recommendation">{{ estate.recommendation }}</span>
                </div>
                <div class="estate-area" v-if="estate.area">📍 {{ estate.area }}</div>
                <div class="estate-price" v-if="estate.currentPricePerSqft">
                  Current: <strong>HK${{ estate.currentPricePerSqft?.toLocaleString() }}/sqft</strong>
                </div>
                <div class="estate-preds">
                  <span v-for="(val, k) in estate.predictions" :key="k" class="estate-pred" :class="changeClass(val)">
                    {{ formatPeriod(k) }}: {{ val }}
                  </span>
                </div>
                <div class="estate-factors" v-if="estate.keyFactors?.length">
                  <span v-for="f in estate.keyFactors" :key="f" class="factor-tag">{{ f }}</span>
                </div>
              </div>
            </div>

            <!-- News & Causes -->
            <h3 class="section-title">📰 Major News & Causes</h3>
            <div class="news-list">
              <div v-for="(news, i) in districtReports[selectedDistrict].newsCauses" :key="i" class="news-card" :class="'impact-' + news.direction">
                <div class="news-head">
                  <span>{{ news.direction === 'positive' ? '🟢' : news.direction === 'negative' ? '🔴' : '🟡' }}</span>
                  <strong>{{ news.headline }}</strong>
                </div>
                <div class="news-meta">
                  <span>📎 {{ news.source }}</span>
                  <span>⏱️ {{ news.timeframe }}</span>
                </div>
                <div class="news-impact">{{ news.impact }}</div>
              </div>
            </div>

            <!-- Risks & Opportunities -->
            <div class="ro-row">
              <div class="ro-box opp" v-if="districtReports[selectedDistrict].opportunities?.length">
                <h4>🟢 Opportunities</h4>
                <ul><li v-for="o in districtReports[selectedDistrict].opportunities" :key="o">{{ o }}</li></ul>
              </div>
              <div class="ro-box risk" v-if="districtReports[selectedDistrict].risks?.length">
                <h4>🔴 Risks</h4>
                <ul><li v-for="r in districtReports[selectedDistrict].risks" :key="r">{{ r }}</li></ul>
              </div>
            </div>

            <button class="btn-reanalyze" @click="forceReanalyze(selectedDistrict)">🔄 Re-analyze (force refresh)</button>
          </div>

          <!-- Error state -->
          <div v-else class="modal-loading">
            <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
            <h3>Analysis failed for {{ getDistrictName(selectedDistrict) }}</h3>
            <button class="btn-retry" @click="forceReanalyze(selectedDistrict)">🔄 Retry</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import HKMap from '../components/HKMap.vue';

const districts = ref([]);
const selectedDistrict = ref(null);
const showModal = ref(false);
const analyzedDistricts = reactive({});  // code -> { direction }
const runningDistricts = reactive({});   // code -> { simulationId, agentsCompleted, totalAgents, currentPhase }
const districtReports = reactive({});    // code -> report object

// Track polling intervals per district (multiple can run)
const pollIntervals = {};

function directionEmoji(dir) {
  if (dir === 'up') return '⬆️';
  if (dir === 'down') return '⬇️';
  return '➡️';
}

function getDistrictName(code) {
  return districts.value.find(x => x.code === code)?.name || code;
}

function getDistrictNameCn(code) {
  return districts.value.find(x => x.code === code)?.nameCn || '';
}

function formatPeriod(key) {
  if (key === '1year') return '1 Year';
  if (key === '5year') return '5 Years';
  if (key === '10year') return '10 Years';
  return key;
}

function changeClass(val) {
  if (!val) return '';
  if (typeof val === 'string' && val.startsWith('+')) return 'change-up';
  if (typeof val === 'string' && val.startsWith('-')) return 'change-down';
  return 'change-stable';
}

function isDistrictRunning(code) {
  return !!runningDistricts[code];
}

function getDistrictProgress(code) {
  return runningDistricts[code] || null;
}

function getProgressPercent(code) {
  const p = runningDistricts[code];
  if (!p || !p.totalAgents) return 0;
  return Math.round((p.agentsCompleted / p.totalAgents) * 100);
}

function closeModal() {
  showModal.value = false;
  selectedDistrict.value = null;
}

async function onDistrictSelect(code) {
  selectedDistrict.value = code;
  showModal.value = true;

  // If already have a cached report and not running, show it instantly
  if (districtReports[code] && !runningDistricts[code]) {
    return;
  }

  // If already running, just open modal to show progress (poll is already active)
  if (runningDistricts[code]) {
    return;
  }

  // Otherwise start analysis
  try {
    const res = await fetch(`/api/district/${code}/analyze`, { method: 'POST' });
    const data = await res.json();

    if (data.cached && data.report) {
      districtReports[code] = data.report;
      analyzedDistricts[code] = { direction: data.report.direction || 'stable' };
      return;
    }

    if (data.status === 'running' && data.simulationId) {
      // Already running on server, just start polling
      runningDistricts[code] = { simulationId: data.simulationId, agentsCompleted: 0, totalAgents: 8, currentPhase: 'Starting...' };
      startPolling(data.simulationId, code);
      return;
    }

    if (data.simulationId) {
      runningDistricts[code] = { simulationId: data.simulationId, agentsCompleted: 0, totalAgents: 8, currentPhase: 'Starting...' };
      startPolling(data.simulationId, code);
    }
  } catch {
    // Error
  }
}

async function forceReanalyze(code) {
  if (runningDistricts[code]) return;
  delete districtReports[code];
  delete analyzedDistricts[code];

  try {
    const res = await fetch(`/api/district/${code}/analyze?force=true`, { method: 'POST' });
    const data = await res.json();
    if (data.simulationId) {
      runningDistricts[code] = { simulationId: data.simulationId, agentsCompleted: 0, totalAgents: 8, currentPhase: 'Starting...' };
      startPolling(data.simulationId, code);
    }
  } catch {
    // Error
  }
}

function startPolling(simulationId, districtCode) {
  // Clear existing poll for this district
  if (pollIntervals[districtCode]) {
    clearInterval(pollIntervals[districtCode]);
  }

  pollIntervals[districtCode] = setInterval(async () => {
    try {
      const res = await fetch(`/api/simulation/${simulationId}/status`);
      const data = await res.json();

      if (runningDistricts[districtCode]) {
        runningDistricts[districtCode].agentsCompleted = data.agentsCompleted || 0;
        runningDistricts[districtCode].totalAgents = data.totalAgents || 8;
        runningDistricts[districtCode].currentPhase = data.currentPhase || 'Analyzing...';
      }

      if (data.status === 'completed') {
        clearInterval(pollIntervals[districtCode]);
        delete pollIntervals[districtCode];
        await loadReport(simulationId, districtCode);
        delete runningDistricts[districtCode];
      } else if (data.status === 'failed') {
        clearInterval(pollIntervals[districtCode]);
        delete pollIntervals[districtCode];
        delete runningDistricts[districtCode];
      }
    } catch {
      // retry on next tick
    }
  }, 1500);
}

async function loadReport(simulationId, districtCode) {
  try {
    const res = await fetch(`/api/simulation/${simulationId}/report`);
    const data = await res.json();
    if (data.report) {
      districtReports[districtCode] = data.report;
      analyzedDistricts[districtCode] = { direction: data.report.direction || 'stable' };
    }
  } catch { /* */ }
}

async function loadDistricts() {
  try {
    const res = await fetch('/api/districts');
    districts.value = await res.json();
  } catch { /* */ }
}

// On mount, load districts and check for any already-cached results on the server
async function loadExistingStatuses() {
  try {
    const res = await fetch('/api/districts/status');
    const statuses = await res.json();
    for (const [code, info] of Object.entries(statuses)) {
      if (info.status === 'completed') {
        analyzedDistricts[code] = { direction: info.direction || 'stable' };
        // Pre-fetch the report so clicking shows it instantly
        if (info.simulationId) {
          loadReport(info.simulationId, code);
        }
      } else if (info.status === 'running') {
        runningDistricts[code] = { simulationId: info.simulationId, agentsCompleted: info.agentsCompleted || 0, totalAgents: info.totalAgents || 8, currentPhase: info.currentPhase || 'Analyzing...' };
        startPolling(info.simulationId, code);
      }
    }
  } catch { /* */ }
}

onMounted(() => {
  loadDistricts();
  loadExistingStatuses();
});

onUnmounted(() => {
  for (const key of Object.keys(pollIntervals)) {
    clearInterval(pollIntervals[key]);
  }
});
</script>

<style scoped>
.fullpage-map {
  position: relative;
  width: 100vw;
  height: calc(100vh - 58px);
  overflow: hidden;
  background: #0a0e17;
}

.map-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(13,17,23,0.9);
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  gap: 14px;
  font-size: 0.75rem;
  color: #8b949e;
  z-index: 10;
}
.legend-item { display: flex; align-items: center; gap: 5px; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-up { background: #3fb950; }
.dot-down { background: #f85149; }
.dot-stable { background: #58a6ff; }
.dot-loading { background: #d29922; animation: pulse-dot 1.5s ease-in-out infinite; }
@keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.dot-none { background: #30363d; border: 1px solid #484f58; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.modal-container {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 12px;
  width: 90vw;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 28px 32px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
.modal-close {
  position: absolute; top: 12px; right: 16px;
  background: none; border: none; color: #8b949e;
  font-size: 1.8rem; cursor: pointer; line-height: 1;
}
.modal-close:hover { color: #f0f6fc; }

/* Loading */
.modal-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 300px; text-align: center;
}
.loading-spinner {
  width: 48px; height: 48px; border: 3px solid #30363d;
  border-top: 3px solid #58a6ff; border-radius: 50%;
  animation: spin 1s linear infinite; margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.modal-loading h3 { color: #f0f6fc; margin-bottom: 8px; }
.loading-hint { color: #8b949e; font-size: 0.8rem; margin-bottom: 16px; }
.loading-detail { width: 280px; }
.status-phase { font-size: 0.85rem; color: #58a6ff; margin-bottom: 8px; }
.progress-bar { height: 6px; background: #21262d; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #58a6ff; border-radius: 3px; transition: width 0.5s ease; }
.status-agents { font-size: 0.8rem; color: #8b949e; margin-top: 6px; }

/* Result */
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.modal-header h2 { font-size: 1.4rem; color: #f0f6fc; margin-bottom: 4px; }
.code-badge { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; color: #8b949e; }
.header-badges { display: flex; gap: 8px; align-items: center; }
.direction-badge { padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.85rem; }
.dir-up { background: rgba(63,185,80,0.15); color: #3fb950; border: 1px solid #3fb950; }
.dir-down { background: rgba(248,81,73,0.15); color: #f85149; border: 1px solid #f85149; }
.dir-stable { background: rgba(88,166,255,0.15); color: #58a6ff; border: 1px solid #58a6ff; }
.dir-mixed { background: rgba(210,153,34,0.15); color: #d29922; border: 1px solid #d29922; }
.confidence-badge { font-size: 0.8rem; color: #8b949e; }

.summary-box {
  background: #161b22; border: 1px solid #30363d; border-radius: 8px;
  padding: 14px; margin-bottom: 20px; color: #c9d1d9; line-height: 1.6; font-size: 0.9rem;
}

.predictions-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
.pred-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px; text-align: center; }
.pred-label { font-size: 0.7rem; color: #8b949e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.pred-change { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
.change-up { color: #3fb950; }
.change-down { color: #f85149; }
.change-stable { color: #58a6ff; }
.pred-range { font-size: 0.7rem; color: #58a6ff; margin-bottom: 4px; }
.pred-narrative { font-size: 0.75rem; color: #8b949e; line-height: 1.4; }

.section-title { font-size: 1rem; color: #f0f6fc; margin-bottom: 10px; }

.estates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin-bottom: 20px; }
.estate-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }
.estate-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
.estate-top strong { color: #f0f6fc; font-size: 0.9rem; }
.estate-en { color: #8b949e; font-size: 0.75rem; margin-left: 4px; }
.rec-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; white-space: nowrap; }
.rec-buy { background: rgba(63,185,80,0.15); color: #3fb950; }
.rec-hold { background: rgba(88,166,255,0.15); color: #58a6ff; }
.rec-wait { background: rgba(210,153,34,0.15); color: #d29922; }
.rec-sell { background: rgba(248,81,73,0.15); color: #f85149; }
.estate-area { font-size: 0.75rem; color: #8b949e; margin-bottom: 3px; }
.estate-price { font-size: 0.8rem; color: #c9d1d9; margin-bottom: 6px; }
.estate-preds { display: flex; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.estate-pred { font-size: 0.75rem; font-weight: 700; }
.estate-factors { display: flex; flex-wrap: wrap; gap: 4px; }
.factor-tag { background: #21262d; border-radius: 4px; padding: 1px 6px; font-size: 0.65rem; color: #8b949e; }

.news-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.news-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px; border-left: 3px solid #30363d; }
.news-card.impact-positive { border-left-color: #3fb950; }
.news-card.impact-negative { border-left-color: #f85149; }
.news-card.impact-neutral { border-left-color: #d29922; }
.news-head { display: flex; gap: 6px; align-items: flex-start; margin-bottom: 4px; }
.news-head strong { color: #f0f6fc; font-size: 0.85rem; }
.news-meta { display: flex; gap: 14px; font-size: 0.7rem; color: #8b949e; margin-bottom: 4px; }
.news-impact { font-size: 0.8rem; color: #c9d1d9; line-height: 1.4; }

.ro-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.ro-box { background: #161b22; border-radius: 8px; padding: 12px; }
.ro-box h4 { margin-bottom: 6px; font-size: 0.85rem; }
.ro-box ul { list-style: none; padding: 0; }
.ro-box li { padding: 2px 0; font-size: 0.8rem; color: #c9d1d9; }
.ro-box li::before { content: '•'; margin-right: 6px; }
.opp { border: 1px solid #238636; }
.risk { border: 1px solid #f85149; }

.btn-reanalyze, .btn-retry {
  background: #21262d; border: 1px solid #30363d; color: #c9d1d9;
  border-radius: 6px; padding: 8px 20px; font-size: 0.85rem; cursor: pointer;
}
.btn-reanalyze:hover, .btn-retry:hover { border-color: #58a6ff; background: #1c2333; }

@media (max-width: 700px) {
  .modal-container { width: 95vw; padding: 16px; }
  .predictions-row { grid-template-columns: 1fr; }
  .ro-row { grid-template-columns: 1fr; }
}
</style>
