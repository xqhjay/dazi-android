<template>
  <button
    class="bg-surface rounded-2xl p-4 flex flex-col items-start gap-2 transition-transform active:scale-95 border border-text-muted/10"
    @click="emit('click')"
  >
    <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
      {{ icon }}
    </div>
    <div>
      <h3 class="font-semibold text-text">{{ title }}</h3>
      <p class="text-xs text-text-muted mt-0.5">{{ desc }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  desc: string
  icon: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>
