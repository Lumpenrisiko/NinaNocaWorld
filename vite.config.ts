import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2022",
    sourcemap: true,
    // Phaser alone is ~1.5 MB; raise the threshold so the unavoidable
    // dependency chunk doesn't trigger the size warning each build.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        // Phaser is ~1.5 MB minified; isolating it lets the app chunk
        // (~45 KB) stay small and cacheable across deploys.
        manualChunks: {
          phaser: ["phaser"],
        },
      },
    },
  },
});
