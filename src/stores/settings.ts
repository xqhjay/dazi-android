import { ref, watch } from 'vue'
import { getDb } from '../composables/useDb'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: ThemeMode
  soundEnabled: boolean
  hapticEnabled: boolean
  activeSetId: string
}

const settings = ref<AppSettings>({
  theme: 'system',
  soundEnabled: true,
  hapticEnabled: true,
  activeSetId: 'common-500'
})

let loaded = false

export function useSettings() {
  const load = async () => {
    if (loaded) return
    const db = await getDb()
    const rows = await db.select<{ key: string; value: string }[]>('SELECT key, value FROM settings')
    for (const row of rows) {
      if (row.key === 'theme') settings.value.theme = row.value as ThemeMode
      if (row.key === 'soundEnabled') settings.value.soundEnabled = row.value === '1'
      if (row.key === 'hapticEnabled') settings.value.hapticEnabled = row.value === '1'
      if (row.key === 'activeSetId') settings.value.activeSetId = row.value
    }
    loaded = true
  }

  const save = async () => {
    const db = await getDb()
    const values = [
      ['theme', settings.value.theme],
      ['soundEnabled', settings.value.soundEnabled ? '1' : '0'],
      ['hapticEnabled', settings.value.hapticEnabled ? '1' : '0'],
      ['activeSetId', settings.value.activeSetId]
    ]
    for (const [key, value] of values) {
      await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
    }
  }

  watch(settings, save, { deep: true })

  return { settings, load, save }
}
