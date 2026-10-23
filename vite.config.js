import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { cpSync } from 'node:fs';

const root = fileURLToPath(new URL('.', import.meta.url));
const resolve = (p) => fileURLToPath(new URL(p, import.meta.url));

// The pages still load a few assets as classic scripts/files at runtime
// (data banks, seed loader, Firebase engine). Those are not part of the
// bundle yet, so copy them into dist/ untouched, preserving their paths.
function copyRuntimeAssets() {
  return {
    name: 'copy-runtime-assets',
    closeBundle() {
      cpSync(resolve('./data'), resolve('./dist/data'), { recursive: true });
      cpSync(resolve('./firebase-db.js'), resolve('./dist/firebase-db.js'));
      cpSync(resolve('./js/seed-data.js'), resolve('./dist/js/seed-data.js'));
    },
  };
}

export default defineConfig({
  root,
  base: './',
  plugins: [copyRuntimeAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve('./index.html'),
        parent: resolve('./parent.html'),
      },
    },
  },
});
