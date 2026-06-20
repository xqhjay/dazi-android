import { useEffect, useState } from "react";
import { useSettings } from "@/store/settings";
import { TabBar } from "@/components/TabBar";
import { Practice } from "@/pages/Practice";
import { Game } from "@/pages/Game";
import { Stats } from "@/pages/Stats";
import { CharSets } from "@/pages/CharSets";
import { Profile } from "@/pages/Profile";

export type GameConfig = {
  mode: "timed" | "free" | "endless" | "test" | "custom";
  charsetId: string;
  displayMode: "falling" | "line";
  speed?: number; // 自由练习速度
  customChars?: string[]; // 自定义练习
};

export default function App() {
  const load = useSettings((s) => s.load);
  const [tab, setTab] = useState<"practice" | "stats" | "charsets" | "profile">(
    "practice"
  );
  const [game, setGame] = useState<GameConfig | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  if (game) {
    return (
      <Game
        config={game}
        onExit={() => setGame(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white dark:bg-zinc-950">
      <div className="flex-1 overflow-y-auto safe-top">
        {tab === "practice" && (
          <Practice
            onStart={(cfg) => setGame(cfg)}
            onCustom={() => setTab("charsets")}
          />
        )}
        {tab === "stats" && <Stats />}
        {tab === "charsets" && (
          <CharSets
            onCustomPractice={(chars) =>
              setGame({
                mode: "custom",
                charsetId: "custom",
                displayMode: "falling",
                customChars: chars,
              })
            }
          />
        )}
        {tab === "profile" && <Profile />}
      </div>
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}
