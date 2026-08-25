import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  envDir: ".",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5177,
    strictPort: true,
    fs: { allow: [".."] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: { index: "index.html", admin: "admin.html" } },
  },
});
