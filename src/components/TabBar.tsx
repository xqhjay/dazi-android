interface TabBarProps {
  tab: "practice" | "stats" | "charsets" | "profile";
  onChange: (t: "practice" | "stats" | "charsets" | "profile") => void;
}

const tabs = [
  { id: "practice", label: "练习", icon: "✎" },
  { id: "stats", label: "统计", icon: "▤" },
  { id: "charsets", label: "字集", icon: "字" },
  { id: "profile", label: "我的", icon: "◉" },
] as const;

export function TabBar({ tab, onChange }: TabBarProps) {
  return (
    <nav className="flex border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 safe-bottom safe-x">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
            tab === t.id
              ? "text-accent"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          <span className="text-xl leading-none">{t.icon}</span>
          <span className="text-[11px]">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
