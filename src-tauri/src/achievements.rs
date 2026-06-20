use crate::db::DbState;
use crate::models::*;
use rusqlite::{params, Connection};
use std::sync::Mutex;

/// 成就定义
pub const ACHIEVEMENTS: &[(&str, &str)] = &[
    ("first_practice", "首次练习"),
    ("streak_3", "连续打卡 3 天"),
    ("streak_7", "连续打卡 7 天"),
    ("streak_30", "连续打卡 30 天"),
    ("wpm_30", "WPM 突破 30"),
    ("wpm_60", "WPM 突破 60"),
    ("wpm_100", "WPM 突破 100"),
    ("chars_1000", "累计练习 1000 字"),
    ("chars_10000", "累计练习 10000 字"),
    ("master_100", "掌握 100 字"),
    ("master_500", "掌握 500 字"),
    ("endless_500", "无尽模式 500 分"),
    ("timed_lv8", "限时挑战达到大师级"),
];

/// 尝试解锁成就，返回是否新解锁
pub fn try_unlock(conn: &Mutex<Connection>, id: &str) -> bool {
    let conn = conn.lock().unwrap();
    // 已存在则不重复解锁
    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM achievements WHERE id = ?1",
            params![id],
            |_| Ok(true),
        )
        .unwrap_or(false);
    if exists {
        return false;
    }
    let now = crate::db::now_iso();
    conn.execute(
        "INSERT OR IGNORE INTO achievements (id, unlocked_at) VALUES (?1, ?2)",
        params![id, now],
    )
    .ok()
    .map(|n| n > 0)
    .unwrap_or(false)
}

/// 列出所有成就及解锁状态
pub fn list_achievements(conn: &Mutex<Connection>) -> Vec<(String, String, Option<String>)> {
    let conn = conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, unlocked_at FROM achievements")
        .unwrap();
    let unlocked: std::collections::HashMap<String, String> = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .unwrap()
        .filter_map(Result::ok)
        .collect();

    ACHIEVEMENTS
        .iter()
        .map(|(id, name)| {
            let unlocked_at = unlocked.get(*id).cloned();
            (id.to_string(), name.to_string(), unlocked_at)
        })
        .collect()
}

/// 检查并解锁所有应触发的成就
/// 在每次会话记录后调用
pub fn check_all(
    state: &DbState,
    session: &PracticeSession,
    streak: &Streak,
) -> Vec<String> {
    let mut newly = Vec::new();
    let conn = &state.0;

    // first_practice: 总会话数 >= 1
    {
        let total: i64 = conn
            .lock()
            .unwrap()
            .query_row("SELECT COUNT(*) FROM practice_sessions", [], |row| {
                row.get(0)
            })
            .unwrap_or(0);
        if total >= 1 && try_unlock(conn, "first_practice") {
            newly.push("first_practice".to_string());
        }
    }

    // streak 成就
    if streak.current >= 30 && try_unlock(conn, "streak_30") {
        newly.push("streak_30".to_string());
    } else if streak.current >= 7 && try_unlock(conn, "streak_7") {
        newly.push("streak_7".to_string());
    } else if streak.current >= 3 && try_unlock(conn, "streak_3") {
        newly.push("streak_3".to_string());
    }

    // wpm 成就
    if session.wpm >= 100.0 && try_unlock(conn, "wpm_100") {
        newly.push("wpm_100".to_string());
    } else if session.wpm >= 60.0 && try_unlock(conn, "wpm_60") {
        newly.push("wpm_60".to_string());
    } else if session.wpm >= 30.0 && try_unlock(conn, "wpm_30") {
        newly.push("wpm_30".to_string());
    }

    // chars 累计
    {
        let total_chars: i64 = conn
            .lock()
            .unwrap()
            .query_row(
                "SELECT COALESCE(SUM(chars_total), 0) FROM practice_sessions",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if total_chars >= 10000 && try_unlock(conn, "chars_10000") {
            newly.push("chars_10000".to_string());
        } else if total_chars >= 1000 && try_unlock(conn, "chars_1000") {
            newly.push("chars_1000".to_string());
        }
    }

    // master 字数
    {
        let mastered: i64 = conn
            .lock()
            .unwrap()
            .query_row(
                "SELECT COUNT(*) FROM char_mastery WHERE mastery >= 0.85 AND correct >= 3",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if mastered >= 500 && try_unlock(conn, "master_500") {
            newly.push("master_500".to_string());
        } else if mastered >= 100 && try_unlock(conn, "master_100") {
            newly.push("master_100".to_string());
        }
    }

    // endless 500 分
    if session.mode == "endless" && session.score >= 500 && try_unlock(conn, "endless_500") {
        newly.push("endless_500".to_string());
    }

    // timed 达到 Lv.8
    if session.mode == "timed" && session.level_reached >= 8 && try_unlock(conn, "timed_lv8") {
        newly.push("timed_lv8".to_string());
    }

    newly
}
