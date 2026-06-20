import { useEffect, useState } from "react";
import * as ipc from "@/lib/ipc";
import { useSettings } from "@/store/settings";

export function Profile() {
  const {
    theme,
    setTheme,
    hapticsEnabled,
    setHapticsEnabled,
    freeSpeed,
    setFreeSpeed,
    dailyGoalChars,
    setDailyGoalChars,
  } = useSettings();
  const [achievements, setAchievements] = useState<ipc.Achievement[]>([]);
  const [streak, setStreak] = useState<ipc.Streak | null>(null);

  useEffect(() => {
    ipc.getAchievements().then(setAchievements);
    ipc.getStreak().then(setStreak);
  }, []);

  const unlockedCount = achievements.filter((a) => a[2]).length;

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-bold mb-5">我的</h1>

      {/* 打卡 */}
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-5 text-white">
        <p className="text-sm opacity-90">连续打卡</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-4xl font-bold">{streak?.current || 0}</span>
          <span className="text-sm opacity-90 mb-1">天</span>
        </div>
        <p className="text-xs opacity-80 mt-1">
          最长 {streak?.longest || 0} 天
        </p>
      </section>

      {/* 成就 */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-500">成就</h2>
          <span className="text-xs text-zinc-400">
            {unlockedCount}/{achievements.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map(([id, name, unlocked]) => (
            <div
              key={id}
              className={`rounded-xl p-3 text-center transition-all ${
                unlocked
                  ? "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
                  : "bg-zinc-100 dark:bg-zinc-900 opacity-50"
              }`}
            >
              <div className="text-2xl mb-1">{unlocked ? "🏆" : "🔒"}</div>
              <div className="text-[11px] leading-tight text-zinc-600 dark:text-zinc-300">
                {name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 设置 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-3">设置</h2>
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* 主题 */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">深色模式</span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                theme === "dark" ? "bg-accent" : "bg-zinc-300"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  theme === "dark" ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* 触感 */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">触感反馈</span>
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                hapticsEnabled ? "bg-accent" : "bg-zinc-300"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                  hapticsEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* 自由练习速度 */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">自由练习速度</span>
              <span className="text-sm text-accent font-medium">
                {freeSpeed.toFixed(1)}×
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={freeSpeed}
              onChange={(e) => setFreeSpeed(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* 每日目标 */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">每日目标（字数）</span>
              <span className="text-sm text-accent font-medium">
                {dailyGoalChars}
              </span>
            </div>
            <div className="flex gap-2">
              {[200, 500, 1000, 2000].map((n) => (
                <button
                  key={n}
                  onClick={() => setDailyGoalChars(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                    dailyGoalChars === n
                      ? "bg-accent text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-zinc-400 mt-8">
        字速 v0.1.0 · 基于 Tauri 2
      </p>
    </div>
  );
}
