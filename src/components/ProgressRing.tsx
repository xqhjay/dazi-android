interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  value?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  stroke = 6,
  color = "#4f46e5",
  label,
  value,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {value && <span className="text-lg font-semibold">{value}</span>}
        {label && <span className="text-[10px] text-zinc-500">{label}</span>}
      </div>
    </div>
  );
}
