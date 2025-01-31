import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    assetsDir: "assets",
  },
  resolve: {
    alias: {
      "@assets": "/assets", // Adjust the path according to your project structure
    },
  },
});
