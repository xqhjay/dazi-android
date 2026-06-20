<template>
  <div class="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
    <div class="bg-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold mb-4">{{ editing ? '编辑字集' : '新建字集' }}</h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5">字集名称</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full h-12 px-4 bg-bg border border-text-muted/20 rounded-xl focus:outline-none focus:border-primary text-text"
            placeholder="例如：高考常用字"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1.5">汉字内容</label>
          <textarea
            v-model="form.content"
            rows="6"
            class="w-full p-4 bg-bg border border-text-muted/20 rounded-xl focus:outline-none focus:border-primary text-text resize-none"
            placeholder="粘贴或输入汉字，系统会自动去重"
          />
          <p class="text-xs text-text-muted mt-1.5">已提取 {{ wordCount }} 个唯一汉字</p>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button class="flex-1 py-3.5 border border-text-muted/20 rounded-xl font-medium" @click="emit('cancel')">取消</button>
        <button
          class="flex-1 py-3.5 bg-primary text-white rounded-xl font-semibold disabled:opacity-50"
          :disabled="!canSubmit"
          @click="submit"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { extractChineseChars, generateId } from '../utils/charSets'

const props = defineProps<{
  editing?: boolean
  initialName?: string
  initialContent?: string
}>()

const emit = defineEmits<{
  cancel: []
  submit: [id: string, name: string, words: string[]]
}>()

const form = ref({
  name: props.initialName || '',
  content: props.initialContent || ''
})

const wordCount = computed(() => extractChineseChars(form.value.content).length)
const canSubmit = computed(() => form.value.name.trim().length > 0 && wordCount.value > 0)

const submit = () => {
  const words = extractChineseChars(form.value.content)
  const id = props.editing ? generateId('cs_') : generateId('cs_')
  emit('submit', id, form.value.name.trim(), words)
}
</script>
