import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  define: {
    // Prevent issues with process.env in bundled React
    "process.env.NODE_ENV": JSON.stringify("production"),
  },

  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "_OverlayInternal", // Internal name, actual export is via defineOverlay
      fileName: () => "index.js",
      formats: ["iife"], // Self-contained bundle
    },
    rollupOptions: {
      // NO EXTERNALS - everything bundled
      external: [],
      output: {
        // Single file output
        inlineDynamicImports: true,
      },
    },
    // Minimize for production (using esbuild, the default)
    minify: true,
    // Generate source maps
    sourcemap: true,
    // Target modern browsers
    target: "es2020",
  },

  resolve: {
    alias: {
      // Resolve SDK from source for bundling
      "@eulerstream/overlay-sdk": resolve(__dirname, "../../packages/sdk/src/index.ts"),
    },
  },

  preview: {
    port: 5174,
    cors: true,
  },
});
