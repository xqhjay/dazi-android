use crate::models::*;

/// WPM 计算：每分钟正确字符数
/// 中文按字符计，1 字 = 1 WPM 单位
pub fn calc_wpm(chars_correct: i64, duration_sec: i64) -> f64 {
    if duration_sec <= 0 {
        return 0.0;
    }
    (chars_correct as f64 / duration_sec as f64) * 60.0
}

/// 准确率：correct / (correct + wrong)
pub fn calc_accuracy(chars_correct: i64, chars_wrong: i64) -> f64 {
    let total = chars_correct + chars_wrong;
    if total == 0 {
        return 0.0;
    }
    chars_correct as f64 / total as f64
}

/// 速度等级映射（去修仙化）
/// Lv.1 入门 0.5× → Lv.8 大师 4.0×
pub fn level_speed_mult(level: i64) -> f64 {
    match level {
        1 => 0.5,
        2 => 1.0,
        3 => 1.5,
        4 => 2.0,
        5 => 2.5,
        6 => 3.0,
        7 => 3.5,
        _ if level >= 8 => 4.0,
        _ => 0.5,
    }
}

pub fn level_name(level: i64) -> &'static str {
    match level {
        1 => "入门",
        2 => "初级",
        3 => "进阶",
        4 => "熟练",
        5 => "精通",
        6 => "高手",
        7 => "专家",
        _ => "大师",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calc_wpm() {
        assert_eq!(calc_wpm(0, 60), 0.0);
        assert_eq!(calc_wpm(60, 60), 60.0);
        assert_eq!(calc_wpm(30, 30), 60.0);
        assert_eq!(calc_wpm(100, 0), 0.0);
    }

    #[test]
    fn test_calc_accuracy() {
        assert_eq!(calc_accuracy(0, 0), 0.0);
        assert_eq!(calc_accuracy(90, 10), 0.9);
        assert!((calc_accuracy(1, 1) - 0.5).abs() < 1e-9);
    }

    #[test]
    fn test_level_speed_mult() {
        assert_eq!(level_speed_mult(1), 0.5);
        assert_eq!(level_speed_mult(4), 2.0);
        assert_eq!(level_speed_mult(8), 4.0);
        assert_eq!(level_speed_mult(100), 4.0);
    }

    #[test]
    fn test_level_name() {
        assert_eq!(level_name(1), "入门");
        assert_eq!(level_name(8), "大师");
        assert_eq!(level_name(99), "大师");
    }
}

// 占位避免未使用警告（StatsSummary 在 commands 中使用）
#[allow(dead_code)]
fn _use_models(_s: StatsSummary) {}
