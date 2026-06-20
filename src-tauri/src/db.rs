use rusqlite::{Connection, params};
use std::sync::Mutex;
use tauri::Manager;

use crate::models::*;

/// 应用状态：持有 SQLite 连接
pub struct DbState(pub Mutex<Connection>);

/// 初始化数据库（建表 + 迁移）
pub fn init_db(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS practice_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mode TEXT NOT NULL,
            charset_id TEXT NOT NULL,
            display_mode TEXT NOT NULL,
            duration_sec INTEGER NOT NULL,
            chars_total INTEGER NOT NULL,
            chars_correct INTEGER NOT NULL,
            chars_wrong INTEGER NOT NULL,
            wpm REAL NOT NULL,
            accuracy REAL NOT NULL,
            score INTEGER NOT NULL,
            level_reached INTEGER NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_created ON practice_sessions(created_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_charset ON practice_sessions(charset_id);

        CREATE TABLE IF NOT EXISTS char_mastery (
            charset_id TEXT NOT NULL,
            char TEXT NOT NULL,
            correct INTEGER NOT NULL DEFAULT 0,
            wrong INTEGER NOT NULL DEFAULT 0,
            mastery REAL NOT NULL DEFAULT 0,
            last_seen TEXT NOT NULL,
            PRIMARY KEY (charset_id, char)
        );

        CREATE TABLE IF NOT EXISTS daily_stats (
            date TEXT NOT NULL,
            charset_id TEXT NOT NULL,
            sessions INTEGER NOT NULL DEFAULT 0,
            chars_total INTEGER NOT NULL DEFAULT 0,
            duration_sec INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (date, charset_id)
        );

        CREATE TABLE IF NOT EXISTS streaks (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            current INTEGER NOT NULL DEFAULT 0,
            longest INTEGER NOT NULL DEFAULT 0,
            last_active_date TEXT NOT NULL DEFAULT ''
        );
        INSERT OR IGNORE INTO streaks (id, current, longest, last_active_date) VALUES (1, 0, 0, '');

        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            unlocked_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS high_scores (
            mode TEXT NOT NULL,
            charset_id TEXT NOT NULL,
            score INTEGER NOT NULL,
            PRIMARY KEY (mode, charset_id)
        );
        ",
    )?;
    Ok(())
}

/// 获取数据库连接路径（app data dir）
pub fn db_path(app: &tauri::AppHandle) -> tauri::Result<std::path::PathBuf> {
    let dir = app.path().app_data_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| tauri::Error::Anyhow(e.into()))?;
    Ok(dir.join("zisu.db"))
}

/// 打开并初始化数据库
pub fn open_db(app: &tauri::AppHandle) -> tauri::Result<Connection> {
    let path = db_path(app)?;
    let conn = Connection::open(path).map_err(|e| tauri::Error::Anyhow(e.into()))?;
    init_db(&conn).map_err(|e| tauri::Error::Anyhow(e.into()))?;
    Ok(conn)
}

/// 当前 ISO 日期 (YYYY-MM-DD)，本地时区
pub fn today_local() -> String {
    use chrono::Local;
    Local::now().format("%Y-%m-%d").to_string()
}

/// 当前 ISO 时间戳
pub fn now_iso() -> String {
    use chrono::Local;
    Local::now().to_rfc3339()
}
