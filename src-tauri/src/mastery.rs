/// 单字掌握度评分 + 错字强化复现算法
///
/// 设计原则（参考原版 zjxx 智能练习系统）：
/// - 错字/漏字进入"强化池"
/// - 10 秒后高概率（70%）复现
/// - 连续正确 2 次后移出强化池
/// - 掌握度 = correct / (correct + wrong)，阈值 0.85 视为掌握

/// 掌握度评分：correct / (correct + wrong)，无数据返回 0
pub fn mastery_score(correct: i64, wrong: i64) -> f64 {
    let total = correct + wrong;
    if total == 0 {
        return 0.0;
    }
    correct as f64 / total as f64
}

/// 是否视为掌握（阈值 0.85，且至少正确 3 次）
pub fn is_mastered(correct: i64, wrong: i64) -> bool {
    correct >= 3 && mastery_score(correct, wrong) >= 0.85
}

/// 强化池中的字条目
#[derive(Debug, Clone, PartialEq)]
pub struct ReinforceEntry {
    pub char: String,
    /// 加入时间戳（秒）
    pub added_at: i64,
    /// 连续正确计数
    pub consecutive_correct: i64,
}

/// 强化池
#[derive(Debug, Clone, Default)]
pub struct ReinforcePool {
    entries: Vec<ReinforceEntry>,
}

impl ReinforcePool {
    pub fn new() -> Self {
        Self { entries: Vec::new() }
    }

    /// 加入/刷新强化池（错字触发）
    pub fn add(&mut self, char: &str, now: i64) {
        if let Some(e) = self.entries.iter_mut().find(|e| e.char == char) {
            e.added_at = now;
            e.consecutive_correct = 0;
        } else {
            self.entries.push(ReinforceEntry {
                char: char.to_string(),
                added_at: now,
                consecutive_correct: 0,
            });
        }
    }

    /// 记录正确输入：连续正确 2 次则移出强化池
    pub fn record_correct(&mut self, char: &str) {
        if let Some(e) = self.entries.iter_mut().find(|e| e.char == char) {
            e.consecutive_correct += 1;
            if e.consecutive_correct >= 2 {
                self.entries.retain(|x| x.char != char);
            }
        }
    }

    /// 记录错误输入：重置连续正确
    pub fn record_wrong(&mut self, char: &str, now: i64) {
        if let Some(e) = self.entries.iter_mut().find(|e| e.char == char) {
            e.consecutive_correct = 0;
            e.added_at = now;
        } else {
            self.add(char, now);
        }
    }

    /// 是否应从强化池抽取（加入超过 10 秒，70% 概率）
    pub fn should_reinforce(&self, now: i64, rng_value: f64) -> Option<&ReinforceEntry> {
        let eligible: Vec<&ReinforceEntry> = self
            .entries
            .iter()
            .filter(|e| now - e.added_at >= 10)
            .collect();
        if eligible.is_empty() {
            return None;
        }
        // 70% 概率复现
        if rng_value < 0.7 {
            // 选最早加入的（最久未强化）
            eligible.iter().min_by_key(|e| e.added_at).copied()
        } else {
            None
        }
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mastery_score() {
        assert_eq!(mastery_score(0, 0), 0.0);
        assert_eq!(mastery_score(10, 0), 1.0);
        assert_eq!(mastery_score(8, 2), 0.8);
        assert!((mastery_score(1, 1) - 0.5).abs() < 1e-9);
    }

    #[test]
    fn test_is_mastered() {
        assert!(!is_mastered(2, 0)); // 正确次数不足
        assert!(is_mastered(3, 0));
        assert!(!is_mastered(3, 1)); // 0.75 < 0.85
        assert!(is_mastered(10, 1)); // ~0.91
    }

    #[test]
    fn test_reinforce_pool_add_and_remove() {
        let mut pool = ReinforcePool::new();
        pool.add("的", 0);
        assert_eq!(pool.len(), 1);

        // 连续正确 1 次不移除
        pool.record_correct("的");
        assert_eq!(pool.len(), 1);

        // 连续正确 2 次移除
        pool.record_correct("的");
        assert_eq!(pool.len(), 0);
    }

    #[test]
    fn test_reinforce_pool_wrong_resets() {
        let mut pool = ReinforcePool::new();
        pool.add("了", 0);
        pool.record_correct("了");
        pool.record_wrong("了", 5);
        // 仍在池中，连续正确被重置
        assert_eq!(pool.len(), 1);
        pool.record_correct("了");
        assert_eq!(pool.len(), 1); // 只 1 次，不移除
        pool.record_correct("了");
        assert_eq!(pool.len(), 0);
    }

    #[test]
    fn test_should_reinforce_timing() {
        let mut pool = ReinforcePool::new();
        pool.add("我", 0);

        // 5 秒内不强化
        assert!(pool.should_reinforce(5, 0.5).is_none());

        // 10 秒后，rng < 0.7 时强化
        assert!(pool.should_reinforce(10, 0.5).is_some());
        // rng >= 0.7 时不强化
        assert!(pool.should_reinforce(10, 0.8).is_none());
    }

    #[test]
    fn test_should_reinforce_oldest_first() {
        let mut pool = ReinforcePool::new();
        pool.add("甲", 0);
        pool.add("乙", 5);
        // 15 秒时两者都符合条件，应选最早加入的"甲"
        let r = pool.should_reinforce(15, 0.5).unwrap();
        assert_eq!(r.char, "甲");
    }
}
