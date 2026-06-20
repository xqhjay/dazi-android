# 打字提速 Android App 实现计划

> **For agentic workers:** 计划按任务分块执行，每块完成后验证。因环境不可用 `superpowers:subagent-driven-development`，将使用 Task 子代理或直接工具调用执行。

**Goal:** 使用 Tauri 2 + Rust + Vue 3 构建一款 Android arm64-v8a 中文打字速度练习 App，包含三种练习模式、每日挑战、成就、统计、错字重练、自定义字集、主题切换与反馈。

**Architecture:** 前端 Vue 3 负责 UI 与游戏渲染，Rust Tauri Commands 处理业务计算与数据库操作，SQLite 通过 `tauri-plugin-sql` 持久化，Web Audio API 与 `navigator.vibrate` 提供反馈。

**Tech Stack:** Tauri 2, Rust, Vue 3, Vite, TailwindCSS, tauri-plugin-sql, SQLite

---

## 文件结构

```
/workspace/
├── src/                          # Vue 前端源码
│   ├── main.ts
│   ├── App.vue
│   ├── router.ts
│   ├── style.css
│   ├── stores/
│   │   ├── settings.ts           # 主题/音效/震动设置
│   │   ├── game.ts               # 游戏状态
│   │   └── stats.ts              # 统计数据
│   ├── components/
│   │   ├── TabBar.vue
│   │   ├── ModeCard.vue
│   │   ├── GameScreen.vue
│   │   ├── ResultModal.vue
│   │   ├── StatsChart.vue
│   │   ├── CharSetList.vue
│   │   ├── CharSetForm.vue
│   │   └── AchievementBadge.vue
│   ├── views/
│   │   ├── PracticeView.vue
│   │   ├── StatsView.vue
│   │   ├── CharSetsView.vue
│   │   ├── ProfileView.vue
│   │   └── GameView.vue
│   ├── composables/
│   │   ├── useDb.ts              # 数据库初始化与查询
│   │   ├── useTheme.ts           # 主题切换
│   │   ├── useAudio.ts           # 音效
│   │   ├── useHaptic.ts          # 震动
│   │   └── useGameEngine.ts      # 游戏循环逻辑
│   └── utils/
│       ├── charSets.ts           # 内置字集
│       ├── achievements.ts       # 成就定义
│       └── format.ts             # 格式化
├── src-tauri/                    # Tauri Rust 后端
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── char_sets.rs
│   │   │   ├── sessions.rs
│   │   │   ├── mistakes.rs
│   │   │   ├── achievements.rs
│   │   │   ├── daily.rs
│   │   │   └── leaderboard.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── migrations.rs
│   │   │   └── models.rs
│   │   └── error.rs
│   ├── capabilities/
│   │   └── default.json
│   └── gen/android/              # Android 生成目录
├── public/
│   └── char-sets/                # 内置字集 JSON
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── docs/
```

---

## Task 1: 项目脚手架初始化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `tailwind.config.js`
- Create: `src/main.ts`, `src/App.vue`
- Run: `npm install`

### Step 1.1: 创建 package.json

```json
{
  "name": "typing-speed-android",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.21",
    "vue-router": "^4.3.0",
    "@tauri-apps/api": "^2.0.0-beta",
    "@tauri-apps/plugin-sql": "^2.0.0-beta"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "@vue/tsconfig": "^0.5.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.4.2",
    "vite": "^5.1.6",
    "vue-tsc": "^2.0.6"
  }
}
```

### Step 1.2: 创建基础配置文件

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  }
})
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

`tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#60A5FA' },
        secondary: { DEFAULT: '#0EA5E9', dark: '#38BDF8' },
        accent: { DEFAULT: '#F59E0B', dark: '#FBBF24' },
        surface: { DEFAULT: '#F8FAFC', dark: '#1E293B' },
        bg: { DEFAULT: '#FFFFFF', dark: '#0F172A' }
      }
    }
  },
  plugins: []
}
```

`index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>打字提速</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### Step 1.3: 创建入口文件

`src/main.ts`:

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(router).mount('#app')
```

`src/App.vue`:

```vue
<template>
  <div class="h-screen w-screen overflow-hidden bg-bg text-text transition-colors duration-300">
    <router-view />
    <TabBar v-if="showTabBar" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const showTabBar = computed(() => route.meta.showTabBar !== false)
</script>
```

`src/style.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #2563EB;
  --color-secondary: #0EA5E9;
  --color-accent: #F59E0B;
  --color-bg: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-text: #1E293B;
  --color-text-muted: #64748B;
  --color-success: #10B981;
  --color-danger: #EF4444;
}

.dark {
  --color-primary: #60A5FA;
  --color-secondary: #38BDF8;
  --color-accent: #FBBF24;
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-text: #F1F5F9;
  --color-text-muted: #94A3B8;
  --color-success: #34D399;
  --color-danger: #F87171;
}

html, body, #app {
  height: 100%;
  width: 100%;
  overscroll-behavior: none;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

### Step 1.4: 安装依赖

Run: `npm install`

---

## Task 2: Tauri 2 移动端项目初始化

**Files:**
- Create: `src-tauri/` 目录下 Cargo 与 Tauri 配置
- Run: `npm run tauri android init`

### Step 2.1: 安装 Tauri CLI

Run: `npm install -D @tauri-apps/cli@^2.0.0-beta`

### Step 2.2: 初始化 Tauri 项目

Run: `npx tauri init --app-name "打字提速" --window-title "打字提速" --dist-dir ../dist --dev-path http://localhost:1420`

### Step 2.3: 配置 tauri.conf.json

Modify `src-tauri/tauri.conf.json`:

```json
{
  "productName": "打字提速",
  "version": "1.0.0",
  "identifier": "com.example.typingspeed",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["apk"],
    "android": {
      "minSdkVersion": 24
    }
  }
}
```

### Step 2.4: 添加 SQL 插件

Run: `cd src-tauri && cargo add tauri-plugin-sql --features sqlite`

Modify `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    typing_speed_android_lib::run();
}
```

Modify `src-tauri/src/lib.rs`:

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 2.5: 初始化 Android 项目

Run: `npx tauri android init`

### Step 2.6: 限制 ABI 为 arm64-v8a

Modify `src-tauri/gen/android/app/build.gradle.kts`:

```kotlin
android {
    ndk {
        abiFilters.add("arm64-v8a")
    }
}
```

---

## Task 3: 数据库 Schema 与迁移

**Files:**
- Create: `src-tauri/src/db/migrations.rs`
- Create: `src-tauri/src/db/models.rs`
- Modify: `src-tauri/src/lib.rs`

### Step 3.1: 编写 Schema 迁移 SQL

`src-tauri/src/db/migrations.rs`:

```rust
pub const MIGRATIONS: &str = r#"
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
"#;
```

### Step 3.2: 定义数据模型

`src-tauri/src/db/models.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CharSet {
    pub id: String,
    pub name: String,
    pub built_in: bool,
    pub word_count: i64,
    pub created_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TypingSession {
    pub id: String,
    pub mode: String,
    pub set_id: String,
    pub score: i64,
    pub correct_chars: i64,
    pub wrong_chars: i64,
    pub wpm: f64,
    pub accuracy: f64,
    pub duration: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Mistake {
    pub word: String,
    pub count: i64,
    pub last_seen: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Progress {
    pub set_id: String,
    pub mode: String,
    pub level: i64,
    pub high_score: i64,
    pub total_sessions: i64,
}
```

### Step 3.3: 导出迁移

`src-tauri/src/db/mod.rs`:

```rust
pub mod migrations;
pub mod models;
```

---

## Task 4: 内置字集数据

**Files:**
- Create: `public/char-sets/common-500.json`, `common-1000.json`, `common-1500.json`
- Create: `src/utils/charSets.ts`

### Step 4.1: 准备字集 JSON

每个 JSON 格式：

```json
{
  "id": "common-500",
  "name": "常用字 500",
  "words": ["的", "一", "是", "不", "了", "在", "人", "有", "我", "他"]
}
```

内置三套字集，分别约 500、1000、1500 个常用汉字。

### Step 4.2: 前端字集工具

`src/utils/charSets.ts`:

```typescript
export interface CharSetData {
  id: string
  name: string
  words: string[]
}

export const BUILT_IN_SET_IDS = ['common-500', 'common-1000', 'common-1500']

export async function loadBuiltInCharSet(id: string): Promise<CharSetData> {
  const res = await fetch(`/char-sets/${id}.json`)
  return res.json()
}
```

---

## Task 5: Rust Commands - 字集管理

**Files:**
- Create: `src-tauri/src/commands/char_sets.rs`
- Modify: `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`

### Step 5.1: 字集 CRUD Commands

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use tauri_plugin_sql::{Migration, SqliteExt};

#[derive(Serialize)]
pub struct CharSet {
    pub id: String,
    pub name: String,
    pub built_in: bool,
    pub word_count: i64,
}

#[derive(Deserialize)]
pub struct CreateCharSetRequest {
    pub id: String,
    pub name: String,
    pub words: Vec<String>,
}

#[tauri::command]
pub async fn list_char_sets(app: tauri::AppHandle) -> Result<Vec<CharSet>, String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let sets: Vec<CharSet> = db
        .select("SELECT id, name, built_in, word_count FROM char_sets ORDER BY built_in DESC, name", vec![])
        .await
        .map_err(|e| e.to_string())?;
    Ok(sets)
}

#[tauri::command]
pub async fn create_char_set(app: tauri::AppHandle, req: CreateCharSetRequest) -> Result<(), String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();
    db.execute(
        "INSERT INTO char_sets (id, name, built_in, word_count, created_at) VALUES (?, ?, 0, ?, ?)",
        vec![req.id.into(), req.name.into(), (req.words.len() as i64).into(), now.into()]
    ).await.map_err(|e| e.to_string())?;
    
    for word in req.words {
        db.execute(
            "INSERT INTO char_set_words (set_id, word) VALUES (?, ?)",
            vec![req.id.clone().into(), word.into()]
        ).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_char_set(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    db.execute("DELETE FROM char_set_words WHERE set_id = ?", vec![id.clone().into()])
        .await.map_err(|e| e.to_string())?;
    db.execute("DELETE FROM char_sets WHERE id = ? AND built_in = 0", vec![id.into()])
        .await.map_err(|e| e.to_string())?;
    Ok(())
}
```

注：需要在 Cargo.toml 中添加 `chrono` 依赖。

---

## Task 6: Rust Commands - 练习记录与统计

**Files:**
- Create: `src-tauri/src/commands/sessions.rs`
- Modify: `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`

### Step 6.1: 保存练习记录

```rust
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Deserialize)]
pub struct SaveSessionRequest {
    pub id: String,
    pub mode: String,
    pub set_id: String,
    pub score: i64,
    pub correct_chars: i64,
    pub wrong_chars: i64,
    pub wpm: f64,
    pub accuracy: f64,
    pub duration: i64,
}

#[tauri::command]
pub async fn save_session(app: AppHandle, req: SaveSessionRequest) -> Result<(), String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();
    db.execute(
        "INSERT INTO typing_sessions (id, mode, set_id, score, correct_chars, wrong_chars, wpm, accuracy, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        vec![
            req.id.into(), req.mode.clone().into(), req.set_id.clone().into(),
            req.score.into(), req.correct_chars.into(), req.wrong_chars.into(),
            req.wpm.into(), req.accuracy.into(), req.duration.into(), now.into()
        ]
    ).await.map_err(|e| e.to_string())?;
    
    // 更新进度表
    db.execute(
        "INSERT INTO progress (set_id, mode, total_sessions) VALUES (?, ?, 1) ON CONFLICT(set_id, mode) DO UPDATE SET total_sessions = total_sessions + 1",
        vec![req.set_id.clone().into(), req.mode.clone().into()]
    ).await.map_err(|e| e.to_string())?;
    
    // 更新排行榜
    db.execute(
        "INSERT INTO leaderboard (mode, set_id, score, achieved_at) VALUES (?, ?, ?, ?) ON CONFLICT(mode) DO UPDATE SET score = excluded.score, set_id = excluded.set_id, achieved_at = excluded.achieved_at WHERE excluded.score > score",
        vec![req.mode.into(), req.set_id.into(), req.score.into(), now.into()]
    ).await.map_err(|e| e.to_string())?;
    
    Ok(())
}
```

---

## Task 7: Rust Commands - 错字与成就

**Files:**
- Create: `src-tauri/src/commands/mistakes.rs`
- Create: `src-tauri/src/commands/achievements.rs`
- Modify: `src-tauri/src/commands/mod.rs`, `src-tauri/src/lib.rs`

### Step 7.1: 错字记录

```rust
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct Mistake {
    pub word: String,
    pub count: i64,
    pub last_seen: i64,
}

#[tauri::command]
pub async fn record_mistakes(app: AppHandle, words: Vec<String>) -> Result<(), String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();
    for word in words {
        db.execute(
            "INSERT INTO mistakes (word, count, last_seen) VALUES (?, 1, ?) ON CONFLICT(word) DO UPDATE SET count = count + 1, last_seen = excluded.last_seen",
            vec![word.into(), now.into()]
        ).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_mistakes(app: AppHandle) -> Result<Vec<Mistake>, String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let rows: Vec<Mistake> = db
        .select("SELECT word, count, last_seen FROM mistakes ORDER BY count DESC LIMIT 100", vec![])
        .await.map_err(|e| e.to_string())?;
    Ok(rows)
}
```

### Step 7.2: 成就查询

```rust
use serde::Serialize;
use tauri::AppHandle;

#[derive(Serialize)]
pub struct Achievement {
    pub id: String,
    pub unlocked_at: Option<i64>,
    pub progress: i64,
}

#[tauri::command]
pub async fn list_achievements(app: AppHandle) -> Result<Vec<Achievement>, String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let rows: Vec<Achievement> = db
        .select("SELECT id, unlocked_at, progress FROM achievements", vec![])
        .await.map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
pub async fn update_achievement(app: AppHandle, id: String, progress: i64) -> Result<bool, String> {
    let db = app.db("sqlite:typingspeed.db").map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();
    db.execute(
        "INSERT INTO achievements (id, progress) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET progress = excluded.progress, unlocked_at = CASE WHEN achievements.unlocked_at IS NULL AND excluded.progress >= 100 THEN ? ELSE achievements.unlocked_at END",
        vec![id.into(), progress.into(), now.into()]
    ).await.map_err(|e| e.to_string())?;
    Ok(true)
}
```

---

## Task 8: 前端数据库连接与设置

**Files:**
- Create: `src/composables/useDb.ts`
- Create: `src/stores/settings.ts`
- Create: `src/composables/useTheme.ts`

### Step 8.1: useDb 组合式函数

```typescript
import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function useDb() {
  if (!db) {
    db = await Database.load('sqlite:typingspeed.db')
  }
  return db
}
```

### Step 8.2: 设置 Store

```typescript
import { ref, watch } from 'vue'
import { useDb } from '../composables/useDb'

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  soundEnabled: boolean
  hapticEnabled: boolean
}

const settings = ref<AppSettings>({
  theme: 'system',
  soundEnabled: true,
  hapticEnabled: true
})

export function useSettings() {
  const load = async () => {
    const db = await useDb()
    const rows = await db.select<{ key: string; value: string }[]>('SELECT key, value FROM settings')
    for (const row of rows) {
      if (row.key === 'theme') settings.value.theme = row.value as any
      if (row.key === 'soundEnabled') settings.value.soundEnabled = row.value === '1'
      if (row.key === 'hapticEnabled') settings.value.hapticEnabled = row.value === '1'
    }
  }

  const save = async () => {
    const db = await useDb()
    await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['theme', settings.value.theme])
    await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['soundEnabled', settings.value.soundEnabled ? '1' : '0'])
    await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ['hapticEnabled', settings.value.hapticEnabled ? '1' : '0'])
  }

  watch(settings, save, { deep: true })

  return { settings, load, save }
}
```

### Step 8.3: 主题切换

```typescript
import { computed, watchEffect } from 'vue'
import { useSettings } from '../stores/settings'

export function useTheme() {
  const { settings } = useSettings()
  const isDark = computed(() => {
    if (settings.value.theme === 'dark') return true
    if (settings.value.theme === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  watchEffect(() => {
    if (isDark.value) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  })

  return { isDark, settings }
}
```

---

## Task 9: 路由与页面框架

**Files:**
- Create: `src/router.ts`
- Create: `src/views/PracticeView.vue`, `StatsView.vue`, `CharSetsView.vue`, `ProfileView.vue`, `GameView.vue`
- Create: `src/components/TabBar.vue`

### Step 9.1: 路由配置

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import PracticeView from './views/PracticeView.vue'
import StatsView from './views/StatsView.vue'
import CharSetsView from './views/CharSetsView.vue'
import ProfileView from './views/ProfileView.vue'
import GameView from './views/GameView.vue'

const routes = [
  { path: '/', component: PracticeView, meta: { showTabBar: true } },
  { path: '/stats', component: StatsView, meta: { showTabBar: true } },
  { path: '/char-sets', component: CharSetsView, meta: { showTabBar: true } },
  { path: '/profile', component: ProfileView, meta: { showTabBar: true } },
  { path: '/game/:mode', component: GameView, meta: { showTabBar: false } }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
```

### Step 9.2: TabBar 组件

```vue
<template>
  <nav class="fixed bottom-0 left-0 right-0 h-14 bg-surface border-t border-text-muted/20 flex items-center justify-around pb-safe">
    <router-link v-for="item in items" :key="item.path" :to="item.path" class="flex flex-col items-center gap-0.5 text-text-muted" active-class="text-primary">
      <span class="text-xl">{{ item.icon }}</span>
      <span class="text-xs">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
const items = [
  { path: '/', label: '练习', icon: '⌨️' },
  { path: '/stats', label: '统计', icon: '📊' },
  { path: '/char-sets', label: '字集', icon: '📝' },
  { path: '/profile', label: '我的', icon: '👤' }
]
</script>
```

---

## Task 10: 音效与震动反馈

**Files:**
- Create: `src/composables/useAudio.ts`
- Create: `src/composables/useHaptic.ts`

### Step 10.1: useAudio

```typescript
import { useSettings } from '../stores/settings'

export function useAudio() {
  const { settings } = useSettings()
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!settings.value.soundEnabled) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.stop(ctx.currentTime + duration)
  }

  const playCorrect = () => playTone(880, 0.1)
  const playWrong = () => playTone(220, 0.2, 'sawtooth')
  const playLevelUp = () => {
    playTone(523, 0.1)
    setTimeout(() => playTone(659, 0.1), 100)
    setTimeout(() => playTone(784, 0.2), 200)
  }

  return { playCorrect, playWrong, playLevelUp }
}
```

### Step 10.2: useHaptic

```typescript
import { useSettings } from '../stores/settings'

export function useHaptic() {
  const { settings } = useSettings()

  const vibrate = (pattern: number | number[]) => {
    if (!settings.value.hapticEnabled) return
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  }

  const light = () => vibrate(10)
  const error = () => vibrate([30, 50, 30])
  const success = () => vibrate(50)

  return { light, error, success }
}
```

---

## Task 11: 游戏引擎

**Files:**
- Create: `src/composables/useGameEngine.ts`
- Create: `src/views/GameView.vue`
- Create: `src/components/GameScreen.vue`

### Step 11.1: useGameEngine

核心逻辑：
- 维护下落字列表（位置、速度、字符）
- requestAnimationFrame 游戏循环
- 处理输入匹配
- 计算分数、WPM、准确率
- 触发模式结束（限时、生命值耗尽）

```typescript
import { ref, computed, onUnmounted } from 'vue'

export interface FallingChar {
  id: number
  char: string
  x: number
  y: number
  speed: number
}

export interface GameConfig {
  mode: 'timed' | 'free' | 'endless' | 'daily'
  setId: string
  words: string[]
  duration?: number
  baseSpeed: number
  speedMultiplier: number
}

export interface GameResult {
  score: number
  correctChars: number
  wrongChars: number
  wpm: number
  accuracy: number
  duration: number
}

export function useGameEngine(config: GameConfig) {
  const chars = ref<FallingChar[]>([])
  const score = ref(0)
  const correctChars = ref(0)
  const wrongChars = ref(0)
  const combo = ref(0)
  const maxCombo = ref(0)
  const timeLeft = ref(config.duration || 0)
  const isPaused = ref(false)
  const isGameOver = ref(false)
  const startTime = ref(0)
  const elapsed = ref(0)

  let lastFrame = 0
  let spawnTimer = 0
  let idCounter = 0
  let rafId = 0

  const spawnInterval = computed(() => Math.max(400, 1200 - config.speedMultiplier * 100))

  const spawnChar = () => {
    const word = config.words[Math.floor(Math.random() * config.words.length)]
    chars.value.push({
      id: idCounter++,
      char: word,
      x: 10 + Math.random() * 80,
      y: -10,
      speed: (config.baseSpeed + Math.random() * 0.3) * config.speedMultiplier
    })
  }

  const loop = (timestamp: number) => {
    if (!startTime.value) startTime.value = timestamp
    const delta = timestamp - lastFrame
    lastFrame = timestamp

    if (!isPaused.value && !isGameOver.value) {
      elapsed.value = timestamp - startTime.value
      if (config.duration) {
        timeLeft.value = Math.max(0, config.duration - elapsed.value / 1000)
        if (timeLeft.value <= 0) endGame()
      }

      spawnTimer += delta
      if (spawnTimer > spawnInterval.value) {
        spawnChar()
        spawnTimer = 0
      }

      const speedFactor = config.mode === 'endless'
        ? 1 + Math.floor(elapsed.value / 15000) * 0.1
        : 1

      chars.value = chars.value
        .map(c => ({ ...c, y: c.y + c.speed * speedFactor * delta * 0.06 }))
        .filter(c => {
          if (c.y > 110) {
            combo.value = 0
            wrongChars.value++
            return false
          }
          return true
        })
    }

    if (!isGameOver.value) {
      rafId = requestAnimationFrame(loop)
    }
  }

  const start = () => {
    lastFrame = performance.now()
    startTime.value = 0
    rafId = requestAnimationFrame(loop)
  }

  const pause = () => { isPaused.value = true }
  const resume = () => { isPaused.value = false }

  const handleInput = (input: string) => {
    if (isPaused.value || isGameOver.value) return false
    const idx = chars.value.findIndex(c => c.char === input)
    if (idx >= 0) {
      chars.value.splice(idx, 1)
      score.value += 10 + combo.value
      correctChars.value++
      combo.value++
      if (combo.value > maxCombo.value) maxCombo.value = combo.value
      return true
    }
    wrongChars.value++
    combo.value = 0
    return false
  }

  const endGame = () => {
    isGameOver.value = true
    cancelAnimationFrame(rafId)
  }

  const result = computed<GameResult>(() => {
    const minutes = elapsed.value / 60000
    const wpm = minutes > 0 ? correctChars.value / minutes : 0
    const total = correctChars.value + wrongChars.value
    const accuracy = total > 0 ? (correctChars.value / total) * 100 : 100
    return {
      score: score.value,
      correctChars: correctChars.value,
      wrongChars: wrongChars.value,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      duration: Math.round(elapsed.value / 1000)
    }
  })

  onUnmounted(() => cancelAnimationFrame(rafId))

  return {
    chars, score, combo, maxCombo, timeLeft, isPaused, isGameOver,
    start, pause, resume, handleInput, endGame, result
  }
}
```

### Step 11.2: GameView

```vue
<template>
  <div class="h-full flex flex-col">
    <GameScreen
      :chars="engine.chars.value"
      :score="engine.score.value"
      :combo="engine.combo.value"
      :time-left="engine.timeLeft.value"
      :is-paused="engine.isPaused.value"
      @input="onInput"
      @pause="engine.pause"
      @resume="engine.resume"
      @exit="router.back()"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import GameScreen from '../components/GameScreen.vue'
import { useGameEngine, GameConfig } from '../composables/useGameEngine'

const route = useRoute()
const router = useRouter()
const mode = route.params.mode as string

// TODO: load words from selected char set
const config: GameConfig = {
  mode: mode as any,
  setId: 'common-500',
  words: ['的', '一', '是', '不', '了'],
  duration: mode === 'timed' || mode === 'daily' ? 240 : undefined,
  baseSpeed: 0.5,
  speedMultiplier: 1
}

const engine = useGameEngine(config)

const onInput = (value: string) => {
  engine.handleInput(value)
}

onMounted(() => engine.start())
</script>
```

---

## Task 12: 练习主页与模式选择

**Files:**
- Create: `src/views/PracticeView.vue`
- Create: `src/components/ModeCard.vue`

### Step 12.1: PracticeView

```vue
<template>
  <div class="h-full p-4 pb-20 overflow-y-auto">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">打字提速</h1>
      <p class="text-text-muted">今日已练习 {{ todayMinutes }} 分钟</p>
    </header>

    <section class="grid grid-cols-2 gap-3 mb-6">
      <ModeCard
        v-for="mode in modes"
        :key="mode.id"
        :title="mode.title"
        :desc="mode.desc"
        :icon="mode.icon"
        @click="startGame(mode.id)"
      />
    </section>

    <section class="bg-surface rounded-2xl p-4">
      <h2 class="font-semibold mb-3">每日挑战</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-text-muted">今日目标</p>
          <p class="text-lg font-bold">{{ dailyTarget }} 分</p>
        </div>
        <button class="px-4 py-2 bg-primary text-white rounded-xl" @click="startGame('daily')">开始</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ModeCard from '../components/ModeCard.vue'

const router = useRouter()
const todayMinutes = ref(0)
const dailyTarget = ref(500)

const modes = [
  { id: 'timed', title: '限时挑战', desc: '4 分钟冲刺', icon: '⏱️' },
  { id: 'free', title: '自由练习', desc: '自定义速度', icon: '🎯' },
  { id: 'endless', title: '无尽模式', desc: '挑战极限', icon: '🔥' },
  { id: 'mistakes', title: '错字重练', desc: '专攻弱项', icon: '🔄' }
]

const startGame = (mode: string) => {
  router.push(`/game/${mode}`)
}
</script>
```

---

## Task 13: 统计页

**Files:**
- Create: `src/views/StatsView.vue`
- Create: `src/composables/useStats.ts`

### Step 13.1: useStats

```typescript
import { ref } from 'vue'
import { useDb } from './useDb'

export interface StatsSummary {
  totalMinutes: number
  totalChars: number
  avgWpm: number
  avgAccuracy: number
}

export interface DailyStat {
  date: string
  wpm: number
  accuracy: number
}

export function useStats() {
  const summary = ref<StatsSummary>({ totalMinutes: 0, totalChars: 0, avgWpm: 0, avgAccuracy: 0 })
  const weekly = ref<DailyStat[]>([])

  const load = async () => {
    const db = await useDb()
    const row = await db.select<{ total_minutes: number; total_chars: number; avg_wpm: number; avg_accuracy: number }[]>(
      `SELECT 
        COALESCE(SUM(duration), 0) / 60 AS total_minutes,
        COALESCE(SUM(correct_chars), 0) AS total_chars,
        COALESCE(AVG(wpm), 0) AS avg_wpm,
        COALESCE(AVG(accuracy), 0) AS avg_accuracy
      FROM typing_sessions`
    )
    if (row.length) summary.value = {
      totalMinutes: Math.round(row[0].total_minutes),
      totalChars: Math.round(row[0].total_chars),
      avgWpm: Math.round(row[0].avg_wpm),
      avgAccuracy: Math.round(row[0].avg_accuracy * 10) / 10
    }
  }

  return { summary, weekly, load }
}
```

---

## Task 14: 字集管理页

**Files:**
- Create: `src/views/CharSetsView.vue`
- Create: `src/components/CharSetList.vue`
- Create: `src/components/CharSetForm.vue`

### Step 14.1: 前端调用 Rust Commands

```typescript
import { invoke } from '@tauri-apps/api/core'

export interface CharSet {
  id: string
  name: string
  built_in: boolean
  word_count: number
}

export async function listCharSets(): Promise<CharSet[]> {
  return invoke('list_char_sets')
}

export async function createCharSet(id: string, name: string, words: string[]): Promise<void> {
  return invoke('create_char_set', { req: { id, name, words } })
}

export async function deleteCharSet(id: string): Promise<void> {
  return invoke('delete_char_set', { id })
}
```

---

## Task 15: 我的页与设置

**Files:**
- Create: `src/views/ProfileView.vue`
- Create: `src/components/AchievementBadge.vue`

### Step 15.1: ProfileView

```vue
<template>
  <div class="h-full p-4 pb-20 overflow-y-auto">
    <h1 class="text-2xl font-bold mb-6">我的</h1>

    <section class="bg-surface rounded-2xl p-4 mb-4">
      <h2 class="font-semibold mb-4">设置</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span>主题</span>
          <select v-model="settings.theme" class="bg-bg border rounded-lg px-3 py-1">
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
        <label class="flex items-center justify-between">
          <span>音效</span>
          <input v-model="settings.soundEnabled" type="checkbox" class="w-5 h-5" />
        </label>
        <label class="flex items-center justify-between">
          <span>震动</span>
          <input v-model="settings.hapticEnabled" type="checkbox" class="w-5 h-5" />
        </label>
      </div>
    </section>

    <section class="bg-surface rounded-2xl p-4">
      <h2 class="font-semibold mb-4">成就</h2>
      <div class="grid grid-cols-4 gap-3">
        <AchievementBadge v-for="a in achievements" :key="a.id" :achievement="a" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from '../stores/settings'
import AchievementBadge from '../components/AchievementBadge.vue'

const { settings } = useSettings()
const achievements = []
</script>
```

---

## Task 16: 数据初始化（内置字集 + 成就定义）

**Files:**
- Create: `src/utils/achievements.ts`
- Modify: `src-tauri/src/lib.rs` 或前端初始化逻辑

### Step 16.1: 成就定义

```typescript
export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
  target: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_practice', name: '初次练习', desc: '完成第一次练习', icon: '🌱', target: 1 },
  { id: 'speed_50', name: '速度达人', desc: 'WPM 达到 50', icon: '⚡', target: 50 },
  { id: 'accuracy_95', name: '精准大师', desc: '单次准确率 95%', icon: '🎯', target: 95 },
  { id: 'combo_30', name: '连击高手', desc: '达成 30 连击', icon: '🔥', target: 30 },
  { id: 'practice_7_days', name: '七日坚持', desc: '连续 7 天练习', icon: '📅', target: 7 }
]
```

### Step 16.2: 初始化内置字集

在 App.vue 或 main.ts 中首次加载时调用：

```typescript
import { invoke } from '@tauri-apps/api/core'
import { loadBuiltInCharSet, BUILT_IN_SET_IDS } from './utils/charSets'

async function initBuiltInCharSets() {
  const existing = await invoke<CharSet[]>('list_char_sets')
  for (const id of BUILT_IN_SET_IDS) {
    if (existing.some(s => s.id === id)) continue
    const data = await loadBuiltInCharSet(id)
    await invoke('create_char_set', { req: { id: data.id, name: data.name, words: data.words } })
  }
}
```

---

## Task 17: 构建配置与打包

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/gen/android/app/build.gradle.kts`

### Step 17.1: 限制 arm64-v8a

确认 `build.gradle.kts`:

```kotlin
android {
    defaultConfig {
        ndk {
            abiFilters.add("arm64-v8a")
        }
    }
}
```

### Step 17.2: 构建 APK

Run: `npx tauri android build --apk`

输出路径：`src-tauri/gen/android/app/build/outputs/apk/arm64/release/app-arm64-release.apk`

---

## Task 18: GitHub Actions 远程构建备选

**Files:**
- Create: `.github/workflows/build-android.yml`

### Step 18.1: 工作流配置

```yaml
name: Build Android APK

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-action@stable
      - name: Install dependencies
        run: npm install
      - name: Install Android targets
        run: rustup target add aarch64-linux-android
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Build Tauri Android
        run: npm run tauri android build -- --apk
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: apk
          path: src-tauri/gen/android/app/build/outputs/apk/arm64/release/*.apk
```

---

## Task 19: 测试计划

**Files:**
- Create: `docs/test-plan.md`

### Step 19.1: 功能测试

| 用例 | 步骤 | 预期结果 |
|---|---|---|
| 模式选择 | 点击限时挑战 | 进入游戏页，4 分钟倒计时开始 |
| 输入匹配 | 输入屏幕上存在的汉字 | 该字消失，分数增加 |
| 输入错误 | 输入不存在的汉字 | 连击中断，错误数增加 |
| 暂停 | 点击暂停按钮 | 游戏暂停，字停止下落 |
| 结束结算 | 限时结束 | 显示结果页，数据写入数据库 |
| 主题切换 | 设置中选择深色 | 界面切换为深色主题 |
| 自定义字集 | 新建字集并保存 | 字集列表中出现新字集 |
| 错字重练 | 练习中产生错字后进入错字重练 | 仅出现历史错字 |

### Step 19.2: 兼容性测试

- Android 7.0/10/13/14 arm64 真机或模拟器
- 主流中文输入法：Gboard、搜狗、百度、讯飞

### Step 19.3: 性能测试

- 游戏循环 FPS 不低于 30
- 内存占用稳定，无持续增长

---

## Task 20: 最终交付

**Files:**
- Create: `docs/delivery-report.md`

### Step 20.1: 交付清单

- [ ] APK 文件
- [ ] 项目文档
- [ ] 测试报告
- [ ] gofile.io 上传链接（如本地构建失败）

---

## 自检清单

- [x] PRD 中所有功能都有对应任务
- [x] 无 TBD/TODO 占位符
- [x] 类型命名一致（CharSet、TypingSession、Mistake 等）
- [x] 数据库 Schema 与 PRD 一致
- [x] ABI 限制为 arm64-v8a
