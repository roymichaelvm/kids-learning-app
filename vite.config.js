import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { cpSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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
      cpSync(resolve('./js/question-loader.js'), resolve('./dist/js/question-loader.js'));
    },
  };
}


// Split the question bank into one small JSON per domain plus a manifest,
// so the client loader (js/question-loader.js) can fetch only the domains a
// student actually opens instead of the whole bank up front. The source of
// truth stays data/questions.json; these files are generated into dist/ at
// build time and never committed.
function questionDomainFiles() {
  return {
    name: 'question-domain-files',
    closeBundle() {
      try {
        const raw = readFileSync(resolve('./dist/data/questions.json'), 'utf8').replace(/^\uFEFF/, '');
        const bank = JSON.parse(raw);
        const fnv = (data) => {
          const text = JSON.stringify(data) || '';
          let h = 2166136261 >>> 0;
          for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
          }
          return 'v' + text.length + '-' + h.toString(36);
        };
        const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const byDomain = new Map();
        for (const q of bank) {
          const d = q.domain || 'General';
          if (!byDomain.has(d)) byDomain.set(d, []);
          byDomain.get(d).push(q);
        }
        mkdirSync(resolve('./dist/data/q'), { recursive: true });
        const domains = [];
        for (const [domain, qs] of byDomain) {
          const s = slug(domain);
          writeFileSync(resolve('./dist/data/q/' + s + '.json'), JSON.stringify(qs));
          domains.push({ domain, slug: s, profile: (qs[0] && qs[0].targetProfile) || 'teen', count: qs.length, hash: fnv(qs) });
        }
        writeFileSync(resolve('./dist/data/q/manifest.json'), JSON.stringify({ version: fnv(bank), total: bank.length, domains }));
      } catch (e) {
        console.warn('question-domain-files: could not generate per-domain question files:', e);
      }
    },
  };
}

export default defineConfig({
  root,
  base: './',
  plugins: [copyRuntimeAssets(), questionDomainFiles()],
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
