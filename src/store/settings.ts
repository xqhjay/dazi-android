import { create } from "zustand";
import { DEFAULT_CHARSET_ID } from "@/lib/charsets";
import * as ipc from "@/lib/ipc";

export type Theme = "light" | "dark";
export type DisplayMode = "falling" | "line";

interface SettingsState {
  theme: Theme;
  charsetId: string;
  displayMode: DisplayMode;
  hapticsEnabled: boolean;
  freeSpeed: number; // 自由练习速度 0.1-5.0
  dailyGoalChars: number;
  loaded: boolean;
  setTheme: (t: Theme) => void;
  setCharsetId: (id: string) => void;
  setDisplayMode: (m: DisplayMode) => void;
  setHapticsEnabled: (b: boolean) => void;
  setFreeSpeed: (n: number) => void;
  setDailyGoalChars: (n: number) => void;
  load: () => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
  theme: "light",
  charsetId: DEFAULT_CHARSET_ID,
  displayMode: "falling",
  hapticsEnabled: true,
  freeSpeed: 1.0,
  dailyGoalChars: 500,
  loaded: false,
  setTheme: (t) => {
    set({ theme: t });
    applyTheme(t);
    ipc.setSetting("theme", t);
  },
  setCharsetId: (id) => {
    set({ charsetId: id });
    ipc.setSetting("charsetId", id);
  },
  setDisplayMode: (m) => {
    set({ displayMode: m });
    ipc.setSetting("displayMode", m);
  },
  setHapticsEnabled: (b) => {
    set({ hapticsEnabled: b });
    ipc.setSetting("hapticsEnabled", b ? "1" : "0");
  },
  setFreeSpeed: (n) => {
    set({ freeSpeed: n });
    ipc.setSetting("freeSpeed", n.toString());
  },
  setDailyGoalChars: (n) => {
    set({ dailyGoalChars: n });
    ipc.setSetting("dailyGoalChars", n.toString());
  },
  load: async () => {
    const all = await ipc.getAllSettings();
    const s: Partial<SettingsState> = {};
    if (all.theme) s.theme = all.theme as Theme;
    if (all.charsetId) s.charsetId = all.charsetId;
    if (all.displayMode) s.displayMode = all.displayMode as DisplayMode;
    if (all.hapticsEnabled) s.hapticsEnabled = all.hapticsEnabled === "1";
    if (all.freeSpeed) s.freeSpeed = parseFloat(all.freeSpeed);
    if (all.dailyGoalChars) s.dailyGoalChars = parseInt(all.dailyGoalChars);
    s.loaded = true;
    set(s as SettingsState);
    applyTheme(get().theme);
  },
}));

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}
