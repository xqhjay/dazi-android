/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Tauri 移动端：固定端口，避免 devUrl 漂移
const host = process.env.TAURI_DEV_HOST || "localhost";
const port = 1420;

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: host || false,
    port,
    strictPort: true,
    hmr: host
      ? { protocol: "ws", host, port }
      : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
