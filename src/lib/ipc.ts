// IPC 封装：Tauri 环境调用 Rust 命令，非 Tauri 环境（web/测试）用 localStorage 兜底
import { invoke, isTauri } from "@tauri-apps/api/core";

export const isTauriEnv = isTauri();

// ===== 类型定义（与 Rust models 对齐） =====
export interface PracticeSession {
  id?: number;
  mode: string;
  charset_id: string;
  display_mode: string;
  duration_sec: number;
  chars_total: number;
  chars_correct: number;
  chars_wrong: number;
  wpm: number;
  accuracy: number;
  score: number;
  level_reached: number;
  created_at: string;
}

export interface CharMastery {
  charset_id: string;
  char: string;
  correct: number;
  wrong: number;
  mastery: number;
  last_seen: string;
}

export interface DailyStat {
  date: string;
  charset_id: string;
  sessions: number;
  chars_total: number;
  duration_sec: number;
}

export interface Streak {
  current: number;
  longest: number;
  last_active_date: string;
}

export interface StatsSummary {
  total_sessions: number;
  total_chars: number;
  total_duration_sec: number;
  avg_wpm: number;
  avg_accuracy: number;
  best_wpm: number;
}

export interface TrendPoint {
  date: string;
  wpm: number;
  accuracy: number;
}

export interface CharDetail {
  char: string;
  correct: number;
  wrong: number;
}

export interface RecordSessionInput {
  mode: string;
  charset_id: string;
  display_mode: string;
  duration_sec: number;
  chars_total: number;
  chars_correct: number;
  chars_wrong: number;
  score: number;
  level_reached: number;
  char_details: CharDetail[];
}

export interface RecordSessionResult {
  session: PracticeSession;
  newly_unlocked: string[];
  streak: Streak;
  new_high_score: boolean;
}

export type Achievement = [string, string, string | null];

// ===== localStorage 兜底实现（web/测试环境） =====
const LS_KEY = "zisu_data_v1";

interface LsData {
  sessions: PracticeSession[];
  mastery: Record<string, Record<string, CharMastery>>;
  daily: Record<string, DailyStat>;
  streak: Streak;
  achievements: Record<string, string>;
  settings: Record<string, string>;
  high_scores: Record<string, number>;
}

function loadLs(): LsData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    sessions: [],
    mastery: {},
    daily: {},
    streak: { current: 0, longest: 0, last_active_date: "" },
    achievements: {},
    settings: {},
    high_scores: {},
  };
}

function saveLs(d: LsData) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {}
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

function wpmCalc(correct: number, sec: number): number {
  if (sec <= 0) return 0;
  return (correct / sec) * 60;
}

function accCalc(correct: number, wrong: number): number {
  const t = correct + wrong;
  if (t === 0) return 0;
  return correct / t;
}

function dateDiffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

// ===== 公共 API =====
export async function recordSession(
  input: RecordSessionInput
): Promise<RecordSessionResult> {
  if (isTauriEnv) {
    try {
      return await invoke<RecordSessionResult>("record_session", { input });
    } catch (e) {
      // QA: IPC 失败兜底，降级到 localStorage，避免前端卡死
      console.error("record_session IPC failed, fallback to localStorage:", e);
    }
  }
  // localStorage 兜底
  const d = loadLs();
  const wpm = wpmCalc(input.chars_correct, input.duration_sec);
  const accuracy = accCalc(input.chars_correct, input.chars_wrong);
  const now = nowIso();
  const today = todayStr();
  const session: PracticeSession = {
    id: d.sessions.length + 1,
    mode: input.mode,
    charset_id: input.charset_id,
    display_mode: input.display_mode,
    duration_sec: input.duration_sec,
    chars_total: input.chars_total,
    chars_correct: input.chars_correct,
    chars_wrong: input.chars_wrong,
    wpm,
    accuracy,
    score: input.score,
    level_reached: input.level_reached,
    created_at: now,
  };
  d.sessions.push(session);

  // 掌握度
  if (!d.mastery[input.charset_id]) d.mastery[input.charset_id] = {};
  for (const cd of input.char_details) {
    const existing = d.mastery[input.charset_id][cd.char] || {
      charset_id: input.charset_id,
      char: cd.char,
      correct: 0,
      wrong: 0,
      mastery: 0,
      last_seen: now,
    };
    existing.correct += cd.correct;
    existing.wrong += cd.wrong;
    const total = existing.correct + existing.wrong;
    existing.mastery = total === 0 ? 0 : existing.correct / total;
    existing.last_seen = now;
    d.mastery[input.charset_id][cd.char] = existing;
  }

  // 每日统计
  const dkey = today;
  if (!d.daily[dkey]) {
    d.daily[dkey] = {
      date: today,
      charset_id: input.charset_id,
      sessions: 0,
      chars_total: 0,
      duration_sec: 0,
    };
  }
  d.daily[dkey].sessions += 1;
  d.daily[dkey].chars_total += input.chars_total;
  d.daily[dkey].duration_sec += input.duration_sec;

  // 连续打卡
  const cur = d.streak;
  let newCurrent = cur.current;
  if (!cur.last_active_date) newCurrent = 1;
  else if (cur.last_active_date !== today) {
    const diff = dateDiffDays(cur.last_active_date, today);
    if (diff === 1) newCurrent = cur.current + 1;
    else if (diff > 1) newCurrent = 1;
  }
  d.streak = {
    current: newCurrent,
    longest: Math.max(newCurrent, cur.longest),
    last_active_date: today,
  };

  // 最高分
  let new_high_score = false;
  if (input.mode === "endless" || input.mode === "timed") {
    const hk = `${input.mode}:${input.charset_id}`;
    if (!d.high_scores[hk] || input.score > d.high_scores[hk]) {
      d.high_scores[hk] = input.score;
      new_high_score = true;
    }
  }

  // 成就（简化版）
  const newly_unlocked: string[] = [];
  const unlock = (id: string, cond: boolean) => {
    if (cond && !d.achievements[id]) {
      d.achievements[id] = now;
      newly_unlocked.push(id);
    }
  };
  unlock("first_practice", d.sessions.length >= 1);
  unlock("streak_3", d.streak.current >= 3);
  unlock("streak_7", d.streak.current >= 7);
  unlock("streak_30", d.streak.current >= 30);
  unlock("wpm_30", wpm >= 30);
  unlock("wpm_60", wpm >= 60);
  unlock("wpm_100", wpm >= 100);
  const totalChars = d.sessions.reduce((s, x) => s + x.chars_total, 0);
  unlock("chars_1000", totalChars >= 1000);
  unlock("chars_10000", totalChars >= 10000);
  let mastered = 0;
  for (const cs of Object.values(d.mastery)) {
    for (const m of Object.values(cs)) {
      if (m.correct >= 3 && m.mastery >= 0.85) mastered++;
    }
  }
  unlock("master_100", mastered >= 100);
  unlock("master_500", mastered >= 500);
  unlock("endless_500", input.mode === "endless" && input.score >= 500);
  unlock("timed_lv8", input.mode === "timed" && input.level_reached >= 8);

  saveLs(d);
  return { session, newly_unlocked, streak: d.streak, new_high_score };
}

export async function getStreak(): Promise<Streak> {
  if (isTauriEnv) return invoke<Streak>("get_streak");
  return loadLs().streak;
}

export async function getStatsSummary(): Promise<StatsSummary> {
  if (isTauriEnv) return invoke<StatsSummary>("get_stats_summary");
  const d = loadLs();
  const n = d.sessions.length;
  if (n === 0)
    return {
      total_sessions: 0,
      total_chars: 0,
      total_duration_sec: 0,
      avg_wpm: 0,
      avg_accuracy: 0,
      best_wpm: 0,
    };
  return {
    total_sessions: n,
    total_chars: d.sessions.reduce((s, x) => s + x.chars_total, 0),
    total_duration_sec: d.sessions.reduce((s, x) => s + x.duration_sec, 0),
    avg_wpm: d.sessions.reduce((s, x) => s + x.wpm, 0) / n,
    avg_accuracy: d.sessions.reduce((s, x) => s + x.accuracy, 0) / n,
    best_wpm: Math.max(...d.sessions.map((x) => x.wpm)),
  };
}

export async function getWpmTrend(days = 30): Promise<TrendPoint[]> {
  if (isTauriEnv) return invoke<TrendPoint[]>("get_wpm_trend", { days });
  const d = loadLs();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const byDate: Record<string, { w: number[]; a: number[] }> = {};
  for (const s of d.sessions) {
    const day = s.created_at.slice(0, 10);
    if (new Date(day) < cutoff) continue;
    if (!byDate[day]) byDate[day] = { w: [], a: [] };
    byDate[day].w.push(s.wpm);
    byDate[day].a.push(s.accuracy);
  }
  return Object.entries(byDate)
    .map(([date, v]) => ({
      date,
      wpm: v.w.reduce((s, x) => s + x, 0) / v.w.length,
      accuracy: v.a.reduce((s, x) => s + x, 0) / v.a.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDailyStats(days = 90): Promise<DailyStat[]> {
  if (isTauriEnv) return invoke<DailyStat[]>("get_daily_stats", { days });
  const d = loadLs();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return Object.values(d.daily)
    .filter((x) => new Date(x.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCharMastery(charsetId: string): Promise<CharMastery[]> {
  if (isTauriEnv) return invoke<CharMastery[]>("get_char_mastery", { charsetId });
  const d = loadLs();
  return Object.values(d.mastery[charsetId] || {});
}

export async function getAchievements(): Promise<Achievement[]> {
  if (isTauriEnv) return invoke<Achievement[]>("get_achievements");
  const d = loadLs();
  const all: [string, string][] = [
    ["first_practice", "首次练习"],
    ["streak_3", "连续打卡 3 天"],
    ["streak_7", "连续打卡 7 天"],
    ["streak_30", "连续打卡 30 天"],
    ["wpm_30", "WPM 突破 30"],
    ["wpm_60", "WPM 突破 60"],
    ["wpm_100", "WPM 突破 100"],
    ["chars_1000", "累计练习 1000 字"],
    ["chars_10000", "累计练习 10000 字"],
    ["master_100", "掌握 100 字"],
    ["master_500", "掌握 500 字"],
    ["endless_500", "无尽模式 500 分"],
    ["timed_lv8", "限时挑战达到大师级"],
  ];
  return all.map(([id, name]) => [id, name, d.achievements[id] || null]);
}

export async function getHighScore(mode: string, charsetId: string): Promise<number> {
  if (isTauriEnv) return invoke<number>("get_high_score", { mode, charsetId });
  const d = loadLs();
  return d.high_scores[`${mode}:${charsetId}`] || 0;
}

export async function getSetting(key: string): Promise<string | null> {
  if (isTauriEnv) return invoke<string | null>("get_setting", { key });
  return loadLs().settings[key] || null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  if (isTauriEnv) return invoke<Record<string, string>>("get_all_settings");
  return loadLs().settings;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (isTauriEnv) return invoke<void>("set_setting", { key, value });
  const d = loadLs();
  d.settings[key] = value;
  saveLs(d);
}
