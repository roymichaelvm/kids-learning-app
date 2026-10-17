/**
 * Lumina Learning Hub — 6+ Little Explorer Playground
 * Covers kid category navigation, flashcards, sub-modes (letters, words, sentences),
 * picture match quiz, 4-choice cloud quizzes, and daily stickers.
 */
(function (window) {
  'use strict';

  const escapeHtml = window.escapeHtml || function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const showToast = function (msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  };

  let kidSubMode = 'words';
  let kidCardIdx = 0;
  let kidQuizIdx = 0;
  let currentKidQuizAnswer = null;
  let currentKidCloudQuestion = null;

  const ALL_KID_CATEGORIES = [
    { key: 'spelling', emoji: '🐝', name: 'Spelling Bee' },
    { key: 'comprehension', emoji: '📖', name: 'Story Reading' },
    { key: 'grammar', emoji: '✏️', name: 'Grammar' },
    { key: 'numbers', emoji: '🔢', name: 'Numbers & Math' },
    { key: 'phonics', emoji: '🔤', name: 'Sight Words' },
    { key: 'animals', emoji: '🦁', name: 'Animals' },
    { key: 'malayalam', emoji: '🌴', name: 'Malayalam' },
    { key: 'hindi', emoji: '🪔', name: 'Hindi' },
    { key: 'spanish', emoji: '🇪🇸', name: 'Spanish' }
  ];

  function setKidSubMode(mode) {
    const pack = window.multiLangData && window.multiLangData[window.appData.kidCategory];
    if (mode === 'letters' && (!pack || !pack.letters || pack.letters.length === 0)) {
      if (typeof window.showToast === 'function') {
        window.showToast("Alphabet Letters mode is available for Malayalam & Hindi!");
      }
      return;
    }
    kidSubMode = mode;
    ['letters', 'words', 'sentences'].forEach(m => {
      const btn = document.getElementById(`btn-kid-sub-${m}`);
      if (!btn) return;
      if (m === mode) {
        btn.className = "flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-bold transition bg-amber-400 text-slate-950 shadow-sm";
      } else {
        btn.className = "flex-1 py-2 px-3 rounded-2xl text-xs sm:text-sm font-bold transition text-slate-700 hover:text-slate-900";
      }
    });
    kidCardIdx = 0;
    renderKidFlashcard();
    generateKidQuizRound();
  }

  function initKidPlayground() {
    const startCat = (window.appData && window.appData.kidCategory && window.multiLangData && window.multiLangData[window.appData.kidCategory])
      ? window.appData.kidCategory
      : 'spelling';
    selectKidCategory(startCat);
    renderKidProgressSummary();
  }

  function selectKidCategory(cat) {
    if (!window.multiLangData || !window.multiLangData[cat]) cat = 'spelling';
    if (window.appData) window.appData.kidCategory = cat;
    kidCardIdx = 0;
    kidQuizIdx = 0;

    // Sub-mode pills for multilingual subjects
    const subBar = document.getElementById('kidLangSubNav');
    if (subBar) {
      if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish') {
        subBar.classList.remove('hidden');
        const pack = window.multiLangData[cat];
        const lettersBtn = document.getElementById('btn-kid-sub-letters');
        if (lettersBtn) {
          if (!pack.letters || pack.letters.length === 0) {
            lettersBtn.classList.add('opacity-40', 'cursor-not-allowed');
            if (kidSubMode === 'letters') kidSubMode = 'words';
          } else {
            lettersBtn.classList.remove('opacity-40', 'cursor-not-allowed');
          }
        }
        setKidSubMode(kidSubMode);
      } else {
        subBar.classList.add('hidden');
      }
    }

    ALL_KID_CATEGORIES.forEach(c => {
      const btn = document.getElementById(`kidCat-${c.key}`);
      if (!btn) return;
      if (c.key === cat) {
        btn.className = "kid-cat-btn p-3.5 rounded-3xl bg-amber-400 text-slate-950 font-bold text-sm shadow-kids-btn btn-tactile flex flex-col items-center justify-center gap-1 border-2 border-amber-500";
      } else {
        btn.className = "kid-cat-btn p-3.5 rounded-3xl bg-white hover:bg-amber-50 text-slate-800 font-bold text-sm shadow-kids-card btn-tactile flex flex-col items-center justify-center gap-1 border-2 border-slate-200";
      }
    });

    renderKidFlashcard();
    generateKidQuizRound();
    renderKidProgressSummary();
  }

  function getActiveKidItemList() {
    const pack = window.multiLangData[window.appData.kidCategory];
    if (kidSubMode === 'letters' && pack.letters && pack.letters.length > 0) {
      return pack.letters.map(item => ({
        emoji: item.emoji || '🔤',
        primary: `${item.char}  •  ${item.translit}`,
        meaning: `${item.word} • ${item.wordMeaning}`,
        speech: item.speech || `${item.char}. ${item.word}.`,
        rawChar: item.char
      }));
    }
    if (kidSubMode === 'sentences' && pack.sentences && pack.sentences.length > 0) {
      return pack.sentences.map(item => ({
        emoji: '💬',
        primary: item.script,
        meaning: `${item.translit}\n${item.meaning}`,
        speech: item.speech || item.script
      }));
    }
    return pack.kidItems;
  }

  function renderKidFlashcard() {
    const pack = window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    const item = items[kidCardIdx % items.length];

    const badgeEl = document.getElementById('kidLeftBadgeText');
    if (badgeEl) {
      if (kidSubMode === 'letters') {
        badgeEl.innerText = `🔤 ${pack.label} Letter Sound (Tap to Hear!)`;
      } else if (kidSubMode === 'sentences') {
        badgeEl.innerText = `💬 ${pack.label} Sentence (Tap to Hear!)`;
      } else {
        badgeEl.innerText = pack.cloudDomain ? `📚 ${pack.label} Study Card (Tap to Hear!)` : '🔊 Tap Picture to Hear!';
      }
    }
    document.getElementById('kidCardProgressText').innerText = `Card ${(kidCardIdx % items.length) + 1} of ${items.length}`;
    document.getElementById('kidCardEmoji').innerText = item.emoji;
    document.getElementById('kidCardPrimaryText').innerText = item.primary;
    document.getElementById('kidCardMeaningText').innerText = item.meaning;
  }

  function stepKidCard(delta) {
    const pack = window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    kidCardIdx = (kidCardIdx + delta + items.length) % items.length;
    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'flashcard',
        isQuestion: false,
        domain: pack.label,
        title: items[kidCardIdx].primary,
        xp: 3,
        durationSec: 4
      });
    }
    renderKidFlashcard();
    speakKidCurrentCard();
    renderKidProgressSummary();
  }

  function speakKidCurrentCard() {
    const pack = window.multiLangData[window.appData.kidCategory];
    const items = getActiveKidItemList();
    const item = items[kidCardIdx % items.length];
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(item.speech || item.primary, pack.langCode);
    }
  }

  function generateKidQuizRound() {
    const pack = window.multiLangData[window.appData.kidCategory];
    const passageBox = document.getElementById('kidQuizPassageBox');
    const promptBox = document.getElementById('kidQuizPromptBox');
    const builderZone = document.getElementById('spellingBuilderZone');
    const spellingToggle = document.getElementById('spellingModeToggle');
    const headerBadge = document.getElementById('kidQuizHeaderBadge');
    const topPrompt = document.getElementById('kidQuizTopPrompt');
    const subHint = document.getElementById('kidQuizSubHint');
    const grid = document.getElementById('kidQuizOptionsGrid');
    const feedbackToast = document.getElementById('kidQuizFeedbackToast');
    if (feedbackToast) feedbackToast.classList.add('hidden');

    // 1. Check if category is 6+ Spelling Bee
    if (window.appData.kidCategory === 'spelling') {
      if (spellingToggle) spellingToggle.classList.remove('hidden');
      if (window.spellingSubMode === 'tiles') {
        if (passageBox) passageBox.classList.add('hidden');
        if (promptBox) promptBox.classList.add('hidden');
        if (grid) grid.classList.add('hidden');
        if (builderZone) builderZone.classList.remove('hidden');
        if (typeof window.generateSpellingTileRound === 'function') {
          window.generateSpellingTileRound();
        }
        return;
      } else {
        // 4-choice quiz mode
        if (builderZone) builderZone.classList.add('hidden');
        if (promptBox) promptBox.classList.remove('hidden');
        if (grid) grid.classList.remove('hidden');
      }
    } else {
      if (spellingToggle) spellingToggle.classList.add('hidden');
      if (builderZone) builderZone.classList.add('hidden');
      if (promptBox) promptBox.classList.remove('hidden');
      if (grid) grid.classList.remove('hidden');
    }

    // Check if this category has structured 4-choice questions in Cloud Firestore
    const cloudQs = (pack.cloudDomain && typeof window.getKidQuestionsByDomain === 'function')
      ? window.getKidQuestionsByDomain(pack.cloudDomain)
      : [];

    if (cloudQs.length > 0) {
      currentKidQuizAnswer = null;
      // Zero-repeat non-repeating queue from deck!
      const qItem = (typeof window.getNextFromDeck === 'function')
        ? window.getNextFromDeck('kid_cloud_' + window.appData.kidCategory, cloudQs, q => q.id)
        : cloudQs[Math.floor(Math.random() * cloudQs.length)];

      currentKidCloudQuestion = qItem;
      const qObj = qItem.question || {};

      if (headerBadge) {
        headerBadge.innerText = `${pack.label} • Question Challenge`;
      }
      if (qObj.paragraph && qObj.paragraph !== 'null') {
        passageBox.classList.remove('hidden');
        passageBox.innerHTML = `
          <div class="flex items-center gap-2 mb-2 pb-1 border-b border-amber-200/60 text-xs font-bold text-amber-900 select-none">
            <span>💡</span>
            <span>Tap any word to see its meaning &amp; hear it spoken!</span>
          </div>
          <div>${typeof window.renderInteractiveText === 'function' ? window.renderInteractiveText(qObj.paragraph) : escapeHtml(qObj.paragraph)}</div>
        `;
      } else {
        passageBox.classList.add('hidden');
        passageBox.innerText = '';
      }

      if (topPrompt) topPrompt.innerText = 'Read or Listen & Pick the Best Answer:';
      const targetLabel = document.getElementById('kidQuizTargetLabel');
      targetLabel.className = "text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 leading-snug";
      targetLabel.innerHTML = (typeof window.renderInteractiveText === 'function')
        ? window.renderInteractiveText(qObj.question || '')
        : escapeHtml(qObj.question || '');
      subHint.innerText = 'Tap A, B, C, or D below!';

      const choices = qObj.choices || {};
      grid.innerHTML = ['A', 'B', 'C', 'D'].filter(k => choices[k]).map(letter => `
        <button id="kid-cloud-opt-${letter}" onclick="checkKidCloudQuizAnswer('${letter}')" class="p-4 sm:p-5 rounded-3xl bg-white hover:bg-sky-50 border-4 border-slate-200 hover:border-sky-400 shadow-kids-card btn-tactile flex items-center gap-3.5 text-left transition">
          <span class="w-10 h-10 rounded-2xl bg-sky-100 text-sky-900 font-extrabold text-lg flex items-center justify-center shrink-0 border-2 border-sky-200">${letter}</span>
          <span class="text-base sm:text-lg font-bold text-slate-800 leading-snug">${escapeHtml(choices[letter])}</span>
        </button>
      `).join('');
      return;
    }

    // Otherwise: Interactive Picture / Letter / Sentence Match Game (Zero-Repeat Target Deck)
    currentKidCloudQuestion = null;
    passageBox.classList.add('hidden');
    if (headerBadge) {
      headerBadge.innerText = kidSubMode === 'letters' ? '🔤 Letter Sound Match!' : (kidSubMode === 'sentences' ? '💬 Sentence Match Game!' : '🎮 Find the Match Game!');
    }
    if (topPrompt) topPrompt.innerText = 'Can you tap:';
    const targetLabel = document.getElementById('kidQuizTargetLabel');
    targetLabel.className = "text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1";

    const items = getActiveKidItemList();
    // Zero-repeat target selection from shuffled deck!
    const target = (typeof window.getNextFromDeck === 'function')
      ? window.getNextFromDeck('kid_target_' + window.appData.kidCategory + '_' + kidSubMode, items, i => i.primary)
      : items[Math.floor(Math.random() * items.length)];

    currentKidQuizAnswer = target;

    targetLabel.innerText = target.primary;
    subHint.innerText = `Hint: ${target.meaning.split('\n')[0]}`;

    // Guarantee 4 unique, non-overlapping choices without accidental repeats
    let pool = [target];
    const otherItems = items.filter(i => i.primary !== target.primary).sort(() => Math.random() - 0.5);
    for (const candidate of otherItems) {
      if (pool.length >= Math.min(4, items.length)) break;
      if (!pool.some(p => p.primary === candidate.primary)) {
        pool.push(candidate);
      }
    }
    pool.sort(() => Math.random() - 0.5);

    grid.innerHTML = pool.map((opt, idx) => `
      <button onclick="checkKidQuizSelection(${idx})" data-primary="${escapeHtml(opt.primary)}" class="kid-pic-opt p-5 rounded-3xl bg-white hover:bg-sky-50 border-4 border-slate-200 hover:border-sky-400 shadow-kids-card btn-tactile flex flex-col items-center justify-center gap-2 transition">
        <span class="text-5xl sm:text-6xl">${opt.emoji}</span>
        <span class="text-base font-bold text-slate-800 text-center leading-snug">${escapeHtml(opt.meaning.split('\n')[0])}</span>
      </button>
    `).join('');
    window._currentKidPool = pool;
  }

  function speakKidQuizPrompt() {
    if (window.appData.kidCategory === 'spelling' && window.spellingSubMode === 'tiles') {
      if (typeof window.speakSpellingTargetWord === 'function') window.speakSpellingTargetWord();
      return;
    }
    const pack = window.multiLangData[window.appData.kidCategory];
    if (currentKidCloudQuestion && currentKidCloudQuestion.question) {
      const qObj = currentKidCloudQuestion.question;
      const p = (qObj.paragraph && qObj.paragraph !== 'null') ? (qObj.paragraph + '. ') : '';
      const c = qObj.choices || {};
      const optsText = ['A', 'B', 'C', 'D'].filter(k => c[k]).map(k => `Option ${k}: ${c[k]}`).join('. ');
      if (typeof window.speakNativeAudio === 'function') {
        window.speakNativeAudio(`${p}${qObj.question}. ${optsText}`, 'en-US');
      }
      return;
    }
    if (!currentKidQuizAnswer) return;
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(currentKidQuizAnswer.speech || currentKidQuizAnswer.primary, pack.langCode);
    }
  }

  function checkKidCloudQuizAnswer(chosenLetter) {
    if (!currentKidCloudQuestion || !currentKidCloudQuestion.question) return;
    const pack = window.multiLangData[window.appData.kidCategory];
    const qObj = currentKidCloudQuestion.question;
    const correctLetter = qObj.correct_answer;
    const isCorrect = (chosenLetter === correctLetter);
    const toast = document.getElementById('kidQuizFeedbackToast');
    toast.classList.remove('hidden');

    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'kid_quiz',
        domain: pack.label,
        title: qObj.question || currentKidCloudQuestion.id,
        isCorrect: isCorrect,
        xp: isCorrect ? 20 : 5,
        durationSec: 10,
        detail: `Answered ${chosenLetter} (${(qObj.choices && qObj.choices[chosenLetter]) || ''})`
      });
    }

    ['A', 'B', 'C', 'D'].forEach(letter => {
      const btn = document.getElementById(`kid-cloud-opt-${letter}`);
      if (!btn) return;
      if (letter === correctLetter) {
        btn.className = "p-4 sm:p-5 rounded-3xl bg-emerald-100 border-4 border-emerald-500 shadow-kids-card flex items-center gap-3.5 text-left transition";
      } else if (letter === chosenLetter && !isCorrect) {
        btn.className = "p-4 sm:p-5 rounded-3xl bg-amber-100 border-4 border-amber-400 shadow-kids-card flex items-center gap-3.5 text-left transition";
      }
    });

    if (isCorrect) {
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
      }
      toast.className = "mt-5 p-4 rounded-2xl text-left text-base sm:text-lg font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400";
      toast.innerHTML = `<div class="flex items-center justify-between gap-2 mb-1"><span>🌟 SUPER STAR! +20 XP!</span><button onclick="generateKidQuizRound()" class="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-bold">Next Question ➡️</button></div><p class="text-sm font-semibold text-emerald-900">${escapeHtml(qObj.explanation || '')}</p>`;
    } else {
      toast.className = "mt-5 p-4 rounded-2xl text-left text-base sm:text-lg font-bold bg-amber-100 text-amber-950 border-2 border-amber-400";
      toast.innerHTML = `<div>😊 Good try! The right answer is <strong>${escapeHtml(correctLetter)}: ${escapeHtml((qObj.choices && qObj.choices[correctLetter]) || '')}</strong> (+5 XP for trying!)</div><p class="text-sm font-semibold text-amber-900 mt-1">${escapeHtml(qObj.explanation || '')}</p>`;
    }
  }

  function checkKidQuizSelection(poolIdx) {
    const pack = window.multiLangData[window.appData.kidCategory];
    const chosen = (window._currentKidPool && window._currentKidPool[poolIdx]) || null;
    const chosenPrimary = chosen ? chosen.primary : '';
    const isCorrect = (chosenPrimary === currentKidQuizAnswer.primary);
    const toast = document.getElementById('kidQuizFeedbackToast');
    toast.classList.remove('hidden');

    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'kid_quiz',
        domain: pack.label,
        title: currentKidQuizAnswer.primary,
        isCorrect: isCorrect,
        xp: isCorrect ? 15 : 3,
        durationSec: 6,
        detail: currentKidQuizAnswer.meaning
      });
    }
    renderKidProgressSummary();

    if (isCorrect) {
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      }
      toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-emerald-100 text-emerald-900 border-2 border-emerald-400";
      toast.innerText = "🌟 YAY! You got it right! +15 Stars!";
      setTimeout(generateKidQuizRound, 1600);
    } else {
      toast.className = "mt-5 p-4 rounded-2xl text-center text-lg font-bold bg-amber-100 text-amber-900 border-2 border-amber-400";
      toast.innerText = "😊 Almost! Try tapping another picture!";
    }
  }

  function renderKidProgressSummary() {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    if (!p) return;
    const el = document.getElementById('kidProgressSummaryGrid');
    if (!el || !window.multiLangData) return;
    el.innerHTML = ALL_KID_CATEGORIES.map(c => {
      const label = window.multiLangData[c.key]?.label || c.name;
      const m = (p.domainMastery && p.domainMastery[label]) || { attempted: 0, correct: 0, cardsViewed: 0 };
      return `
        <div onclick="selectKidCategory('${c.key}')" class="p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border-2 border-amber-200 text-center cursor-pointer transition">
          <div class="text-2xl mb-1">${c.emoji}</div>
          <div class="font-bold text-slate-900 text-xs">${c.name}</div>
          <div class="text-[11px] font-bold text-amber-800 mt-1">⭐ ${m.correct || 0} • 🃏 ${m.cardsViewed || 0}</div>
        </div>
      `;
    }).join('');
  }

  window.ALL_KID_CATEGORIES = ALL_KID_CATEGORIES;
  window.kidSubMode = kidSubMode;
  window.setKidSubMode = setKidSubMode;
  window.initKidPlayground = initKidPlayground;
  window.selectKidCategory = selectKidCategory;
  window.getActiveKidItemList = getActiveKidItemList;
  window.renderKidFlashcard = renderKidFlashcard;
  window.stepKidCard = stepKidCard;
  window.speakKidCurrentCard = speakKidCurrentCard;
  window.generateKidQuizRound = generateKidQuizRound;
  window.speakKidQuizPrompt = speakKidQuizPrompt;
  window.checkKidCloudQuizAnswer = checkKidCloudQuizAnswer;
  window.checkKidQuizSelection = checkKidQuizSelection;
  window.renderKidProgressSummary = renderKidProgressSummary;
})(window);
