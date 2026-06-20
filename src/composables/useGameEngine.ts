import { ref, computed, onUnmounted } from 'vue'
import type { GameConfig } from '../stores/game'

export interface FallingChar {
  id: number
  char: string
  x: number
  y: number
  speed: number
}

export interface GameResult {
  score: number
  correctChars: number
  wrongChars: number
  wpm: number
  accuracy: number
  duration: number
  maxCombo: number
}

export function useGameEngine(config: GameConfig) {
  const chars = ref<FallingChar[]>([])
  const score = ref(0)
  const correctChars = ref(0)
  const wrongChars = ref(0)
  const combo = ref(0)
  const maxCombo = ref(0)
  const timeLeft = ref(config.duration || 0)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const startTime = ref(0)
  const elapsed = ref(0)

  let lastFrame = 0
  let spawnTimer = 0
  let idCounter = 0
  let rafId = 0

  const spawnInterval = computed(() => Math.max(350, 1200 - config.speedMultiplier * 120))

  const currentSpeedFactor = computed(() => {
    if (config.mode === 'endless') {
      return 1 + Math.floor(elapsed.value / 15000) * 0.1
    }
    return config.speedMultiplier
  })

  const spawnChar = () => {
    if (config.words.length === 0) return
    const word = config.words[Math.floor(Math.random() * config.words.length)]
    chars.value.push({
      id: idCounter++,
      char: word,
      x: 8 + Math.random() * 84,
      y: -8,
      speed: config.baseSpeed * (0.8 + Math.random() * 0.4)
    })
  }

  const loop = (timestamp: number) => {
    if (!startTime.value) startTime.value = timestamp
    const delta = timestamp - lastFrame
    lastFrame = timestamp

    if (!isPaused.value && !isGameOver.value) {
      elapsed.value = timestamp - startTime.value

      if (config.duration) {
        timeLeft.value = Math.max(0, config.duration - elapsed.value / 1000)
        if (timeLeft.value <= 0) {
          endGame()
          return
        }
      }

      spawnTimer += delta
      if (spawnTimer > spawnInterval.value) {
        spawnChar()
        spawnTimer = 0
      }

      const factor = currentSpeedFactor.value
      chars.value = chars.value
        .map(c => ({ ...c, y: c.y + c.speed * factor * delta * 0.06 }))
        .filter(c => {
          if (c.y > 105) {
            combo.value = 0
            wrongChars.value++
            return false
          }
          return true
        })
    }

    if (!isGameOver.value) {
      rafId = requestAnimationFrame(loop)
    }
  }

  const start = () => {
    if (rafId) return
    lastFrame = performance.now()
    startTime.value = 0
    rafId = requestAnimationFrame(loop)
  }

  const pause = () => { isPaused.value = true }
  const resume = () => { isPaused.value = false }

  const handleInput = (input: string): boolean => {
    if (isPaused.value || isGameOver.value || input.length === 0) return false
    const lastChar = input.slice(-1)
    const idx = chars.value.findIndex(c => c.char === lastChar)
    if (idx >= 0) {
      chars.value.splice(idx, 1)
      score.value += 10 + combo.value
      correctChars.value++
      combo.value++
      if (combo.value > maxCombo.value) maxCombo.value = combo.value
      return true
    }
    wrongChars.value++
    combo.value = 0
    return false
  }

  const endGame = () => {
    isGameOver.value = true
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  const result = computed<GameResult>(() => {
    const minutes = elapsed.value / 60000
    const wpm = minutes > 0 ? correctChars.value / minutes : 0
    const total = correctChars.value + wrongChars.value
    const accuracy = total > 0 ? (correctChars.value / total) * 100 : 100
    return {
      score: score.value,
      correctChars: correctChars.value,
      wrongChars: wrongChars.value,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      duration: Math.round(elapsed.value / 1000),
      maxCombo: maxCombo.value
    }
  })

  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })

  return {
    chars,
    score,
    combo,
    maxCombo,
    timeLeft,
    isPaused,
    isGameOver,
    start,
    pause,
    resume,
    handleInput,
    endGame,
    result
  }
}
