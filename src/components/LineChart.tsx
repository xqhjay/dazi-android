interface LineChartProps {
  data: { x: number; y: number; label?: string }[];
  color?: string;
  height?: number;
  yLabel?: string;
}

export function LineChart({
  data,
  color = "#4f46e5",
  height = 120,
  yLabel,
}: LineChartProps) {
  const width = 300;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-zinc-400"
        style={{ height }}
      >
        暂无数据
      </div>
    );
  }

  const xs = data.map((d) => d.x);
  const ys = data.map((d) => d.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(...ys, 1);

  const xScale = (x: number) =>
    padding.left + ((x - xMin) / (xMax - xMin || 1)) * innerW;
  const yScale = (y: number) =>
    padding.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH;

  const path = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.x)} ${yScale(d.y)}`)
    .join(" ");

  const areaPath =
    `${path} L ${xScale(data[data.length - 1].x)} ${padding.top + innerH}` +
    ` L ${xScale(data[0].x)} ${padding.top + innerH} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y 轴刻度 */}
      {[0, 0.5, 1].map((t) => {
        const y = padding.top + innerH * (1 - t);
        const val = yMin + (yMax - yMin) * t;
        return (
          <g key={t}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
            />
            <text
              x={padding.left - 4}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="currentColor"
              fillOpacity="0.4"
            >
              {val.toFixed(0)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill={`url(#grad-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(d.x)}
          cy={yScale(d.y)}
          r="2.5"
          fill={color}
        />
      ))}
      {yLabel && (
        <text
          x={4}
          y={12}
          fontSize="9"
          fill="currentColor"
          fillOpacity="0.5"
        >
          {yLabel}
        </text>
      )}
    </svg>
  );
}
