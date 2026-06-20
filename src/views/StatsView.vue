<template>
  <div class="h-full p-4 pb-20 overflow-y-auto no-scrollbar">
    <header class="pt-safe mb-6">
      <h1 class="text-2xl font-bold">练习统计</h1>
      <p class="text-text-muted mt-1">数据驱动进步</p>
    </header>

    <section class="grid grid-cols-2 gap-3 mb-6">
      <div class="bg-surface rounded-2xl p-4 border border-text-muted/10">
        <p class="text-xs text-text-muted mb-1">总时长</p>
        <p class="text-2xl font-bold text-primary">{{ summary.totalMinutes }}<span class="text-sm font-normal text-text-muted ml-1">分钟</span></p>
      </div>
      <div class="bg-surface rounded-2xl p-4 border border-text-muted/10">
        <p class="text-xs text-text-muted mb-1">总字数</p>
        <p class="text-2xl font-bold text-secondary">{{ summary.totalChars }}</p>
      </div>
      <div class="bg-surface rounded-2xl p-4 border border-text-muted/10">
        <p class="text-xs text-text-muted mb-1">平均 WPM</p>
        <p class="text-2xl font-bold text-success">{{ summary.avgWpm }}</p>
      </div>
      <div class="bg-surface rounded-2xl p-4 border border-text-muted/10">
        <p class="text-xs text-text-muted mb-1">平均准确率</p>
        <p class="text-2xl font-bold text-accent">{{ summary.avgAccuracy }}%</p>
      </div>
    </section>

    <section class="bg-surface rounded-2xl p-4 border border-text-muted/10 mb-6">
      <h2 class="font-semibold mb-4">近 7 天趋势</h2>
      <div v-if="weekly.length === 0" class="text-center py-8 text-text-muted">
        暂无数据，开始练习吧
      </div>
      <div v-else class="space-y-3">
        <div v-for="day in weekly" :key="day.date" class="flex items-center gap-3">
          <span class="text-xs text-text-muted w-16">{{ day.date.slice(5) }}</span>
          <div class="flex-1 h-2 bg-bg rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full"
              :style="{ width: `${Math.min(100, day.wpm * 2)}%` }"
            />
          </div>
          <span class="text-xs font-medium w-10 text-right">{{ Math.round(day.wpm) }}</span>
        </div>
      </div>
    </section>

    <section class="bg-surface rounded-2xl p-4 border border-text-muted/10">
      <h2 class="font-semibold mb-4">本地排行榜</h2>
      <div v-if="leaderboard.length === 0" class="text-center py-8 text-text-muted">
        暂无记录
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(entry, idx) in leaderboard"
          :key="entry.mode"
          class="flex items-center justify-between py-2 border-b border-text-muted/5 last:border-0"
        >
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-text-muted w-5">{{ idx + 1 }}</span>
            <span class="text-sm">{{ modeLabel(entry.mode) }}</span>
          </div>
          <span class="font-bold text-primary">{{ entry.score }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStatsSummary, getWeeklyStats, getLeaderboard, type LeaderboardEntry } from '../services/db'

const summary = ref({
  totalMinutes: 0,
  totalChars: 0,
  avgWpm: 0,
  avgAccuracy: 0
})
const weekly = ref<{ date: string; wpm: number; accuracy: number; sessions: number }[]>([])
const leaderboard = ref<LeaderboardEntry[]>([])

const modeLabel = (mode: string) => {
  const labels: Record<string, string> = {
    timed: '限时挑战',
    free: '自由练习',
    endless: '无尽模式',
    daily: '每日挑战',
    mistakes: '错字重练'
  }
  return labels[mode] || mode
}

async function load() {
  const raw = await getStatsSummary()
  summary.value = {
    totalMinutes: Math.round(raw.total_minutes || 0),
    totalChars: Math.round(raw.total_chars || 0),
    avgWpm: Math.round(raw.avg_wpm || 0),
    avgAccuracy: Math.round((raw.avg_accuracy || 0) * 10) / 10
  }
  weekly.value = await getWeeklyStats()
  leaderboard.value = await getLeaderboard()
}

onMounted(load)
</script>
