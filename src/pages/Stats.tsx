import { useEffect, useState } from "react";
import * as ipc from "@/lib/ipc";
import { LineChart } from "@/components/LineChart";
import { HeatMap } from "@/components/HeatMap";
import { StatCard } from "@/components/StatCard";
import { ProgressRing } from "@/components/ProgressRing";
import { useSettings } from "@/store/settings";
import { formatDuration, formatNumber } from "@/lib/wpm";

export function Stats() {
  const { dailyGoalChars } = useSettings();
  const [summary, setSummary] = useState<ipc.StatsSummary | null>(null);
  const [trend, setTrend] = useState<ipc.TrendPoint[]>([]);
  const [daily, setDaily] = useState<ipc.DailyStat[]>([]);
  const [streak, setStreak] = useState<ipc.Streak | null>(null);

  useEffect(() => {
    ipc.getStatsSummary().then(setSummary);
    ipc.getWpmTrend(30).then(setTrend);
    ipc.getDailyStats(91).then(setDaily);
    ipc.getStreak().then(setStreak);
  }, []);

  // 今日练习字数
  const today = new Date().toISOString().slice(0, 10);
  const todayChars = daily
    .filter((d) => d.date === today)
    .reduce((s, d) => s + d.chars_total, 0);
  const goalProgress = dailyGoalChars > 0 ? todayChars / dailyGoalChars : 0;

  // 热力图数据：按日期聚合，强度 0-4
  const heatData = new Map<string, number>();
  for (const d of daily) {
    const cur = heatData.get(d.date) || 0;
    const add = Math.min(4, Math.ceil(d.chars_total / 200));
    heatData.set(d.date, Math.max(cur, add));
  }

  const wpmData = trend.map((t, i) => ({ x: i, y: t.wpm, label: t.date }));
  const accData = trend.map((t, i) => ({
    x: i,
    y: t.accuracy * 100,
    label: t.date,
  }));

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-bold mb-5">统计</h1>

      {/* 每日目标 */}
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-accent to-accent-soft p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">今日目标</p>
            <p className="text-3xl font-bold mt-1">
              {formatNumber(todayChars)}
              <span className="text-base font-normal opacity-80">
                {" "}
                / {formatNumber(dailyGoalChars)} 字
              </span>
            </p>
          </div>
          <ProgressRing
            progress={goalProgress}
            size={72}
            color="#ffffff"
            value={`${Math.min(100, Math.round(goalProgress * 100))}%`}
          />
        </div>
        {streak && streak.current > 0 && (
          <p className="text-sm mt-3 opacity-90">
            🔥 连续打卡 {streak.current} 天 · 最长 {streak.longest} 天
          </p>
        )}
      </section>

      {/* 概览卡片 */}
      <section className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          label="总练习次数"
          value={summary?.total_sessions || 0}
        />
        <StatCard
          label="总练习字数"
          value={formatNumber(summary?.total_chars || 0)}
        />
        <StatCard
          label="平均 WPM"
          value={(summary?.avg_wpm || 0).toFixed(0)}
        />
        <StatCard
          label="最佳 WPM"
          value={(summary?.best_wpm || 0).toFixed(0)}
        />
        <StatCard
          label="平均准确率"
          value={`${((summary?.avg_accuracy || 0) * 100).toFixed(0)}%`}
        />
        <StatCard
          label="总时长"
          value={formatDuration(summary?.total_duration_sec || 0)}
        />
      </section>

      {/* WPM 趋势 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-2">WPM 趋势（30 天）</h2>
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800">
          <LineChart data={wpmData} color="#4f46e5" yLabel="WPM" />
        </div>
      </section>

      {/* 准确率趋势 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-2">准确率趋势（30 天）</h2>
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800">
          <LineChart data={accData} color="#10b981" yLabel="%" />
        </div>
      </section>

      {/* 打卡热力图 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-2">练习打卡（13 周）</h2>
        <div className="rounded-xl bg-white dark:bg-zinc-900 p-3 border border-zinc-200 dark:border-zinc-800">
          <HeatMap data={heatData} />
        </div>
      </section>
    </div>
  );
}
