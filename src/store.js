import { reactive } from 'vue'

export const store = reactive({
  isSessionActive: false,
  activeSessionType: null // 'mixed' | 'fraction' | null
})
