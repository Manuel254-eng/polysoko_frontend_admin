import { defineConfig } from "vite";
import path from "path";
import Vue from "@vitejs/plugin-vue";
import ViteImages from "vite-plugin-vue-images";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue(),
    ViteImages({
      dirs: ["src/assets/images"],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 80000,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      // ASGI's WebSocket routes live at the host root, not under /api — see
      // adminSocket.js's resolveWsBaseUrl(), which falls back to same-origin
      // (window.location.host) whenever VITE_APP_API_URL is relative, as it
      // is in .env.development. Without this, that same-origin WS request
      // hits the Vite dev server itself, which has no such route.
      "/ws": {
        target: "http://127.0.0.1:8000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue", ".css"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
