use crate::achievements;
use crate::db::{self, DbState};
use crate::models::*;
use crate::stats;
use rusqlite::params;
use std::collections::HashMap;
use tauri::State;

/// 记录一次练习会话
#[derive(Debug, Clone, serde::Deserialize)]
pub struct RecordSessionInput {
    pub mode: String,
    pub charset_id: String,
    pub display_mode: String,
    pub duration_sec: i64,
    pub chars_total: i64,
    pub chars_correct: i64,
    pub chars_wrong: i64,
    pub score: i64,
    pub level_reached: i64,
    /// 字符对错明细：[{char, correct, wrong}]
    #[serde(default)]
    pub char_details: Vec<CharDetail>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CharDetail {
    pub char: String,
    pub correct: i64,
    pub wrong: i64,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct RecordSessionResult {
    pub session: PracticeSession,
    pub newly_unlocked: Vec<String>,
    pub streak: Streak,
    pub new_high_score: bool,
}

#[tauri::command]
pub fn record_session(
    input: RecordSessionInput,
    state: State<'_, DbState>,
) -> Result<RecordSessionResult, String> {
    let wpm = stats::calc_wpm(input.chars_correct, input.duration_sec);
    let accuracy = stats::calc_accuracy(input.chars_correct, input.chars_wrong);
    let now = db::now_iso();
    let today = db::today_local();

    let conn = state.0.lock().map_err(|e| e.to_string())?;

    // 插入会话
    conn.execute(
        "INSERT INTO practice_sessions
         (mode, charset_id, display_mode, duration_sec, chars_total, chars_correct, chars_wrong,
          wpm, accuracy, score, level_reached, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
        params![
            input.mode, input.charset_id, input.display_mode,
            input.duration_sec, input.chars_total, input.chars_correct, input.chars_wrong,
            wpm, accuracy, input.score, input.level_reached, now
        ],
    ).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();

    // 更新单字掌握度
    for d in &input.char_details {
        let mastery = crate::mastery::mastery_score(d.correct, d.wrong);
        conn.execute(
            "INSERT INTO char_mastery (charset_id, char, correct, wrong, mastery, last_seen)
             VALUES (?1,?2,?3,?4,?5,?6)
             ON CONFLICT(charset_id, char) DO UPDATE SET
               correct = correct + ?3, wrong = wrong + ?4, mastery = ?5, last_seen = ?6",
            params![input.charset_id, d.char, d.correct, d.wrong, mastery, now],
        ).map_err(|e| e.to_string())?;
    }

    // 更新每日统计
    conn.execute(
        "INSERT INTO daily_stats (date, charset_id, sessions, chars_total, duration_sec)
         VALUES (?1,?2,1,?3,?4)
         ON CONFLICT(date, charset_id) DO UPDATE SET
           sessions = sessions + 1, chars_total = chars_total + ?3, duration_sec = duration_sec + ?4",
        params![today, input.charset_id, input.chars_total, input.duration_sec],
    ).map_err(|e| e.to_string())?;

    // 更新连续打卡
    let mut streak = get_streak_inner(&conn);
    let new_streak = update_streak_inner(&conn, &streak, &today);
    streak.current = new_streak.current;
    streak.longest = new_streak.longest;
    streak.last_active_date = new_streak.last_active_date;

    // 最高分
    let mut new_high_score = false;
    if input.mode == "endless" || input.mode == "timed" {
        let prev: Option<i64> = conn
            .query_row(
                "SELECT score FROM high_scores WHERE mode=?1 AND charset_id=?2",
                params![input.mode, input.charset_id],
                |row| row.get(0),
            )
            .ok();
        if prev.map_or(true, |p| input.score > p) {
            conn.execute(
                "INSERT INTO high_scores (mode, charset_id, score) VALUES (?1,?2,?3)
                 ON CONFLICT(mode, charset_id) DO UPDATE SET score = ?3",
                params![input.mode, input.charset_id, input.score],
            ).map_err(|e| e.to_string())?;
            new_high_score = true;
        }
    }

    let session = PracticeSession {
        id: Some(id),
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

    // 成就检查（需要释放锁后重新获取，这里直接用 state）
    drop(conn);
    let newly_unlocked = achievements::check_all(&state, &session, &streak);

    Ok(RecordSessionResult {
        session,
        newly_unlocked,
        streak,
        new_high_score,
    })
}

fn get_streak_inner(conn: &rusqlite::Connection) -> Streak {
    conn.query_row(
        "SELECT current, longest, last_active_date FROM streaks WHERE id=1",
        [],
        |row| Ok(Streak {
            current: row.get(0)?,
            longest: row.get(1)?,
            last_active_date: row.get(2)?,
        }),
    )
    .unwrap_or(Streak {
        current: 0,
        longest: 0,
        last_active_date: String::new(),
    })
}

fn update_streak_inner(
    conn: &rusqlite::Connection,
    cur: &Streak,
    today: &str,
) -> Streak {
    use chrono::NaiveDate;
    let mut new_current = cur.current;
    if cur.last_active_date.is_empty() {
        new_current = 1;
    } else if cur.last_active_date != *today {
        // 计算日期差
        let last = NaiveDate::parse_from_str(&cur.last_active_date, "%Y-%m-%d").ok();
        let tod = NaiveDate::parse_from_str(today, "%Y-%m-%d").ok();
        if let (Some(l), Some(t)) = (last, tod) {
            let diff = (t - l).num_days();
            if diff == 1 {
                new_current = cur.current + 1;
            } else if diff > 1 {
                new_current = 1; // 断签
            }
            // diff == 0 同一天，不变
        } else {
            new_current = 1;
        }
    }
    let new_longest = new_current.max(cur.longest);
    let _ = conn.execute(
        "UPDATE streaks SET current=?1, longest=?2, last_active_date=?3 WHERE id=1",
        params![new_current, new_longest, today],
    );
    Streak {
        current: new_current,
        longest: new_longest,
        last_active_date: today.to_string(),
    }
}

/// 获取连续打卡
#[tauri::command]
pub fn get_streak(state: State<'_, DbState>) -> Result<Streak, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    Ok(get_streak_inner(&conn))
}

/// 获取统计概览
#[tauri::command]
pub fn get_stats_summary(state: State<'_, DbState>) -> Result<StatsSummary, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let total_sessions: i64 = conn
        .query_row("SELECT COUNT(*) FROM practice_sessions", [], |r| r.get(0))
        .unwrap_or(0);
    let total_chars: i64 = conn
        .query_row("SELECT COALESCE(SUM(chars_total),0) FROM practice_sessions", [], |r| r.get(0))
        .unwrap_or(0);
    let total_duration: i64 = conn
        .query_row("SELECT COALESCE(SUM(duration_sec),0) FROM practice_sessions", [], |r| r.get(0))
        .unwrap_or(0);
    let avg_wpm: f64 = conn
        .query_row("SELECT COALESCE(AVG(wpm),0) FROM practice_sessions", [], |r| r.get(0))
        .unwrap_or(0.0);
    let avg_acc: f64 = conn
        .query_row("SELECT COALESCE(AVG(accuracy),0) FROM practice_sessions", [], |r| r.get(0))
        .unwrap_or(0.0);
    let best_wpm: f64 = conn
        .query_row("SELECT COALESCE(MAX(wpm),0) FROM practice_sessions", [], |r| r.get(0))
        .unwrap_or(0.0);
    Ok(StatsSummary {
        total_sessions,
        total_chars,
        total_duration_sec: total_duration,
        avg_wpm,
        avg_accuracy: avg_acc,
        best_wpm,
    })
}

/// 获取 WPM 趋势（最近 N 天）
#[tauri::command]
pub fn get_wpm_trend(state: State<'_, DbState>, days: Option<i64>) -> Result<Vec<TrendPoint>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let days = days.unwrap_or(30);
    let mut stmt = conn
        .prepare(
            "SELECT substr(created_at,1,10) as d, AVG(wpm) as w, AVG(accuracy) as a
             FROM practice_sessions
             WHERE created_at >= date('now', ?1)
             GROUP BY d ORDER BY d",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![format!("-{} days", days)], |row| {
            Ok(TrendPoint {
                date: row.get(0)?,
                wpm: row.get(1)?,
                accuracy: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// 获取每日统计（用于热力图）
#[tauri::command]
pub fn get_daily_stats(state: State<'_, DbState>, days: Option<i64>) -> Result<Vec<DailyStat>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let days = days.unwrap_or(90);
    let mut stmt = conn
        .prepare(
            "SELECT date, charset_id, sessions, chars_total, duration_sec
             FROM daily_stats WHERE date >= date('now', ?1) ORDER BY date",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![format!("-{} days", days)], |row| {
            Ok(DailyStat {
                date: row.get(0)?,
                charset_id: row.get(1)?,
                sessions: row.get(2)?,
                chars_total: row.get(3)?,
                duration_sec: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// 获取某字集的单字掌握度
#[tauri::command]
pub fn get_char_mastery(state: State<'_, DbState>, charset_id: String) -> Result<Vec<CharMastery>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT charset_id, char, correct, wrong, mastery, last_seen FROM char_mastery WHERE charset_id=?1 ORDER BY char")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![charset_id], |row| {
            Ok(CharMastery {
                charset_id: row.get(0)?,
                char: row.get(1)?,
                correct: row.get(2)?,
                wrong: row.get(3)?,
                mastery: row.get(4)?,
                last_seen: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// 获取成就列表
#[tauri::command]
pub fn get_achievements(state: State<'_, DbState>) -> Result<Vec<(String, String, Option<String>)>, String> {
    Ok(achievements::list_achievements(&state.0))
}

/// 获取最高分
#[tauri::command]
pub fn get_high_score(state: State<'_, DbState>, mode: String, charset_id: String) -> Result<i64, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let score: i64 = conn
        .query_row(
            "SELECT score FROM high_scores WHERE mode=?1 AND charset_id=?2",
            params![mode, charset_id],
            |r| r.get(0),
        )
        .unwrap_or(0);
    Ok(score)
}

/// 获取设置
#[tauri::command]
pub fn get_setting(state: State<'_, DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let v: Option<String> = conn
        .query_row(
            "SELECT value FROM settings WHERE key=?1",
            params![key],
            |r| r.get(0),
        )
        .ok();
    Ok(v)
}

/// 获取所有设置
#[tauri::command]
pub fn get_all_settings(state: State<'_, DbState>) -> Result<HashMap<String, String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))).map_err(|e| e.to_string())?;
    let mut out = HashMap::new();
    for r in rows {
        let (k, v) = r.map_err(|e| e.to_string())?;
        out.insert(k, v);
    }
    Ok(out)
}

/// 设置
#[tauri::command]
pub fn set_setting(state: State<'_, DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1,?2)
         ON CONFLICT(key) DO UPDATE SET value=?2",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
