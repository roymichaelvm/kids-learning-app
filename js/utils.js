/**
 * Lumina Learning Hub — Shared Utilities & Helper Functions
 */
(function (window) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function showToast(message) {
    const t = document.createElement('div');
    t.className = "fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-fade";
    t.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(t);
    setTimeout(() => {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 3500);
  }

  // Deduplicate question items by paragraph+question or question+choiceA
  function dedupeQuestionsList(list) {
    const seen = new Set();
    return (list || []).filter(item => {
      if (!item || !item.question || !item.question.question) return false;
      const p = String(item.question.paragraph || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const q = String(item.question.question || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const a = String((item.question.choices && item.question.choices.A) || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const sig = (p && p !== 'null') ? `${p}::${q}` : `${q}::${a}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  }

  // Non-repeating Fisher-Yates shuffled deck per category (prevents back-to-back or premature repeats!)
  const _shuffledDecks = {};
  function getNextFromDeck(deckKey, itemsArray, keyFn) {
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) return null;
    const seen = new Set();
    const unique = itemsArray.filter(it => {
      const k = keyFn ? keyFn(it) : JSON.stringify(it);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (unique.length === 1) return unique[0];

    let deck = _shuffledDecks[deckKey];
    if (!deck || deck.sourceLen !== unique.length || deck.queue.length === 0) {
      const lastKey = deck ? deck.lastKey : null;
      const indices = unique.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
      }
      if (lastKey !== null && indices.length > 1) {
        const firstItemKey = keyFn ? keyFn(unique[indices[0]]) : JSON.stringify(unique[indices[0]]);
        if (firstItemKey === lastKey) {
          const tmp = indices[0]; indices[0] = indices[indices.length - 1]; indices[indices.length - 1] = tmp;
        }
      }
      deck = { sourceLen: unique.length, queue: indices, lastKey: lastKey };
      _shuffledDecks[deckKey] = deck;
    }
    const nextIdx = deck.queue.shift();
    const chosen = unique[nextIdx];
    deck.lastKey = keyFn ? keyFn(chosen) : JSON.stringify(chosen);
    return chosen;
  }

  window.escapeHtml = escapeHtml;
  window.showToast = showToast;
  window.dedupeQuestionsList = dedupeQuestionsList;
  window.getNextFromDeck = getNextFromDeck;

  /* ------------------------------------------ language spelling helpers */
  // Split a word into grapheme clusters so Indic scripts (Malayalam,
  // Hindi) keep dependent vowel signs and conjuncts attached to their
  // base letter — one tile per visible character, never a broken glyph.
  function splitGraphemes(str) {
    const s = String(str || '');
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
        const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
        return Array.from(seg.segment(s), part => part.segment);
      }
    } catch (e) { /* fall through to code-point split */ }
    return Array.from(s);
  }

  // The spellable form of a language item: for Malayalam/Hindi kid items
  // the primary is "native (Transliteration)" — spell the native part.
  // For the Latin languages, drop a leading article (El/La/Le/Il...) so
  // kids spell the word itself, and trim surrounding punctuation.
  function langSpellTarget(item) {
    let p = String((item && item.primary) || '').trim();
    const paren = p.indexOf(' (');
    if (paren > 0) p = p.slice(0, paren).trim();
    p = p.replace(/^(el|la|los|las|un|una|unos|unas|le|les|il|lo|gli|une|des)\s+/i, '');
    p = p.replace(/^[¡¿"' ]+|[!?.…"' ]+$/g, '');
    return p.trim();
  }

  function langTransliteration(item) {
    const p = String((item && item.primary) || '');
    const m = p.match(/\(([^)]+)\)/);
    if (m) return m[1].trim();
    return String((item && (item.transliteration || item.translit)) || '');
  }

  // Packs carry two item shapes: kid/expanded items {primary, meaning,
  // speech, emoji} and teen cards {script, translit, meaning, example}.
  // Normalize teen cards into the kid shape for spelling rounds.
  function normalizeLangItem(item) {
    if (!item) return null;
    if (item.primary) return item;
    if (item.script) {
      return {
        primary: item.script, meaning: item.meaning || '',
        speech: item.script, translit: item.translit || '',
        emoji: item.emoji || '✍️'
      };
    }
    return null;
  }

  // Items from a pack list that make good spelling rounds: single word,
  // 2–11 graphemes.
  function getLangSpellPool(items) {
    const pool = [];
    (items || []).forEach(raw => {
      const item = normalizeLangItem(raw);
      if (!item) return;
      const target = langSpellTarget(item);
      if (!target || /\s/.test(target)) return;
      const graphemes = splitGraphemes(target);
      if (graphemes.length < 2 || graphemes.length > 11) return;
      pool.push({ item: item, target: target, graphemes: graphemes });
    });
    return pool;
  }

  window.splitGraphemes = splitGraphemes;
  window.langSpellTarget = langSpellTarget;
  window.langTransliteration = langTransliteration;
  window.getLangSpellPool = getLangSpellPool;
})(window);
