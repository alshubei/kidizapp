import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    fs: {
      // Allow serving files from public directory
      allow: ['..']
    },
    hmr: {
      overlay: true,
    },
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
  // Configure for ONNX Runtime Web
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
    // Force re-optimization to fix HMR issues
    force: true,
  },
  // Ensure WASM and MJS files are handled correctly
  assetsInclude: ['**/*.wasm', '**/*.mjs'],
});
