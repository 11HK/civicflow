import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// The Express server (../server.js) serves the built app from ../public
// and proxies /api. In dev, Vite runs on :5173 and proxies /api to :5000.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5055",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../public",
    emptyOutDir: true,
    sourcemap: false,
  },
});
