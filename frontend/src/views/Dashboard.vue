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

    <!-- Estate Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          @input="onSearchInput"
          @focus="showSearchResults = searchResults.length > 0"
          @keydown.escape="showSearchResults = false"
          @keydown.enter="onCustomEstateSearch"
          type="text"
          placeholder="Search any estate / building (e.g. 太古城, Belcher's, 嘉湖山莊)..."
          class="search-input"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">&times;</button>
      </div>
      <div v-if="showSearchResults && searchQuery.length >= 2" class="search-dropdown">
        <!-- Config matches -->
        <div
          v-for="item in searchResults"
          :key="item.name + item.districtCode"
          class="search-result-item"
          @click="onEstateSelect(item)"
        >
          <div class="search-result-name">
            <strong>{{ item.nameCn }}</strong>
            <span class="search-result-en">{{ item.name }}</span>
          </div>
          <div class="search-result-meta">
            📍 {{ item.area }} · {{ item.districtNameCn }} {{ item.districtName }}
          </div>
        </div>
        <!-- Free-text custom search option -->
        <div class="search-result-item search-custom" @click="onCustomEstateSearch">
          <div class="search-result-name">
            <strong>🔎 Analyze "{{ searchQuery }}"</strong>
          </div>
          <div class="search-result-meta">Search any building / estate in Hong Kong</div>
        </div>
      </div>
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

    <!-- District Picker Modal (for custom search) -->
    <Teleport to="body">
      <div v-if="showDistrictPicker" class="modal-overlay" @click.self="showDistrictPicker = false">
        <div class="district-picker-container">
          <button class="modal-close" @click="showDistrictPicker = false">&times;</button>
          <h3 class="picker-title">📍 Select District for "{{ pendingCustomQuery }}"</h3>
          <p class="picker-subtitle">Choose which district this property belongs to for more accurate prediction</p>
          <div class="district-grid">
            <div
              v-for="d in districts"
              :key="d.code"
              class="district-pick-card"
              @click="onDistrictPicked(d)"
            >
              <div class="pick-name">{{ d.nameCn }}</div>
              <div class="pick-en">{{ d.name }}</div>
            </div>
          </div>
          <div class="picker-skip">
            <button class="btn-skip" @click="onDistrictPicked(null)">Skip — let AI determine the district</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Estate Report Modal -->
    <Teleport to="body">
      <div v-if="showEstateModal" class="modal-overlay" @click.self="closeEstateModal">
        <div class="modal-container">
          <button class="modal-close" @click="closeEstateModal">&times;</button>

          <!-- Loading state -->
          <div v-if="estateLoading" class="modal-loading">
            <div class="loading-spinner"></div>
            <h3>Analyzing {{ selectedEstate?.nameCn || selectedEstate?.name }}...</h3>
            <p class="loading-hint">{{ selectedEstate?.districtNameCn }} · {{ selectedEstate?.area }}</p>
            <div v-if="estateProgress" class="loading-detail">
              <div class="status-phase">{{ estateProgress.currentPhase }}</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: estateProgressPercent + '%' }"></div>
              </div>
              <div class="status-agents">{{ estateProgress.agentsCompleted || 0 }} / {{ estateProgress.totalAgents || 4 }} agents</div>
            </div>
          </div>

          <!-- Estate Report -->
          <div v-else-if="estateReport" class="modal-result">
            <div class="modal-header">
              <div>
                <h2>{{ estateReport.estateNameCn || estateReport.estateName }} {{ estateReport.estateName }}</h2>
                <span class="code-badge">{{ estateReport.districtNameCn }} · {{ estateReport.area }}</span>
              </div>
              <div class="header-badges">
                <span class="direction-badge" :class="'dir-' + estateReport.direction">
                  {{ directionEmoji(estateReport.direction) }} {{ estateReport.direction?.toUpperCase() }}
                </span>
                <span class="confidence-badge">{{ ((estateReport.confidence || 0) * 100).toFixed(0) }}% confidence</span>
                <span class="rec-badge" :class="'rec-' + estateReport.recommendation">{{ estateReport.recommendation }}</span>
              </div>
            </div>

            <div class="summary-box">{{ estateReport.summary }}</div>

            <!-- Current Price -->
            <div v-if="estateReport.currentPricePerSqft" class="estate-current-price">
              Current Price: <strong>HK${{ estateReport.currentPricePerSqft?.toLocaleString() }}/sqft</strong>
            </div>

            <!-- Price Predictions -->
            <div class="predictions-row">
              <div class="pred-card" v-for="(p, key) in estateReport.predictions" :key="key">
                <div class="pred-label">{{ formatPeriod(key) }}</div>
                <div class="pred-change" :class="changeClass(p.change)">{{ p.change }}</div>
                <div class="pred-range" v-if="p.estimatedPrice">
                  Est. HK${{ p.estimatedPrice?.toLocaleString() }}/sqft
                </div>
                <div class="pred-narrative">{{ p.narrative }}</div>
              </div>
            </div>

            <!-- Recommendation -->
            <div v-if="estateReport.recommendationReasoning" class="summary-box" style="border-left: 3px solid #58a6ff;">
              <strong>💡 Recommendation:</strong> {{ estateReport.recommendationReasoning }}
            </div>

            <!-- Strengths & Weaknesses -->
            <div class="ro-row" v-if="estateReport.strengths?.length || estateReport.weaknesses?.length">
              <div class="ro-box opp" v-if="estateReport.strengths?.length">
                <h4>💪 Strengths</h4>
                <ul><li v-for="s in estateReport.strengths" :key="s">{{ s }}</li></ul>
              </div>
              <div class="ro-box risk" v-if="estateReport.weaknesses?.length">
                <h4>⚠️ Weaknesses</h4>
                <ul><li v-for="w in estateReport.weaknesses" :key="w">{{ w }}</li></ul>
              </div>
            </div>

            <!-- Key Factors -->
            <div v-if="estateReport.keyFactors?.length" style="margin-bottom:16px;">
              <h3 class="section-title">📊 Key Factors</h3>
              <div class="estate-factors">
                <span v-for="f in estateReport.keyFactors" :key="f" class="factor-tag">{{ f }}</span>
              </div>
            </div>

            <!-- Comparable Estates -->
            <div v-if="estateReport.comparableEstates?.length">
              <h3 class="section-title">🏘️ Comparable Estates</h3>
              <div class="estates-grid">
                <div v-for="comp in estateReport.comparableEstates" :key="comp.name" class="estate-card">
                  <div class="estate-top">
                    <div>
                      <strong>{{ comp.nameCn || comp.name }}</strong>
                      <span class="estate-en" v-if="comp.nameCn"> {{ comp.name }}</span>
                    </div>
                    <span class="code-badge">{{ comp.priceComparison }}</span>
                  </div>
                  <div class="news-impact" v-if="comp.note">{{ comp.note }}</div>
                </div>
              </div>
            </div>

            <!-- News & Causes -->
            <h3 class="section-title" v-if="estateReport.newsCauses?.length">📰 Major News & Causes</h3>
            <div class="news-list" v-if="estateReport.newsCauses?.length">
              <div v-for="(news, i) in estateReport.newsCauses" :key="i" class="news-card" :class="'impact-' + news.direction">
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
            <div class="ro-row" v-if="estateReport.risks?.length || estateReport.opportunities?.length">
              <div class="ro-box opp" v-if="estateReport.opportunities?.length">
                <h4>🟢 Opportunities</h4>
                <ul><li v-for="o in estateReport.opportunities" :key="o">{{ o }}</li></ul>
              </div>
              <div class="ro-box risk" v-if="estateReport.risks?.length">
                <h4>🔴 Risks</h4>
                <ul><li v-for="r in estateReport.risks" :key="r">{{ r }}</li></ul>
              </div>
            </div>

            <button class="btn-reanalyze" @click="reanalyzeEstate">🔄 Re-analyze</button>
          </div>

          <!-- Error state -->
          <div v-else class="modal-loading">
            <div style="font-size:3rem;margin-bottom:12px;">⚠️</div>
            <h3>Analysis failed for {{ selectedEstate?.nameCn || selectedEstate?.name }}</h3>
            <button class="btn-retry" @click="reanalyzeEstate">🔄 Retry</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import HKMap from '../components/HKMap.vue';

const districts = ref([]);
const selectedDistrict = ref(null);
const showModal = ref(false);
const analyzedDistricts = reactive({});  // code -> { direction }
const runningDistricts = reactive({});   // code -> { simulationId, agentsCompleted, totalAgents, currentPhase }
const districtReports = reactive({});    // code -> report object

// Estate search state
const searchQuery = ref('');
const searchResults = ref([]);
const showSearchResults = ref(false);
const selectedEstate = ref(null);
const showEstateModal = ref(false);
const estateLoading = ref(false);
const estateReport = ref(null);
const estateProgress = ref(null);
const estateSimulationId = ref(null);
let estateSearchTimeout = null;
let estatePollInterval = null;

// District picker state (for custom search)
const showDistrictPicker = ref(false);
const pendingCustomQuery = ref('');

const estateProgressPercent = computed(() => {
  if (!estateProgress.value || !estateProgress.value.totalAgents) return 0;
  return Math.round((estateProgress.value.agentsCompleted / estateProgress.value.totalAgents) * 100);
});

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

// ── Estate Search Functions ──

function onSearchInput() {
  clearTimeout(estateSearchTimeout);
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    showSearchResults.value = false;
    return;
  }
  estateSearchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`/api/estates/search?q=${encodeURIComponent(searchQuery.value)}`);
      searchResults.value = await res.json();
      showSearchResults.value = true;
    } catch { searchResults.value = []; }
  }, 250);
}

function clearSearch() {
  searchQuery.value = '';
  searchResults.value = [];
  showSearchResults.value = false;
}

function onCustomEstateSearch() {
  if (searchQuery.value.trim().length < 2) return;
  pendingCustomQuery.value = searchQuery.value.trim();
  showSearchResults.value = false;
  showDistrictPicker.value = true;
}

function onDistrictPicked(district) {
  showDistrictPicker.value = false;
  const customEstate = {
    name: pendingCustomQuery.value,
    nameCn: pendingCustomQuery.value,
    area: district ? district.name : '',
    districtCode: district ? district.code : '',
    districtName: district ? district.name : '',
    districtNameCn: district ? district.nameCn : '',
    isCustom: true,
  };
  onEstateSelect(customEstate);
}

async function onEstateSelect(estate) {
  selectedEstate.value = estate;
  showSearchResults.value = false;
  showEstateModal.value = true;
  estateLoading.value = true;
  estateReport.value = null;
  estateProgress.value = null;

  try {
    const payload = estate.isCustom
      ? { query: estate.name, ...(estate.districtCode ? { districtCode: estate.districtCode } : {}) }
      : { estateName: estate.name, districtCode: estate.districtCode };
    const res = await fetch('/api/estate/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.cached && data.report) {
      estateReport.value = data.report;
      estateLoading.value = false;
      return;
    }

    if (data.simulationId) {
      estateSimulationId.value = data.simulationId;
      startEstatePoll(data.simulationId);
    }
  } catch {
    estateLoading.value = false;
  }
}

function startEstatePoll(simulationId) {
  if (estatePollInterval) clearInterval(estatePollInterval);
  estatePollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/simulation/${simulationId}/status`);
      const data = await res.json();
      estateProgress.value = {
        agentsCompleted: data.agentsCompleted || 0,
        totalAgents: data.totalAgents || 4,
        currentPhase: data.currentPhase || 'Analyzing...',
      };
      if (data.status === 'completed') {
        clearInterval(estatePollInterval);
        estatePollInterval = null;
        const reportRes = await fetch(`/api/simulation/${simulationId}/report`);
        const reportData = await reportRes.json();
        if (reportData.report) {
          estateReport.value = reportData.report;
        }
        estateLoading.value = false;
      } else if (data.status === 'failed') {
        clearInterval(estatePollInterval);
        estatePollInterval = null;
        estateLoading.value = false;
      }
    } catch { /* retry */ }
  }, 1500);
}

function closeEstateModal() {
  showEstateModal.value = false;
  selectedEstate.value = null;
  estateReport.value = null;
  estateLoading.value = false;
  if (estatePollInterval) { clearInterval(estatePollInterval); estatePollInterval = null; }
}

async function reanalyzeEstate() {
  if (!selectedEstate.value) return;
  estateLoading.value = true;
  estateReport.value = null;
  estateProgress.value = null;
  try {
    const payload = selectedEstate.value.isCustom
      ? { query: selectedEstate.value.name, ...(selectedEstate.value.districtCode ? { districtCode: selectedEstate.value.districtCode } : {}) }
      : { estateName: selectedEstate.value.name, districtCode: selectedEstate.value.districtCode };
    const res = await fetch('/api/estate/analyze?force=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.simulationId) {
      estateSimulationId.value = data.simulationId;
      startEstatePoll(data.simulationId);
    }
  } catch {
    estateLoading.value = false;
  }
}

// ── Click outside to close search ──
function onClickOutsideSearch(e) {
  if (!e.target.closest('.search-bar')) {
    showSearchResults.value = false;
  }
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
  document.addEventListener('click', onClickOutsideSearch);
});

onUnmounted(() => {
  for (const key of Object.keys(pollIntervals)) {
    clearInterval(pollIntervals[key]);
  }
  if (estatePollInterval) clearInterval(estatePollInterval);
  document.removeEventListener('click', onClickOutsideSearch);
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

/* Search Bar */
.search-bar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 420px;
  max-width: calc(100vw - 32px);
  z-index: 20;
}
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  font-size: 0.9rem;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 36px 10px 36px;
  background: rgba(13,17,23,0.95);
  border: 1px solid #30363d;
  border-radius: 10px;
  color: #f0f6fc;
  font-size: 0.85rem;
  outline: none;
  backdrop-filter: blur(8px);
}
.search-input::placeholder { color: #484f58; }
.search-input:focus { border-color: #58a6ff; box-shadow: 0 0 0 2px rgba(88,166,255,0.15); }
.search-clear {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #8b949e;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 2px 6px;
}
.search-clear:hover { color: #f0f6fc; }
.search-dropdown {
  margin-top: 4px;
  background: rgba(13,17,23,0.97);
  border: 1px solid #30363d;
  border-radius: 10px;
  max-height: 320px;
  overflow-y: auto;
  backdrop-filter: blur(8px);
}
.search-result-item {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid #21262d;
}
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: #161b22; }
.search-result-name strong { color: #f0f6fc; font-size: 0.9rem; }
.search-result-en { color: #8b949e; font-size: 0.8rem; margin-left: 6px; }
.search-result-meta { font-size: 0.75rem; color: #8b949e; margin-top: 2px; }
.search-no-results { padding: 14px; text-align: center; color: #484f58; font-size: 0.85rem; }
.search-custom { border-top: 1px solid #30363d; background: rgba(88,166,255,0.05); }
.search-custom:hover { background: rgba(88,166,255,0.1); }
.search-custom .search-result-name strong { color: #58a6ff; }

/* District Picker */
.district-picker-container {
  background: #161b22; border: 1px solid #30363d; border-radius: 16px;
  padding: 28px; max-width: 640px; width: 90vw; max-height: 80vh;
  overflow-y: auto; position: relative;
}
.picker-title { margin: 0 0 6px; font-size: 1.2rem; color: #e6edf3; }
.picker-subtitle { margin: 0 0 18px; color: #8b949e; font-size: 0.85rem; }
.district-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}
.district-pick-card {
  background: #0d1117; border: 1px solid #30363d; border-radius: 10px;
  padding: 14px 12px; cursor: pointer; text-align: center; transition: all .15s;
}
.district-pick-card:hover {
  border-color: #58a6ff; background: rgba(88,166,255,0.08);
}
.pick-name { font-size: 1rem; font-weight: 600; color: #e6edf3; }
.pick-en { font-size: 0.75rem; color: #8b949e; margin-top: 2px; }
.picker-skip { text-align: center; margin-top: 16px; }
.btn-skip {
  background: transparent; border: 1px solid #30363d; color: #8b949e;
  padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 0.85rem;
  transition: all .15s;
}
.btn-skip:hover { border-color: #58a6ff; color: #58a6ff; }

/* Estate current price */
.estate-current-price {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  color: #c9d1d9;
  font-size: 0.95rem;
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
