<template>
  <nav class="fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-text-muted/10 flex items-center justify-around pb-safe z-50">
    <router-link
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      class="flex flex-col items-center justify-center gap-0.5 w-16 text-text-muted transition-colors"
      :class="{ 'text-primary': route.path === item.path }"
    >
      <component :is="item.icon" class="w-6 h-6" />
      <span class="text-[10px] font-medium">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { HomeIcon, ChartBarIcon, DocumentTextIcon, UserIcon } from '@heroicons/vue/24/outline'

const route = useRoute()

const items = [
  { path: '/', label: '练习', icon: HomeIcon },
  { path: '/stats', label: '统计', icon: ChartBarIcon },
  { path: '/char-sets', label: '字集', icon: DocumentTextIcon },
  { path: '/profile', label: '我的', icon: UserIcon }
]
</script>
