interface HeatMapProps {
  // date(YYYY-MM-DD) -> 强度 0-4
  data: Map<string, number>;
  weeks?: number;
}

export function HeatMap({ data, weeks = 13 }: HeatMapProps) {
  const today = new Date();
  const days: { date: string; level: number }[] = [];
  // 从 weeks*7 天前开始
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);
  // 对齐到周日
  start.setDate(start.getDate() - start.getDay());

  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > today) break;
    const ds = d.toISOString().slice(0, 10);
    days.push({ date: ds, level: data.get(ds) || 0 });
  }

  const colors = [
    "bg-zinc-100 dark:bg-zinc-800",
    "bg-accent/30",
    "bg-accent/50",
    "bg-accent/70",
    "bg-accent",
  ];

  // 按列（周）分组
  const columns: { date: string; level: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex gap-[3px] overflow-x-auto">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map((d, ri) => (
            <div
              key={ri}
              className={`w-[11px] h-[11px] rounded-sm ${colors[d.level]}`}
              title={`${d.date}: ${d.level > 0 ? "已练习" : "未练习"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
