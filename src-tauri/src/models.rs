use serde::{Deserialize, Serialize};

/// 游戏模式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GameMode {
    /// 限时挑战
    Timed,
    /// 自由练习
    Free,
    /// 无尽模式
    Endless,
    /// 打字测试
    Test,
    /// 自定义练习
    Custom,
}

impl GameMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            GameMode::Timed => "timed",
            GameMode::Free => "free",
            GameMode::Endless => "endless",
            GameMode::Test => "test",
            GameMode::Custom => "custom",
        }
    }
}

/// 显示机制
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DisplayMode {
    Falling,
    Line,
}

/// 一次练习会话
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PracticeSession {
    pub id: Option<i64>,
    pub mode: String,
    pub charset_id: String,
    pub display_mode: String,
    pub duration_sec: i64,
    pub chars_total: i64,
    pub chars_correct: i64,
    pub chars_wrong: i64,
    pub wpm: f64,
    pub accuracy: f64,
    pub score: i64,
    pub level_reached: i64,
    pub created_at: String,
}

/// 单字掌握度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharMastery {
    pub charset_id: String,
    pub char: String,
    pub correct: i64,
    pub wrong: i64,
    pub mastery: f64,
    pub last_seen: String,
}

/// 每日统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStat {
    pub date: String,
    pub charset_id: String,
    pub sessions: i64,
    pub chars_total: i64,
    pub duration_sec: i64,
}

/// 连续打卡
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Streak {
    pub current: i64,
    pub longest: i64,
    pub last_active_date: String,
}

/// 成就
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub unlocked_at: String,
}

/// 设置 KV
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
}

/// 最高分
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HighScore {
    pub mode: String,
    pub charset_id: String,
    pub score: i64,
}

/// 统计聚合结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatsSummary {
    pub total_sessions: i64,
    pub total_chars: i64,
    pub total_duration_sec: i64,
    pub avg_wpm: f64,
    pub avg_accuracy: f64,
    pub best_wpm: f64,
}

/// WPM 趋势点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendPoint {
    pub date: String,
    pub wpm: f64,
    pub accuracy: f64,
}

/// 字集元信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharsetMeta {
    pub id: String,
    pub title: String,
    pub size: usize,
}
