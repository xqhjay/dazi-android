interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}
