<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import PracticeView from './views/PracticeView.vue'
import FractionView from './views/FractionView.vue'
import StatsView from './views/StatsView.vue'
import { store } from './store.js'

const state = reactive({ route: 'practice' })

const viewMap = {
  practice: PracticeView,
  fractions: FractionView,
  stats: StatsView,
}

const validRoutes = ['practice', 'fractions', 'stats']

function parseHash() {
  const hash = location.hash.replace('#/', '').trim()
  const targetRoute = validRoutes.includes(hash) ? hash : 'practice'

  if (store.isSessionActive && targetRoute !== state.route) {
    // Revert hash if session is active
    location.hash = '#/' + state.route
    return
  }

  state.route = targetRoute
}

onMounted(() => {
  parseHash()
  window.addEventListener('hashchange', parseHash)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', parseHash)
})

const currentView = computed(() => viewMap[state.route] || PracticeView)

function isNavDisabled(route) {
  if (!store.isSessionActive) return false
  return route !== state.route
}
</script>

<template>
  <div class="container">
    <header class="topbar">
      <h1 class="brand">Math Practice</h1>
      <nav class="nav">
        <template v-for="r in [{ key: 'practice', label: 'Mixed Ops' }, { key: 'fractions', label: 'Fractions' }, { key: 'stats', label: 'Stats' }]" :key="r.key">
          <a
            v-if="!isNavDisabled(r.key)"
            :class="['nav-' + r.key, { active: state.route === r.key }]"
            :href="'#/' + r.key"
          >{{ r.label }}</a>
          <span
            v-else
            class="nav-link disabled"
            title="Finish current session first"
          >{{ r.label }}</span>
        </template>
      </nav>
    </header>

    <main class="content">
      <component :is="currentView" />
    </main>
  </div>

  <footer class="footer">Data saved locally in your browser (localStorage). UI kept intentionally simple.</footer>
</template>

<style scoped>
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  font-size: 1.25rem;
  margin: 0;
}

.nav a, .nav .nav-link {
  margin-left: 1rem;
  text-decoration: none;
  color: #333;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.nav a.nav-practice { color: #d6336c; }
.nav a.nav-practice.active { background: #fff0f5; color: #d6336c; }
.nav a.nav-fractions { color: #1f5cff; }
.nav a.nav-fractions.active { background: #eef3ff; color: #1f5cff; }
.nav a.nav-stats { color: #333; }
.nav a.nav-stats.active { background: #f3f3f3; color: #333; }

.nav .disabled {
  color: #999;
  cursor: not-allowed;
}

.content {
  margin-top: 1rem;
}

.footer {
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  padding: 1rem 0 2rem;
}
</style>
