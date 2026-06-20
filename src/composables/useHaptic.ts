import { useSettings } from '../stores/settings'

export function useHaptic() {
  const { settings } = useSettings()

  const vibrate = (pattern: number | number[]) => {
    if (!settings.value.hapticEnabled) return
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch (e) {
        // ignore
      }
    }
  }

  const light = () => vibrate(12)
  const error = () => vibrate([30, 50, 30])
  const success = () => vibrate(50)

  return { light, error, success }
}
