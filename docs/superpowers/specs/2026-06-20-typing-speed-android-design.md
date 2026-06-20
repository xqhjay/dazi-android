# 打字提速 Android App 产品需求文档（PRD）

## 1. 项目概述

### 1.1 项目背景

本项目基于开源网页项目 [limalivy/zjxx](https://github.com/limalivy/zjxx) 的核心玩法（汉字下落式打字练习），但去除其修仙化包装，重新设计为面向移动端的专业打字速度练习工具。

### 1.2 产品定位

**App 名称**：打字提速  
**定位**：移动端中文打字速度练习工具  
**目标用户**：希望利用碎片时间提升中文输入速度的学生、职场人士、手机输入法练习者。

### 1.3 核心价值

- 通过游戏化的下落式练习提升打字速度
- 数据驱动的进步追踪
- 完全离线可用，随时随地练习
- 支持自定义内容，满足个性化需求

## 2. 功能范围

### 2.1 核心练习模式

| 模式 | 说明 | 规则 |
|---|---|---|
| 限时挑战 | 4 分钟限时挑战 | 在限定时间内打出更多正确字数，根据准确率与速度评分 |
| 自由练习 | 不限时自由练习 | 可自定义下落速度（0.1x–5.0x），支持暂停/继续 |
| 无尽模式 | 速度递增的生存模式 | 初始速度较慢，每 15 秒速度提升，坚持越久分数越高 |

### 2.2 扩展功能

| 功能 | 优先级 | 说明 |
|---|---|---|
| 每日挑战 | P0 | 每日生成一组固定目标，完成后打卡，保持练习习惯 |
| 成就徽章 | P0 | 根据连击、速度突破、练习天数等解锁徽章 |
| 统计报表 | P0 | WPM、正确率、练习时长、趋势折线图 |
| 错字重练 | P0 | 自动收集错误字，生成专项练习字集 |
| 自定义字集 | P0 | 新建/编辑/删除个人字集 |
| 主题切换 | P1 | 深色/浅色双主题，可跟随系统 |
| 音效/震动 | P1 | 打字、连击、通关反馈 |
| 本地排行榜 | P1 | 各模式最高分与历史记录 |

## 3. 用户故事

### 3.1 练习场景

- 作为用户，我希望能选择不同练习模式，以便针对自己的弱项训练。
- 作为用户，我希望字从屏幕上方落下，我在底部输入框输入对应汉字，正确则消除，错误则提示。
- 作为用户，我希望自由练习可以调整速度并随时暂停，以便控制练习强度。

### 3.2 进步追踪

- 作为用户，我希望查看我的 WPM、正确率、练习时长趋势，以便了解自己的进步。
- 作为用户，我希望系统自动记录我常错的字，并能一键重练，以便针对性提升。

### 3.3 习惯养成

- 作为用户，我希望每天有固定挑战目标，完成后有反馈，以便保持练习习惯。
- 作为用户，我希望解锁成就徽章，以便获得持续练习的动力。

### 3.4 个性化

- 作为用户，我希望添加自己需要的字集（如专业术语、考试词汇），以便练习特定内容。
- 作为用户，我希望切换深色/浅色主题，以便适应不同光线环境。

## 4. 信息架构

底部 Tab 导航：

```
┌─────────┬─────────┬─────────┬─────────┐
│  练习   │  统计   │  字集   │  我的   │
└─────────┴─────────┴─────────┴─────────┘
```

### 4.1 练习页

- 顶部：欢迎语 + 今日练习时长
- 中部：模式卡片（限时挑战 / 自由练习 / 无尽模式 / 每日挑战）
- 底部：继续上次练习（如有）

### 4.2 统计页

- 概览卡片：总练习时长、总字数、平均 WPM、平均正确率
- 趋势图：近 7 天 WPM / 正确率
- 排行榜：各模式最高分

### 4.3 字集页

- 内置字集列表（常用字 500 / 1000 / 1500）
- 自定义字集列表
- 新建/编辑/删除自定义字集

### 4.4 我的页

- 用户头像/名称占位
- 成就徽章墙
- 设置：主题、音效、震动、清除数据

## 5. 核心流程

### 5.1 开始练习

1. 用户在练习页选择模式
2. 进入游戏页，字从顶部生成并下落
3. 用户在底部输入框输入
4. 正确：字消失，加分/连击
5. 错误：连击中断，可选择显示正确拼音提示
6. 时间到/生命耗尽：显示结果页

### 5.2 错字重练

1. 系统自动记录每次练习中的错误字
2. 当错字达到一定数量，推荐「错字重练」
3. 用户点击后进入练习模式，仅使用错字字集

### 5.3 自定义字集

1. 用户在字集页点击「新建字集」
2. 输入名称，粘贴或输入汉字
3. 系统自动去重，保存到 SQLite
4. 可在练习时选择该字集

## 6. UI/UX 规范

### 6.1 设计原则

- 现代极简专业风
- 去除修仙化元素
- 强调数据清晰与操作效率
- 拇指区优先

### 6.2 色彩系统

| Token | 日间 | 夜间 | 用途 |
|---|---|---|---|
| `--color-primary` | `#2563EB` | `#60A5FA` | 主色：按钮、激活态 |
| `--color-secondary` | `#0EA5E9` | `#38BDF8` | 次色：图表、强调 |
| `--color-accent` | `#F59E0B` | `#FBBF24` | 强调：成就、高分 |
| `--color-bg` | `#FFFFFF` | `#0F172A` | 背景 |
| `--color-surface` | `#F8FAFC` | `#1E293B` | 卡片背景 |
| `--color-text` | `#1E293B` | `#F1F5F9` | 主文本 |
| `--color-text-muted` | `#64748B` | `#94A3B8` | 次要文本 |
| `--color-success` | `#10B981` | `#34D399` | 成功 |
| `--color-danger` | `#EF4444` | `#F87171` | 错误/警告 |

### 6.3 字体

- 中文：系统默认无衬线字体（优先 PingFang SC / Noto Sans CJK）
- 数字：系统默认等宽或 Tabular 数字

### 6.4 间距与圆角

- 页面边距：16px
- 卡片间距：12px
- 卡片圆角：16px
- 按钮圆角：12px
- 输入框圆角：8px

### 6.5 组件规范

- 底部 Tab 栏高度：56px，图标 24px
- 顶部标题栏高度：56px
- 主要操作按钮位于屏幕底部拇指区
- 游戏页输入框固定在底部，高度 56px

## 7. 技术架构

| 层级 | 技术 |
|---|---|
| 前端框架 | Vue 3 + Vite |
| 样式 | TailwindCSS + CSS 变量主题 |
| 本地数据库 | SQLite（通过 `tauri-plugin-sql`） |
| 后端命令 | Rust Tauri Commands |
| 音频 | Web Audio API |
| 震动 | `navigator.vibrate()` |
| 构建 | Tauri 2 Android，ABI 限制为 `arm64-v8a` |

## 8. 数据模型

### 8.1 表结构

```sql
-- 应用设置
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 字集
CREATE TABLE char_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  built_in INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL,
  created_at INTEGER
);

-- 字集汉字
CREATE TABLE char_set_words (
  set_id TEXT NOT NULL,
  word TEXT NOT NULL,
  PRIMARY KEY (set_id, word)
);

-- 各字集各模式进度/等级
CREATE TABLE progress (
  set_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  high_score INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (set_id, mode)
);

-- 每次练习记录
CREATE TABLE typing_sessions (
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

-- 错字统计
CREATE TABLE mistakes (
  word TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  last_seen INTEGER NOT NULL
);

-- 本地排行榜
CREATE TABLE leaderboard (
  mode TEXT PRIMARY KEY,
  set_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  achieved_at INTEGER NOT NULL
);

-- 成就
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  unlocked_at INTEGER,
  progress INTEGER NOT NULL DEFAULT 0
);

-- 每日挑战
CREATE TABLE daily_challenges (
  date TEXT PRIMARY KEY,
  target_score INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER
);
```

## 9. 非功能性需求

| 类别 | 要求 |
|---|---|
| 离线优先 | 核心功能完全离线可用，无需网络 |
| 权限最小化 | 不申请网络、存储等敏感权限；音效/震动通过 Web API 实现 |
| 性能 | 游戏循环 60fps，低端机不低于 30fps |
| 兼容性 | Android 7.0+（API 24），仅 arm64-v8a |
| 安全区 | 适配刘海屏、圆角屏、底部手势条 |
| 输入法 | 兼容中文输入法 composition 事件 |

## 10. 风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| Tauri 2 Android 交叉编译失败 | 高 | 准备 GitHub Actions 远程构建方案 |
| 中文输入法 composition 事件异常 | 中 | 充分测试主流输入法 |
| 低端设备动画卡顿 | 中 | 优化 DOM/Canvas 渲染，提供性能降级 |
| SQLite 移动设备读写异常 | 中 | 使用 `tauri-plugin-sql` 官方插件 |

## 11. 后续迭代（V2）

- 多语言支持（英文、日文等）
- 云端同步与账号系统
- 自定义词组/句子练习
- 真人对战/排行榜
- iOS 版本

## 12. 验收标准

- [ ] 三种练习模式可正常运行
- [ ] 每日挑战、成就、统计、错字重练、自定义字集功能可用
- [ ] 深色/浅色主题可切换
- [ ] 音效与震动反馈正常
- [ ] 本地排行榜记录正确
- [ ] Android arm64-v8a APK 构建成功
- [ ] 测试用例通过率达到 90% 以上
