<template>
  <div class="h-screen w-screen overflow-hidden bg-bg text-text transition-colors duration-300">
    <router-view />
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import { initDb } from './composables/useDb'
import { useSettings } from './stores/settings'
import { useTheme } from './composables/useTheme'
import { getCharSets, createCharSet } from './services/db'
import { loadBuiltInCharSet, BUILT_IN_SET_IDS } from './utils/charSets'

const route = useRoute()
const showTabBar = computed(() => route.meta.showTabBar !== false)

const { load: loadSettings } = useSettings()
useTheme()

async function initBuiltInCharSets() {
  const existing = await getCharSets()
  for (const id of BUILT_IN_SET_IDS) {
    if (existing.some(s => s.id === id)) continue
    try {
      const data = await loadBuiltInCharSet(id)
      await createCharSet(data.id, data.name, data.words)
    } catch (e) {
      console.error(`Failed to load char set ${id}`, e)
    }
  }
}

onMounted(async () => {
  await initDb()
  await loadSettings()
  await initBuiltInCharSets()
})
</script>
