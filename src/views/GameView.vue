<template>
  <div class="h-full relative">
    <GameScreen
      :chars="engine.chars.value"
      :score="engine.score.value"
      :combo="engine.combo.value"
      :time-left="engine.timeLeft.value"
      :duration="config?.duration"
      :is-paused="engine.isPaused.value"
      @input="onInput"
      @pause="engine.pause"
      @resume="engine.resume"
      @exit="onExit"
    />

    <ResultModal
      v-if="engine.isGameOver.value && result"
      :result="result"
      :title="resultTitle"
      :subtitle="resultSubtitle"
      @again="restart"
      @back="onExit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameScreen from '../components/GameScreen.vue'
import ResultModal from '../components/ResultModal.vue'
import { useGameEngine } from '../composables/useGameEngine'
import { useAudio } from '../composables/useAudio'
import { useHaptic } from '../composables/useHaptic'
import { pendingGameConfig } from '../stores/game'
import { saveSession, recordMistakes, completeDailyChallenge, getCharSetWords } from '../services/db'

const route = useRoute()
const router = useRouter()
const { playCorrect, playWrong, playLevelUp } = useAudio()
const { light, error } = useHaptic()

const modeParam = route.params.mode as string
const config = computed(() => {
  if (pendingGameConfig.value && pendingGameConfig.value.mode === modeParam) {
    return pendingGameConfig.value
  }
  return null
})

const engine = useGameEngine(config.value || {
  mode: 'timed',
  setId: 'common-500',
  words: [],
  duration: 240,
  baseSpeed: 0.5,
  speedMultiplier: 1
})

const result = computed(() => engine.isGameOver.value ? engine.result.value : null)

const resultTitle = computed(() => {
  if (!result.value) return ''
  if (modeParam === 'timed' || modeParam === 'daily') return '挑战结束'
  if (modeParam === 'endless') return '游戏结束'
  return '练习结束'
})

const resultSubtitle = computed(() => {
  if (!result.value) return ''
  if (result.value.accuracy >= 95) return '表现太棒了！'
  if (result.value.accuracy >= 80) return '继续加油！'
  return '多加练习会更好'
})

let missedWords: string[] = []

const onInput = (value: string) => {
  const lastChar = value.slice(-1)
  const hit = engine.handleInput(lastChar)
  if (hit) {
    light()
    if (engine.combo.value % 10 === 0) playLevelUp()
    else if (engine.combo.value > 1) playCorrect()
  } else {
    error()
    playWrong()
    missedWords.push(lastChar)
  }
}

const saveResult = async () => {
  const cfg = config.value
  if (!cfg) return
  const r = engine.result.value
  await saveSession(cfg.mode, cfg.setId, r.score, r.correctChars, r.wrongChars, r.wpm, r.accuracy, r.duration)
  await recordMistakes(missedWords)

  if (cfg.mode === 'daily') {
    const date = new Date().toISOString().split('T')[0]
    const { getDailyChallenge } = await import('../services/db')
    const challenge = await getDailyChallenge(date)
    if (challenge && r.score >= challenge.target_score) {
      await completeDailyChallenge(date)
    }
  }
}

const restart = async () => {
  const cfg = config.value
  if (!cfg) {
    router.replace('/')
    return
  }
  let words = cfg.words
  if (cfg.mode !== 'mistakes') {
    words = await getCharSetWords(cfg.setId)
  }
  pendingGameConfig.value = { ...cfg, words }
  router.replace(`/game/${cfg.mode}`)
}

const onExit = () => {
  engine.endGame()
  pendingGameConfig.value = null
  router.replace('/')
}

watch(() => engine.isGameOver.value, async (over) => {
  if (over) {
    await saveResult()
  }
})

onMounted(() => {
  if (!config.value || config.value.words.length === 0) {
    router.replace('/')
    return
  }
  engine.start()
})
</script>
