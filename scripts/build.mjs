import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build } from "vite";

const root = process.cwd();

await build({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  plugins: [react(), tailwindcss()],
  publicDir: "public",
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        options: resolve(root, "options.html"),
        background: resolve(root, "src/background/index.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});

await build({
  configFile: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  plugins: [react()],
  publicDir: false,
  build: {
    emptyOutDir: false,
    outDir: "dist",
    lib: {
      entry: resolve(root, "src/content/index.tsx"),
      formats: ["iife"],
      name: "YoutubeTimestampCommentsContent",
      fileName: () => "content.js"
    }
  }
});
