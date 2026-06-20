import { useEffect, useState } from "react";
import { CHARSETS } from "@/lib/charsets";
import * as ipc from "@/lib/ipc";
import { useSettings } from "@/store/settings";

interface CharSetsProps {
  onCustomPractice: (chars: string[]) => void;
}

export function CharSets({ onCustomPractice }: CharSetsProps) {
  const { charsetId, setCharsetId } = useSettings();
  const [mastery, setMastery] = useState<ipc.CharMastery[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    ipc.getCharMastery(charsetId).then(setMastery);
  }, [charsetId]);

  const masteryMap = new Map(mastery.map((m) => [m.char, m]));
  const activeCharset = CHARSETS.find((c) => c.id === charsetId)!;

  const masteryColor = (m?: ipc.CharMastery) => {
    if (!m) return "bg-zinc-100 dark:bg-zinc-800 text-zinc-400";
    if (m.correct >= 3 && m.mastery >= 0.85)
      return "bg-emerald-500 text-white";
    if (m.mastery >= 0.6) return "bg-amber-400 text-white";
    if (m.wrong > 0) return "bg-rose-400 text-white";
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";
  };

  const toggleSelect = (ch: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(ch)) n.delete(ch);
      else n.add(ch);
      return n;
    });
  };

  const masteredCount = mastery.filter(
    (m) => m.correct >= 3 && m.mastery >= 0.85
  ).length;

  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-bold mb-5">字集</h1>

      {/* 字集切换 */}
      <section className="mb-5">
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

      {/* 掌握度概览 */}
      <section className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">已掌握</p>
          <p className="text-2xl font-bold">
            {masteredCount}
            <span className="text-base font-normal text-zinc-400">
              {" "}
              / {activeCharset.words.length}
            </span>
          </p>
        </div>
        {!selectMode ? (
          <button
            onClick={() => {
              setSelectMode(true);
              setSelected(new Set());
            }}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
          >
            自定义练习
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectMode(false);
                setSelected(new Set());
              }}
              className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-sm"
            >
              取消
            </button>
            <button
              onClick={() => {
                if (selected.size > 0) {
                  onCustomPractice(Array.from(selected));
                }
              }}
              disabled={selected.size === 0}
              className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium disabled:opacity-40"
            >
              开始 ({selected.size})
            </button>
          </div>
        )}
      </section>

      {/* 图例 */}
      <section className="mb-3 flex gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-emerald-500" /> 已掌握
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-400" /> 熟悉
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-rose-400" /> 易错
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-zinc-300 dark:bg-zinc-700" /> 未练
        </span>
      </section>

      {/* 字网格 */}
      <section className="grid grid-cols-8 gap-1.5">
        {activeCharset.words.map((ch, i) => {
          const m = masteryMap.get(ch);
          const isSel = selected.has(ch);
          if (selectMode) {
            return (
              <button
                key={i}
                onClick={() => toggleSelect(ch)}
                className={`aspect-square rounded-md text-sm font-medium flex items-center justify-center transition-all ${
                  isSel
                    ? "bg-accent text-white scale-105"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {ch}
              </button>
            );
          }
          return (
            <div
              key={i}
              className={`aspect-square rounded-md text-sm font-medium flex items-center justify-center ${masteryColor(
                m
              )}`}
            >
              {ch}
            </div>
          );
        })}
      </section>
    </div>
  );
}
