<template>
  <div class="hk-map-wrapper">
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      class="hk-map"
    >
      <!-- Water background -->
      <rect width="800" height="600" fill="#0a0e17" />

      <!-- District paths - simplified polygons for Hong Kong 18 districts -->
      <g class="districts">
        <!-- NEW TERRITORIES -->

        <!-- Islands (IS) - Lantau + outlying islands -->
        <path
          :class="districtClass('IS')"
          @click="$emit('select', 'IS')"
          @mouseenter="hover = 'IS'"
          @mouseleave="hover = null"
          d="M 60,320 L 100,280 L 160,270 L 210,290 L 230,330 L 220,370 L 180,400 L 130,410 L 80,380 Z
             M 140,420 L 160,415 L 165,430 L 145,435 Z
             M 100,430 L 115,425 L 118,440 L 103,442 Z"
        />
        <text :class="labelClass('IS')" x="145" y="340" text-anchor="middle">離島</text>
        <text :class="sublabelClass('IS')" x="145" y="358" text-anchor="middle">Islands</text>

        <!-- Tuen Mun (TM) -->
        <path
          :class="districtClass('TM')"
          @click="$emit('select', 'TM')"
          @mouseenter="hover = 'TM'"
          @mouseleave="hover = null"
          d="M 170,170 L 210,150 L 240,175 L 250,220 L 225,250 L 190,245 L 170,210 Z"
        />
        <text :class="labelClass('TM')" x="210" y="200" text-anchor="middle">屯門</text>
        <text :class="sublabelClass('TM')" x="210" y="218" text-anchor="middle">Tuen Mun</text>

        <!-- Yuen Long (YL) -->
        <path
          :class="districtClass('YL')"
          @click="$emit('select', 'YL')"
          @mouseenter="hover = 'YL'"
          @mouseleave="hover = null"
          d="M 210,150 L 270,110 L 340,100 L 360,130 L 340,170 L 290,190 L 250,220 L 240,175 Z"
        />
        <text :class="labelClass('YL')" x="290" y="150" text-anchor="middle">元朗</text>
        <text :class="sublabelClass('YL')" x="290" y="168" text-anchor="middle">Yuen Long</text>

        <!-- North (NO) -->
        <path
          :class="districtClass('NO')"
          @click="$emit('select', 'NO')"
          @mouseenter="hover = 'NO'"
          @mouseleave="hover = null"
          d="M 340,100 L 400,70 L 480,65 L 520,90 L 500,130 L 440,150 L 380,155 L 360,130 Z"
        />
        <text :class="labelClass('NO')" x="430" y="105" text-anchor="middle">北區</text>
        <text :class="sublabelClass('NO')" x="430" y="123" text-anchor="middle">North</text>

        <!-- Tai Po (TP) -->
        <path
          :class="districtClass('TP')"
          @click="$emit('select', 'TP')"
          @mouseenter="hover = 'TP'"
          @mouseleave="hover = null"
          d="M 440,150 L 500,130 L 540,155 L 550,200 L 520,230 L 470,225 L 440,200 Z"
        />
        <text :class="labelClass('TP')" x="490" y="185" text-anchor="middle">大埔</text>
        <text :class="sublabelClass('TP')" x="490" y="203" text-anchor="middle">Tai Po</text>

        <!-- Sha Tin (ST) -->
        <path
          :class="districtClass('ST')"
          @click="$emit('select', 'ST')"
          @mouseenter="hover = 'ST'"
          @mouseleave="hover = null"
          d="M 380,155 L 440,150 L 440,200 L 470,225 L 475,270 L 440,290 L 400,280 L 380,240 L 370,200 Z"
        />
        <text :class="labelClass('ST')" x="420" y="225" text-anchor="middle">沙田</text>
        <text :class="sublabelClass('ST')" x="420" y="243" text-anchor="middle">Sha Tin</text>

        <!-- Sai Kung (SK) -->
        <path
          :class="districtClass('SK')"
          @click="$emit('select', 'SK')"
          @mouseenter="hover = 'SK'"
          @mouseleave="hover = null"
          d="M 520,230 L 580,210 L 640,230 L 660,280 L 640,330 L 580,340 L 530,310 L 510,280 L 475,270 Z"
        />
        <text :class="labelClass('SK')" x="575" y="275" text-anchor="middle">西貢</text>
        <text :class="sublabelClass('SK')" x="575" y="293" text-anchor="middle">Sai Kung</text>

        <!-- Tsuen Wan (TW) -->
        <path
          :class="districtClass('TW')"
          @click="$emit('select', 'TW')"
          @mouseenter="hover = 'TW'"
          @mouseleave="hover = null"
          d="M 250,220 L 290,190 L 340,170 L 360,200 L 340,250 L 300,270 L 260,260 Z"
        />
        <text :class="labelClass('TW')" x="305" y="225" text-anchor="middle">荃灣</text>
        <text :class="sublabelClass('TW')" x="305" y="243" text-anchor="middle">Tsuen Wan</text>

        <!-- Kwai Tsing (KI) -->
        <path
          :class="districtClass('KI')"
          @click="$emit('select', 'KI')"
          @mouseenter="hover = 'KI'"
          @mouseleave="hover = null"
          d="M 260,260 L 300,270 L 320,300 L 310,340 L 275,350 L 250,320 L 245,290 Z"
        />
        <text :class="labelClass('KI')" x="282" y="305" text-anchor="middle">葵青</text>
        <text :class="sublabelClass('KI')" x="282" y="323" text-anchor="middle">Kwai Tsing</text>

        <!-- KOWLOON -->

        <!-- Sham Shui Po (SSP) -->
        <path
          :class="districtClass('SSP')"
          @click="$emit('select', 'SSP')"
          @mouseenter="hover = 'SSP'"
          @mouseleave="hover = null"
          d="M 320,300 L 355,290 L 370,310 L 365,345 L 340,355 L 310,340 Z"
        />
        <text :class="labelClass('SSP')" x="342" y="322" text-anchor="middle">深水埗</text>
        <text :class="sublabelClass('SSP')" x="342" y="338" text-anchor="middle">SSP</text>

        <!-- Kowloon City (KC) -->
        <path
          :class="districtClass('KC')"
          @click="$emit('select', 'KC')"
          @mouseenter="hover = 'KC'"
          @mouseleave="hover = null"
          d="M 380,280 L 420,270 L 445,300 L 440,335 L 410,345 L 385,330 L 370,310 Z"
        />
        <text :class="labelClass('KC')" x="410" y="305" text-anchor="middle">九龍城</text>
        <text :class="sublabelClass('KC')" x="410" y="321" text-anchor="middle">K. City</text>

        <!-- Wong Tai Sin (WTS) -->
        <path
          :class="districtClass('WTS')"
          @click="$emit('select', 'WTS')"
          @mouseenter="hover = 'WTS'"
          @mouseleave="hover = null"
          d="M 420,270 L 460,260 L 480,285 L 475,315 L 445,330 L 445,300 Z"
        />
        <text :class="labelClass('WTS')" x="458" y="290" text-anchor="middle">黃大仙</text>
        <text :class="sublabelClass('WTS')" x="458" y="306" text-anchor="middle">WTS</text>

        <!-- Kwun Tong (KT) -->
        <path
          :class="districtClass('KT')"
          @click="$emit('select', 'KT')"
          @mouseenter="hover = 'KT'"
          @mouseleave="hover = null"
          d="M 460,260 L 510,280 L 530,310 L 520,345 L 490,355 L 475,340 L 475,315 L 480,285 Z"
        />
        <text :class="labelClass('KT')" x="500" y="310" text-anchor="middle">觀塘</text>
        <text :class="sublabelClass('KT')" x="500" y="326" text-anchor="middle">Kwun Tong</text>

        <!-- Yau Tsim Mong (YTM) -->
        <path
          :class="districtClass('YTM')"
          @click="$emit('select', 'YTM')"
          @mouseenter="hover = 'YTM'"
          @mouseleave="hover = null"
          d="M 340,355 L 365,345 L 385,360 L 395,390 L 375,410 L 350,400 L 335,375 Z"
        />
        <text :class="labelClass('YTM')" x="362" y="378" text-anchor="middle">油尖旺</text>
        <text :class="sublabelClass('YTM')" x="362" y="394" text-anchor="middle">YTM</text>

        <!-- HK ISLAND -->

        <!-- Central & Western (CW) -->
        <path
          :class="districtClass('CW')"
          @click="$emit('select', 'CW')"
          @mouseenter="hover = 'CW'"
          @mouseleave="hover = null"
          d="M 310,430 L 350,415 L 390,420 L 400,445 L 380,470 L 340,475 L 310,460 Z"
        />
        <text :class="labelClass('CW')" x="355" y="445" text-anchor="middle">中西區</text>
        <text :class="sublabelClass('CW')" x="355" y="461" text-anchor="middle">Central</text>

        <!-- Wan Chai (WC) -->
        <path
          :class="districtClass('WC')"
          @click="$emit('select', 'WC')"
          @mouseenter="hover = 'WC'"
          @mouseleave="hover = null"
          d="M 390,420 L 430,415 L 460,425 L 460,455 L 435,470 L 400,465 L 400,445 Z"
        />
        <text :class="labelClass('WC')" x="428" y="442" text-anchor="middle">灣仔</text>
        <text :class="sublabelClass('WC')" x="428" y="458" text-anchor="middle">Wan Chai</text>

        <!-- Eastern (EA) -->
        <path
          :class="districtClass('EA')"
          @click="$emit('select', 'EA')"
          @mouseenter="hover = 'EA'"
          @mouseleave="hover = null"
          d="M 460,425 L 510,410 L 570,420 L 590,445 L 560,470 L 500,475 L 460,455 Z"
        />
        <text :class="labelClass('EA')" x="525" y="445" text-anchor="middle">東區</text>
        <text :class="sublabelClass('EA')" x="525" y="461" text-anchor="middle">Eastern</text>

        <!-- Southern (SO) -->
        <path
          :class="districtClass('SO')"
          @click="$emit('select', 'SO')"
          @mouseenter="hover = 'SO'"
          @mouseleave="hover = null"
          d="M 310,460 L 340,475 L 380,470 L 435,470 L 500,475 L 560,470 L 570,500 L 530,530 L 440,540 L 360,530 L 310,500 Z"
        />
        <text :class="labelClass('SO')" x="435" y="505" text-anchor="middle">南區</text>
        <text :class="sublabelClass('SO')" x="435" y="523" text-anchor="middle">Southern</text>
      </g>

      <!-- Tooltip -->
      <foreignObject v-if="hover" :x="tooltipX" :y="tooltipY" width="200" height="80" class="tooltip-fo">
        <div class="map-tooltip">
          <strong>{{ getDistrict(hover)?.nameCn }} {{ getDistrict(hover)?.name }}</strong>
          <div class="tooltip-detail">{{ getDistrict(hover)?.character }}</div>
          <div class="tooltip-price">HK${{ getDistrict(hover)?.priceRange[0]?.toLocaleString() }} – HK${{ getDistrict(hover)?.priceRange[1]?.toLocaleString() }}/sqft</div>
        </div>
      </foreignObject>

      <!-- Region labels -->
      <text x="140" y="55" class="region-label">NEW TERRITORIES</text>
      <text x="420" y="360" class="region-label-sm">KOWLOON</text>
      <text x="440" y="490" class="region-label-sm">HK ISLAND</text>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  districts: { type: Array, default: () => [] },
  selectedCode: { type: String, default: null },
  analyzedDistricts: { type: Object, default: () => ({}) },
  runningDistricts: { type: Object, default: () => ({}) },
});

defineEmits(['select']);

const hover = ref(null);

const tooltipX = computed(() => 350);
const tooltipY = computed(() => 10);

function getDistrict(code) {
  return props.districts.find(d => d.code === code);
}

function districtClass(code) {
  const classes = ['district-path'];
  if (props.selectedCode === code) classes.push('selected');
  if (props.runningDistricts[code]) classes.push('loading');
  if (hover.value === code) classes.push('hovered');
  if (props.analyzedDistricts[code]) {
    const dir = props.analyzedDistricts[code].direction;
    if (dir === 'up') classes.push('analyzed-up');
    else if (dir === 'down') classes.push('analyzed-down');
    else classes.push('analyzed-stable');
  }
  return classes.join(' ');
}

function labelClass(code) {
  return hover.value === code || props.selectedCode === code ? 'district-label active' : 'district-label';
}

function sublabelClass(code) {
  return hover.value === code || props.selectedCode === code ? 'district-sublabel active' : 'district-sublabel';
}
</script>

<style scoped>
.hk-map-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hk-map {
  width: 100%;
  height: 100%;
}

.district-path {
  fill: #1c2333;
  stroke: #30363d;
  stroke-width: 1.5;
  cursor: pointer;
  transition: fill 0.2s, stroke 0.2s, filter 0.2s;
}

.district-path:hover,
.district-path.hovered {
  fill: #263040;
  stroke: #58a6ff;
  stroke-width: 2;
  filter: brightness(1.2);
}

.district-path.selected {
  fill: #1a3a5c;
  stroke: #58a6ff;
  stroke-width: 2.5;
  filter: drop-shadow(0 0 6px rgba(88, 166, 255, 0.4));
}

.district-path.loading {
  animation: pulse-loading 1.5s ease-in-out infinite;
}

@keyframes pulse-loading {
  0%, 100% { fill: #1c2333; }
  50% { fill: #2a3a50; }
}

.district-path.analyzed-up {
  fill: rgba(63, 185, 80, 0.15);
  stroke: #3fb950;
}

.district-path.analyzed-down {
  fill: rgba(248, 81, 73, 0.15);
  stroke: #f85149;
}

.district-path.analyzed-stable {
  fill: rgba(88, 166, 255, 0.15);
  stroke: #58a6ff;
}

.district-label {
  fill: #8b949e;
  font-size: 11px;
  font-weight: 700;
  pointer-events: none;
  user-select: none;
}

.district-label.active {
  fill: #f0f6fc;
}

.district-sublabel {
  fill: #484f58;
  font-size: 8px;
  font-weight: 400;
  pointer-events: none;
  user-select: none;
}

.district-sublabel.active {
  fill: #8b949e;
}

.region-label {
  fill: #30363d;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 3px;
  pointer-events: none;
}

.region-label-sm {
  fill: #30363d;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  pointer-events: none;
}

.map-tooltip {
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
  color: #e1e4e8;
  font-size: 12px;
  line-height: 1.4;
}

.map-tooltip strong {
  color: #f0f6fc;
  font-size: 13px;
}

.tooltip-detail {
  color: #8b949e;
  font-size: 11px;
  margin-top: 2px;
}

.tooltip-price {
  color: #58a6ff;
  font-size: 11px;
  margin-top: 2px;
  font-weight: 600;
}
</style>
