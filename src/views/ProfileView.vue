<template>
  <div class="h-full p-4 pb-20 overflow-y-auto no-scrollbar">
    <header class="pt-safe mb-6">
      <h1 class="text-2xl font-bold">我的</h1>
    </header>

    <section class="bg-surface rounded-2xl p-4 border border-text-muted/10 mb-6">
      <h2 class="font-semibold mb-4">设置</h2>
      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">主题</p>
            <p class="text-xs text-text-muted">切换深浅色外观</p>
          </div>
          <select
            v-model="settings.theme"
            class="h-10 px-3 bg-bg border border-text-muted/20 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>

        <label class="flex items-center justify-between">
          <div>
            <p class="font-medium">音效</p>
            <p class="text-xs text-text-muted">打字与反馈声音</p>
          </div>
          <input v-model="settings.soundEnabled" type="checkbox" class="w-5 h-5 accent-primary" />
        </label>

        <label class="flex items-center justify-between">
          <div>
            <p class="font-medium">震动</p>
            <p class="text-xs text-text-muted">输入反馈震动</p>
          </div>
          <input v-model="settings.hapticEnabled" type="checkbox" class="w-5 h-5 accent-primary" />
        </label>
      </div>
    </section>

    <section class="bg-surface rounded-2xl p-4 border border-text-muted/10 mb-6">
      <h2 class="font-semibold mb-4">成就</h2>
      <div class="grid grid-cols-4 gap-2">
        <AchievementBadge
          v-for="def in ACHIEVEMENTS"
          :key="def.id"
          :def="def"
          :record="achievementMap.get(def.id)"
        />
      </div>
    </section>

    <section class="bg-surface rounded-2xl p-4 border border-text-muted/10">
      <h2 class="font-semibold mb-4">关于</h2>
      <div class="space-y-3 text-sm text-text-muted">
        <p>打字提速 v1.0.0</p>
        <p>基于 Tauri 2 构建的离线中文打字练习工具。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AchievementBadge from '../components/AchievementBadge.vue'
import { useSettings } from '../stores/settings'
import { useTheme } from '../composables/useTheme'
import { ACHIEVEMENTS } from '../utils/achievements'
import { getAchievements, type AchievementRecord } from '../services/db'

const { settings, load: loadSettings } = useSettings()
useTheme()

const achievementMap = ref<Map<string, AchievementRecord>>(new Map())

async function load() {
  await loadSettings()
  const records = await getAchievements()
  achievementMap.value = new Map(records.map(r => [r.id, r]))
}

onMounted(load)
</script>
