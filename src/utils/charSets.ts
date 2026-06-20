export interface CharSetData {
  id: string
  name: string
  words: string[]
}

export const BUILT_IN_SET_IDS = ['common-500', 'common-1000', 'common-1500']

export async function loadBuiltInCharSet(id: string): Promise<CharSetData> {
  const res = await fetch(`/char-sets/${id}.json`)
  return res.json()
}

export function extractChineseChars(text: string): string[] {
  const matches = text.match(/[\u4e00-\u9fa5]/g)
  return matches ? Array.from(new Set(matches)) : []
}

export function generateId(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
