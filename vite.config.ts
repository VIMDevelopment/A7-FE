/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// R-54: Vite вместо CRA. Выход — build/static/* (как у CRA): nginx.conf (кэш /static/ на год)
// и scripts/verify-delivery.sh менять не нужно. Переменная API — прежняя REACT_APP_API_URL.
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: { port: 3005 },
  build: {
    outDir: "build",
    assetsDir: "static",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
