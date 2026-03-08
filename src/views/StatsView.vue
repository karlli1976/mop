<script setup>
import { computed, ref, onMounted } from 'vue'
import { formatSeconds } from '@/utils/generator.js'

const PINK = '#d6336c'
const BLUE = '#1f5cff'

const sessions = ref([])
const filter = ref('all') // 'all' | 'mixed' | 'fraction'

function loadFromKey(key, type) {
  try {
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    return arr.map(s => ({
      ...s,
      type,
      startedAt: typeof s.startedAt === 'number' ? s.startedAt : null,
    }))
  } catch {
    return []
  }
}

function load() {
  const mixed = loadFromKey('mop:sessions', 'mixed')
  const fractions = loadFromKey('mop:fraction-sessions', 'fraction')
  const all = [...mixed, ...fractions].sort((a, b) => {
    const at = a.startedAt ?? new Date(a.date + 'T00:00:00Z').getTime()
    const bt = b.startedAt ?? new Date(b.date + 'T00:00:00Z').getTime()
    return bt - at
  })
  sessions.value = all
}

onMounted(load)

const filtered = computed(() => {
  if (filter.value === 'all') return sessions.value
  return sessions.value.filter(s => s.type === filter.value)
})

const mixedSessions = computed(() => sessions.value.filter(s => s.type === 'mixed'))
const fractionSessions = computed(() => sessions.value.filter(s => s.type === 'fraction'))

const mixedAccPoints = computed(() => mixedSessions.value.map((s, i) => ({ x: i, y: s.accuracy })))
const mixedTimePoints = computed(() => mixedSessions.value.map((s, i) => ({ x: i, y: s.timeSec })))
const fractionAccPoints = computed(() => fractionSessions.value.map((s, i) => ({ x: i, y: s.accuracy })))
const fractionTimePoints = computed(() => fractionSessions.value.map((s, i) => ({ x: i, y: s.timeSec })))

const yMaxTime = computed(() => {
  const all = [...mixedTimePoints.value, ...fractionTimePoints.value]
  if (!all.length) return 1
  return Math.max(1, Math.max(...all.map(p => p.y)))
})

function linePath(points, width, height, yMax, totalCount) {
  if (!points.length) return ''
  const padding = 16
  const innerW = Math.max(1, width - padding * 2)
  const innerH = Math.max(1, height - padding * 2)
  const count = totalCount || points.length
  const xStep = count > 1 ? innerW / (count - 1) : 0
  const maxY = yMax ?? Math.max(...points.map(p => p.y), 1)
  const toX = (i) => padding + xStep * i
  const toY = (y) => padding + innerH - (y / maxY) * innerH
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.y)}`).join(' ')
}

function dotPoints(points, width, height, yMax, totalCount) {
  if (!points.length) return []
  const padding = 16
  const innerW = Math.max(1, width - padding * 2)
  const innerH = Math.max(1, height - padding * 2)
  const count = totalCount || points.length
  const xStep = count > 1 ? innerW / (count - 1) : 0
  const maxY = yMax ?? Math.max(...points.map(p => p.y), 1)
  const toX = (i) => padding + xStep * i
  const toY = (y) => padding + innerH - (y / maxY) * innerH
  return points.map((p, i) => ({ cx: toX(i), cy: toY(p.y) }))
}

function labelPoints(points, width, height, yMax, labels, totalCount) {
  if (!points.length) return []
  const padding = 16
  const innerW = Math.max(1, width - padding * 2)
  const innerH = Math.max(1, height - padding * 2)
  const count = totalCount || points.length
  const xStep = count > 1 ? innerW / (count - 1) : 0
  const maxY = yMax ?? Math.max(...points.map(p => p.y), 1)
  const toX = (i) => padding + xStep * i
  const toY = (y) => padding + innerH - (y / maxY) * innerH
  return points.map((p, i) => ({ x: toX(i) + 6, y: toY(p.y) - 6, text: labels?.[i] ?? String(p.y) }))
}

function fmtStartTime(ms) {
  if (!ms) return '-'
  try {
    const d = new Date(ms)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch {
    return '-'
  }
}

function typeLabel(type) {
  return type === 'fraction' ? 'Fractions' : 'Mixed Ops'
}

function typeColor(type) {
  return type === 'fraction' ? BLUE : PINK
}
</script>

<template>
  <section>
    <h2>Statistics</h2>

    <div class="filter-bar">
      <button :class="{ active: filter === 'all' }" @click="filter = 'all'">All</button>
      <button :class="['btn-mixed', { active: filter === 'mixed' }]" @click="filter = 'mixed'">Mixed Ops</button>
      <button :class="['btn-fraction', { active: filter === 'fraction' }]" @click="filter = 'fraction'">Fractions</button>
    </div>

    <div v-if="!filtered.length">No data yet. Complete a practice set to see stats.</div>

    <div v-else class="stats">
      <table class="table scroll">
        <thead>
          <tr><th>Date</th><th>Start</th><th>Type</th><th>Accuracy</th><th>Time</th></tr>
        </thead>
        <tbody>
          <tr v-for="(s, idx) in filtered" :key="(s.startedAt || s.date) + '-' + s.type + '-' + idx">
            <td>{{ s.date }}</td>
            <td>{{ fmtStartTime(s.startedAt) }}</td>
            <td :style="{ color: typeColor(s.type) }">{{ typeLabel(s.type) }}</td>
            <td>{{ s.accuracy }}%</td>
            <td>{{ formatSeconds(s.timeSec) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Accuracy chart -->
      <div class="chart-large">
        <div class="label">Accuracy (%)</div>
        <svg :width="820" :height="220">
          <rect x="0" y="0" width="820" height="220" fill="#fafafa" stroke="#eee" />
          <g font-size="10" fill="#666">
            <text x="4" y="206">0%</text>
            <text x="4" y="18">100%</text>
          </g>

          <!-- Mixed Ops accuracy (pink) -->
          <path :d="linePath(mixedAccPoints, 820, 220, 100)" :stroke="PINK" fill="none" stroke-width="2" />
          <g>
            <circle
              v-for="(p, idx) in dotPoints(mixedAccPoints, 820, 220, 100)"
              :key="'m-acc-dot-' + idx"
              :cx="p.cx" :cy="p.cy" r="3" :fill="PINK"
            />
            <g v-for="(lp, idx) in labelPoints(mixedAccPoints, 820, 220, 100, mixedSessions.map(s => s.accuracy + '%'))" :key="'m-acc-lbl-' + idx">
              <text :x="lp.x" :y="lp.y" font-size="10" :fill="PINK">{{ lp.text }}</text>
            </g>
          </g>

          <!-- Fractions accuracy (blue) -->
          <path :d="linePath(fractionAccPoints, 820, 220, 100)" :stroke="BLUE" fill="none" stroke-width="2" />
          <g>
            <circle
              v-for="(p, idx) in dotPoints(fractionAccPoints, 820, 220, 100)"
              :key="'f-acc-dot-' + idx"
              :cx="p.cx" :cy="p.cy" r="3" :fill="BLUE"
            />
            <g v-for="(lp, idx) in labelPoints(fractionAccPoints, 820, 220, 100, fractionSessions.map(s => s.accuracy + '%'))" :key="'f-acc-lbl-' + idx">
              <text :x="lp.x" :y="lp.y" font-size="10" :fill="BLUE">{{ lp.text }}</text>
            </g>
          </g>

          <!-- legend -->
          <g transform="translate(16, 12)" font-size="12" fill="#333">
            <rect x="0" y="-10" width="220" height="18" fill="rgba(255,255,255,0.8)" stroke="#ddd" />
            <rect x="8" y="-7" width="16" height="4" :fill="PINK" />
            <text x="28" y="-3">Mixed Ops</text>
            <rect x="108" y="-7" width="16" height="4" :fill="BLUE" />
            <text x="128" y="-3">Fractions</text>
          </g>
        </svg>
      </div>

      <!-- Time chart -->
      <div class="chart-large">
        <div class="label">Completion Time</div>
        <svg :width="820" :height="220">
          <rect x="0" y="0" width="820" height="220" fill="#fafafa" stroke="#eee" />
          <g font-size="10" fill="#666">
            <text x="4" y="206">0:00</text>
            <text x="4" y="18">{{ formatSeconds(yMaxTime) }}</text>
          </g>

          <!-- Mixed Ops time (pink) -->
          <path :d="linePath(mixedTimePoints, 820, 220, yMaxTime)" :stroke="PINK" fill="none" stroke-width="2" />
          <g>
            <circle
              v-for="(p, idx) in dotPoints(mixedTimePoints, 820, 220, yMaxTime)"
              :key="'m-time-dot-' + idx"
              :cx="p.cx" :cy="p.cy" r="3" :fill="PINK"
            />
            <g v-for="(lp, idx) in labelPoints(mixedTimePoints, 820, 220, yMaxTime, mixedSessions.map(s => formatSeconds(s.timeSec)))" :key="'m-time-lbl-' + idx">
              <text :x="lp.x" :y="lp.y" font-size="10" :fill="PINK">{{ lp.text }}</text>
            </g>
          </g>

          <!-- Fractions time (blue) -->
          <path :d="linePath(fractionTimePoints, 820, 220, yMaxTime)" :stroke="BLUE" fill="none" stroke-width="2" />
          <g>
            <circle
              v-for="(p, idx) in dotPoints(fractionTimePoints, 820, 220, yMaxTime)"
              :key="'f-time-dot-' + idx"
              :cx="p.cx" :cy="p.cy" r="3" :fill="BLUE"
            />
            <g v-for="(lp, idx) in labelPoints(fractionTimePoints, 820, 220, yMaxTime, fractionSessions.map(s => formatSeconds(s.timeSec)))" :key="'f-time-lbl-' + idx">
              <text :x="lp.x" :y="lp.y" font-size="10" :fill="BLUE">{{ lp.text }}</text>
            </g>
          </g>

          <!-- legend -->
          <g transform="translate(16, 12)" font-size="12" fill="#333">
            <rect x="0" y="-10" width="220" height="18" fill="rgba(255,255,255,0.8)" stroke="#ddd" />
            <rect x="8" y="-7" width="16" height="4" :fill="PINK" />
            <text x="28" y="-3">Mixed Ops</text>
            <rect x="108" y="-7" width="16" height="4" :fill="BLUE" />
            <text x="128" y="-3">Fractions</text>
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped>
h2 { margin: 0 0 0.75rem 0; }
.stats { display: grid; gap: 1rem; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border-bottom: 1px solid #eee; padding: 0.5rem; text-align: left; }
.chart-large { display: grid; gap: 0.25rem; }
.label { color: #444; font-size: 0.9rem; }

.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filter-bar button {
  padding: 0.3rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  color: #333;
}

.filter-bar button.active {
  background: #f3f3f3;
  border-color: #999;
}

.filter-bar button.btn-mixed { color: #d6336c; }
.filter-bar button.btn-mixed.active { background: #fff0f5; border-color: #d6336c; }
.filter-bar button.btn-fraction { color: #1f5cff; }
.filter-bar button.btn-fraction.active { background: #eef3ff; border-color: #1f5cff; }

/* Make the stats table body scrollable when more than ~5 rows */
.table.scroll { width: 100%; border-collapse: collapse; table-layout: fixed; }
.table.scroll thead { display: table; width: 100%; table-layout: fixed; }
.table.scroll tbody { display: block; max-height: 12rem; overflow-y: auto; }
.table.scroll tbody tr { display: table; width: 100%; table-layout: fixed; }
</style>
