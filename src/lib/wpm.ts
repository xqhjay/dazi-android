// 前端 WPM/准确率计算（与 Rust stats 对齐，用于实时显示）
export function calcWpm(charsCorrect: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return (charsCorrect / durationSec) * 60;
}

export function calcAccuracy(charsCorrect: number, charsWrong: number): number {
  const total = charsCorrect + charsWrong;
  if (total === 0) return 0;
  return charsCorrect / total;
}

// 速度等级映射（去修仙化）
export function levelSpeedMult(level: number): number {
  if (level >= 8) return 4.0;
  return level * 0.5;
}

export function levelName(level: number): string {
  const names = ["", "入门", "初级", "进阶", "熟练", "精通", "高手", "专家", "大师"];
  return names[Math.min(level, 8)] || "大师";
}

export const LEVELS = Array.from({ length: 8 }, (_, i) => ({
  level: i + 1,
  name: levelName(i + 1),
  speedMult: levelSpeedMult(i + 1),
}));

// 格式化时长 mm:ss
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// 格式化大数字
export function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "万";
  return n.toString();
}
