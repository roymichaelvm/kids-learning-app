# Vite Build Prototype

This branch prototypes a production build for the app with
[Vite](https://vite.dev) + Tailwind CSS compiled ahead of time.
The app source code (classic IIFE scripts that attach to `window.*`)
is unchanged in how it works; only the delivery is built.

## Run it

```bash
npm install     # one time
npm run build   # outputs dist/
npm run preview # serves dist/ locally
npm run dev     # dev server with hot reload (source files)
```

Deploy the contents of `dist/`, not the repo root.

## What the build does

- Bundles the seven application scripts (`js/utils.js` ... `js/app.js`),
  imported in their original order by `src/entry.js`, into one minified,
  fingerprinted JS file (long-lived caching works).
- Compiles Tailwind via PostCSS using `tailwind.config.js`
  (the old inline `tailwind.config` + Play CDN script are gone).
  The config scans the JS files too, because many class names live in
  template strings there.
- Copies the runtime assets that are intentionally NOT bundled yet
  (`data/`, `firebase-db.js`, `js/seed-data.js`) into `dist/` with their
  paths preserved (see the `copyRuntimeAssets` plugin in
  `vite.config.js`). Firebase SDKs and Lucide still come from CDNs.

## Measured output (this prototype, 2026-10-23)

| Asset | Before (no build) | Vite build |
| --- | --- | --- |
| App JS | 404 KB raw across 9 files | 226 KB minified (59 KB gzip) in 1 file |
| CSS | Tailwind Play CDN: 401 KB JS (120 KB gzip) + runtime compile in the browser | 64 KB compiled CSS (10 KB gzip), no runtime compile |
| Tailwind CDN console warning | yes | gone |

## Caveats

- **Hosting only:** the bundle is an ES module, which Chrome blocks on
  `file://`. The old "double-click index.html" workflow does not work
  with the built output; serve `dist/` over HTTP(S) (or use
  `npm run preview`). The un-built source also no longer runs standalone,
  because the pages now reference `src/entry.js` — always go through Vite.
- jsdom cannot execute ES-module scripts, so the simulated-DOM test used
  for earlier branches only verifies the built page partially (page loads,
  data banks present, no errors). Full verification needs a real browser
  run of `dist/`.
- Still to do in a later pass if this is adopted: bundle `firebase-db.js`
  and the data banks, split kid vs teen bundles, add the Firebase config
  as a real file instead of the tolerated 404.
