import { useEffect, useMemo, useRef, useState } from "react";
import { calcWpm, calcAccuracy } from "@/lib/wpm";
import { hapticLight, hapticError } from "@/lib/haptics";

interface LineTypingProps {
  words: string[];
  onFinish: (result: { correct: number; wrong: number; durationSec: number }) => void;
  /** 测试字数，默认 50 */
  count?: number;
}

export function LineTyping({ words, onFinish, count = 50 }: LineTypingProps) {
  // 生成测试序列
  const sequence = useMemo(() => {
    if (words.length === 0) return [];
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      out.push(words[Math.floor(Math.random() * words.length)]);
    }
    return out;
  }, [words, count]);

  const [index, setIndex] = useState(0);
  const [wrongSet, setWrongSet] = useState<Set<number>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [composing, setComposing] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // QA: 用 ref 跟踪累计计数，避免闭包陈旧值
  const correctCountRef = useRef(0);
  const wrongCountRef = useRef(0);
  const indexRef = useRef(0);
  indexRef.current = index;
  const finishedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (sequence.length === 0) {
    return <div className="p-6 text-center text-zinc-500">字集为空</div>;
  }

  const handleChar = (char: string) => {
    if (finishedRef.current) return;
    const curIndex = indexRef.current;
    if (curIndex >= sequence.length) return;
    if (startTimeRef.current === null) startTimeRef.current = performance.now();
    const expected = sequence[curIndex];
    if (char === expected) {
      correctCountRef.current++;
      hapticLight();
    } else {
      wrongCountRef.current++;
      setWrongSet((s) => new Set(s).add(curIndex));
      hapticError();
    }
    const nextIndex = curIndex + 1;
    setIndex(nextIndex);

    // 完成判定
    if (nextIndex >= sequence.length) {
      finishedRef.current = true;
      const dur =
        (performance.now() - (startTimeRef.current || performance.now())) / 1000;
      setTimeout(() => {
        onFinish({
          correct: correctCountRef.current,
          wrong: wrongCountRef.current,
          durationSec: dur,
        });
      }, 0);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (composing) return;
    const last = val.slice(-1);
    if (last) {
      handleChar(last);
      setInputValue("");
    }
  };

  // 实时 WPM
  const elapsed = startTimeRef.current
    ? (performance.now() - startTimeRef.current) / 1000
    : 0;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (index === 0) return;
    const t = setInterval(() => setTick((x) => x + 1), 200);
    return () => clearInterval(t);
  }, [index]);
  const liveWpm = calcWpm(correctCountRef.current, elapsed);
  const liveAcc = calcAccuracy(correctCountRef.current, wrongCountRef.current);

  return (
    <div className="flex flex-col h-full px-5 py-4">
      {/* 实时数据 */}
      <div className="flex justify-between text-sm text-zinc-500 mb-4">
        <span>{liveWpm.toFixed(0)} WPM</span>
        <span>{(liveAcc * 100).toFixed(0)}% 准确</span>
        <span>
          {index}/{sequence.length}
        </span>
      </div>

      {/* 字符序列 */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-2xl leading-loose font-medium tracking-wide break-all">
          {sequence.map((ch, i) => {
            const isCurrent = i === index;
            const isWrong = wrongSet.has(i);
            const isDone = i < index;
            let cls = "text-zinc-300 dark:text-zinc-700";
            if (isDone && !isWrong) cls = "text-zinc-800 dark:text-zinc-200";
            if (isDone && isWrong) cls = "text-rose-500 dark:text-rose-400";
            if (isCurrent)
              cls =
                "text-accent border-b-2 border-accent rounded-sm bg-accent/10 px-0.5";
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      {/* 输入框 */}
      <div className="safe-bottom safe-x pt-3">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={onChange}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(e) => {
            setComposing(false);
            const val = (e.target as HTMLInputElement).value;
            const last = val.slice(-1);
            if (last) {
              handleChar(last);
              setInputValue("");
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="逐字输入…"
          className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-center text-lg outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
    </div>
  );
}
