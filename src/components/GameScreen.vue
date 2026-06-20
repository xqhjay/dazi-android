<template>
  <div class="h-full flex flex-col relative">
    <!-- 顶部 HUD -->
    <div class="flex items-center justify-between px-4 pt-safe py-3 bg-surface/80 backdrop-blur-sm z-10">
      <button class="p-2 -ml-2 text-text-muted" @click="emit('exit')">
        <ChevronLeftIcon class="w-6 h-6" />
      </button>
      <div class="flex items-center gap-4">
        <div class="text-center">
          <p class="text-[10px] text-text-muted uppercase tracking-wide">分数</p>
          <p class="text-xl font-bold tabular-nums leading-none">{{ score }}</p>
        </div>
        <div v-if="duration" class="text-center">
          <p class="text-[10px] text-text-muted uppercase tracking-wide">时间</p>
          <p class="text-xl font-bold tabular-nums leading-none" :class="{ 'text-danger': timeLeft <= 10 }">
            {{ formatDuration(Math.ceil(timeLeft)) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-[10px] text-text-muted uppercase tracking-wide">连击</p>
          <p class="text-xl font-bold tabular-nums leading-none" :class="combo > 10 ? 'text-accent' : 'text-text'">
            {{ combo }}
          </p>
        </div>
      </div>
      <button class="p-2 -mr-2 text-text-muted" @click="togglePause">
        <PauseIcon v-if="!isPaused" class="w-6 h-6" />
        <PlayIcon v-else class="w-6 h-6" />
      </button>
    </div>

    <!-- 游戏区域 -->
    <div class="flex-1 relative overflow-hidden">
      <TransitionGroup name="fall">
        <div
          v-for="c in chars"
          :key="c.id"
          class="absolute text-3xl font-bold text-text select-none flex items-center justify-center w-12 h-12 -ml-6 -mt-6"
          :style="{ left: `${c.x}%`, top: `${c.y}%` }"
        >
          {{ c.char }}
        </div>
      </TransitionGroup>

      <!-- 暂停遮罩 -->
      <div
        v-if="isPaused"
        class="absolute inset-0 bg-bg/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
      >
        <p class="text-2xl font-bold mb-4">已暂停</p>
        <button class="px-6 py-3 bg-primary text-white rounded-xl font-medium" @click="resume">继续</button>
      </div>
    </div>

    <!-- 底部输入区 -->
    <div class="px-4 pb-safe pb-4 pt-2 bg-surface border-t border-text-muted/10 z-30">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        class="w-full h-14 px-4 text-lg text-center bg-bg border border-text-muted/20 rounded-xl focus:outline-none focus:border-primary text-text"
        placeholder="输入屏幕上出现的汉字"
        @input="onInput"
        @blur="inputRef?.focus()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ChevronLeftIcon, PauseIcon, PlayIcon } from '@heroicons/vue/24/solid'
import { formatDuration } from '../utils/format'
import type { FallingChar } from '../composables/useGameEngine'

const props = defineProps<{
  chars: FallingChar[]
  score: number
  combo: number
  timeLeft: number
  duration?: number
  isPaused: boolean
}>()

const emit = defineEmits<{
  input: [value: string]
  pause: []
  resume: []
  exit: []
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')

const onInput = () => {
  emit('input', inputValue.value)
  // 保留最后一个字符或清空，以便连续输入
  nextTick(() => {
    inputValue.value = ''
  })
}

const togglePause = () => {
  if (props.isPaused) emit('resume')
  else emit('pause')
}

const resume = () => emit('resume')

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})
</script>

<style scoped>
.fall-move,
.fall-enter-active,
.fall-leave-active {
  transition: all 0.3s ease;
}
.fall-enter-from,
.fall-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
