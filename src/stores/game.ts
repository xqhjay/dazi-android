import { ref } from 'vue'

export type GameMode = 'timed' | 'free' | 'endless' | 'daily' | 'mistakes'

export interface GameConfig {
  mode: GameMode
  setId: string
  words: string[]
  duration?: number
  baseSpeed: number
  speedMultiplier: number
}

export const pendingGameConfig = ref<GameConfig | null>(null)
