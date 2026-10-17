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
})(window);
