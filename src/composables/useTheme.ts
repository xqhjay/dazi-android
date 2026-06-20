import { computed, watchEffect } from 'vue'
import { useSettings } from '../stores/settings'

export function useTheme() {
  const { settings } = useSettings()

  const isDark = computed(() => {
    if (settings.value.theme === 'dark') return true
    if (settings.value.theme === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  watchEffect(() => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  return { isDark, settings }
}
