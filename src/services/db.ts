import { getDb } from '../composables/useDb'
import { generateId } from '../utils/charSets'
import type { GameMode } from '../stores/game'

export interface CharSet {
  id: string
  name: string
  built_in: number
  word_count: number
  created_at: number
}

export interface TypingSession {
  id: string
  mode: GameMode
  set_id: string
  score: number
  correct_chars: number
  wrong_chars: number
  wpm: number
  accuracy: number
  duration: number
  created_at: number
}

export interface Mistake {
  word: string
  count: number
  last_seen: number
}

export interface Progress {
  set_id: string
  mode: GameMode
  level: number
  high_score: number
  total_sessions: number
}

export interface LeaderboardEntry {
  mode: GameMode
  set_id: string
  score: number
  achieved_at: number
}

export interface AchievementRecord {
  id: string
  unlocked_at: number | null
  progress: number
}

export interface DailyChallenge {
  date: string
  target_score: number
  completed: number
  completed_at: number | null
}

export async function getCharSets(): Promise<CharSet[]> {
  const db = await getDb()
  return db.select('SELECT * FROM char_sets ORDER BY built_in DESC, name')
}

export async function getCharSetWords(setId: string): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ word: string }[]>('SELECT word FROM char_set_words WHERE set_id = ?', [setId])
  return rows.map(r => r.word)
}

export async function createCharSet(id: string, name: string, words: string[]): Promise<void> {
  const db = await getDb()
  const uniqueWords = Array.from(new Set(words))
  const now = Date.now()
  await db.execute(
    'INSERT INTO char_sets (id, name, built_in, word_count, created_at) VALUES (?, ?, 0, ?, ?)',
    [id, name, uniqueWords.length, now]
  )
  for (const word of uniqueWords) {
    await db.execute('INSERT INTO char_set_words (set_id, word) VALUES (?, ?)', [id, word])
  }
}

export async function deleteCharSet(id: string): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM char_set_words WHERE set_id = ?', [id])
  await db.execute('DELETE FROM char_sets WHERE id = ? AND built_in = 0', [id])
}

export async function saveSession(
  mode: GameMode,
  setId: string,
  score: number,
  correctChars: number,
  wrongChars: number,
  wpm: number,
  accuracy: number,
  duration: number
): Promise<void> {
  const db = await getDb()
  const id = generateId('s_')
  const now = Date.now()
  await db.execute(
    `INSERT INTO typing_sessions
     (id, mode, set_id, score, correct_chars, wrong_chars, wpm, accuracy, duration, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, mode, setId, score, correctChars, wrongChars, wpm, accuracy, duration, now]
  )

  await db.execute(
    `INSERT INTO progress (set_id, mode, total_sessions) VALUES (?, ?, 1)
     ON CONFLICT(set_id, mode) DO UPDATE SET total_sessions = total_sessions + 1`,
    [setId, mode]
  )

  await db.execute(
    `INSERT INTO leaderboard (mode, set_id, score, achieved_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(mode) DO UPDATE SET score = excluded.score, set_id = excluded.set_id, achieved_at = excluded.achieved_at
     WHERE excluded.score > score`,
    [mode, setId, score, now]
  )
}

export async function recordMistakes(words: string[]): Promise<void> {
  if (words.length === 0) return
  const db = await getDb()
  const now = Date.now()
  for (const word of words) {
    await db.execute(
      `INSERT INTO mistakes (word, count, last_seen) VALUES (?, 1, ?)
       ON CONFLICT(word) DO UPDATE SET count = count + 1, last_seen = excluded.last_seen`,
      [word, now]
    )
  }
}

export async function getMistakes(limit = 100): Promise<Mistake[]> {
  const db = await getDb()
  return db.select('SELECT word, count, last_seen FROM mistakes ORDER BY count DESC LIMIT ?', [limit])
}

export async function clearMistakes(): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM mistakes')
}

export async function getStatsSummary(): Promise<{ total_minutes: number; total_chars: number; avg_wpm: number; avg_accuracy: number }> {
  const db = await getDb()
  const rows = await db.select<{ total_minutes: number; total_chars: number; avg_wpm: number; avg_accuracy: number }[]>(
    `SELECT
      COALESCE(SUM(duration), 0) / 60.0 AS total_minutes,
      COALESCE(SUM(correct_chars), 0) AS total_chars,
      COALESCE(AVG(wpm), 0) AS avg_wpm,
      COALESCE(AVG(accuracy), 0) AS avg_accuracy
    FROM typing_sessions`
  )
  return rows[0]
}

export async function getWeeklyStats(): Promise<{ date: string; wpm: number; accuracy: number; sessions: number }[]> {
  const db = await getDb()
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return db.select(
    `SELECT
      date(created_at / 1000, 'unixepoch', 'localtime') AS date,
      AVG(wpm) AS wpm,
      AVG(accuracy) AS accuracy,
      COUNT(*) AS sessions
    FROM typing_sessions
    WHERE created_at >= ?
    GROUP BY date
    ORDER BY date`,
    [sevenDaysAgo]
  )
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const db = await getDb()
  return db.select('SELECT * FROM leaderboard ORDER BY score DESC')
}

export async function getAchievements(): Promise<AchievementRecord[]> {
  const db = await getDb()
  return db.select('SELECT * FROM achievements')
}

export async function updateAchievementProgress(id: string, progress: number): Promise<void> {
  const db = await getDb()
  const now = Date.now()
  await db.execute(
    `INSERT INTO achievements (id, progress) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET
       progress = MAX(excluded.progress, achievements.progress),
       unlocked_at = CASE WHEN achievements.unlocked_at IS NULL AND MAX(excluded.progress, achievements.progress) >= 100 THEN ? ELSE achievements.unlocked_at END`,
    [id, Math.min(progress, 100), now]
  )
}

export async function getDailyChallenge(date: string): Promise<DailyChallenge | null> {
  const db = await getDb()
  const rows = await db.select<DailyChallenge[]>('SELECT * FROM daily_challenges WHERE date = ?', [date])
  return rows[0] || null
}

export async function ensureDailyChallenge(date: string): Promise<DailyChallenge> {
  const existing = await getDailyChallenge(date)
  if (existing) return existing
  const db = await getDb()
  const target = 500 + Math.floor(Math.random() * 500)
  await db.execute('INSERT INTO daily_challenges (date, target_score) VALUES (?, ?)', [date, target])
  return { date, target_score: target, completed: 0, completed_at: null }
}

export async function completeDailyChallenge(date: string): Promise<void> {
  const db = await getDb()
  const now = Date.now()
  await db.execute(
    'UPDATE daily_challenges SET completed = 1, completed_at = ? WHERE date = ? AND completed = 0',
    [now, date]
  )
}

export async function getTodayMinutes(): Promise<number> {
  const db = await getDb()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const rows = await db.select<{ total: number }[]>(
    'SELECT COALESCE(SUM(duration), 0) / 60.0 AS total FROM typing_sessions WHERE created_at >= ?',
    [startOfDay.getTime()]
  )
  return Math.round(rows[0].total)
}

export async function getProgress(setId: string, mode: GameMode): Promise<Progress> {
  const db = await getDb()
  const rows = await db.select<Progress[]>('SELECT * FROM progress WHERE set_id = ? AND mode = ?', [setId, mode])
  return rows[0] || { set_id: setId, mode, level: 0, high_score: 0, total_sessions: 0 }
}
