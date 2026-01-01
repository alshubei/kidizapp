import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 8080,
    // Ensure preview server handles SPA routing
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure build includes proper base path handling
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
