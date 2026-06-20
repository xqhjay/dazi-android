import { useEffect, useState } from "react";
import { useSettings } from "@/store/settings";
import { CHARSETS } from "@/lib/charsets";
import * as ipc from "@/lib/ipc";
import type { GameConfig } from "@/App";

interface PracticeProps {
  onStart: (cfg: GameConfig) => void;
  onCustom: () => void;
}

export function Practice({ onStart, onCustom }: PracticeProps) {
  const { charsetId, setCharsetId, displayMode, setDisplayMode } = useSettings();
  const [endlessHigh, setEndlessHigh] = useState(0);
  const [timedLevel, setTimedLevel] = useState(1);

  useEffect(() => {
    ipc.getHighScore("endless", charsetId).then(setEndlessHigh);
    // 限时挑战等级存于 settings
    ipc.getSetting(`timed_level:${charsetId}`).then((v) =>
      setTimedLevel(v ? parseInt(v) : 1)
    );
  }, [charsetId]);

  const modes = [
    {
      id: "timed" as const,
      title: "限时挑战",
      desc: "4 分钟 · 生命值 · 升级",
      accent: "from-rose-500 to-orange-500",
      meta: `当前 Lv.${timedLevel}`,
    },
    {
      id: "free" as const,
      title: "自由练习",
      desc: "不限时 · 自定义速度",
      accent: "from-indigo-500 to-blue-500",
      meta: displayMode === "falling" ? "下落式" : "行式",
    },
    {
      id: "endless" as const,
      title: "无尽模式",
      desc: "速度递增 · 最高分",
      accent: "from-violet-500 to-purple-500",
      meta: `最高 ${endlessHigh}`,
    },
    {
      id: "test" as const,
      title: "打字测试",
      desc: "行式 · 精确测速",
      accent: "from-emerald-500 to-teal-500",
      meta: "行式",
    },
  ];

  return (
    <div className="px-5 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">字速</h1>
        <p className="text-sm text-zinc-500 mt-1">中文打字速度练习</p>
      </header>

      {/* 字集选择 */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            字集
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
          {CHARSETS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCharsetId(c.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                charsetId === c.id
                  ? "bg-accent text-white"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </section>

      {/* 显示模式切换（自由练习用） */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
            显示模式
          </span>
        </div>
        <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
          {(["falling", "line"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setDisplayMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                displayMode === m
                  ? "bg-white dark:bg-zinc-700 text-accent shadow-sm"
                  : "text-zinc-500"
              }`}
            >
              {m === "falling" ? "下落式" : "行式"}
            </button>
          ))}
        </div>
      </section>

      {/* 模式卡片 */}
      <section className="space-y-3">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() =>
              onStart({
                mode: m.id,
                charsetId,
                displayMode: m.id === "test" ? "line" : displayMode,
                speed: m.id === "free" ? useSettings.getState().freeSpeed : undefined,
              })
            }
            className="w-full text-left rounded-2xl p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{m.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{m.desc}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.accent} flex items-center justify-center text-white text-lg`}
              >
                ▶
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-400">{m.meta}</div>
          </button>
        ))}
      </section>

      <button
        onClick={onCustom}
        className="w-full mt-4 py-3 text-sm text-accent font-medium"
      >
        自定义练习（选择特定字）→
      </button>
    </div>
  );
}
