export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
  target: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_practice', name: '初次练习', desc: '完成第一次练习', icon: '🌱', target: 1 },
  { id: 'speed_50', name: '速度达人', desc: 'WPM 达到 50', icon: '⚡', target: 50 },
  { id: 'speed_80', name: '极速高手', desc: 'WPM 达到 80', icon: '🚀', target: 80 },
  { id: 'accuracy_95', name: '精准大师', desc: '单次准确率 95%', icon: '🎯', target: 95 },
  { id: 'combo_30', name: '连击高手', desc: '达成 30 连击', icon: '🔥', target: 30 },
  { id: 'combo_50', name: '连击大师', desc: '达成 50 连击', icon: '💥', target: 50 },
  { id: 'practice_7_days', name: '七日坚持', desc: '连续 7 天练习', icon: '📅', target: 7 },
  { id: 'score_1000', name: '千分突破', desc: '单次得分超过 1000', icon: '🏆', target: 1000 }
]
