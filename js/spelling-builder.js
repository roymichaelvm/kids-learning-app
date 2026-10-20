/**
 * Lumina Learning Hub — Interactive Spelling Letter-Tile Picker ("Build the Word")
 * Enables kids to tap scrambled letter tiles into empty spelling slots,
 * with undo/remove, pronunciation, hints, confetti, and streak XP.
 */
(function (window) {
  'use strict';

  let spellingSubMode = 'tiles'; // 'tiles' or 'quiz'
  let currentSpellingItem = null;
  let currentSpellingWord = '';
  let currentSpellingSlots = []; // array of { char, trayIdx } or null
  let currentSpellingTray = [];  // array of { char, origIdx, used }
  let isSpellingResolving = false;
  let hasFailedFirstAttempt = false;
  let spellingHintRevealed = false;
  let spellingLengthFilter = '3'; // '3' | '4' | '5' | '6' | 'big' (7+) | 'all'

  // Spelling words loaded externally from data/spelling.json (via js/seed-data.js)
  function getShortSpellingWords() {
    const raw = window.SHORT_SPELLING_WORDS_RAW || [];
    return raw.map(([w, emoji, clue]) => ({
      emoji,
      primary: w.split('').join(' - '),
      meaning: `${w} • ${clue}`,
      speech: `${w.charAt(0) + w.slice(1).toLowerCase()}. ${w.split('').join(', ')}.`
    }));
  }

  function spellingWordOf(item) {
    return (item.primary || '').replace(/[^A-Za-z]/g, '').toUpperCase();
  }

  function makeMisspellings(word) {
    const w = word.toUpperCase();
    const out = new Set();
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    // 1. Swap first vowel with another vowel
    for (let i = 0; i < w.length; i++) {
      if (vowels.includes(w[i])) {
        vowels.forEach(v => {
          if (v !== w[i]) out.add(w.slice(0, i) + v + w.slice(i + 1));
        });
      }
    }
    // 2. Transpose two adjacent distinct letters
    for (let i = 0; i < w.length - 1; i++) {
      if (w[i] !== w[i + 1]) {
        out.add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
      }
    }
    // 3. Double a consonant or drop a letter
    if (w.length >= 3) {
      out.add(w + w[w.length - 1]);
      out.add(w.slice(0, -1) + (w[w.length - 1] === 'E' ? 'A' : 'E'));
    }
    out.delete(w);
    return Array.from(out).slice(0, 3);
  }

  function getAllSpellingItems() {
    const pack = window.multiLangData && window.multiLangData.spelling;
    const base = (pack && pack.kidItems) || [];
    const seen = new Set(base.map(spellingWordOf));
    getShortSpellingWords().forEach(item => {
      const w = spellingWordOf(item);
      if (!seen.has(w)) {
        seen.add(w);
        base.push(item);
      }
    });
    return base;
  }

  function getGeneratedSpellingQuizQuestions() {
    const items = getAllSpellingItems();
    const letters = ['A', 'B', 'C', 'D'];
    return items.map((item, idx) => {
      const w = spellingWordOf(item);
      const cluePart = (item.meaning || '').split('•').slice(1).join('•').trim() || item.meaning || '';
      const wrongs = makeMisspellings(w);
      while (wrongs.length < 3) {
        wrongs.push(w + letters[wrongs.length]);
      }
      const correctPos = idx % 4;
      const opts = wrongs.slice(0, 3);
      opts.splice(correctPos, 0, w);
      const choices = { A: opts[0], B: opts[1], C: opts[2], D: opts[3] };
      return {
        id: 'kid_spell_auto_' + w.toLowerCase(),
        targetProfile: 'kid',
        domain: '6+ Spelling Bee',
        wordLength: w.length,
        difficulty: w.length <= 4 ? 'Easy' : (w.length <= 6 ? 'Medium' : 'Hard'),
        question: {
          paragraph: `${item.emoji || '🐝'} Spelling Clue (${w.length} letters): ${cluePart}`,
          question: `Which is the correct spelling for this ${w.length}-letter word?`,
          choices: choices,
          correct_answer: letters[correctPos],
          explanation: `The correct spelling is ${w.split('').join(' - ')} (${w}): ${cluePart}`
        }
      };
    });
  }

  function matchesLengthFilter(item) {
    const n = spellingWordOf(item).length;
    if (spellingLengthFilter === 'all') return true;
    if (spellingLengthFilter === 'big') return n >= 7;
    return n === Number(spellingLengthFilter);
  }

  function ensureSpellingLevelBar() {
    const toggle = document.getElementById('spellingModeToggle');
    const zone = document.getElementById('spellingBuilderZone');
    const host = (toggle && toggle.parentNode) ? toggle.parentNode : zone;
    if (!host) return;
    let bar = document.getElementById('spellingLevelBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'spellingLevelBar';
      bar.className = 'flex flex-wrap items-center justify-center gap-2 mb-3';
      if (toggle && toggle.nextSibling) {
        host.insertBefore(bar, toggle.nextSibling);
      } else {
        host.insertBefore(bar, host.firstChild);
      }
    }
    const isSpelling = !!(window.appData && window.appData.kidCategory === 'spelling');
    bar.classList.toggle('hidden', !isSpelling);
    const all = getAllSpellingItems();
    const levels = [['3', '3 Letters'], ['4', '4 Letters'], ['5', '5 Letters'], ['6', '6 Letters'], ['big', 'Big Words'], ['all', 'All']];
    bar.innerHTML = levels.map(([key, label]) => {
      const saved = spellingLengthFilter;
      spellingLengthFilter = key;
      const count = all.filter(matchesLengthFilter).length;
      spellingLengthFilter = saved;
      const active = key === spellingLengthFilter;
      const cls = active
        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50';
      const xpVal = (typeof window.getSectionXP === 'function' && key !== 'all')
        ? window.getSectionXP('spelling', key)
        : null;
      const isBonus = xpVal && xpVal >= 40;
      const xpPill = xpVal
        ? `<span class="ml-1 text-[10px] font-black px-1.5 py-0.2 rounded-full ${isBonus ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-900/10 text-slate-800'}">${isBonus ? '🔥 +' : '+'}${xpVal}</span>`
        : '';
      return `<button id="spelling-level-${key}" onclick="setSpellingLengthFilter('${key}')" class="px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition ${cls}">${label} <span class="opacity-60">(${count})</span>${xpPill}</button>`;
    }).join('');
  }

  function setSpellingLengthFilter(key) {
    spellingLengthFilter = key;
    window.spellingLengthFilter = key;
    ensureSpellingLevelBar();
    if (typeof window.renderKidFlashcard === 'function') {
      window.renderKidFlashcard();
    }
    if (spellingSubMode === 'tiles') {
      generateSpellingTileRound();
    } else if (typeof window.generateKidQuizRound === 'function') {
      window.generateKidQuizRound();
    }
  }

  function setSpellingBuilderContentVisible(visible) {
    const zone = document.getElementById('spellingBuilderZone');
    if (!zone) return;
    Array.from(zone.children).forEach(ch => {
      if (ch.id === 'spellingLevelBar' || ch.id === 'spellingCompleteBox') return;
      ch.classList.toggle('hidden', !visible);
    });
    let box = document.getElementById('spellingCompleteBox');
    if (!visible && !box) {
      box = document.createElement('div');
      box.id = 'spellingCompleteBox';
      zone.appendChild(box);
    }
    if (box) box.classList.toggle('hidden', visible);
  }

  function setSpellingSubMode(mode) {
    spellingSubMode = mode;
    window.spellingSubMode = mode;
    const btnTiles = document.getElementById('btn-spelling-sub-tiles');
    const btnQuiz = document.getElementById('btn-spelling-sub-quiz');
    if (btnTiles && btnQuiz) {
      if (mode === 'tiles') {
        btnTiles.className = "px-3 py-1 rounded-xl transition bg-amber-400 text-slate-950 shadow-sm";
        btnQuiz.className = "px-3 py-1 rounded-xl transition text-slate-600 hover:text-slate-900";
      } else {
        btnQuiz.className = "px-3 py-1 rounded-xl transition bg-amber-400 text-slate-950 shadow-sm";
        btnTiles.className = "px-3 py-1 rounded-xl transition text-slate-600 hover:text-slate-900";
      }
    }
    if (typeof window.generateKidQuizRound === 'function') {
      window.generateKidQuizRound();
    }
  }

  function handleKidNextQuizBtn() {
    if (window.appData && window.appData.kidCategory === 'spelling' && spellingSubMode === 'tiles') {
      generateSpellingTileRound();
    } else if (typeof window.generateKidQuizRound === 'function') {
      window.generateKidQuizRound();
    }
  }

  function resetCompletedSpellingWords() {
    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    if (p && window.LuminaDB) {
      const levelItems = getAllSpellingItems().filter(matchesLengthFilter);
      if (spellingLengthFilter === 'all' && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
        window.LuminaDB.resetCompletedQuestions(p.id, 'spelling');
      } else if (typeof window.LuminaDB.unmarkQuestionCompleted === 'function') {
        levelItems.forEach(i => window.LuminaDB.unmarkQuestionCompleted(p.id, 'spelling_' + spellingWordOf(i)));
      }
    }
    if (typeof window.showToast === 'function') window.showToast("Spelling Bee words reset! Ready to play again.");
    generateSpellingTileRound();
  }

  function generateSpellingTileRound() {
    isSpellingResolving = false;
    hasFailedFirstAttempt = false;
    spellingHintRevealed = false;

    const btnHint = document.getElementById('btnSpellingHint');
    if (btnHint) btnHint.classList.add('hidden');

    const allItems = getAllSpellingItems().filter(matchesLengthFilter);
    ensureSpellingLevelBar();
    if (allItems.length === 0) return;

    // Filter out words that are already completed for this profile
    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    const completed = new Set((p && p.completedQuestionIds) || []);

    const uncompletedItems = allItems.filter(i => !completed.has('spelling_' + spellingWordOf(i)));

    const levelName = spellingLengthFilter === 'all' ? 'every' : (spellingLengthFilter === 'big' ? 'every big' : `every ${spellingLengthFilter}-letter`);
    if (uncompletedItems.length === 0) {
      setSpellingBuilderContentVisible(false);
      const box = document.getElementById('spellingCompleteBox');
      if (box) {
        box.innerHTML = `
          <div class="text-center py-8 px-6 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-3xl border-4 border-amber-300 shadow-xl space-y-4 animate-fade">
            <div class="text-6xl animate-bounce">🏆</div>
            <h3 class="text-2xl font-black text-slate-900">Spelling Bee Champion!</h3>
            <p class="text-base font-bold text-slate-700">You built ${levelName} spelling word in the hive! Try another level above.</p>
            <div class="pt-2">
              <span class="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-100 text-amber-950 text-xs font-bold border border-amber-300">
                ⭐ Level Completed! Ask your parent or admin in the Parent Portal to reset or add more words.
              </span>
            </div>
          </div>
        `;
      }
      return;
    }
    setSpellingBuilderContentVisible(true);

    // Zero-repeat non-repeating deck queue
    const item = (typeof window.getNextFromDeck === 'function')
      ? window.getNextFromDeck('spelling_tiles_deck_' + (p ? p.id : 'default') + '_' + spellingLengthFilter, uncompletedItems, i => i.primary)
      : uncompletedItems[Math.floor(Math.random() * uncompletedItems.length)];

    currentSpellingItem = item;
    const target = spellingWordOf(item);
    currentSpellingWord = target;
    currentSpellingSlots = new Array(target.length).fill(null);

    // Scramble letters for the tray
    const tiles = target.split('').map((char, idx) => ({ char, origIdx: idx, used: false }));
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = tiles[i]; tiles[i] = tiles[j]; tiles[j] = tmp;
    }
    // Prevent accidental unshuffled state if word length > 1
    if (tiles.map(t => t.char).join('') === target && tiles.length > 1) {
      const tmp = tiles[0]; tiles[0] = tiles[tiles.length - 1]; tiles[tiles.length - 1] = tmp;
    }
    currentSpellingTray = tiles;

    renderSpellingBuilderUI();

    const headerBadge = document.getElementById('kidQuizHeaderBadge');
    if (headerBadge) {
      headerBadge.innerText = `🔤 Spelling Bee • Build the Word (${uncompletedItems.length} left)`;
    }
    // Pronounce clue word
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(target, 'en-US');
    }
  }

  function renderSpellingBuilderUI() {
    const clueEmoji = document.getElementById('spellingClueEmoji');
    const clueMeaning = document.getElementById('spellingClueMeaning');
    const slotsRow = document.getElementById('spellingSlotsRow');
    const trayRow = document.getElementById('spellingTilesTray');
    const toast = document.getElementById('kidQuizFeedbackToast');
    if (toast && !isSpellingResolving) toast.classList.add('hidden');

    if (clueEmoji && currentSpellingItem) clueEmoji.innerText = currentSpellingItem.emoji || '🐝';
    if (clueMeaning && currentSpellingItem) {
      if (spellingHintRevealed) {
        clueMeaning.innerText = currentSpellingItem.meaning || `Spell "${currentSpellingWord}"`;
      } else {
        clueMeaning.innerText = "Spell this word! Tap the scrambled letter tiles below.";
      }
    }

    // Render slots
    if (slotsRow) {
      const firstEmptyIdx = currentSpellingSlots.findIndex(s => s === null);
      slotsRow.innerHTML = currentSpellingSlots.map((slot, idx) => {
        if (slot) {
          return `
            <button onclick="removeSpellingSlot(${idx})" title="Tap to remove letter back to tray" class="animate-tile-pop w-11 h-13 sm:w-14 sm:h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl sm:text-3xl border-4 border-amber-500 shadow-md flex items-center justify-center cursor-pointer transition transform hover:scale-105 active:scale-95 group relative">
              <span>${slot.char}</span>
              <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">✕</span>
            </button>
          `;
        } else {
          const isNext = (idx === firstEmptyIdx);
          return `
            <div class="w-11 h-13 sm:w-14 sm:h-16 rounded-2xl border-4 ${isNext ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 animate-pulse' : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'} text-slate-400 dark:text-slate-500 font-extrabold text-2xl sm:text-3xl flex items-center justify-center select-none transition">
              _
            </div>
          `;
        }
      }).join('');
    }

    // Render tray
    if (trayRow) {
      trayRow.innerHTML = currentSpellingTray.map((tile, tIdx) => {
        if (tile.used) {
          return `
            <button disabled class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 font-black text-xl sm:text-2xl border-2 border-slate-200 dark:border-slate-700 opacity-25 pointer-events-none scale-90 flex items-center justify-center select-none transition">
              ${tile.char}
            </button>
          `;
        } else {
          return `
            <button onclick="placeSpellingTile(${tIdx})" class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xl sm:text-2xl border-b-4 border-amber-600 shadow-md active:translate-y-1 active:border-b-0 hover:scale-105 flex items-center justify-center cursor-pointer select-none transition btn-tactile">
              ${tile.char}
            </button>
          `;
        }
      }).join('');
    }
  }

  function placeSpellingTile(tIdx) {
    if (isSpellingResolving) return;
    const tile = currentSpellingTray[tIdx];
    if (!tile || tile.used) return;

    const slotIdx = currentSpellingSlots.findIndex(s => s === null);
    if (slotIdx === -1) return; // All slots full

    tile.used = true;
    currentSpellingSlots[slotIdx] = { char: tile.char, trayIdx: tIdx };
    renderSpellingBuilderUI();
    checkSpellingCompletion();
  }

  function removeSpellingSlot(slotIdx) {
    if (isSpellingResolving) return;
    const slot = currentSpellingSlots[slotIdx];
    if (!slot) return;

    if (currentSpellingTray[slot.trayIdx]) {
      currentSpellingTray[slot.trayIdx].used = false;
    }
    currentSpellingSlots[slotIdx] = null;
    renderSpellingBuilderUI();
  }

  function undoSpellingLastSlot() {
    if (isSpellingResolving) return;
    for (let i = currentSpellingSlots.length - 1; i >= 0; i--) {
      if (currentSpellingSlots[i] !== null) {
        removeSpellingSlot(i);
        return;
      }
    }
  }

  function clearSpellingSlots() {
    if (isSpellingResolving) return;
    currentSpellingSlots = new Array(currentSpellingWord.length).fill(null);
    currentSpellingTray.forEach(t => t.used = false);
    renderSpellingBuilderUI();
  }

  function giveSpellingHint() {
    if (isSpellingResolving) return;
    const target = currentSpellingWord;
    let hintSlotIdx = -1;
    for (let i = 0; i < target.length; i++) {
      if (!currentSpellingSlots[i] || currentSpellingSlots[i].char !== target[i]) {
        hintSlotIdx = i;
        break;
      }
    }
    if (hintSlotIdx === -1) return; // already complete

    if (currentSpellingSlots[hintSlotIdx]) {
      removeSpellingSlot(hintSlotIdx);
    }

    const targetChar = target[hintSlotIdx];
    let foundTrayIdx = currentSpellingTray.findIndex(t => !t.used && t.char === targetChar);
    if (foundTrayIdx === -1) {
      for (let i = hintSlotIdx + 1; i < currentSpellingSlots.length; i++) {
        if (currentSpellingSlots[i] && currentSpellingSlots[i].char === targetChar) {
          removeSpellingSlot(i);
          break;
        }
      }
      foundTrayIdx = currentSpellingTray.findIndex(t => !t.used && t.char === targetChar);
    }

    if (foundTrayIdx !== -1) {
      currentSpellingTray[foundTrayIdx].used = true;
      currentSpellingSlots[hintSlotIdx] = { char: targetChar, trayIdx: foundTrayIdx };
      renderSpellingBuilderUI();
      checkSpellingCompletion();
    }
  }

  function speakSpellingTargetWord() {
    if (currentSpellingWord && typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(currentSpellingWord, 'en-US');
    }
  }

  function checkSpellingCompletion() {
    if (currentSpellingSlots.some(s => s === null)) return;

    const assembled = currentSpellingSlots.map(s => s.char).join('');
    const target = currentSpellingWord;
    const toast = document.getElementById('kidQuizFeedbackToast');
    const slotsRow = document.getElementById('spellingSlotsRow');

    if (assembled === target) {
      isSpellingResolving = true;
      const wordLenKey = (target.length >= 7) ? 'big' : String(target.length);
      const earnedXP = (typeof window.getSectionXP === 'function')
        ? window.getSectionXP('spelling', wordLenKey)
        : 20;

      const burstCount = earnedXP >= 40 ? 120 : 85;
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: burstCount, spread: 80, origin: { y: 0.6 } });
      }

      if (slotsRow) {
        slotsRow.querySelectorAll('button').forEach(btn => {
          btn.className = "w-11 h-13 sm:w-14 sm:h-16 rounded-2xl bg-emerald-500 text-white font-black text-2xl sm:text-3xl border-4 border-emerald-600 shadow-lg flex items-center justify-center animate-bounce";
        });
      }

      if (toast) {
        toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400";
        const bonusTag = earnedXP >= 40 ? '🔥 ' : '';
        toast.innerHTML = `🎉 Super Speller! You built <strong>${target}</strong>! (${bonusTag}+${earnedXP} Stars ⭐)`;
        toast.classList.remove('hidden');
      }

      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio(`Awesome! ${target.split('').join(' ')} spells ${target.toLowerCase()}!`, 'en-US');
      }

      if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
        window.LuminaDB.recordActivity({
          type: 'spelling_bee',
          isQuestion: true,
          domain: '6+ Spelling Bee',
          title: `Build Word: ${target}`,
          xp: earnedXP,
          durationSec: 10
        });
      }
      const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
        ? window.LuminaDB.getActiveProfile()
        : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
      if (p && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
        window.LuminaDB.markQuestionCompleted(p.id, 'spelling_' + target);
      }
      if (typeof window.refreshHeaderUI === 'function') {
        window.refreshHeaderUI();
      }

      setTimeout(() => {
        generateSpellingTileRound();
      }, 1900);
    } else {
      if (!hasFailedFirstAttempt) {
        hasFailedFirstAttempt = true;
        const btnHint = document.getElementById('btnSpellingHint');
        if (btnHint) btnHint.classList.remove('hidden');
      }

      if (slotsRow) {
        slotsRow.classList.remove('animate-tile-shake');
        void slotsRow.offsetWidth;
        slotsRow.classList.add('animate-tile-shake');
        slotsRow.querySelectorAll('button').forEach(btn => {
          btn.classList.add('border-rose-400', 'bg-rose-100', 'text-rose-900');
        });
      }
      if (toast) {
        toast.className = "mt-5 p-4 rounded-2xl text-center text-base sm:text-lg font-bold bg-rose-100 text-rose-950 border-2 border-rose-300";
        toast.innerHTML = `🤔 Almost! That spells <em>${assembled}</em>. Tap a letter to fix it or tap <strong>💡 Show Hint</strong>!`;
        toast.classList.remove('hidden');
      }
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio('Not quite, check your letters!', 'en-US');
      }
    }
  }

  function handleSpellingHintClick() {
    if (isSpellingResolving) return;
    spellingHintRevealed = true;
    const clueMeaning = document.getElementById('spellingClueMeaning');
    if (clueMeaning && currentSpellingItem) {
      clueMeaning.innerText = currentSpellingItem.meaning || `Spell "${currentSpellingWord}"`;
    }
    const btnHint = document.getElementById('btnSpellingHint');
    if (btnHint) btnHint.classList.add('hidden');
    giveSpellingHint();
    if (typeof window.speakNativeAudio === 'function') {
      const clueText = currentSpellingItem ? currentSpellingItem.meaning : currentSpellingWord;
      window.speakNativeAudio(`Hint: ${clueText}`, 'en-US');
    }
  }

  window.spellingSubMode = spellingSubMode;
  window.spellingLengthFilter = spellingLengthFilter;
  window.setSpellingSubMode = setSpellingSubMode;
  window.setSpellingLengthFilter = setSpellingLengthFilter;
  window.ensureSpellingLevelBar = ensureSpellingLevelBar;
  window.getAllSpellingItems = getAllSpellingItems;
  window.getGeneratedSpellingQuizQuestions = getGeneratedSpellingQuizQuestions;
  window.handleKidNextQuizBtn = handleKidNextQuizBtn;
  window.generateSpellingTileRound = generateSpellingTileRound;
  window.renderSpellingBuilderUI = renderSpellingBuilderUI;
  window.placeSpellingTile = placeSpellingTile;
  window.removeSpellingSlot = removeSpellingSlot;
  window.undoSpellingLastSlot = undoSpellingLastSlot;
  window.clearSpellingSlots = clearSpellingSlots;
  window.giveSpellingHint = giveSpellingHint;
  window.handleSpellingHintClick = handleSpellingHintClick;
  window.resetCompletedSpellingWords = resetCompletedSpellingWords;
  window.speakSpellingTargetWord = speakSpellingTargetWord;
  window.getCurrentSpellingWord = function () { return currentSpellingWord; };
  window.getCurrentSpellingItem = function () { return currentSpellingItem; };
  window.checkSpellingCompletion = checkSpellingCompletion;
})(window);
