<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { generateFractionSet, formatSeconds, parseFraction, fractionsEqual, formatFraction } from '@/utils/fractionGenerator.js'
import { store } from '../store.js'

const state = reactive({
  problems: [],
  startedAt: 0,
  elapsedSec: 0,
  timerId: null,
  finished: false,
})

function newSet() {
  state.problems = generateFractionSet(5).map(p => ({ ...p, userAnswer: '' }))
  state.startedAt = 0
  state.elapsedSec = 0
  state.finished = false
  store.isSessionActive = false
  store.activeSessionType = null
  if (state.timerId) clearInterval(state.timerId)
  state.timerId = null
}

function toggleTimer() {
  if (!state.startedAt && !state.finished) {
    state.startedAt = Date.now()
    store.isSessionActive = true
    store.activeSessionType = 'fraction'
    state.timerId = setInterval(() => {
      state.elapsedSec = Math.floor((Date.now() - state.startedAt) / 1000)
    }, 200)
  } else if (!state.finished) {
    state.finished = true
    store.isSessionActive = false
    store.activeSessionType = null
    if (state.timerId) clearInterval(state.timerId)
    state.timerId = null
    state.elapsedSec = Math.floor((Date.now() - state.startedAt) / 1000)
    saveStats()
  } else {
    newSet()
  }
}

function isCorrect(p) {
  const parsed = parseFraction(p.userAnswer)
  return fractionsEqual(parsed, p.answer)
}

const correctCount = computed(() => {
  if (!state.finished) return 0
  return state.problems.reduce((acc, p) => acc + (isCorrect(p) ? 1 : 0), 0)
})

function saveStats() {
  try {
    const key = 'mop:fraction-sessions'
    const raw = localStorage.getItem(key)
    const arr = raw ? JSON.parse(raw) : []
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10)
    const accuracy = Math.round((correctCount.value / state.problems.length) * 100)
    arr.push({
      date: dateStr,
      timeSec: state.elapsedSec,
      accuracy,
      startedAt: state.startedAt || Date.now(),
    })
    localStorage.setItem(key, JSON.stringify(arr))
  } catch (e) {
    // ignore
  }
}

onMounted(() => newSet())
onBeforeUnmount(() => { if (state.timerId) clearInterval(state.timerId) })
</script>

<template>
  <section>
    <div class="toolbar">
      <button class="primary" @click="toggleTimer">
        <span v-if="!state.startedAt && !state.finished">Start</span>
        <span v-else-if="state.startedAt && !state.finished">End</span>
        <span v-else>New Set</span>
      </button>
      <div class="time">Time: <strong>{{ formatSeconds(state.elapsedSec) }}</strong></div>
    </div>

    <div class="problems">
      <div class="row" v-for="(p, idx) in state.problems" :key="idx">
        <div class="expr">
          <template v-if="state.startedAt">
            {{ idx + 1 }}. {{ p.expr }} =
          </template>
          <template v-else>
            {{ idx + 1 }}.
            <span class="masked" aria-label="hidden until start">••••••••••</span>
            =
          </template>
        </div>
        <input
          class="answer"
          type="text"
          :disabled="!state.startedAt || state.finished"
          v-model="p.userAnswer"
          placeholder="e.g. 3/4"
        />

        <div class="result" v-if="state.finished">
          <span class="correct" v-if="isCorrect(p)">✔</span>
          <span class="wrong" v-else>✖</span>
          <span class="correct-answer">Correct: {{ p.answerStr }}</span>
        </div>
      </div>
    </div>

    <div class="summary" v-if="state.finished">
      <div>Completed in: <strong>{{ formatSeconds(state.elapsedSec) }}</strong></div>
      <div>Accuracy: <strong>{{ correctCount }}/{{ state.problems.length }} ({{ Math.round((correctCount/state.problems.length)*100) }}%)</strong></div>
      <div class="hint">Enter answers as fractions (e.g. 3/4) or whole numbers (e.g. 2).</div>
    </div>
  </section>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.primary {
  background: #1f5cff;
  color: #fff;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
}

.time { color: #333; }

.problems { display: grid; gap: 0.5rem; }
.row { display: grid; grid-template-columns: 1fr 120px auto; align-items: center; gap: 0.5rem; }
.expr { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.expr .masked { color: #bbb; letter-spacing: 2px; }
.answer { padding: 0.35rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
.result { display: flex; align-items: center; gap: 0.5rem; }
.correct { color: #138000; }
.wrong { color: #cc0000; }
.correct-answer { color: #555; font-size: 0.9rem; }

.summary { margin-top: 1rem; }
.hint { color: #666; font-size: 0.9rem; margin-top: 0.25rem; }
</style>
