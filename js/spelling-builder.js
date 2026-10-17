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

  function setSpellingSubMode(mode) {
    spellingSubMode = mode;
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

  function generateSpellingTileRound() {
    isSpellingResolving = false;
    const pack = window.multiLangData && window.multiLangData.spelling;
    if (!pack) return;
    const items = pack.kidItems || [];
    if (items.length === 0) return;

    // Zero-repeat non-repeating deck queue
    const item = (typeof window.getNextFromDeck === 'function')
      ? window.getNextFromDeck('spelling_tiles_deck', items, i => i.primary)
      : items[Math.floor(Math.random() * items.length)];

    currentSpellingItem = item;
    const target = (item.primary || '').replace(/[^A-Za-z]/g, '').toUpperCase();
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
      headerBadge.innerText = `🔤 Spelling Bee • Build the Word`;
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
    if (clueMeaning && currentSpellingItem) clueMeaning.innerText = currentSpellingItem.meaning || `Spell "${currentSpellingWord}"`;

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
            <div class="w-11 h-13 sm:w-14 sm:h-16 rounded-2xl border-4 ${isNext ? 'border-amber-400 bg-amber-50/80 animate-pulse' : 'border-dashed border-slate-300 bg-slate-50/60'} text-slate-400 font-extrabold text-2xl sm:text-3xl flex items-center justify-center select-none transition">
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
            <button disabled class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-100 text-slate-300 font-black text-xl sm:text-2xl border-2 border-slate-200 opacity-25 pointer-events-none scale-90 flex items-center justify-center select-none transition">
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
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 85, spread: 80, origin: { y: 0.6 } });
      }

      if (slotsRow) {
        slotsRow.querySelectorAll('button').forEach(btn => {
          btn.className = "w-11 h-13 sm:w-14 sm:h-16 rounded-2xl bg-emerald-500 text-white font-black text-2xl sm:text-3xl border-4 border-emerald-600 shadow-lg flex items-center justify-center animate-bounce";
        });
      }

      if (toast) {
        toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400";
        toast.innerHTML = `🎉 Super Speller! You built <strong>${target}</strong>! (+20 Stars ⭐)`;
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
          xp: 20,
          durationSec: 10
        });
      }
      if (typeof window.refreshHeaderUI === 'function') {
        window.refreshHeaderUI();
      }

      setTimeout(() => {
        generateSpellingTileRound();
      }, 1900);
    } else {
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
        toast.innerHTML = `🤔 Almost! That spells <em>${assembled}</em>. Tap a letter to fix it or tap <strong>💡 Hint</strong>!`;
        toast.classList.remove('hidden');
      }
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio('Not quite, check your letters!', 'en-US');
      }
    }
  }

  window.spellingSubMode = spellingSubMode;
  window.setSpellingSubMode = setSpellingSubMode;
  window.handleKidNextQuizBtn = handleKidNextQuizBtn;
  window.generateSpellingTileRound = generateSpellingTileRound;
  window.renderSpellingBuilderUI = renderSpellingBuilderUI;
  window.placeSpellingTile = placeSpellingTile;
  window.removeSpellingSlot = removeSpellingSlot;
  window.undoSpellingLastSlot = undoSpellingLastSlot;
  window.clearSpellingSlots = clearSpellingSlots;
  window.giveSpellingHint = giveSpellingHint;
  window.speakSpellingTargetWord = speakSpellingTargetWord;
  window.checkSpellingCompletion = checkSpellingCompletion;
})(window);
