/**
 * Question Loader — per-domain, on-demand loading of the question bank.
 *
 * Replaces the old <script src="data/questions.data.js"> head tag. Instead of
 * downloading and parsing the entire bank (~126 KB) on every page load, this
 * loader:
 *   1. Synchronously adopts the bank LuminaDB cached in localStorage on a
 *      previous visit (window.DEFAULT_QUESTIONS), so repeat visits and
 *      offline use behave exactly as before.
 *   2. Fetches a tiny manifest (data/q/manifest.json, generated at build
 *      time from data/questions.json) listing every domain, its question
 *      count and a content hash (same FNV-1a scheme as firebase-db.js).
 *   3. Fetches a domain's questions only when something actually asks for
 *      them (ensureDomain / ensureProfile / ensureAll), verifies the slice
 *      already in memory against the manifest hash, and swaps in the fresh
 *      copy only when it changed. Loaded slices are merged into
 *      LuminaDB.state.questions and persisted through LuminaDB's own
 *      localStorage cache, so the next visit starts warm.
 *
 * If the split files are missing (older deploy), it falls back to fetching
 * the whole data/questions.json once. If a Firestore pull replaced the bank
 * this session (window.__cloudBankPulled), the cloud copy wins and static
 * files are never applied over it.
 */
(function (window) {
  'use strict';

  window.__QUESTION_LOADER_ACTIVE = true;

  var CACHE_KEY = 'lumina_questions_cache_v3'; // same key LuminaDB persists to

  function fnv(data) {
    var text;
    try { text = JSON.stringify(data) || ''; } catch (e) { text = String(data); }
    var h = 2166136261 >>> 0;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return 'v' + text.length + '-' + h.toString(36);
  }

  // ---- 1. Synchronous boot: adopt the locally cached bank, if any.
  var initial = [];
  try {
    var raw = window.localStorage ? window.localStorage.getItem(CACHE_KEY) : null;
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) initial = parsed;
    }
  } catch (e) { /* cache unreadable — start empty, domains will fetch */ }
  window.DEFAULT_QUESTIONS = initial;

  // ---- 2. Loader state
  var manifest = null;
  var manifestPromise = null;
  var loadedHashes = {}; // domain -> hash of the slice currently applied
  var inflight = {};     // domain -> Promise

  function stateQuestions() {
    return (window.LuminaDB && window.LuminaDB.state && Array.isArray(window.LuminaDB.state.questions))
      ? window.LuminaDB.state.questions
      : null;
  }

  function currentSlice(domain) {
    var qs = stateQuestions() || window.DEFAULT_QUESTIONS || [];
    return qs.filter(function (q) { return q && q.domain === domain; });
  }

  function manifestEntry(domain) {
    if (!manifest || !Array.isArray(manifest.domains)) return null;
    for (var i = 0; i < manifest.domains.length; i++) {
      if (manifest.domains[i].domain === domain) return manifest.domains[i];
    }
    return null;
  }

  function isReady(domain) {
    if (window.__cloudBankPulled) return true;
    var entry = manifestEntry(domain);
    if (!entry) return false;
    if (loadedHashes[domain] === entry.hash) return true;
    return fnv(currentSlice(domain)) === entry.hash;
  }

  function applyDomain(domain, questions) {
    function replaceIn(arr) {
      var rest = (arr || []).filter(function (q) { return !q || q.domain !== domain; });
      return rest.concat(questions);
    }
    window.DEFAULT_QUESTIONS = replaceIn(window.DEFAULT_QUESTIONS || []);
    var st = stateQuestions();
    if (st) {
      var merged = replaceIn(st);
      st.length = 0;
      for (var i = 0; i < merged.length; i++) st.push(merged[i]);
    }
    loadedHashes[domain] = fnv(questions);
    if (window.LuminaDB && typeof window.LuminaDB.saveQuestionsLocal === 'function') {
      try { window.LuminaDB.saveQuestionsLocal(); } catch (e) {}
    }
    if (window.LuminaDB && typeof window.LuminaDB.notify === 'function') {
      try { window.LuminaDB.notify(); } catch (e) {}
    }
  }

  function fetchJson(url) {
    if (typeof fetch !== 'function') return Promise.resolve(null);
    return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function getManifest() {
    if (manifest) return Promise.resolve(manifest);
    if (!manifestPromise) {
      manifestPromise = fetchJson('data/q/manifest.json').then(function (m) {
        if (m && Array.isArray(m.domains)) { manifest = m; return manifest; }
        // Fallback: split files unavailable — load the whole bank once, as before.
        return fetchJson('data/questions.json').then(function (all) {
          if (Array.isArray(all) && all.length) {
            var byDomain = {};
            all.forEach(function (q) { (byDomain[q.domain] = byDomain[q.domain] || []).push(q); });
            Object.keys(byDomain).forEach(function (d) { applyDomain(d, byDomain[d]); });
            manifest = {
              version: fnv(all),
              total: all.length,
              fallback: true,
              domains: Object.keys(byDomain).map(function (d) {
                return { domain: d, slug: null, profile: (byDomain[d][0] || {}).targetProfile || 'teen', count: byDomain[d].length, hash: fnv(byDomain[d]) };
              })
            };
          }
          return manifest;
        });
      });
    }
    return manifestPromise;
  }

  function ensureDomain(domain) {
    if (!domain) return Promise.resolve(false);
    if (window.__cloudBankPulled) return Promise.resolve(true);
    if (inflight[domain]) return inflight[domain];
    inflight[domain] = getManifest().then(function (m) {
      if (!m) { delete inflight[domain]; return false; }
      var entry = manifestEntry(domain);
      if (!entry) { delete inflight[domain]; return false; }
      if (isReady(domain)) { loadedHashes[domain] = entry.hash; delete inflight[domain]; return true; }
      if (m.fallback || !entry.slug) { delete inflight[domain]; return true; }
      return fetchJson('data/q/' + entry.slug + '.json').then(function (qs) {
        delete inflight[domain];
        if (Array.isArray(qs)) { applyDomain(domain, qs); return true; }
        return false;
      });
    });
    return inflight[domain];
  }

  function ensureProfile(profile) {
    return getManifest().then(function (m) {
      if (!m) return false;
      return Promise.all(m.domains.filter(function (d) { return d.profile === profile; }).map(function (d) { return ensureDomain(d.domain); })).then(function () { return true; });
    });
  }

  function ensureAll() {
    return getManifest().then(function (m) {
      if (!m) return false;
      return Promise.all(m.domains.map(function (d) { return ensureDomain(d.domain); })).then(function () { return true; });
    });
  }

  function getDomainCounts() {
    if (!manifest) return null;
    var out = {};
    manifest.domains.forEach(function (d) { out[d.domain] = d.count; });
    return out;
  }

  window.QuestionLoader = {
    ensureDomain: ensureDomain,
    ensureProfile: ensureProfile,
    ensureAll: ensureAll,
    getManifest: getManifest,
    getDomainCounts: getDomainCounts,
    isReady: isReady,
    hash: fnv
  };

  // Warm the manifest in the background (a couple of KB) without blocking boot.
  if (window.location && /^https?:$/.test(window.location.protocol)) {
    getManifest();
  }
})(window);
