import { useEffect, useRef, useState, useCallback } from "react";
import type { GameConfig } from "@/App";
import { useSettings } from "@/store/settings";
import { getCharset } from "@/lib/charsets";
import {
  createInitialState,
  tick,
  inputChar,
  spawnChar,
  speedForLevel,
  endlessLevelFromTime,
  endlessSpeedMult,
  ReinforcePool,
  type GameState,
} from "@/lib/fallingEngine";
import { calcWpm, calcAccuracy, formatDuration, levelName } from "@/lib/wpm";
import * as ipc from "@/lib/ipc";
import { hapticLight, hapticError, hapticSuccess } from "@/lib/haptics";
import { LineTyping } from "@/components/LineTyping";

interface GameProps {
  config: GameConfig;
  onExit: () => void;
}

export function Game({ config, onExit }: GameProps) {
  const { hapticsEnabled } = useSettings();
  const charset = config.customChars
    ? null
    : getCharset(config.charsetId);
  const words = config.customChars || charset?.words || [];

  // 行式直接交给 LineTyping
  if (config.displayMode === "line" || config.mode === "test") {
    return (
      <LineTypingGame
        words={words}
        config={config}
        onExit={onExit}
        hapticsEnabled={hapticsEnabled}
      />
    );
  }

  return (
    <FallingGame
      words={words}
      config={config}
      onExit={onExit}
      hapticsEnabled={hapticsEnabled}
    />
  );
}

// ===== 下落式 =====
function FallingGame({
  words,
  config,
  onExit,
  hapticsEnabled,
}: {
  words: string[];
  config: GameConfig;
  onExit: () => void;
  hapticsEnabled: boolean;
}) {
  const [state, setState] = useState<GameState>(() => {
    const initLevel = config.mode === "timed" ? loadTimedLevel(config.charsetId) : 1;
    return createInitialState(100, initLevel);
  });
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState<null | {
    wpm: number;
    accuracy: number;
    score: number;
    level: number;
    newHighScore: boolean;
    unlocked: string[];
  }>(null);
  const [inputValue, setInputValue] = useState("");
  const [composing, setComposing] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const elapsedRef = useRef(elapsed);
  elapsedRef.current = elapsed;
  const poolRef = useRef(new ReinforcePool());
  const charDetailsRef = useRef<Map<string, { correct: number; wrong: number }>>(
    new Map()
  );
  const lastSpawnRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // 当前等级与速度
  const currentLevel =
    config.mode === "endless"
      ? endlessLevelFromTime(elapsed)
      : config.mode === "timed"
      ? state.level
      : 1;
  const currentSpeed =
    config.mode === "endless"
      ? speedForLevel(1) * endlessSpeedMult(elapsed) / 0.5
      : config.mode === "timed"
      ? speedForLevel(state.level)
      : config.mode === "free"
      ? 0.08 * (config.speed || 1.0)
      : speedForLevel(1);

  // 限时挑战 4 分钟
  const TIME_LIMIT = 240;
  const timeLeft = config.mode === "timed" ? Math.max(0, TIME_LIMIT - elapsed) : 0;

  const recordDetail = useCallback((char: string, correct: boolean) => {
    const d = charDetailsRef.current.get(char) || { correct: 0, wrong: 0 };
    if (correct) d.correct++;
    else d.wrong++;
    charDetailsRef.current.set(char, d);
  }, []);

  const finishGame = useCallback(
    async (reason: string) => {
      const s = stateRef.current;
      const e = elapsedRef.current;
      const wpm = calcWpm(s.charsCorrect, e);
      const accuracy = calcAccuracy(s.charsCorrect, s.charsWrong);
      const level =
        config.mode === "endless"
          ? endlessLevelFromTime(e)
          : config.mode === "timed"
          ? s.level
          : 1;

      // QA: 整体 try-catch，确保即使持久化失败也能显示结果页
      let newLevel = level;
      let result: ipc.RecordSessionResult = {
        session: {
          mode: config.mode,
          charset_id: config.charsetId,
          display_mode: "falling",
          duration_sec: Math.round(e),
          chars_total: s.charsCorrect + s.charsWrong,
          chars_correct: s.charsCorrect,
          chars_wrong: s.charsWrong,
          wpm,
          accuracy,
          score: s.score,
          level_reached: level,
          created_at: new Date().toISOString(),
        },
        newly_unlocked: [],
        streak: { current: 0, longest: 0, last_active_date: "" },
        new_high_score: false,
      };

      try {
        // 限时挑战升级
        if (config.mode === "timed" && reason === "timeup" && s.hp > 0) {
          newLevel = Math.min(8, level + 1);
          await ipc.setSetting(
            `timed_level:${config.charsetId}`,
            newLevel.toString()
          );
        }

        const charDetails = Array.from(charDetailsRef.current.entries()).map(
          ([char, v]) => ({ char, ...v })
        );

        result = await ipc.recordSession({
          mode: config.mode,
          charset_id: config.charsetId,
          display_mode: "falling",
          duration_sec: Math.round(e),
          chars_total: s.charsCorrect + s.charsWrong,
          chars_correct: s.charsCorrect,
          chars_wrong: s.charsWrong,
          score: s.score,
          level_reached: newLevel,
          char_details: charDetails,
        });
      } catch (err) {
        console.error("finishGame persistence failed:", err);
      }

      if (hapticsEnabled) hapticSuccess();

      setFinished({
        wpm,
        accuracy,
        score: s.score,
        level: newLevel,
        newHighScore: result.new_high_score,
        unlocked: result.newly_unlocked,
      });
    },
    [config, hapticsEnabled]
  );

  // 游戏主循环
  useEffect(() => {
    if (paused || finished) return;
    lastTimeRef.current = performance.now();
    const loop = (now: number) => {
      let dt = (now - lastTimeRef.current) / 1000;
      // QA: 限制单帧 dt 上限，防止后台切回时跳跃（如 dt > 0.5s 视为异常）
      dt = Math.min(dt, 0.1);
      lastTimeRef.current = now;
      const newElapsed = elapsedRef.current + dt;
      setElapsed(newElapsed);

      setState((prev) => {
        let next = tick(prev, dt);

        // 限时挑战时间到
        if (config.mode === "timed" && newElapsed >= TIME_LIMIT) {
          setTimeout(() => finishGame("timeup"), 0);
          return next;
        }
        // 生命值归零
        if (next.hp <= 0) {
          setTimeout(() => finishGame("dead"), 0);
          return next;
        }

        // 生成新字符
        lastSpawnRef.current += dt;
        const spawnInterval =
          config.mode === "endless"
            ? Math.max(0.6, 1.5 - endlessSpeedMult(newElapsed) * 0.2)
            : config.mode === "timed"
            ? Math.max(0.7, 1.4 - state.level * 0.08)
            : 1.2;
        if (lastSpawnRef.current >= spawnInterval && words.length > 0) {
          lastSpawnRef.current = 0;
          // 错字强化
          const reinforce = poolRef.current.shouldReinforce(
            newElapsed,
            Math.random()
          );
          const char =
            reinforce ||
            words[Math.floor(Math.random() * words.length)];
          next = spawnChar(next, char, currentSpeed, Math.random());
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, finished, config.mode, currentSpeed, words, finishGame]);

  // QA: Android 生命周期 - 切后台自动暂停，防止 dt 跳跃和 RAF 堆积
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !paused && !finished) {
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [paused, finished]);

  // 输入处理
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (composing) return;
    // 取最后一个字符
    const lastChar = val.slice(-1);
    if (!lastChar) return;
    setState((prev) => {
      const { state: next, hit } = inputChar(prev, lastChar);
      if (hit) {
        recordDetail(lastChar, true);
        poolRef.current.recordCorrect(lastChar);
        if (hapticsEnabled) hapticLight();
      } else {
        recordDetail(lastChar, false);
        poolRef.current.recordWrong(lastChar, elapsedRef.current);
        if (hapticsEnabled) hapticError();
      }
      return next;
    });
    setInputValue("");
  };

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (finished) {
    return (
      <ResultScreen
        wpm={finished.wpm}
        accuracy={finished.accuracy}
        score={finished.score}
        level={finished.level}
        newHighScore={finished.newHighScore}
        unlocked={finished.unlocked}
        mode={config.mode}
        onExit={onExit}
      />
    );
  }

  const hpPct = (state.hp / state.maxHp) * 100;

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950">
      {/* 顶部状态栏 */}
      <div className="safe-top px-4 pt-3 pb-2 flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          ✕
        </button>
        <div className="flex-1">
          {config.mode === "timed" && (
            <>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>生命值</span>
                <span>{formatDuration(Math.ceil(timeLeft))}</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
            </>
          )}
          {config.mode === "free" && (
            <div className="text-center text-sm text-zinc-500">
              {formatDuration(Math.floor(elapsed))} · {state.score} 分
            </div>
          )}
          {config.mode === "endless" && (
            <div className="text-center text-sm text-zinc-500">
              {formatDuration(Math.floor(elapsed))} · Lv.{currentLevel} · {state.score} 分
            </div>
          )}
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          {paused ? "▶" : "❚❚"}
        </button>
      </div>

      {/* 游戏区 */}
      <div className="flex-1 relative overflow-hidden">
        {state.chars.map((c) => (
          <div
            key={c.id}
            className="absolute text-3xl font-medium text-zinc-800 dark:text-zinc-100 select-none"
            style={{
              left: `${c.x * 100}%`,
              top: `${c.y * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {c.char}
          </div>
        ))}
        {paused && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl px-8 py-6 text-center">
              <p className="text-lg font-semibold mb-3">已暂停</p>
              <button
                onClick={() => setPaused(false)}
                className="px-6 py-2 bg-accent text-white rounded-xl font-medium"
              >
                继续
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div className="safe-bottom safe-x px-4 pb-3 pt-2 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInput}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            setComposing(false);
            // compositionend 后手动触发输入
            const val = (e.target as HTMLInputElement).value;
            const lastChar = val.slice(-1);
            if (lastChar) {
              setState((prev) => {
                const { state: next, hit } = inputChar(prev, lastChar);
                if (hit) {
                  recordDetail(lastChar, true);
                  poolRef.current.recordCorrect(lastChar);
                  if (hapticsEnabled) hapticLight();
                } else {
                  recordDetail(lastChar, false);
                  poolRef.current.recordWrong(lastChar, elapsedRef.current);
                  if (hapticsEnabled) hapticError();
                }
                return next;
              });
              setInputValue("");
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="输入汉字消除…"
          className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-center text-lg outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  );
}

function loadTimedLevel(charsetId: string): number {
  // 同步读取 localStorage 缓存（实际值由 settings 异步加载）
  try {
    const v = localStorage.getItem(`timed_level:${charsetId}`);
    return v ? parseInt(v) : 1;
  } catch {
    return 1;
  }
}

// ===== 行式打字测试 =====
function LineTypingGame({
  words,
  config,
  onExit,
  hapticsEnabled,
}: {
  words: string[];
  config: GameConfig;
  onExit: () => void;
  hapticsEnabled: boolean;
}) {
  const [finished, setFinished] = useState<null | {
    wpm: number;
    accuracy: number;
    unlocked: string[];
  }>(null);

  const handleFinish = async (result: {
    correct: number;
    wrong: number;
    durationSec: number;
  }) => {
    const wpm = calcWpm(result.correct, result.durationSec);
    const accuracy = calcAccuracy(result.correct, result.wrong);
    const r = await ipc.recordSession({
      mode: config.mode,
      charset_id: config.charsetId,
      display_mode: "line",
      duration_sec: Math.round(result.durationSec),
      chars_total: result.correct + result.wrong,
      chars_correct: result.correct,
      chars_wrong: result.wrong,
      score: result.correct,
      level_reached: 1,
      char_details: [],
    });
    if (hapticsEnabled) hapticSuccess();
    setFinished({ wpm, accuracy, unlocked: r.newly_unlocked });
  };

  if (finished) {
    return (
      <ResultScreen
        wpm={finished.wpm}
        accuracy={finished.accuracy}
        score={0}
        level={0}
        newHighScore={false}
        unlocked={finished.unlocked}
        mode={config.mode}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-zinc-50 dark:bg-zinc-950">
      <div className="safe-top px-4 pt-3 pb-2 flex items-center">
        <button
          onClick={onExit}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
        >
          ✕
        </button>
        <span className="ml-3 text-sm text-zinc-500">
          {config.mode === "test" ? "打字测试" : "行式练习"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <LineTyping words={words} onFinish={handleFinish} />
      </div>
    </div>
  );
}

// ===== 结果页 =====
function ResultScreen({
  wpm,
  accuracy,
  score,
  level,
  newHighScore,
  unlocked,
  mode,
  onExit,
}: {
  wpm: number;
  accuracy: number;
  score: number;
  level: number;
  newHighScore: boolean;
  unlocked: string[];
  mode: string;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white dark:bg-zinc-950 safe-top safe-bottom safe-x">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-zinc-500 mb-2">练习完成</p>
        <div className="text-6xl font-bold text-accent mb-1">
          {wpm.toFixed(0)}
        </div>
        <p className="text-sm text-zinc-500 mb-6">WPM</p>

        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-4 text-center">
            <div className="text-2xl font-semibold">
              {(accuracy * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-zinc-500 mt-1">准确率</div>
          </div>
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-4 text-center">
            <div className="text-2xl font-semibold">{score}</div>
            <div className="text-xs text-zinc-500 mt-1">得分</div>
          </div>
        </div>

        {newHighScore && (
          <div className="mb-4 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium">
            🏆 新纪录！
          </div>
        )}
        {level > 0 && mode === "timed" && (
          <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
            达到 Lv.{level} {levelName(level)}
          </div>
        )}
        {unlocked.length > 0 && (
          <div className="mb-6 text-center">
            <p className="text-xs text-zinc-500 mb-2">解锁成就</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {unlocked.map((id) => (
                <span
                  key={id}
                  className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs"
                >
                  {achievementName(id)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onExit}
        className="mx-6 mb-4 py-3.5 bg-accent text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
      >
        完成
      </button>
    </div>
  );
}

function achievementName(id: string): string {
  const map: Record<string, string> = {
    first_practice: "首次练习",
    streak_3: "连续打卡 3 天",
    streak_7: "连续打卡 7 天",
    streak_30: "连续打卡 30 天",
    wpm_30: "WPM 突破 30",
    wpm_60: "WPM 突破 60",
    wpm_100: "WPM 突破 100",
    chars_1000: "累计 1000 字",
    chars_10000: "累计 10000 字",
    master_100: "掌握 100 字",
    master_500: "掌握 500 字",
    endless_500: "无尽 500 分",
    timed_lv8: "限时大师级",
  };
  return map[id] || id;
}
