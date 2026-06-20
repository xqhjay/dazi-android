import { isTauriEnv } from "./ipc";

// 触感反馈封装：Tauri 用 plugin-haptics，web 用 navigator.vibrate
export async function hapticLight() {
  try {
    if (isTauriEnv) {
      const mod = await import("@tauri-apps/plugin-haptics");
      await mod.impactFeedback("light");
    } else if ("vibrate" in navigator) {
      navigator.vibrate(10);
    }
  } catch {}
}

export async function hapticMedium() {
  try {
    if (isTauriEnv) {
      const mod = await import("@tauri-apps/plugin-haptics");
      await mod.impactFeedback("medium");
    } else if ("vibrate" in navigator) {
      navigator.vibrate(20);
    }
  } catch {}
}

export async function hapticError() {
  try {
    if (isTauriEnv) {
      const mod = await import("@tauri-apps/plugin-haptics");
      await mod.notificationFeedback("error");
    } else if ("vibrate" in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
  } catch {}
}

export async function hapticSuccess() {
  try {
    if (isTauriEnv) {
      const mod = await import("@tauri-apps/plugin-haptics");
      await mod.notificationFeedback("success");
    } else if ("vibrate" in navigator) {
      navigator.vibrate([20, 40, 20]);
    }
  } catch {}
}
