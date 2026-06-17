import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies all /api calls to the Fastify backend on :8080,
// so the frontend can use same-origin relative URLs in every environment.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
});
