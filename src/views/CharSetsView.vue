<template>
  <div class="h-full flex flex-col p-4 pb-20 overflow-hidden">
    <header class="pt-safe mb-6">
      <h1 class="text-2xl font-bold">字集管理</h1>
      <p class="text-text-muted mt-1">选择或创建练习内容</p>
    </header>

    <div class="flex-1 overflow-y-auto no-scrollbar space-y-6">
      <section>
        <h2 class="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">内置字集</h2>
        <div class="space-y-2">
          <button
            v-for="set in builtInSets"
            :key="set.id"
            class="w-full bg-surface rounded-2xl p-4 flex items-center justify-between border transition-colors"
            :class="settings.activeSetId === set.id ? 'border-primary' : 'border-text-muted/10'"
            @click="selectSet(set.id)"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <DocumentTextIcon class="w-5 h-5" />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ set.name }}</p>
                <p class="text-xs text-text-muted">{{ set.word_count }} 字</p>
              </div>
            </div>
            <CheckCircleIcon v-if="settings.activeSetId === set.id" class="w-6 h-6 text-primary" />
          </button>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-text-muted uppercase tracking-wide">自定义字集</h2>
          <button class="text-sm text-primary font-medium" @click="showForm = true">+ 新建</button>
        </div>
        <div v-if="customSets.length === 0" class="text-center py-8 text-text-muted bg-surface rounded-2xl border border-text-muted/10">
          暂无自定义字集
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="set in customSets"
            :key="set.id"
            class="bg-surface rounded-2xl p-4 flex items-center justify-between border"
            :class="settings.activeSetId === set.id ? 'border-primary' : 'border-text-muted/10'"
          >
            <button class="flex items-center gap-3 flex-1 text-left" @click="selectSet(set.id)">
              <div class="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <PencilIcon class="w-5 h-5" />
              </div>
              <div>
                <p class="font-medium">{{ set.name }}</p>
                <p class="text-xs text-text-muted">{{ set.word_count }} 字</p>
              </div>
            </button>
            <button class="p-2 text-danger" @click="removeSet(set.id)">
              <TrashIcon class="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>

    <CharSetForm
      v-if="showForm"
      @cancel="showForm = false"
      @submit="onCreateSet"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { DocumentTextIcon, CheckCircleIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import CharSetForm from '../components/CharSetForm.vue'
import { useSettings } from '../stores/settings'
import { getCharSets, createCharSet, deleteCharSet, type CharSet } from '../services/db'

const { settings } = useSettings()

const charSets = ref<CharSet[]>([])
const showForm = ref(false)

const builtInSets = computed(() => charSets.value.filter(s => s.built_in === 1))
const customSets = computed(() => charSets.value.filter(s => s.built_in === 0))

async function load() {
  charSets.value = await getCharSets()
}

function selectSet(id: string) {
  settings.value.activeSetId = id
}

async function removeSet(id: string) {
  if (!confirm('确定删除这个字集吗？')) return
  await deleteCharSet(id)
  if (settings.value.activeSetId === id) {
    settings.value.activeSetId = 'common-500'
  }
  await load()
}

async function onCreateSet(id: string, name: string, words: string[]) {
  await createCharSet(id, name, words)
  settings.value.activeSetId = id
  showForm.value = false
  await load()
}

onMounted(load)
</script>
