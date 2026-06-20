import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:typingspeed.db')
  }
  return db
}

export async function initDb(): Promise<void> {
  const database = await getDb()
  await database.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS char_sets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      built_in INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS char_set_words (
      set_id TEXT NOT NULL,
      word TEXT NOT NULL,
      PRIMARY KEY (set_id, word)
    );

    CREATE TABLE IF NOT EXISTS progress (
      set_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 0,
      high_score INTEGER NOT NULL DEFAULT 0,
      total_sessions INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (set_id, mode)
    );

    CREATE TABLE IF NOT EXISTS typing_sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      set_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      correct_chars INTEGER NOT NULL,
      wrong_chars INTEGER NOT NULL,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      duration INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      word TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      last_seen INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      mode TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      achieved_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      unlocked_at INTEGER,
      progress INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      date TEXT PRIMARY KEY,
      target_score INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER
    );
  `)
}
