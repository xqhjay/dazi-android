<template>
  <div class="h-full flex flex-col p-4 pb-20 overflow-y-auto no-scrollbar">
    <header class="pt-safe mb-6">
      <h1 class="text-2xl font-bold">打字提速</h1>
      <p class="text-text-muted mt-1">今日已练习 {{ todayMinutes }} 分钟</p>
    </header>

    <section class="grid grid-cols-2 gap-3 mb-6">
      <ModeCard
        v-for="mode in modes"
        :key="mode.id"
        :title="mode.title"
        :desc="mode.desc"
        :icon="mode.icon"
        @click="startGame(mode.id)"
      />
    </section>

    <section class="bg-surface rounded-2xl p-4 border border-text-muted/10">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold">每日挑战</h2>
        <span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
          {{ daily.completed ? '已完成' : '进行中' }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-text-muted">今日目标</p>
          <p class="text-lg font-bold">{{ daily.target_score }} 分</p>
        </div>
        <button
          class="px-5 py-2.5 bg-primary text-white rounded-xl font-medium disabled:opacity-50"
          :disabled="daily.completed === 1"
          @click="startGame('daily')"
        >
          开始
        </button>
      </div>
    </section>

    <section class="mt-6 bg-surface rounded-2xl p-4 border border-text-muted/10">
      <h2 class="font-semibold mb-3">当前字集</h2>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <DocumentTextIcon class="w-5 h-5" />
          </div>
          <div>
            <p class="font-medium">{{ activeSetName }}</p>
            <p class="text-xs text-text-muted">{{ activeSetWordCount }} 字</p>
          </div>
        </div>
        <router-link to="/char-sets" class="text-sm text-primary font-medium">切换</router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DocumentTextIcon } from '@heroicons/vue/24/outline'
import ModeCard from '../components/ModeCard.vue'
import { useSettings } from '../stores/settings'
import { pendingGameConfig, type GameMode } from '../stores/game'
import { getCharSets, getCharSetWords, ensureDailyChallenge, getTodayMinutes, type CharSet } from '../services/db'

const router = useRouter()
const { settings } = useSettings()

const todayMinutes = ref(0)
const charSets = ref<CharSet[]>([])
const daily = ref({ target_score: 500, completed: 0 })

const activeSet = computed(() => charSets.value.find(s => s.id === settings.value.activeSetId))
const activeSetName = computed(() => activeSet.value?.name || '常用字 500')
const activeSetWordCount = computed(() => activeSet.value?.word_count || 0)

const modes = [
  { id: 'timed', title: '限时挑战', desc: '4 分钟冲刺', icon: '⏱️' },
  { id: 'free', title: '自由练习', desc: '自定义速度', icon: '🎯' },
  { id: 'endless', title: '无尽模式', desc: '挑战极限', icon: '🔥' },
  { id: 'mistakes', title: '错字重练', desc: '专攻弱项', icon: '🔄' }
]

async function startGame(mode: string) {
  const setId = settings.value.activeSetId
  let words: string[] = []

  if (mode === 'mistakes') {
    // 错字重练从 mistakes 表取字
    const { getMistakes } = await import('../services/db')
    const mistakes = await getMistakes(50)
    words = mistakes.map(m => m.word)
    if (words.length === 0) {
      alert('暂无错字记录，先去练习吧！')
      return
    }
  } else {
    words = await getCharSetWords(setId)
  }

  const config = {
    mode: mode as GameMode,
    setId,
    words,
    duration: mode === 'timed' || mode === 'daily' ? 240 : undefined,
    baseSpeed: 0.5,
    speedMultiplier: mode === 'daily' ? 1.2 : 1
  }

  pendingGameConfig.value = config
  router.push(`/game/${mode}`)
}

async function load() {
  charSets.value = await getCharSets()
  todayMinutes.value = await getTodayMinutes()
  const date = new Date().toISOString().split('T')[0]
  daily.value = await ensureDailyChallenge(date)
}

onMounted(load)
</script>
