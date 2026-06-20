<template>
  <div class="absolute inset-0 bg-bg/90 backdrop-blur-md flex items-center justify-center p-6 z-40">
    <div class="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-xl border border-text-muted/10">
      <h2 class="text-2xl font-bold text-center mb-1">{{ title }}</h2>
      <p class="text-center text-text-muted mb-6">{{ subtitle }}</p>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-bg rounded-2xl p-4 text-center">
          <p class="text-xs text-text-muted mb-1">得分</p>
          <p class="text-2xl font-bold text-primary">{{ result.score }}</p>
        </div>
        <div class="bg-bg rounded-2xl p-4 text-center">
          <p class="text-xs text-text-muted mb-1">WPM</p>
          <p class="text-2xl font-bold text-secondary">{{ result.wpm }}</p>
        </div>
        <div class="bg-bg rounded-2xl p-4 text-center">
          <p class="text-xs text-text-muted mb-1">准确率</p>
          <p class="text-2xl font-bold text-success">{{ result.accuracy }}%</p>
        </div>
        <div class="bg-bg rounded-2xl p-4 text-center">
          <p class="text-xs text-text-muted mb-1">最高连击</p>
          <p class="text-2xl font-bold text-accent">{{ result.maxCombo }}</p>
        </div>
      </div>

      <div class="space-y-3">
        <button class="w-full py-3.5 bg-primary text-white rounded-xl font-semibold" @click="emit('again')">
          再来一次
        </button>
        <button class="w-full py-3.5 bg-surface border border-text-muted/20 text-text rounded-xl font-medium" @click="emit('back')">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameResult } from '../composables/useGameEngine'

defineProps<{
  result: GameResult
  title: string
  subtitle: string
}>()

const emit = defineEmits<{
  again: []
  back: []
}>()
</script>
