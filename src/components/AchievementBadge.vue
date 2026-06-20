<template>
  <div
    class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-opacity"
    :class="unlocked ? 'opacity-100' : 'opacity-40 grayscale'"
  >
    <div
      class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
      :class="unlocked ? 'bg-accent/20' : 'bg-text-muted/10'"
    >
      {{ def.icon }}
    </div>
    <p class="text-[10px] text-center leading-tight text-text">{{ def.name }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AchievementDef } from '../utils/achievements'
import type { AchievementRecord } from '../services/db'

const props = defineProps<{
  def: AchievementDef
  record?: AchievementRecord
}>()

const unlocked = computed(() => !!props.record?.unlocked_at)
</script>
