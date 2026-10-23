/**
 * Lumina Learning Hub — Core Application Logic, Multi-Profile Engine & State Coordinator
 */
(function (window) {
  'use strict';

  // Curriculum & Language Data loaded from external JSON (data/curriculum.json via js/seed-data.js)
  const multiLangData = window.multiLangData || {};

  /* =====================================================================
     STATE, KID PROFILES & FIREBASE PERSISTENCE
     ===================================================================== */
  if (window.LuminaDB && typeof window.LuminaDB.init === 'function') {
    window.LuminaDB.init();
  }
  const appData = (window.LuminaDB && window.LuminaDB.state) || {};
  let selectedCalendarDateKey = (window.LuminaDB && typeof window.LuminaDB.getTodayDateKey === 'function')
    ? window.LuminaDB.getTodayDateKey()
    : new Date().toISOString().slice(0, 10);

  function activeProfile() {
    return (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : {};
  }

  function isTeenProfile(p) {
    return (p || activeProfile()).ageGroup !== 'kid';
  }

  function getQuestionSignature(item) {
    if (!item) return '';
    if (item.id) return item.id;
    if (!item.question) return '';
    const p = String(item.question.paragraph || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const q = String(item.question.question || '').replace(/\s+/g, ' ').trim().toLowerCase();
    return `${item.domain || ''}::${p}::${q}`;
  }

  function getTeenQuestions(includeCompleted = false) {
    const p = activeProfile();
    const completed = new Set((p && p.completedQuestionIds) || []);
    const all = dedupeQuestionsList((appData.questions || []).filter(q => (q.targetProfile || 'teen') !== 'kid'));
    if (includeCompleted) return all;
    return all.filter(q => !completed.has(q.id) && !completed.has(getQuestionSignature(q)));
  }

  function getKidQuestionsByDomain(domainName, includeCompleted = false) {
    const p = activeProfile();
    const completed = new Set((p && p.completedQuestionIds) || []);
    let combined = (appData.questions || []).filter(q => q.targetProfile === 'kid' && q.domain === domainName);

    if (domainName === '6+ Spelling Bee' && typeof window.getGeneratedSpellingQuizQuestions === 'function') {
      combined = combined.concat(window.getGeneratedSpellingQuizQuestions());
    }
    if (domainName === '6+ Numbers & Math' && typeof window.getGeneratedMathQuestions === 'function') {
      combined = combined.concat(window.getGeneratedMathQuestions('all'));
    }

    let all = dedupeQuestionsList(combined);

    // Apply active Spelling Bee word-length filter in Multiple Choice Quiz mode too
    if (domainName === '6+ Spelling Bee' && window.spellingLengthFilter && window.spellingLengthFilter !== 'all') {
      const f = window.spellingLengthFilter;
      all = all.filter(q => {
        const correctChoice = q.question && q.question.choices && q.question.choices[q.question.correct_answer];
        const len = q.wordLength || (correctChoice ? String(correctChoice).replace(/[^A-Za-z]/g, '').length : 0);
        if (f === 'big') return len >= 7;
        return len === Number(f);
      });
    }

    // Apply active Numbers & Math operation filter (addition, subtraction, multiplication, division)
    if (domainName === '6+ Numbers & Math' && window.mathOpFilter && window.mathOpFilter !== 'all') {
      const op = window.mathOpFilter;
      all = all.filter(q => {
        if (q.mathOp) return q.mathOp === op;
        const txt = ((q.question && q.question.question) || '') + ' ' + ((q.question && q.question.paragraph) || '');
        if (op === 'addition') return txt.includes('+') || /add|more|sum|total|altogether/i.test(txt);
        if (op === 'subtraction') return txt.includes('-') || /minus|left|take away|flew away/i.test(txt);
        if (op === 'multiplication') return txt.includes('×') || /times|groups of/i.test(txt);
        if (op === 'division') return txt.includes('÷') || /divide|share.*equally/i.test(txt);
        return false;
      });
    }

    if (includeCompleted) return all;
    return all.filter(q => !completed.has(q.id) && !completed.has(getQuestionSignature(q)));
  }

  function saveState() {
    if (window.LuminaDB && typeof window.LuminaDB.saveLocal === 'function') {
      window.LuminaDB.saveLocal();
    }
  }

  // Deduplicate any question array by normalized paragraph+question or question+choiceA
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

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function showToast(message) {
    const t = document.createElement('div');
    t.className = "fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-bold flex items-center gap-2.5 animate-fade";
    t.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  function mergeCustomKidCards() {
    (appData.customKidCards || []).forEach(card => {
      const cat = card.category && multiLangData[card.category] ? card.category : 'phonics';
      const exists = multiLangData[cat].kidItems.some(i => i.primary === card.primary);
      if (!exists) multiLangData[cat].kidItems.push(card);
    });
  }

  /**
   * Hydrates multiLangData from Firestore-synced / localStorage-cached language packs,
   * with seamless fallback to js/seed-data.js if not yet cached.
   */
  function mergeLanguagePacksFromDB() {
    const seedPacks = window.EXPANDED_LANGUAGE_PACKS || {};
    const dbPacks = (window.LuminaDB && window.LuminaDB.state && window.LuminaDB.state.languagePacks) || {};

    ['malayalam', 'hindi', 'spanish', 'french', 'italian'].forEach(lang => {
      if (!multiLangData[lang]) return;
      const target = multiLangData[lang];
      if (!target.sentences) target.sentences = [];
      if (!target.kidItems) target.kidItems = [];
      if (!target.teenCards) target.teenCards = [];
      if (!target.teenQuiz) target.teenQuiz = [];
      if (!target.teenSentenceQuiz) target.teenSentenceQuiz = [];

      const seed = seedPacks[lang] || {};
      const db = dbPacks[lang] || {};

      // 1. Merge seed words & db words into kidItems
      [seed.words, db.words].forEach(wordsList => {
        if (Array.isArray(wordsList)) {
          wordsList.forEach(w => {
            const exists = target.kidItems.some(i => i.primary === w.primary);
            if (!exists) {
              target.kidItems.push({
                emoji: w.emoji || '📖',
                primary: w.primary,
                meaning: w.meaning,
                speech: w.speech || w.primary
              });
            }
          });
        }
      });

      // 2. Merge seed sentences & db sentences into sentences
      [seed.sentences, db.sentences].forEach(sentencesList => {
        if (Array.isArray(sentencesList)) {
          sentencesList.forEach(s => {
            const exists = target.sentences.some(i => i.script === s.script);
            if (!exists) {
              target.sentences.push({
                script: s.script,
                translit: s.translit || '',
                meaning: s.meaning,
                speech: s.speech || s.script
              });
            }
          });
        }
      });

      // 3. Merge words into teenCards
      [seed.words, db.words].forEach(wordsList => {
        if (Array.isArray(wordsList)) {
          wordsList.forEach(w => {
            const cleanScript = (w.primary || '').split('(')[0].trim();
            const translit = ((w.primary || '').match(/\(([^)]+)\)/) || ['', ''])[1];
            const exists = target.teenCards.some(i => i.script === cleanScript || i.script === w.primary);
            if (!exists && cleanScript) {
              target.teenCards.push({
                script: cleanScript,
                translit: translit,
                meaning: w.meaning,
                example: `${w.primary} — ${w.meaning}`
              });
            }
          });
        }
      });

      // 4. Merge vocabulary quiz items into teenQuiz
      [seed.words, db.words].forEach(wordsList => {
        if (Array.isArray(wordsList)) {
          wordsList.forEach(w => {
            const cleanScript = (w.primary || '').split('(')[0].trim();
            const translit = ((w.primary || '').match(/\(([^)]+)\)/) || ['', ''])[1];
            const qText = `What is the English meaning of '${cleanScript}${translit ? " (" + translit + ")" : ""}'?`;
            const exists = target.teenQuiz.some(q => q.q === qText);
            if (!exists && cleanScript) {
              const distractors = (seed.words || [])
                .filter(other => other.meaning !== w.meaning)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map(other => other.meaning.split('/')[0].trim());
              if (distractors.length === 3) {
                const choices = [w.meaning.split('/')[0].trim(), ...distractors].sort(() => Math.random() - 0.5);
                const answerIdx = choices.indexOf(w.meaning.split('/')[0].trim());
                target.teenQuiz.push({
                  q: qText,
                  choices: choices,
                  answer: answerIdx
                });
              }
            }
          });
        }
      });

      // 5. Merge sentence quiz items into teenSentenceQuiz
      if (Array.isArray(target.sentences) && target.sentences.length >= 4) {
        target.sentences.forEach((s, idx) => {
          const qText1 = `What is the English meaning of: '${s.script}'?`;
          if (!target.teenSentenceQuiz.some(q => q.q === qText1)) {
            const distractors = target.sentences
              .filter((_, i) => i !== idx)
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map(o => o.meaning);
            if (distractors.length === 3) {
              const choices = [s.meaning, ...distractors].sort(() => Math.random() - 0.5);
              target.teenSentenceQuiz.push({
                q: qText1,
                choices: choices,
                answer: choices.indexOf(s.meaning),
                script: s.script,
                translit: s.translit
              });
            }
          }

          const qText2 = `Which ${target.label.split(' ')[0]} sentence means: "${s.meaning}"?`;
          if (!target.teenSentenceQuiz.some(q => q.q === qText2)) {
            const distractors = target.sentences
              .filter((_, i) => i !== idx)
              .sort(() => Math.random() - 0.5)
              .slice(0, 3)
              .map(o => o.script);
            if (distractors.length === 3) {
              const choices = [s.script, ...distractors].sort(() => Math.random() - 0.5);
              target.teenSentenceQuiz.push({
                q: qText2,
                choices: choices,
                answer: choices.indexOf(s.script),
                script: s.script,
                translit: s.translit
              });
            }
          }
        });
      }
    });
  }

  async function manualCloudSync() {
    showToast("Syncing with Firebase Cloud Firestore...");
    if (window.LuminaDB) {
      await window.LuminaDB.pushToCloud();
      const res = await window.LuminaDB.pullFromCloud();
      if (res.ok) {
        showToast("Cloud sync complete!");
        mergeLanguagePacksFromDB();
        applyActiveProfileView();
      } else {
        showToast(res.error || "Saved locally on this device.");
      }
    }
  }

  function refreshHeaderUI() {
    const p = activeProfile();
    const streakEl = document.getElementById('headerStreakCount');
    if (streakEl && window.LuminaDB) streakEl.innerText = window.LuminaDB.getCurrentStreak(p);

    const xpEl = document.getElementById('headerXPCount');
    if (xpEl) {
      const avail = (window.LuminaDB && typeof window.LuminaDB.getAvailableXp === 'function')
        ? window.LuminaDB.getAvailableXp(p)
        : (p.xp || 0);
      xpEl.innerText = avail.toLocaleString();
    }

    const cashEl = document.getElementById('headerRewardsCashText');
    if (cashEl) cashEl.innerText = `$${(p.cashBalance || 0).toFixed(2)}`;

    const qCount = getTeenQuestions().length;
    const totalQEl = document.getElementById('totalQuestionsCounter');
    if (totalQEl) totalQEl.innerText = qCount;

    const teenHeroQEl = document.getElementById('teenHeroQuestionCount');
    if (teenHeroQEl) teenHeroQEl.innerText = `${qCount} Questions Active`;

    const teenHeroGreetEl = document.getElementById('teenHeroGreeting');
    if (teenHeroGreetEl) teenHeroGreetEl.innerText = `Welcome back, ${p.name || 'Scholar'}! Ready to crush your SAT timing & language goals?`;

    renderCloudStatus();
    renderProfileSwitcher();
    renderTodayStrip();
    updateFamilyAuthUI();
  }

  function renderCloudStatus() {
    const map = {
      connected: ['bg-emerald-400', 'Firebase Connected'],
      syncing: ['bg-sky-400 animate-pulse', 'Syncing…'],
      error: ['bg-rose-500', 'Sync Issue'],
      local: ['bg-amber-400', 'Local Mode']
    };
    const [cls, label] = map[appData.cloudStatus] || map.local;
    const dot = document.getElementById('cloudStatusDot');
    const text = document.getElementById('cloudStatusText');
    const pill = document.getElementById('cloudStatusPill');
    if (dot) dot.className = `w-2 h-2 rounded-full ${cls}`;
    if (text) text.innerText = label;
    if (pill) pill.title = appData.cloudMessage || label;
  }

  function renderProfileSwitcher() {
    const container = document.getElementById('profileSwitcher');
    if (!container || !window.LuminaDB) return;
    const activeId = appData.activeProfileId;
    // Friend Preview: the quick bar lists only the two preview profiles.
    let switcherProfiles = window.LuminaDB.getAllProfiles();
    if (isPreviewMode() && window.LuminaDB.isPreviewProfile) {
      switcherProfiles = switcherProfiles.filter(p => window.LuminaDB.isPreviewProfile(p));
    }
    container.innerHTML = switcherProfiles.map(p => {
      const active = p.id === activeId;
      const activeCls = p.ageGroup === 'kid' 
        ? 'bg-amber-400 text-slate-950 shadow-xs' 
        : 'bg-white dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-200 shadow-xs border border-indigo-200 dark:border-indigo-700';
      return `
        <button onclick="switchProfile('${p.id}')" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${active ? activeCls : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}">
          <span class="text-sm">${escapeHtml(p.avatar)}</span>
          <span>${escapeHtml(p.name)}</span>
        </button>`;
    }).join('');
  }

  function renderTodayStrip() {
    const container = document.getElementById('todayProgressStrip');
    if (!container || !window.LuminaDB) return;
    const p = activeProfile();
    const days = window.LuminaDB.getLastNDaysSummary(p.id, 7);
    const today = days[days.length - 1];
    const mins = Math.floor((today.secondsSpent || 0) / 60);
    const qPct = Math.min(100, Math.round((today.questionsAttempted / (p.dailyGoalQuestions || 10)) * 100));
    const mPct = Math.min(100, Math.round((mins / (p.dailyGoalMinutes || 15)) * 100));
    const acc = today.questionsAttempted ? Math.round((today.questionsCorrect / today.questionsAttempted) * 100) : null;
    const goalMet = qPct >= 100 && mPct >= 100;
    const kid = p.ageGroup === 'kid';
    const maxQ = Math.max(1, ...days.map(d => d.questionsAttempted));

    container.innerHTML = `
      <div class="bg-white dark:bg-slate-900 rounded-3xl border ${kid ? 'border-amber-200 dark:border-amber-900/50' : 'border-slate-200/80 dark:border-slate-800'} shadow-bento p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${kid ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300'} flex items-center justify-center text-2xl shrink-0">${escapeHtml(p.avatar)}</div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">${escapeHtml(p.name)}'s Daily Activity Goal</p>
            <p class="font-extrabold text-slate-900 dark:text-slate-100 leading-tight">${goalMet ? '🏆 All daily goals completed!' : `Keep going, ${escapeHtml(p.name)}!`}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">${acc === null ? 'No questions answered yet today' : `Accuracy today: ${acc}% (${today.questionsCorrect}/${today.questionsAttempted})`} • ⚡ ${(today.xpEarned || 0) >= 0 ? '+' : ''}${today.xpEarned || 0} XP today</p>
          </div>
        </div>
        <div class="md:col-span-3">
          <div class="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"><span>📝 Questions Goal</span><span class="font-mono text-slate-900 dark:text-slate-100">${today.questionsAttempted} / ${p.dailyGoalQuestions || 10}</span></div>
          <div class="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div class="h-full rounded-full bg-indigo-500 transition-all" style="width:${qPct}%"></div></div>
        </div>
        <div class="md:col-span-3">
          <div class="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1"><span>⏱️ Active Time Goal</span><span class="font-mono text-slate-900 dark:text-slate-100">${mins} / ${p.dailyGoalMinutes || 15} min</span></div>
          <div class="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${mPct}%"></div></div>
        </div>
        <div class="md:col-span-2 flex items-end justify-between gap-1 h-12" title="Questions answered over the last 7 days">
          ${days.map(d => `
            <div class="flex-1 flex flex-col items-center gap-0.5" title="${d.label}: ${d.questionsAttempted} questions">
              <div class="w-full rounded-md ${d.isToday ? 'bg-indigo-600' : (d.questionsAttempted > 0 ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-slate-200 dark:bg-slate-800')}" style="height:${Math.max(4, Math.round((d.questionsAttempted / maxQ) * 32))}px"></div>
              <span class="text-[9px] font-bold text-slate-400">${d.shortDay.slice(0, 2)}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function trackActivity(opts) {
    const p = activeProfile();
    const before = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0].questionsAttempted;
    window.LuminaDB.recordActivity(opts);
    if (opts.questionId && opts.isCorrect && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
      window.LuminaDB.markQuestionCompleted(p.id, opts.questionId);
    }
    const after = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0].questionsAttempted;
    if (before < (p.dailyGoalQuestions || 10) && after >= (p.dailyGoalQuestions || 10)) {
      setTimeout(() => {
        if (typeof window.confetti === 'function') {
          window.confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 } });
        }
        showToast(`🏆 Daily goal reached, ${p.name}! ${p.dailyGoalQuestions} questions done today!`);
      }, 700);
    }
    refreshHeaderUI();
  }

  // Active study time heartbeat (adds 15s every 15s while child is actively interacting)
  let lastInteractionAt = Date.now();
  let pickerOpen = false;
  ['click', 'keydown', 'touchstart', 'scroll'].forEach(evt =>
    window.addEventListener(evt, () => { lastInteractionAt = Date.now(); }, { passive: true })
  );
  setInterval(() => {
    const recentlyActive = Date.now() - lastInteractionAt < 90000;
    if (document.visibilityState === 'visible' && recentlyActive && !pickerOpen) {
      if (window.LuminaDB) window.LuminaDB.addStudySeconds(15);
    }
  }, 15000);

  function showProfilePicker() {
    const signedIn = window.LuminaDB && window.LuminaDB.getCurrentUser && window.LuminaDB.getCurrentUser();
    if (!signedIn && !isPreviewMode()) {
      updateFamilyAuthUI();
      return;
    }
    pickerOpen = true;
    const grid = document.getElementById('profilePickerGrid');
    if (!grid || !window.LuminaDB) return;
    // Friend Preview: guests only ever see the two preview profiles.
    // The family's own profiles appear only after a real sign-in.
    let visibleProfiles = window.LuminaDB.getAllProfiles();
    if (isPreviewMode() && window.LuminaDB.isPreviewProfile) {
      visibleProfiles = visibleProfiles.filter(p => window.LuminaDB.isPreviewProfile(p));
    }
    grid.innerHTML = visibleProfiles.map(p => {
      const today = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0];
      return `
        <button onclick="switchProfile('${p.id}')" class="p-6 rounded-3xl border-4 ${p.ageGroup === 'kid' ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50' : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'} btn-tactile transition flex flex-col items-center gap-2">
          <span class="text-6xl">${escapeHtml(p.avatar)}</span>
          <span class="font-extrabold text-xl text-slate-900 dark:text-slate-100 font-kids">${escapeHtml(p.name)}</span>
          <span class="text-xs font-bold text-slate-600 dark:text-slate-400">${escapeHtml(p.ageLabel || '')}</span>
          <span class="text-xs font-bold px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 mt-1">
            🔥 ${window.LuminaDB.getCurrentStreak(p)}d streak • 📝 ${today.questionsAttempted}/${p.dailyGoalQuestions} today
          </span>
        </button>
      `;
    }).join('');
    document.getElementById('profilePickerOverlay').classList.remove('hidden');
  }

  function hideProfilePicker() {
    pickerOpen = false;
    const overlay = document.getElementById('profilePickerOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  /* =====================================================================
     THEME CONTROLLER (DARK / LIGHT THEME TOGGLE)
     ===================================================================== */
  function initTheme() {
    const saved = localStorage.getItem('lumina_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('lumina_theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
    if (typeof window.showToast === 'function') {
      window.showToast(isDark ? '🌙 Dark theme enabled' : '☀️ Light theme enabled');
    }
  }

  function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const icons = document.querySelectorAll('.theme-toggle-icon');
    icons.forEach(el => {
      el.textContent = isDark ? '☀️' : '🌙';
    });
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.title = isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme';
    });
  }

  /* =====================================================================
     PROFILE PIN AUTHENTICATION & SWITCHER ENGINE
     ===================================================================== */
  let pendingSwitchProfileId = null;
  let enteredPinBuffer = '';

  function switchProfile(profileId) {
    const cur = activeProfile();
    if (cur && cur.id === profileId) {
      hideProfilePicker();
      return;
    }
    hideProfilePicker();
    // Friend Preview profiles have no PIN - guests switch instantly.
    const target = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(profileId)
      : null;
    if (target && window.LuminaDB.isPreviewProfile && window.LuminaDB.isPreviewProfile(target)) {
      completeProfileSwitch(profileId);
      refreshPreviewBanner();
      return;
    }
    // In Friend Preview, family profiles stay locked away - even if this
    // device still holds a family sign-in session underneath.
    if (isPreviewMode()) {
      showToast('Sign in to use family profiles, or keep exploring the preview.');
      return;
    }
    promptProfilePin(profileId);
  }

  function promptProfilePin(profileId) {
    const p = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(profileId)
      : null;
    if (!p) return;

    pendingSwitchProfileId = profileId;
    enteredPinBuffer = '';

    const modal = document.getElementById('profilePinModal');
    if (!modal) {
      // Fallback if modal not in DOM: switch immediately
      completeProfileSwitch(profileId);
      return;
    }

    const nameEl = document.getElementById('pinModalProfileName');
    const avatarEl = document.getElementById('pinModalProfileAvatar');
    const errorEl = document.getElementById('pinModalError');
    if (nameEl) nameEl.textContent = p.name;
    if (avatarEl) avatarEl.textContent = p.avatar;
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }

    updatePinDots();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeProfilePinModal() {
    const modal = document.getElementById('profilePinModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    pendingSwitchProfileId = null;
    enteredPinBuffer = '';
  }

  function updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pinDot${i}`);
      if (dot) {
        if (i < enteredPinBuffer.length) {
          dot.classList.add('bg-indigo-600', 'scale-110');
          dot.classList.remove('bg-slate-200', 'dark:bg-slate-700');
        } else {
          dot.classList.remove('bg-indigo-600', 'scale-110');
          dot.classList.add('bg-slate-200', 'dark:bg-slate-700');
        }
      }
    }
  }

  function handlePinInput(digit) {
    if (enteredPinBuffer.length >= 4) return;
    enteredPinBuffer += String(digit);
    updatePinDots();
    if (enteredPinBuffer.length === 4) {
      setTimeout(verifyAndSubmitPin, 120);
    }
  }

  function handlePinBackspace() {
    if (enteredPinBuffer.length > 0) {
      enteredPinBuffer = enteredPinBuffer.slice(0, -1);
      updatePinDots();
    }
  }

  function handlePinClear() {
    enteredPinBuffer = '';
    updatePinDots();
  }

  function verifyAndSubmitPin() {
    if (!pendingSwitchProfileId) return;
    const isValid = window.LuminaDB && typeof window.LuminaDB.verifyProfilePin === 'function'
      ? window.LuminaDB.verifyProfilePin(pendingSwitchProfileId, enteredPinBuffer)
      : true;

    if (isValid) {
      const targetId = pendingSwitchProfileId;
      closeProfilePinModal();
      completeProfileSwitch(targetId);
    } else {
      const errorEl = document.getElementById('pinModalError');
      const dotsBox = document.getElementById('pinDotsContainer');
      if (errorEl) {
        errorEl.textContent = 'Incorrect PIN. Try again (Default: 1234, Master: 0000)';
        errorEl.classList.remove('hidden');
      }
      if (dotsBox) {
        dotsBox.classList.add('animate-shake');
        setTimeout(() => dotsBox.classList.remove('animate-shake'), 400);
      }
      enteredPinBuffer = '';
      updatePinDots();
    }
  }

  function completeProfileSwitch(profileId) {
    if (window.LuminaDB) {
      window.LuminaDB.setActiveProfile(profileId);
      selectedCalendarDateKey = window.LuminaDB.getTodayDateKey();
    }
    Object.keys(_shuffledDecks).forEach(k => delete _shuffledDecks[k]);
    hideProfilePicker();
    applyActiveProfileView();
    const p = activeProfile();
    if (typeof window.showToast === 'function') {
      window.showToast(`Switched to ${p.name || 'Scholar'}!`);
    }
  }

  /* =====================================================================
     FAMILY LEADERBOARD & TROPHY ROOM CONTROLLER
     ===================================================================== */
  function openLeaderboardModal() {
    renderLeaderboardModal();
    const modal = document.getElementById('leaderboardModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function renderLeaderboardModal() {
    const container = document.getElementById('leaderboardList');
    if (!container || !window.LuminaDB) return;
    const list = window.LuminaDB.getLeaderboardData() || [];
    // Sort by all-time XP descending
    list.sort((a, b) => (b.xp || 0) - (a.xp || 0));

    const rankEmojis = ['🥇', '🥈', '🥉'];

    container.innerHTML = list.map((item, idx) => {
      const rank = rankEmojis[idx] || `#${idx + 1}`;
      const recentPrizes = (item.recentRedemptions || [])
        .map(r => `<span class="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold whitespace-nowrap">${escapeHtml(r.reward)}</span>`)
        .join('') || '<span class="text-xs text-slate-400 italic">No prizes redeemed yet</span>';

      return `
        <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="text-2xl sm:text-3xl font-black w-10 text-center">${rank}</div>
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-2xl shrink-0">
              ${escapeHtml(item.avatar || '👤')}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-black text-slate-900 dark:text-slate-100 text-base">${escapeHtml(item.name)}</h4>
                <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${item.ageGroup === 'kid' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200' : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200'}">
                  ${escapeHtml(item.ageLabel || item.ageGroup)}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                🔥 ${item.streakDays} Day Streak • ⚡ ${(item.availableXp || 0).toLocaleString()} XP Available
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 md:gap-6 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <div class="text-left md:text-right">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Balance</span>
              <span class="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">⚡ ${(item.xp || 0).toLocaleString()}</span>
            </div>

            <div class="text-left md:text-right">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lifetime Earned</span>
              <span class="font-bold text-slate-600 dark:text-slate-300 text-base">⚡ ${(item.lifetimeXp || item.xp || 0).toLocaleString()}</span>
            </div>

            <div class="text-left md:text-right">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Cash Balance</span>
              <span class="font-black text-emerald-700 dark:text-emerald-300 text-lg">💵 $${(item.cashBalance || 0).toFixed(2)}</span>
            </div>

            <div class="w-full md:w-auto text-left md:text-right max-w-xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Recent Prizes</span>
              <div class="flex flex-wrap gap-1 justify-start md:justify-end">
                ${recentPrizes}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* =====================================================================
     STUDENT REWARDS BAZAAR & CASH REDEMPTION CONTROLLER
     ===================================================================== */
  function openRewardsModal() {
    renderRewardsModal();
    const modal = document.getElementById('rewardsModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function closeRewardsModal() {
    const modal = document.getElementById('rewardsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function renderRewardsModal() {
    const p = activeProfile();
    const catalog = (window.LuminaDB && typeof window.LuminaDB.getPrizeCatalog === 'function')
      ? window.LuminaDB.getPrizeCatalog()
      : (window.LuminaDB && window.LuminaDB.DEFAULT_PRIZE_CATALOG) || [];
    const availableXP = (window.LuminaDB && typeof window.LuminaDB.getAvailableXp === 'function')
      ? window.LuminaDB.getAvailableXp(p)
      : Math.max(0, (p.xp || 0) - (p.totalXpSpent || 0));
    const walletCash = p.cashBalance || 0;
    const redemptions = p.redemptions || [];
    const pendingCount = redemptions.filter(r => r.status === 'Pending Approval' || r.status === 'pending').length;

    // Stats Banner
    const nameEl = document.getElementById('rewardsModalStudentName');
    const xpEl = document.getElementById('rewardsModalAvailableXP');
    const cashEl = document.getElementById('rewardsModalCashBalance');
    const spentEl = document.getElementById('rewardsModalTotalSpent');
    const pendingBadge = document.getElementById('rewardsModalPendingBadge');

    if (nameEl) nameEl.textContent = `${p.avatar || '👤'} ${p.name || 'Scholar'}'s Learning Wallet & Prize Store`;
    if (xpEl) xpEl.textContent = `⚡ ${availableXP.toLocaleString()} XP`;
    if (cashEl) cashEl.textContent = `$${walletCash.toFixed(2)}`;
    if (spentEl) spentEl.textContent = `⚡ ${(p.totalXpSpent || 0).toLocaleString()} XP`;
    if (pendingBadge) {
      if (pendingCount > 0) {
        pendingBadge.textContent = `⏳ ${pendingCount} Awaiting Parent Approval`;
        pendingBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs font-bold";
      } else {
        pendingBadge.textContent = "✓ All requests up to date";
        pendingBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold";
      }
    }

    // Render XP to Wallet Cash Conversion Station
    const conversionGrid = document.getElementById('rewardsConversionStationGrid');
    if (conversionGrid) {
      const canAfford1 = availableXP >= 20000;
      const canAfford2 = availableXP >= 30000;
      conversionGrid.innerHTML = `
        <div class="p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${canAfford1
          ? 'border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-700 shadow-sm'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-75'}">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100">
                💵 Standard Rate
              </span>
              <span class="text-xs font-black text-emerald-700 dark:text-emerald-400">⚡ 20,000 XP</span>
            </div>
            <h4 class="text-base font-black text-slate-900 dark:text-slate-100">+$1.00 Cash to Wallet</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Exchange 20,000 XP for $1.00 added directly into your Wallet balance.</p>
          </div>
          <div class="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60">
            <button onclick="handleConvertXPToWallet(1.00, 20000)" ${canAfford1 ? '' : 'disabled'}
              class="w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 btn-tactile ${canAfford1
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}">
              <span>💵</span>
              <span>${canAfford1 ? 'Convert 20,000 XP ➔ +$1.00' : `Need ${(20000 - availableXP).toLocaleString()} More XP`}</span>
            </button>
          </div>
        </div>

        <div class="p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${canAfford2
          ? 'border-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-700 shadow-sm ring-2 ring-indigo-400/20'
          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-75'}">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-950 dark:text-indigo-100">
                ⭐ Best Value Bonus!
              </span>
              <span class="text-xs font-black text-indigo-700 dark:text-indigo-400">⚡ 30,000 XP</span>
            </div>
            <h4 class="text-base font-black text-slate-900 dark:text-slate-100">+$2.00 Cash to Wallet</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bonus exchange: 30,000 XP gives you $2.00 cash (save 10,000 XP)!</p>
          </div>
          <div class="mt-4 pt-3 border-t border-indigo-200/60 dark:border-indigo-800/60">
            <button onclick="handleConvertXPToWallet(2.00, 30000)" ${canAfford2 ? '' : 'disabled'}
              class="w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 btn-tactile ${canAfford2
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}">
              <span>🌟</span>
              <span>${canAfford2 ? 'Convert 30,000 XP ➔ +$2.00 (Bonus)' : `Need ${(30000 - availableXP).toLocaleString()} More XP`}</span>
            </button>
          </div>
        </div>
      `;
    }

    // Render Prize Catalog Store (Buy with Wallet Cash or XP)
    const catalogGrid = document.getElementById('rewardsPrizeCatalogGrid');
    if (catalogGrid) {
      const displayItems = catalog.filter(item => item.category !== 'cash'); // cash items handled in conversion station above
      catalogGrid.innerHTML = displayItems.map(item => {
        const canAffordCash = walletCash >= item.price;
        const canAffordXP = availableXP >= item.xpPoints;

        return `
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="text-3xl">${escapeHtml(item.icon || '🎁')}</span>
                <div>
                  <h5 class="text-sm font-extrabold text-slate-900 dark:text-slate-100">${escapeHtml(item.name)}</h5>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">${escapeHtml(item.description || '')}</p>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 mb-2 font-mono">
                <span class="font-black text-emerald-700 dark:text-emerald-400">💵 $${item.price.toFixed(2)}</span>
                <span class="text-slate-400">or</span>
                <span class="font-extrabold text-indigo-600 dark:text-indigo-400">⚡ ${item.xpPoints.toLocaleString()} XP</span>
              </div>
            </div>

            <!-- Two purchase buttons -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button onclick="handlePurchasePrize('${item.id}', 'wallet')" ${canAffordCash ? '' : 'disabled'}
                class="py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 btn-tactile ${canAffordCash
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'}"
                title="${canAffordCash ? `Buy with $${item.price.toFixed(2)} from your wallet` : `You need $${item.price.toFixed(2)} in your wallet (You have $${walletCash.toFixed(2)})`}">
                <span>👛 Wallet ($${item.price.toFixed(2)})</span>
              </button>

              <button onclick="handlePurchasePrize('${item.id}', 'xp')" ${canAffordXP ? '' : 'disabled'}
                class="py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 btn-tactile ${canAffordXP
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-300 dark:border-indigo-700 text-indigo-950 dark:text-indigo-200 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'}"
                title="${canAffordXP ? `Redeem with ${item.xpPoints.toLocaleString()} XP` : `You need ${item.xpPoints.toLocaleString()} XP (You have ${availableXP.toLocaleString()} XP)`}">
                <span>⚡ XP (${(item.xpPoints / 1000).toFixed(0)}k)</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Student's Redemption & Wallet Activity History
    const historyContainer = document.getElementById('rewardsHistoryList');
    if (historyContainer) {
      if (redemptions.length === 0) {
        historyContainer.innerHTML = `
          <div class="text-center py-6 text-slate-400 text-xs italic">
            You haven't requested any rewards yet. Answer questions and complete tracks to build up XP and Wallet cash!
          </div>
        `;
      } else {
        historyContainer.innerHTML = redemptions.map(r => {
          let statusBadge = '';
          if (r.status === 'Pending Approval' || r.status === 'pending') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">⏳ Waiting for Parent Approval</span>';
          } else if (r.status === 'Approved') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">✅ Approved by Parent</span>';
          } else if (r.status === 'Added to Wallet') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">👛 Added to Wallet</span>';
          } else if (r.status === 'Paid Out') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 line-through">💵 Paid Out</span>';
          } else if (r.status === 'Rejected') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">❌ Declined (Refunded)</span>';
          } else {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600">${escapeHtml(r.status || 'Done')}</span>`;
          }

          const paymentTxt = r.paymentMethod === 'wallet'
            ? `<span class="text-emerald-700 dark:text-emerald-400 font-black font-mono">-$${(r.cashCost || 0).toFixed(2)} from Wallet</span>`
            : `<span class="text-indigo-600 dark:text-indigo-400 font-black font-mono">-⚡${(r.tierPoints || 0).toLocaleString()} XP</span>`;

          return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs gap-2">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">${r.isCash ? '💵' : '🎁'}</span>
                <div>
                  <p class="font-black text-slate-900 dark:text-slate-100">${escapeHtml(r.reward)}</p>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400">${new Date(r.timestamp).toLocaleDateString()} ${new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Cost: ${paymentTxt}</p>
                </div>
              </div>
              <div class="sm:text-right shrink-0">
                ${statusBadge}
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  function handleConvertXPToWallet(cashAmount, xpRequired) {
    const p = activeProfile();
    const availableXP = (window.LuminaDB && typeof window.LuminaDB.getAvailableXp === 'function')
      ? window.LuminaDB.getAvailableXp(p)
      : Math.max(0, (p.xp || 0) - (p.totalXpSpent || 0));
    if (availableXP < xpRequired) {
      showToast(`You need ${xpRequired.toLocaleString()} XP to convert to $${cashAmount.toFixed(2)}. You have ${availableXP.toLocaleString()} XP.`);
      return;
    }

    const pinInput = window.prompt(
      `Convert ${xpRequired.toLocaleString()} XP to $${cashAmount.toFixed(2)} Cash in ${p.name}'s Wallet?\n\nPARENT APPROVAL:\n• If parent is here, enter Parent Master PIN (0000) for instant approval.\n• Or leave blank and click OK to submit for Parent Approval in the Parent Portal:`,
      ''
    );
    if (pinInput === null) return; // User cancelled

    const isMasterApproved = pinInput.trim() === '0000';

    if (window.LuminaDB && typeof window.LuminaDB.redeemReward === 'function') {
      const res = window.LuminaDB.redeemReward(p.id, 'prize_cash', `$${cashAmount.toFixed(2)} Cash to Wallet`, {
        paymentMethod: 'xp',
        xpCost: xpRequired,
        isCashConversion: true,
        cashAmount: cashAmount,
        parentApproved: isMasterApproved
      });

      if (res && res.ok) {
        if (isMasterApproved) {
          if (typeof window.confetti === 'function') window.confetti({ particleCount: 160, spread: 100 });
          showToast(`💵 Added $${cashAmount.toFixed(2)} directly to ${p.name}'s Learning Wallet!`);
        } else {
          showToast(`⏳ Submitted $${cashAmount.toFixed(2)} conversion request for Parent Approval!`);
        }
        refreshHeaderUI();
        renderRewardsModal();
      } else {
        showToast((res && res.error) || 'Could not convert XP to wallet cash');
      }
    }
  }

  function handlePurchasePrize(prizeId, paymentMethod) {
    const p = activeProfile();
    const catalog = (window.LuminaDB && typeof window.LuminaDB.getPrizeCatalog === 'function')
      ? window.LuminaDB.getPrizeCatalog()
      : [];
    const item = catalog.find(i => i.id === prizeId);
    if (!item) return;

    const availableXP = (window.LuminaDB && typeof window.LuminaDB.getAvailableXp === 'function')
      ? window.LuminaDB.getAvailableXp(p)
      : Math.max(0, (p.xp || 0) - (p.totalXpSpent || 0));
    const walletCash = p.cashBalance || 0;

    if (paymentMethod === 'wallet' && walletCash < item.price) {
      showToast(`You need $${item.price.toFixed(2)} in your Wallet. Your current wallet balance is $${walletCash.toFixed(2)}.`);
      return;
    }
    if (paymentMethod === 'xp' && availableXP < item.xpPoints) {
      showToast(`You need ${item.xpPoints.toLocaleString()} XP. Your available XP is ${availableXP.toLocaleString()} XP.`);
      return;
    }

    const costLabel = paymentMethod === 'wallet' ? `$${item.price.toFixed(2)} from Wallet` : `${item.xpPoints.toLocaleString()} XP`;
    const pinInput = window.prompt(
      `Redeem "${item.name}" for ${costLabel}?\n\nPARENT APPROVAL:\n• If parent is here, enter Parent Master PIN (0000) for instant approval.\n• Or leave blank and click OK to submit for Parent Approval in the Parent Portal:`,
      ''
    );
    if (pinInput === null) return; // Cancelled

    const isMasterApproved = pinInput.trim() === '0000';

    if (window.LuminaDB && typeof window.LuminaDB.redeemReward === 'function') {
      const res = window.LuminaDB.redeemReward(p.id, item.id, item.name, {
        paymentMethod: paymentMethod,
        price: item.price,
        cashCost: item.price,
        xpCost: item.xpPoints,
        parentApproved: isMasterApproved
      });

      if (res && res.ok) {
        if (isMasterApproved) {
          if (typeof window.confetti === 'function') window.confetti({ particleCount: 160, spread: 100 });
          showToast(`🎉 Approved! Claim your "${item.name}".`);
        } else {
          showToast(`⏳ Request for "${item.name}" submitted! Waiting for Parent Approval.`);
        }
        refreshHeaderUI();
        renderRewardsModal();
      } else {
        showToast((res && res.error) || 'Could not redeem prize');
      }
    }
  }

  function handleRequestCashPayout() {
    const p = activeProfile();
    const walletCash = p.cashBalance || 0;
    if (walletCash <= 0) {
      showToast('No wallet cash available for payout. Convert XP to cash first!');
      return;
    }

    const conf = window.confirm(`Request cash payout of $${walletCash.toFixed(2)} from your parent in real life?`);
    if (!conf) return;

    if (window.LuminaDB && typeof window.LuminaDB.requestCashPayout === 'function') {
      const res = window.LuminaDB.requestCashPayout(p.id, walletCash);
      if (res && res.ok) {
        showToast(`💵 Cash payout request for $${walletCash.toFixed(2)} submitted! Ask parent to pay and approve.`);
        refreshHeaderUI();
        renderRewardsModal();
      } else {
        showToast((res && res.error) || 'Could not submit payout request');
      }
    }
  }

  function handleRedeemReward(tierId, rewardItem) {
    const p = activeProfile();
    const pinInput = window.prompt(
      `Redeem "${rewardItem}" for ${tierId} points?\n\nPARENT APPROVAL:\n• Enter Parent PIN (0000) for instant approval\n• Or leave blank and click OK to submit for Parent Approval:`,
      ''
    );
    if (pinInput === null) return;

    const isMasterApproved = pinInput.trim() === '0000';

    if (window.LuminaDB && typeof window.LuminaDB.redeemReward === 'function') {
      const res = window.LuminaDB.redeemReward(p.id, tierId, rewardItem, {
        parentApproved: isMasterApproved
      });
      if (res && res.ok) {
        if (isMasterApproved) {
          if (typeof window.confetti === 'function') window.confetti({ particleCount: 180, spread: 120 });
          if (res.redemption.isCash) {
            showToast(`💵 Added $${res.redemption.cashAmount.toFixed(2)} to ${p.name}'s Wallet! Total: $${(p.cashBalance || 0).toFixed(2)}`);
          } else {
            showToast(`🎉 Approved! Claim "${rewardItem}".`);
          }
        } else {
          showToast(`⏳ Submitted request for "${rewardItem}"! Waiting for parent approval.`);
        }
        refreshHeaderUI();
        renderRewardsModal();
      } else {
        showToast((res && res.error) || 'Could not redeem reward');
      }
    }
  }

  function resetTopicQuestions(domain) {
    const p = activeProfile();
    if (p && window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(p.id, domain);
    }
    Object.keys(_shuffledDecks).forEach(k => delete _shuffledDecks[k]);
    if (typeof window.showToast === 'function') {
      window.showToast(`Reset questions for ${domain === 'ALL' ? 'all topics' : domain}!`);
    }
    if (typeof window.populateDomainFilterDropdown === 'function') {
      window.populateDomainFilterDropdown();
    }
    refreshHeaderUI();
  }
  window.resetTopicQuestions = resetTopicQuestions;

  function applyActiveProfileView() {
    const p = activeProfile();
    const badge = document.getElementById('activeModeBadge');
    const adminSec = document.getElementById('section-parent-admin');
    const teenSec = document.getElementById('section-teen-dashboard');
    const kidSec = document.getElementById('section-kid-playground');

    // Standalone Parent Portal page (parent.html)
    if (adminSec && !teenSec && !kidSec) {
      adminSec.classList.remove('hidden');
      // Parent portal works with the whole bank (editor, per-domain stats):
      // load every domain once, then re-render the portal with full data.
      if (window.QuestionLoader && !applyActiveProfileView._bankHydrated) {
        applyActiveProfileView._bankHydrated = true;
        window.QuestionLoader.ensureAll().then(function (ok) {
          if (ok) applyActiveProfileView();
        });
      }
      if (badge) {
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-700";
        badge.innerText = '⚙️ Parent Admin Portal';
      }
      const allProfiles = (window.LuminaDB && typeof window.LuminaDB.getAllProfiles === 'function')
        ? window.LuminaDB.getAllProfiles()
        : [];
      if (!adminActiveStudentId && allProfiles.length > 0) {
        adminActiveStudentId = (p && p.id) || allProfiles[0].id;
      }
      renderAdminPortal();
      updateAdminDomainDropdown();
      refreshHeaderUI();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      return;
    }

    ['section-teen-dashboard', 'section-teen-sat', 'section-languages', 'section-teen-spelling', 'section-kid-playground', 'section-parent-admin']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

    if (isTeenProfile(p)) {
      if (badge) {
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/80 whitespace-nowrap shrink-0";
        badge.innerText = `${p.avatar || '🎓'} ${p.name || 'Scholar'} • Teen`;
      }
      const appBody = document.getElementById('appBody');
      if (appBody) appBody.className = "bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-300";
      if (typeof window.openTeenTab === 'function') {
        window.openTeenTab(appData.teenSubTab || 'dashboard');
      }
    } else {
      if (typeof window.stopSatTimer === 'function') window.stopSatTimer();
      if (badge) {
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80 whitespace-nowrap shrink-0";
        badge.innerText = `${p.avatar || '🌟'} ${p.name || 'Explorer'} • 6+`;
      }
      const appBody = document.getElementById('appBody');
      if (appBody) appBody.className = "bg-[#FFFBEB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-kids transition-colors duration-300";
      if (kidSec) kidSec.classList.remove('hidden');
      renderSubNavForKid();
      if (typeof window.initKidPlayground === 'function') {
        window.initKidPlayground();
      }
    }

    refreshHeaderUI();
    refreshStudentXPBadges();
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderSubNavForKid() {
    const container = document.getElementById('subNavTabs');
    if (!container) return;
    const currentTab = window.kidViewTab || 'practice';
    const isPractice = currentTab === 'practice';
    const isFlash = currentTab === 'flashcards';

    const practiceCls = isPractice
      ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-amber-400 text-slate-950 border border-amber-500 shadow-xs"
      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800";

    const flashCls = isFlash
      ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-amber-400 text-slate-950 border border-amber-500 shadow-xs"
      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800";

    container.innerHTML = `
      <div class="flex items-center gap-2">
        <button onclick="setKidViewTab('practice')" class="${practiceCls}">
          <span>🎮</span>
          <span>Practice &amp; Quizzes</span>
        </button>
        <button onclick="setKidViewTab('flashcards')" class="${flashCls}">
          <span>🃏</span>
          <span>Study Flashcards &amp; Deck</span>
        </button>
      </div>
    `;
  }

  let authModalManuallyOpened = false;

  function setProtectedContentVisible(isVisible) {
    ['mainAppContent', 'profileQuickBar', 'todayGoalSection', 'subNavBar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !isVisible);
    });
    const mainFallback = document.querySelector('main');
    if (mainFallback) mainFallback.classList.toggle('hidden', !isVisible);
    if (!isVisible) {
      hideProfilePicker();
      if (typeof window.stopSatTimer === 'function') window.stopSatTimer();
    }
  }

  function updateFamilyAuthUI() {
    const user = (window.LuminaDB && typeof window.LuminaDB.getCurrentUser === 'function')
      ? window.LuminaDB.getCurrentUser()
      : null;
    const textEl = document.getElementById('familyAuthText');
    const iconEl = document.getElementById('familyAuthIcon');
    const pill = document.getElementById('familyAuthPill');
    const userEmailEl = document.getElementById('familyAuthUserEmail');
    const loggedInView = document.getElementById('familyLoggedInView');
    const loginForm = document.getElementById('familyLoginForm');
    const modal = document.getElementById('familyAuthModal');
    const titleEl = document.getElementById('familyAuthTitle');

    if (user) {
      setProtectedContentVisible(true);
      refreshPreviewBanner();
      if (modal && !authModalManuallyOpened) {
        modal.classList.add('hidden');
      }
      if (titleEl) titleEl.innerText = 'Account Status';
      if (textEl) textEl.innerText = user.email ? (user.email.split('@')[0]) : 'Signed In';
      if (iconEl) iconEl.setAttribute('data-lucide', 'shield-check');
      if (pill) {
        pill.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition border border-emerald-200 cursor-pointer";
        pill.title = `Signed in as ${user.email}. Click to view or sign out.`;
      }
      if (userEmailEl) userEmailEl.innerText = user.email || 'Authenticated User';
      if (loggedInView) loggedInView.classList.remove('hidden');
      if (loginForm) loginForm.classList.add('hidden');
    } else if (isPreviewMode()) {
      // Friend Preview session: content stays unlocked without an account
      // and the sign-in modal stays closed.
      setProtectedContentVisible(true);
      if (modal) modal.classList.add('hidden');
      refreshPreviewBanner();
    } else {
      authModalManuallyOpened = false;
      setProtectedContentVisible(false);
      if (modal) modal.classList.remove('hidden');
      if (titleEl) titleEl.innerText = 'Sign In Required';
      if (textEl) textEl.innerText = 'Sign In';
      if (iconEl) iconEl.setAttribute('data-lucide', 'lock');
      if (pill) {
        pill.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer";
        pill.title = "Sign in required to access Roy's Learning Hub";
      }
      if (loggedInView) loggedInView.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function toggleFamilyAuthModal() {
    const modal = document.getElementById('familyAuthModal');
    if (!modal) return;
    const user = (window.LuminaDB && typeof window.LuminaDB.getCurrentUser === 'function')
      ? window.LuminaDB.getCurrentUser()
      : null;
    if (!user) {
      updateFamilyAuthUI();
      modal.classList.remove('hidden');
      return;
    }
    const willOpen = modal.classList.contains('hidden');
    authModalManuallyOpened = willOpen;
    updateFamilyAuthUI();
    modal.classList.toggle('hidden', !willOpen);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  async function handleFamilyLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailEl = document.getElementById('familyEmailInput');
    const passEl = document.getElementById('familyPasswordInput');
    const errBox = document.getElementById('familyAuthError');
    const btn = document.getElementById('btnFamilySignIn');

    const email = (emailEl && emailEl.value || '').trim();
    const pass = (passEl && passEl.value || '');
    if (!email || !pass) {
      if (errBox) {
        errBox.innerText = 'Please enter both email and password.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Signing in...';
    }
    if (errBox) errBox.classList.add('hidden');

    if (window.LuminaDB && typeof window.LuminaDB.signIn === 'function') {
      const res = await window.LuminaDB.signIn(email, pass);
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Sign In to Unlock Hub';
      }
      if (res && res.ok) {
        authModalManuallyOpened = false;
        updateFamilyAuthUI();
        applyActiveProfileView();
        if (typeof showToast === 'function') showToast(`Signed in as ${email}!`);
        if (typeof window.LuminaDB.pullFromCloud === 'function') {
          const pullRes = await window.LuminaDB.pullFromCloud();
          if (pullRes && pullRes.ok) {
            mergeLanguagePacksFromDB();
            mergeCustomKidCards();
            applyActiveProfileView();
          }
        }
      } else {
        if (errBox) {
          errBox.innerText = (res && res.error) || 'Failed to sign in. Please verify your credentials.';
          errBox.classList.remove('hidden');
        }
      }
    }
  }

  async function handleFamilySignOut() {
    if (window.LuminaDB && typeof window.LuminaDB.signOut === 'function') {
      await window.LuminaDB.signOut();
      authModalManuallyOpened = false;
      updateFamilyAuthUI();
      if (typeof showToast === 'function') showToast('Signed out. Sign in to access Roy\'s Learning Hub.');
    }
  }

  function continueOfflineMode() {
    authModalManuallyOpened = false;
    const modal = document.getElementById('familyAuthModal');
    if (modal) modal.classList.add('hidden');
    setProtectedContentVisible(true);
    applyActiveProfileView();
    if (typeof showToast === 'function') {
      showToast('Running in Local Device Mode. All progress and quiz answers save on this device.');
    }
  }

  /* =====================================================================
     FRIEND PREVIEW (GUEST TRIAL) - demo profiles, no account needed.
     Preview profiles live only on this device: firebase-db.js excludes
     them from every cloud push and preserves them across cloud pulls.
     ===================================================================== */
  // Phones only: move the Questions/Time goal strip to the very bottom of
  // the page so the exercise comes first. Tablet/desktop keep it up top.
  function placeGoalStrip() {
    const section = document.getElementById('todayGoalSection');
    const main = document.getElementById('mainAppContent');
    if (!section || !main) return;
    if (window.innerWidth < 640 && main.lastElementChild !== section) {
      main.appendChild(section);
    }
  }

  // Phones only: the Dictionary & Vault button leaves the sub-nav bar and
  // sits at the very bottom of the page (below the daily-goal strip, which
  // placeGoalStrip appends first). Tablet/desktop keep it in the sub-nav.
  function placeDictionaryVault() {
    const wrap = document.getElementById('dictVaultBtnWrap');
    const main = document.getElementById('mainAppContent');
    if (!wrap || !main) return;
    if (window.innerWidth < 640 && wrap.parentElement !== main) {
      wrap.classList.add('dict-vault-bottom');
      main.appendChild(wrap);
    }
  }

  function isPreviewMode() {
    try { return sessionStorage.getItem('lumina_preview_mode') === '1'; } catch (e) { return false; }
  }

  function refreshPreviewBanner() {
    const banner = document.getElementById('previewBanner');
    if (!banner) return;
    const active = (typeof activeProfile === 'function') ? activeProfile() : null;
    const show = isPreviewMode() && !!active && !!window.LuminaDB
      && typeof window.LuminaDB.isPreviewProfile === 'function'
      && window.LuminaDB.isPreviewProfile(active);
    banner.classList.toggle('hidden', !show);
  }

  function startFriendPreview() {
    if (!window.LuminaDB) return;
    try { sessionStorage.setItem('lumina_preview_mode', '1'); } catch (e) {}
    window.LuminaDB.upsertProfile({ id: 'preview_teen', name: 'Preview Scholar', avatar: '\uD83C\uDF93', ageGroup: 'teen', ageLabel: 'Friend Preview - Teen', dailyGoalQuestions: 12, dailyGoalMinutes: 20, isPreview: true });
    window.LuminaDB.upsertProfile({ id: 'preview_kid', name: 'Preview Explorer', avatar: '\uD83E\uDDED', ageGroup: 'kid', ageLabel: 'Friend Preview - Kid', dailyGoalQuestions: 10, dailyGoalMinutes: 15, isPreview: true });
    authModalManuallyOpened = false;
    const modal = document.getElementById('familyAuthModal');
    if (modal) modal.classList.add('hidden');
    setProtectedContentVisible(true);
    completeProfileSwitch('preview_kid');
    refreshPreviewBanner();
    if (typeof showToast === 'function') {
      showToast('\uD83C\uDF81 Friend Preview: demo profiles only - progress stays on this device.');
    }
  }

  function exitFriendPreview() {
    try { sessionStorage.removeItem('lumina_preview_mode'); } catch (e) {}
    if (window.LuminaDB) {
      ['preview_teen', 'preview_kid'].forEach(id => {
        if (window.LuminaDB.getProfileById(id)) window.LuminaDB.deleteProfile(id);
      });
    }
    location.reload();
  }

  /* =====================================================================
     PARENT & ADMIN PORTAL CONTROLLER
     ===================================================================== */
  let adminActiveStudentId = null;

  function openParentAdminPortal() {
    const adminSec = document.getElementById('section-parent-admin');
    if (!adminSec) {
      window.location.href = 'parent.html';
      return;
    }

    const user = (window.LuminaDB && typeof window.LuminaDB.getCurrentUser === 'function')
      ? window.LuminaDB.getCurrentUser()
      : null;
    if (!user) {
      if (typeof window.showToast === 'function') {
        window.showToast("Please sign in with your family account to access the Parent Portal.");
      }
      toggleFamilyAuthModal();
      return;
    }

    if (typeof window.stopSatTimer === 'function') window.stopSatTimer();

    ['section-teen-dashboard', 'section-teen-sat', 'section-languages', 'section-kid-playground']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });

    adminSec.classList.remove('hidden');

    const badge = document.getElementById('activeModeBadge');
    if (badge) {
      badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 dark:bg-indigo-950 text-amber-300 border border-slate-700 dark:border-indigo-800 whitespace-nowrap shrink-0";
      badge.innerText = '⚙️ Parent Admin Portal';
    }

    const appBody = document.getElementById('appBody');
    if (appBody) appBody.className = "bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-300";

    const allProfiles = (window.LuminaDB && typeof window.LuminaDB.getAllProfiles === 'function')
      ? window.LuminaDB.getAllProfiles()
      : [];
    if (!adminActiveStudentId && allProfiles.length > 0) {
      const active = activeProfile();
      adminActiveStudentId = (active && active.id) || allProfiles[0].id;
    }

    renderAdminPortal();
    updateAdminDomainDropdown();

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeParentAdminPortal() {
    const teenSec = document.getElementById('section-teen-dashboard');
    const kidSec = document.getElementById('section-kid-playground');
    if (!teenSec && !kidSec) {
      window.location.href = 'index.html';
      return;
    }
    const adminSec = document.getElementById('section-parent-admin');
    if (adminSec) adminSec.classList.add('hidden');
    applyActiveProfileView();
  }

  function selectAdminStudent(pid) {
    adminActiveStudentId = pid;
    renderAdminPortal();
  }

  function getStudentTrackProgressList(pid) {
    const p = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    if (!p) return [];
    const completed = new Set((p && p.completedQuestionIds) || []);

    const tracks = [];

    // 1. Spelling Bee
    const allSpelling = (typeof window.getAllSpellingItems === 'function')
      ? window.getAllSpellingItems()
      : [];
    const spellingDone = allSpelling.filter(i => completed.has('spelling_' + ((i.word || i.primary || '').replace(/[^A-Za-z]/g, '').toUpperCase()))).length;
    tracks.push({
      key: 'spelling',
      domain: '6+ Spelling Bee',
      title: '🐝 6+ Spelling Bee',
      category: 'Spelling & Vocabulary',
      targetProfile: 'kid',
      total: allSpelling.length || 200,
      completedCount: spellingDone,
      percent: Math.min(100, Math.round(((spellingDone) / (allSpelling.length || 1)) * 100)),
      isCompleted: spellingDone >= (allSpelling.length || 1) && allSpelling.length > 0
    });

    // 2. Math - Addition
    const addDone = Array.from(completed).filter(id => id.startsWith('kid_math_addition_')).length;
    tracks.push({
      key: 'math_addition',
      domain: '6+ Numbers & Math',
      title: '➕ Numbers & Math — Addition',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, addDone),
      percent: Math.min(100, Math.round((Math.min(25, addDone) / 25) * 100)),
      isCompleted: addDone >= 25
    });

    // 3. Math - Subtraction
    const subDone = Array.from(completed).filter(id => id.startsWith('kid_math_subtraction_')).length;
    tracks.push({
      key: 'math_subtraction',
      domain: '6+ Numbers & Math',
      title: '➖ Numbers & Math — Subtraction',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, subDone),
      percent: Math.min(100, Math.round((Math.min(25, subDone) / 25) * 100)),
      isCompleted: subDone >= 25
    });

    // 4. Math - Multiplication
    const mulDone = Array.from(completed).filter(id => id.startsWith('kid_math_multiplication_')).length;
    tracks.push({
      key: 'math_multiplication',
      domain: '6+ Numbers & Math',
      title: '✖️ Numbers & Math — Multiplication',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, mulDone),
      percent: Math.min(100, Math.round((Math.min(25, mulDone) / 25) * 100)),
      isCompleted: mulDone >= 25
    });

    // 5. Math - Division
    const divDone = Array.from(completed).filter(id => id.startsWith('kid_math_division_')).length;
    tracks.push({
      key: 'math_division',
      domain: '6+ Numbers & Math',
      title: '➗ Numbers & Math — Division',
      category: 'Math',
      targetProfile: 'kid',
      total: 25,
      completedCount: Math.min(25, divDone),
      percent: Math.min(100, Math.round((Math.min(25, divDone) / 25) * 100)),
      isCompleted: divDone >= 25
    });

    // 6. Story Reading & Comprehension
    const compQs = (appData.questions || []).filter(q => q.domain === '6+ Story Reading & Comprehension');
    const compDone = compQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const compTotal = compQs.length || 10;
    tracks.push({
      key: '6+ Story Reading & Comprehension',
      domain: '6+ Story Reading & Comprehension',
      title: '📖 6+ Story Reading & Comprehension',
      category: 'Reading',
      targetProfile: 'kid',
      total: compTotal,
      completedCount: compDone,
      percent: Math.min(100, Math.round((compDone / compTotal) * 100)),
      isCompleted: compDone >= compTotal && compTotal > 0
    });

    // 7. Grammar & Sentence Building
    const gramQs = (appData.questions || []).filter(q => q.domain === '6+ Grammar & Sentence Building');
    const gramDone = gramQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const gramTotal = gramQs.length || 10;
    tracks.push({
      key: '6+ Grammar & Sentence Building',
      domain: '6+ Grammar & Sentence Building',
      title: '✏️ 6+ Grammar & Sentences',
      category: 'Grammar',
      targetProfile: 'kid',
      total: gramTotal,
      completedCount: gramDone,
      percent: Math.min(100, Math.round((gramDone / gramTotal) * 100)),
      isCompleted: gramDone >= gramTotal && gramTotal > 0
    });

    // 8. Sight Words & Phonics
    const phonicsItems = (window.multiLangData && window.multiLangData.phonics && window.multiLangData.phonics.kidItems) || [];
    const phonicsDone = phonicsItems.filter(i => completed.has('kid_match_phonics_words_' + i.primary) || completed.has('kid_match_phonics_' + i.primary)).length;
    tracks.push({
      key: 'phonics',
      domain: 'Sight Words & Phonics',
      title: '🔤 Sight Words & Phonics',
      category: 'Phonics',
      targetProfile: 'kid',
      total: phonicsItems.length || 20,
      completedCount: phonicsDone,
      percent: Math.min(100, Math.round((phonicsDone / (phonicsItems.length || 1)) * 100)),
      isCompleted: phonicsDone >= (phonicsItems.length || 1) && phonicsItems.length > 0
    });

    // 9. Animals & Science
    const animalItems = (window.multiLangData && window.multiLangData.animals && window.multiLangData.animals.kidItems) || [];
    const animalDone = animalItems.filter(i => completed.has('kid_match_animals_words_' + i.primary) || completed.has('kid_match_animals_' + i.primary)).length;
    tracks.push({
      key: 'animals',
      domain: 'Animals & Science',
      title: '🦁 Animals & Science Facts',
      category: 'Science',
      targetProfile: 'kid',
      total: animalItems.length || 20,
      completedCount: animalDone,
      percent: Math.min(100, Math.round((animalDone / (animalItems.length || 1)) * 100)),
      isCompleted: animalDone >= (animalItems.length || 1) && animalItems.length > 0
    });

    // 10. Malayalam Track
    const malPack = window.multiLangData && window.multiLangData.malayalam;
    const malTotal = ((malPack && malPack.letters ? malPack.letters.length : 0) + (malPack && malPack.kidItems ? malPack.kidItems.length : 0) + (malPack && malPack.sentences ? malPack.sentences.length : 0)) || 50;
    const malDone = Array.from(completed).filter(id => id.startsWith('kid_match_malayalam_')).length;
    tracks.push({
      key: 'malayalam',
      domain: 'Malayalam Language Pack',
      title: '🌴 Malayalam Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: malTotal,
      completedCount: Math.min(malTotal, malDone),
      percent: Math.min(100, Math.round((Math.min(malTotal, malDone) / malTotal) * 100)),
      isCompleted: malDone >= malTotal && malTotal > 0
    });

    // 11. Hindi Track
    const hinPack = window.multiLangData && window.multiLangData.hindi;
    const hinTotal = ((hinPack && hinPack.letters ? hinPack.letters.length : 0) + (hinPack && hinPack.kidItems ? hinPack.kidItems.length : 0) + (hinPack && hinPack.sentences ? hinPack.sentences.length : 0)) || 50;
    const hinDone = Array.from(completed).filter(id => id.startsWith('kid_match_hindi_')).length;
    tracks.push({
      key: 'hindi',
      domain: 'Hindi Language Pack',
      title: '🪔 Hindi Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: hinTotal,
      completedCount: Math.min(hinTotal, hinDone),
      percent: Math.min(100, Math.round((Math.min(hinTotal, hinDone) / hinTotal) * 100)),
      isCompleted: hinDone >= hinTotal && hinTotal > 0
    });

    // 12. Spanish Track
    const espPack = window.multiLangData && window.multiLangData.spanish;
    const espTotal = ((espPack && espPack.kidItems ? espPack.kidItems.length : 0) + (espPack && espPack.sentences ? espPack.sentences.length : 0)) || 40;
    const espDone = Array.from(completed).filter(id => id.startsWith('kid_match_spanish_')).length;
    tracks.push({
      key: 'spanish',
      domain: 'Spanish Language Pack',
      title: '🇪🇸 Spanish Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: espTotal,
      completedCount: Math.min(espTotal, espDone),
      percent: Math.min(100, Math.round((Math.min(espTotal, espDone) / espTotal) * 100)),
      isCompleted: espDone >= espTotal && espTotal > 0
    });

    // 13. French Track
    const frPack = window.multiLangData && window.multiLangData.french;
    const frTotal = ((frPack && frPack.kidItems ? frPack.kidItems.length : 0) + (frPack && frPack.sentences ? frPack.sentences.length : 0)) || 40;
    const frDone = Array.from(completed).filter(id => id.startsWith('kid_match_french_')).length;
    tracks.push({
      key: 'french',
      domain: 'French Language Pack',
      title: '🇫🇷 French Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: frTotal,
      completedCount: Math.min(frTotal, frDone),
      percent: Math.min(100, Math.round((Math.min(frTotal, frDone) / frTotal) * 100)),
      isCompleted: frDone >= frTotal && frTotal > 0
    });

    // 14. Italian Track
    const itPack = window.multiLangData && window.multiLangData.italian;
    const itTotal = ((itPack && itPack.kidItems ? itPack.kidItems.length : 0) + (itPack && itPack.sentences ? itPack.sentences.length : 0)) || 40;
    const itDone = Array.from(completed).filter(id => id.startsWith('kid_match_italian_')).length;
    tracks.push({
      key: 'italian',
      domain: 'Italian Language Pack',
      title: '🇮🇹 Italian Track',
      category: 'Languages',
      targetProfile: 'kid',
      total: itTotal,
      completedCount: Math.min(itTotal, itDone),
      percent: Math.min(100, Math.round((Math.min(itTotal, itDone) / itTotal) * 100)),
      isCompleted: itDone >= itTotal && itTotal > 0
    });

    // 13. SAT Bluebook Reading & Writing
    const satRwQs = (appData.questions || []).filter(q => (q.targetProfile || 'teen') !== 'kid' && (q.domain.includes('Reading') || q.domain.includes('Writing') || q.domain.includes('Ideas')));
    const satRwDone = satRwQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const satRwTotal = satRwQs.length || 30;
    tracks.push({
      key: 'sat_reading_writing',
      domain: 'Information & Ideas',
      title: '🎓 13+ SAT Reading & Writing',
      category: 'SAT Bluebook',
      targetProfile: 'teen',
      total: satRwTotal,
      completedCount: satRwDone,
      percent: Math.min(100, Math.round((satRwDone / satRwTotal) * 100)),
      isCompleted: satRwDone >= satRwTotal && satRwTotal > 0
    });

    // 14. SAT Bluebook Math
    const satMathQs = (appData.questions || []).filter(q => (q.targetProfile || 'teen') !== 'kid' && (q.domain.includes('Math') || q.domain.includes('Algebra') || q.domain.includes('Advanced')));
    const satMathDone = satMathQs.filter(q => completed.has(q.id) || completed.has(getQuestionSignature(q))).length;
    const satMathTotal = satMathQs.length || 20;
    tracks.push({
      key: 'sat_math',
      domain: 'Algebra',
      title: '📐 13+ SAT Math',
      category: 'SAT Bluebook',
      targetProfile: 'teen',
      total: satMathTotal,
      completedCount: satMathDone,
      percent: Math.min(100, Math.round((satMathDone / satMathTotal) * 100)),
      isCompleted: satMathDone >= satMathTotal && satMathTotal > 0
    });

    // 15. 13+ SAT & Academic Spelling Bee
    const teenSpellAll = Array.isArray(window.TEEN_SPELLING_WORDS) ? window.TEEN_SPELLING_WORDS : [];
    const teenSpellTotal = teenSpellAll.length || 44;
    const teenSpellDone = teenSpellAll.filter(w => completed.has('teen_spelling_' + w.word.toUpperCase())).length;
    tracks.push({
      key: 'teen_spelling',
      domain: '13+ SAT & Academic Spelling',
      title: '🐝 13+ SAT & Academic Spelling Bee',
      category: 'Teen Spelling',
      targetProfile: 'teen',
      total: teenSpellTotal,
      completedCount: teenSpellDone,
      percent: Math.min(100, Math.round((teenSpellDone / teenSpellTotal) * 100)),
      isCompleted: teenSpellDone >= teenSpellTotal && teenSpellTotal > 0
    });

    return tracks;
  }

  function renderAdminPortal() {
    const allProfiles = (window.LuminaDB && typeof window.LuminaDB.getAllProfiles === 'function')
      ? window.LuminaDB.getAllProfiles()
      : [];
    if (!adminActiveStudentId && allProfiles.length > 0) {
      adminActiveStudentId = allProfiles[0].id;
    }
    const student = allProfiles.find(p => p.id === adminActiveStudentId) || allProfiles[0];
    if (!student) return;

    // 1. Student Pills Bar
    const pillsBar = document.getElementById('adminStudentPillsBar');
    if (pillsBar) {
      pillsBar.innerHTML = allProfiles.map(p => {
        const active = p.id === student.id;
        const tracks = getStudentTrackProgressList(p.id);
        const finishedCount = tracks.filter(t => t.isCompleted).length;
        const cls = active
          ? "px-4 py-2 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow-md border-2 border-indigo-700 flex items-center gap-2 transition btn-tactile"
          : "px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition btn-tactile";
        return `
          <button onclick="selectAdminStudent('${p.id}')" class="${cls}">
            <span class="text-base">${p.avatar || '👤'}</span>
            <span>${escapeHtml(p.name || 'Student')}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}">${finishedCount} completed</span>
          </button>
        `;
      }).join('');
    }

    // Top Student Name & Reset All button
    const studentNameEl = document.getElementById('adminActiveStudentName');
    if (studentNameEl) studentNameEl.innerText = `${student.avatar || ''} ${student.name || 'Student'}`;

    const resetAllBox = document.getElementById('adminStudentResetAllBtnContainer');
    if (resetAllBox) {
      resetAllBox.innerHTML = `
        <button onclick="resetStudentAllCompletedAreas('${student.id}')" class="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-800 shadow-xs flex items-center gap-1.5 transition btn-tactile">
          <span>🔄</span>
          <span>Reset All Completed Tracks</span>
        </button>
      `;
    }

    // 1b. Manual Points Adjustment Card (bonus / deduction by parent)
    const adjustBox = document.getElementById('adminAdjustPointsBox');
    if (adjustBox) {
      const availXP = (window.LuminaDB && typeof window.LuminaDB.getAvailableXp === 'function')
        ? window.LuminaDB.getAvailableXp(student)
        : (student.xp || 0);
      const adjustments = Array.isArray(student.pointsAdjustments) ? student.pointsAdjustments.slice(0, 5) : [];
      adjustBox.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 class="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <span>⭐</span><span>Adjust Points — ${escapeHtml(student.name || 'Student')}</span>
          </h3>
          <span class="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black">Balance: ${(student.xp || 0).toLocaleString()} XP</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Available to spend: <strong>${availXP.toLocaleString()} XP</strong> (after pending reward holds) • Wallet: <strong>$${(student.cashBalance || 0).toFixed(2)}</strong>. Added points are spendable right away and sync to the student's device. Subtractions never take the balance below 0.</p>
        <div class="flex flex-wrap items-stretch gap-2">
          <input id="adminAdjustAmount" type="number" min="1" step="1" inputmode="numeric" placeholder="Points, e.g. 100" class="w-36 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold" />
          <input id="adminAdjustNote" type="text" maxlength="80" placeholder="Reason (optional) — e.g. Helped clean up" class="flex-1 min-w-[180px] px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm" />
          <button onclick="adminAdjustPoints(1)" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-sm transition btn-tactile">+ Add Points</button>
          <button onclick="adminAdjustPoints(-1)" class="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold text-sm border-2 border-rose-300 dark:border-rose-800 shadow-sm transition btn-tactile">− Subtract Points</button>
        </div>
        ${adjustments.length > 0 ? `
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Recent adjustments</p>
            <div class="space-y-1.5">
              ${adjustments.map(a => `
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="font-black ${a.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">${a.delta >= 0 ? '+' : ''}${(a.delta || 0).toLocaleString()} XP</span>
                  <span class="flex-1 text-slate-600 dark:text-slate-300 truncate">${escapeHtml(a.reason || 'Manual adjustment')}</span>
                  <span class="text-slate-400">${escapeHtml(a.date || '')} • bal ${(a.balanceAfter || 0).toLocaleString()}</span>
                </div>`).join('')}
            </div>
          </div>` : '<p class="mt-3 text-xs text-slate-400">No manual adjustments yet for this student.</p>'}
      `;
    }

    // 1c. Wrong-Answer Penalty control
    const penaltyBox = document.getElementById('adminPenaltyBox');
    if (penaltyBox) {
      const penalty = getWrongAnswerPenalty();
      penaltyBox.innerHTML = `
        <div class="p-4 rounded-2xl ${penalty > 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'}">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2"><span>⚠️</span><span>Wrong-Answer Penalty</span></h4>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black ${penalty > 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">${penalty > 0 ? `ON — −${penalty} XP per wrong answer` : 'OFF — wrong answers earn effort points'}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Stops tap-everything farming: with a penalty on, every wrong tap <strong>costs</strong> points instead of earning a small effort bonus. Correct answers are unaffected, and a balance never drops below 0. Applies to SAT questions, quizzes, and spelling challenges on all devices (syncs via the cloud). Set to 0 to turn it off.</p>
          <div class="flex flex-wrap items-center gap-2">
            <input id="adminPenaltyInput" type="number" min="0" max="200" step="1" inputmode="numeric" value="${penalty}" class="w-28 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold" />
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400">XP per wrong answer (0 = off)</span>
            <button onclick="saveWrongAnswerPenaltySetting()" class="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 font-extrabold text-sm shadow-sm transition btn-tactile">Save Penalty</button>
          </div>
        </div>
      `;
    }

    // 2. Completed Areas Highlight Section
    const tracks = getStudentTrackProgressList(student.id);
    const completedTracks = tracks.filter(t => t.isCompleted);
    const completedGrid = document.getElementById('adminCompletedAreasGrid');
    const badgeEl = document.getElementById('adminCompletedAreasCountBadge');

    if (badgeEl) {
      badgeEl.innerHTML = `
        <span class="px-3 py-1 rounded-full text-xs font-black ${completedTracks.length > 0 ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">
          ${completedTracks.length} of ${tracks.length} Tracks Finished
        </span>
      `;
    }

    if (completedGrid) {
      if (completedTracks.length === 0) {
        completedGrid.className = "col-span-full py-8 text-center text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700";
        completedGrid.innerHTML = `
          <div class="text-4xl mb-2">🌱</div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">${escapeHtml(student.name || 'Student')} has not completely finished any full track yet.</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">As questions and matching cards are completed, finished tracks will appear right here with one-click question expansion!</p>
        `;
      } else {
        completedGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
        completedGrid.innerHTML = completedTracks.map(t => `
          <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 font-black text-[10px] uppercase tracking-wider">
                  ✓ 100% Completed
                </span>
                <span class="text-xs font-extrabold text-emerald-900 dark:text-emerald-300">${t.completedCount} / ${t.total} Done</span>
              </div>
              <h4 class="text-base font-black text-slate-900 dark:text-slate-100">${escapeHtml(t.title)}</h4>
              <p class="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1">Student has answered all questions in this track! Ready for new questions.</p>
            </div>
            <div class="mt-4 pt-3 border-t border-emerald-200/70 dark:border-emerald-800/70 flex flex-wrap items-center gap-2">
              <button onclick="prefillAdminQuestionCreator('${escapeHtml(t.domain)}', '${t.targetProfile}')" class="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition btn-tactile">
                <span>➕</span>
                <span>Add Questions to This Track</span>
              </button>
              <button onclick="resetStudentArea('${student.id}', '${t.key}')" class="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800 transition btn-tactile">
                <span>🔄 Reset</span>
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // 3. All Curriculum Tracks Grid
    const allTracksGrid = document.getElementById('adminAllTracksGrid');
    if (allTracksGrid) {
      const overallSum = tracks.reduce((acc, t) => acc + t.completedCount, 0);
      const overallTotal = tracks.reduce((acc, t) => acc + t.total, 0);
      const overallPct = overallTotal ? Math.round((overallSum / overallTotal) * 100) : 0;

      const pctEl = document.getElementById('adminStudentOverallProgressText');
      if (pctEl) pctEl.innerText = `${overallPct}% (${overallSum} / ${overallTotal} items)`;

      allTracksGrid.innerHTML = tracks.map(t => {
        const isDone = t.isCompleted;
        const barColor = isDone ? 'bg-emerald-500' : (t.percent > 0 ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600');
        return `
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border ${isDone ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700'} shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-1 mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">${escapeHtml(t.category)}</span>
                <span class="text-xs font-black ${isDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}">${t.completedCount} / ${t.total} (${t.percent}%)</span>
              </div>
              <h5 class="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">${escapeHtml(t.title)}</h5>
              
              <!-- Progress Bar -->
              <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden my-2.5">
                <div class="h-full rounded-full transition-all duration-500 ${barColor}" style="width: ${t.percent}%"></div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
              <button onclick="prefillAdminQuestionCreator('${escapeHtml(t.domain)}', '${t.targetProfile}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold transition flex items-center gap-1">
                <span>➕ Add Q</span>
              </button>
              <button onclick="resetStudentArea('${student.id}', '${t.key}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition" title="Reset this section for ${escapeHtml(student.name)}">
                <span>🔄 Reset</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Render Section XP Multipliers Grid
    renderAdminSectionXPGrid();

    // 5. Render Rewards, Cash Allowances & Profile PINs
    renderAdminRewardsSection();
  }

  function resetStudentArea(pid, trackKey) {
    const student = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    const name = student ? student.name : 'Student';
    if (window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(pid, trackKey);
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`Reset track "${trackKey}" for ${name}! Ready for practice.`);
    }
    renderAdminPortal();
    refreshHeaderUI();
  }

  function resetStudentAllCompletedAreas(pid) {
    const student = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    const name = student ? student.name : 'Student';
    if (window.LuminaDB && typeof window.LuminaDB.resetCompletedQuestions === 'function') {
      window.LuminaDB.resetCompletedQuestions(pid, 'ALL');
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`Reset all completed tracks for ${name}! Ready for a clean start.`);
    }
    renderAdminPortal();
    refreshHeaderUI();
  }

  function updateAdminDomainDropdown(selectedDomain) {
    const profileSelect = document.getElementById('adminNewQProfile');
    const domainSelect = document.getElementById('adminNewQDomain');
    if (!profileSelect || !domainSelect) return;

    const isKid = profileSelect.value === 'kid';
    const kidDomains = [
      '6+ Numbers & Math',
      '6+ Spelling Bee',
      '6+ Story Reading & Comprehension',
      '6+ Grammar & Sentence Building',
      'Sight Words & Phonics',
      'Animals & Science',
      'Malayalam Language Pack',
      'Hindi Language Pack',
      'Spanish Language Pack'
    ];
    const teenDomains = [
      'Information & Ideas',
      'Craft & Structure',
      'Expression of Ideas',
      'Standard English Conventions',
      'Algebra',
      'Advanced Math',
      'Problem-Solving & Data Analysis',
      'Geometry & Trigonometry',
      'Malayalam Language Pack',
      'Hindi Language Pack',
      'Spanish Language Pack'
    ];

    const list = isKid ? kidDomains : teenDomains;
    domainSelect.innerHTML = list.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    if (selectedDomain && list.includes(selectedDomain)) {
      domainSelect.value = selectedDomain;
    }
  }

  function prefillAdminQuestionCreator(domain, targetProfile) {
    const box = document.getElementById('adminQuestionCreatorBox');
    if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const prof = document.getElementById('adminNewQProfile');
    if (prof) {
      prof.value = targetProfile || 'kid';
    }
    updateAdminDomainDropdown(domain);

    const txt = document.getElementById('adminNewQText');
    if (txt) txt.focus();
    if (typeof window.showToast === 'function') {
      window.showToast(`Ready to add questions for ${domain}! Fill in the form below.`);
    }
  }

  function resetAdminQuestionForm() {
    const form = document.getElementById('adminNewQuestionForm');
    if (form) form.reset();
    updateAdminDomainDropdown();
  }

  function handleAdminCreateQuestionSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const profEl = document.getElementById('adminNewQProfile');
    const domainEl = document.getElementById('adminNewQDomain');
    const paraEl = document.getElementById('adminNewQParagraph');
    const qTextEl = document.getElementById('adminNewQText');
    const cAEl = document.getElementById('adminNewQChoiceA');
    const cBEl = document.getElementById('adminNewQChoiceB');
    const cCEl = document.getElementById('adminNewQChoiceC');
    const cDEl = document.getElementById('adminNewQChoiceD');
    const correctLetterEl = document.getElementById('adminNewQCorrectAnswer');
    const expEl = document.getElementById('adminNewQExplanation');

    if (!profEl || !domainEl || !qTextEl) return;

    const prof = profEl.value;
    const domain = domainEl.value;
    const para = paraEl ? paraEl.value.trim() : '';
    const qText = qTextEl.value.trim();
    const cA = cAEl ? cAEl.value.trim() : '';
    const cB = cBEl ? cBEl.value.trim() : '';
    const cC = cCEl ? cCEl.value.trim() : '';
    const cD = cDEl ? cDEl.value.trim() : '';
    const correctLetter = correctLetterEl ? correctLetterEl.value : 'A';
    const exp = expEl ? expEl.value.trim() : '';

    if (!qText || !cA || !cB || !cC || !cD) {
      if (typeof window.showToast === 'function') window.showToast("Please fill in question prompt and all four choices!");
      return;
    }

    const newQuestion = {
      id: 'q_' + prof + '_' + Date.now().toString(36),
      targetProfile: prof,
      domain: domain,
      skill: domain,
      question: {
        paragraph: para || null,
        question: qText,
        choices: {
          A: cA,
          B: cB,
          C: cC,
          D: cD
        },
        correct_answer: correctLetter,
        explanation: exp || `The correct answer is ${correctLetter}: ${correctLetter === 'A' ? cA : (correctLetter === 'B' ? cB : (correctLetter === 'C' ? cC : cD))}`
      }
    };

    if (window.LuminaDB && typeof window.LuminaDB.addQuestion === 'function') {
      window.LuminaDB.addQuestion(newQuestion);
    } else {
      appData.questions = appData.questions || [];
      appData.questions.unshift(newQuestion);
      saveState();
    }

    if (typeof window.showToast === 'function') {
      window.showToast(`✓ Added new question to ${domain} and synced to cloud!`);
    }

    resetAdminQuestionForm();
    renderAdminPortal();
    refreshHeaderUI();
  }

  /* =====================================================================
     CUSTOM SECTION XP MULTIPLIERS & MOTIVATION SYSTEM
     ===================================================================== */
  const DEFAULT_SECTION_XP = {
    // Math Operations
    'math_division': 50,       // ➗ Division promoted by default (Tough)
    'math_multiplication': 35, // ✖️ Multiplication
    'math_subtraction': 20,    // ➖ Subtraction
    'math_addition': 20,       // ➕ Addition
    'numbers': 25,

    // Spelling Bee Levels
    'spelling_big': 50,        // 🐝 Big Words (7+ letters, Tough)
    'spelling_6': 30,          // 🐝 6-Letter Words
    'spelling_5': 25,          // 🐝 5-Letter Words
    'spelling_4': 20,          // 🐝 4-Letter Words
    'spelling_3': 15,          // 🐝 3-Letter Words
    'spelling': 25,            // 🐝 General Spelling

    // Trilingual Studio (Sentences, Words, Letters)
    'malayalam_sentences': 50, // 🌴 Malayalam Small Sentences (Tough)
    'malayalam_words': 20,     // 🌴 Malayalam Core Words
    'malayalam_letters': 15,   // 🌴 Malayalam Alphabet Letters
    'malayalam': 30,
    'malayalam_spelling': 30,   // 🐝 Malayalam Spelling Bee

    'hindi_sentences': 50,     // 🪔 Hindi Small Sentences (Tough)
    'hindi_words': 20,         // 🪔 Hindi Core Words
    'hindi_letters': 15,       // 🪔 Hindi Alphabet Letters
    'hindi': 30,
    'hindi_spelling': 30,   // 🐝 Hindi Spelling Bee

    'spanish_sentences': 50,   // 🇪🇸 Spanish Small Sentences (Tough)
    'spanish_words': 20,       // 🇪🇸 Spanish Core Words
    'spanish': 30,
    'spanish_spelling': 30,   // 🐝 Spanish Spelling Bee

    'french_sentences': 50,    // 🇫🇷 French Small Sentences (Tough)
    'french_words': 20,        // 🇫🇷 French Core Words
    'french': 30,
    'french_spelling': 30,   // 🐝 French Spelling Bee

    'italian_sentences': 50,   // 🇮🇹 Italian Small Sentences (Tough)
    'italian_words': 20,       // 🇮🇹 Italian Core Words
    'italian': 30,
    'italian_spelling': 30,   // 🐝 Italian Spelling Bee

    // Reading Comprehension & Facts
    'comprehension': 35,       // 📖 Story Reading & Comprehension
    'grammar': 25,             // ✏️ Grammar & Sentence Building
    'phonics': 20,             // 🔤 Sight Words & Phonics
    'animals': 20,             // 🦁 Animals & Science Facts
    'ai': 25,                  // 🤖 AI Basics

    // Teen Studio
    'sat_math': 40,            // 📐 SAT Advanced Math & Algebra (Tough)
    'sat_rw': 25,              // 📝 SAT Reading & Writing
    'sat': 30,
    'teen_spelling_bee': 50,   // 🏆 Scripps Bee & Etymology (Tough)
    'teen_spelling_sat': 35,   // 🎓 SAT Honors Vocabulary
    'teen_spelling_core': 25,  // 🎯 High School Core Spelling
    'teen_spelling': 35
  };

  const ADMIN_XP_SECTIONS = [
    // Math Operations
    { key: 'math_division', title: '➗ Math — Division', group: 'Math Operations', isTough: true, defaultXP: 50, hint: 'Sharing, grouping, and long division' },
    { key: 'math_multiplication', title: '✖️ Math — Multiplication', group: 'Math Operations', isTough: false, defaultXP: 35, hint: 'Times tables, arrays, and word problems' },
    { key: 'math_subtraction', title: '➖ Math — Subtraction', group: 'Math Operations', isTough: false, defaultXP: 20, hint: 'Minus, takeaway, and difference problems' },
    { key: 'math_addition', title: '➕ Math — Addition', group: 'Math Operations', isTough: false, defaultXP: 20, hint: 'Plus, sum, and combine math problems' },

    // Spelling Bee Levels
    { key: 'spelling_big', title: '🐝 Spelling — Big Words (7+ Letters)', group: 'Spelling Bee', isTough: true, defaultXP: 50, hint: 'Chameleon, dinosaur, chocolate, etc.' },
    { key: 'spelling_6', title: '🐝 Spelling — 6-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 30, hint: 'School, friend, monkey, etc.' },
    { key: 'spelling_5', title: '🐝 Spelling — 5-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 25, hint: 'Tiger, clock, water, apple, etc.' },
    { key: 'spelling_4', title: '🐝 Spelling — 4-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 20, hint: 'Book, bird, star, frog, etc.' },
    { key: 'spelling_3', title: '🐝 Spelling — 3-Letter Words', group: 'Spelling Bee', isTough: false, defaultXP: 15, hint: 'Cat, sun, dog, pig, etc.' },
    { key: 'spelling', title: '🐝 Spelling Bee (Standard Track)', group: 'Spelling Bee', isTough: false, defaultXP: 25, hint: 'General spelling builder curriculum' },

    // Trilingual Languages
    { key: 'malayalam_sentences', title: '🌴 Malayalam — Small Sentences', group: 'Languages', isTough: true, defaultXP: 50, hint: 'Conversational Malayalam sentences' },
    { key: 'malayalam_words', title: '🌴 Malayalam — Core Words', group: 'Languages', isTough: false, defaultXP: 20, hint: '100+ Vocabulary words' },
    { key: 'malayalam_letters', title: '🌴 Malayalam — Alphabet Letters', group: 'Languages', isTough: false, defaultXP: 15, hint: '50+ Malayalam letter sounds' },

    { key: 'hindi_sentences', title: '🪔 Hindi — Small Sentences', group: 'Languages', isTough: true, defaultXP: 50, hint: 'Conversational Hindi sentences' },
    { key: 'hindi_words', title: '🪔 Hindi — Core Words', group: 'Languages', isTough: false, defaultXP: 20, hint: '100+ Hindi vocabulary words' },
    { key: 'hindi_letters', title: '🪔 Hindi — Alphabet Letters', group: 'Languages', isTough: false, defaultXP: 15, hint: 'Devanagari letter sounds' },

    { key: 'spanish_sentences', title: '🇪🇸 Spanish — Small Sentences', group: 'Languages', isTough: true, defaultXP: 50, hint: 'Conversational Spanish sentences' },
    { key: 'spanish_words', title: '🇪🇸 Spanish — Core Words', group: 'Languages', isTough: false, defaultXP: 20, hint: '100+ Spanish vocabulary words' },
    { key: 'malayalam_spelling', title: '🌴 Malayalam — Spelling Bee', group: 'Languages', isTough: false, defaultXP: 30, hint: 'Build & type Malayalam word spellings' },
    { key: 'hindi_spelling', title: '🪔 Hindi — Spelling Bee', group: 'Languages', isTough: false, defaultXP: 30, hint: 'Build & type Hindi word spellings' },
    { key: 'spanish_spelling', title: '🇪🇸 Spanish — Spelling Bee', group: 'Languages', isTough: false, defaultXP: 30, hint: 'Build & type Spanish word spellings' },
    { key: 'french_spelling', title: '🇫🇷 French — Spelling Bee', group: 'Languages', isTough: false, defaultXP: 30, hint: 'Build & type French word spellings' },
    { key: 'italian_spelling', title: '🇮🇹 Italian — Spelling Bee', group: 'Languages', isTough: false, defaultXP: 30, hint: 'Build & type Italian word spellings' },

    // Reading Comprehension & Facts
    { key: 'comprehension', title: '📖 6+ Story Reading & Comprehension', group: 'Reading & Science', isTough: false, defaultXP: 35, hint: 'Reading passages & paragraph questions' },
    { key: 'grammar', title: '✏️ 6+ Grammar & Sentence Building', group: 'Reading & Science', isTough: false, defaultXP: 25, hint: 'Parts of speech & sentence structure' },
    { key: 'phonics', title: '🔤 Sight Words & Phonics', group: 'Reading & Science', isTough: false, defaultXP: 20, hint: 'Phonetic blends and sight words' },
    { key: 'animals', title: '🦁 Animals & Science Facts', group: 'Reading & Science', isTough: false, defaultXP: 20, hint: 'Animal science and nature facts' },
    { key: 'ai', title: '🤖 AI Basics', group: 'Reading & Science', isTough: false, defaultXP: 25, hint: 'Kid AI Basics flashcards & quizzes' },

    // Teen Studio
    { key: 'sat_math', title: '📐 SAT Advanced Math & Algebra', group: 'Digital SAT', isTough: true, defaultXP: 40, hint: '13+ College Board SAT Math' },
    { key: 'sat_rw', title: '📝 SAT Reading & Writing', group: 'Digital SAT', isTough: false, defaultXP: 25, hint: '13+ College Board SAT Verbal' },
    { key: 'teen_spelling_bee', title: '🏆 13+ Scripps Bee & Etymology', group: 'Teen Spelling', isTough: true, defaultXP: 50, hint: 'Championship spelling & classical roots' },
    { key: 'teen_spelling_sat', title: '🎓 13+ SAT Honors Spelling', group: 'Teen Spelling', isTough: false, defaultXP: 35, hint: 'High-frequency SAT & AP vocabulary' },
    { key: 'teen_spelling_core', title: '🎯 13+ High School Core Spelling', group: 'Teen Spelling', isTough: false, defaultXP: 25, hint: 'Common high-school essay spelling traps' }
  ];

  function getSectionXP(trackKey, subKey) {
    const custom = (window.LuminaDB && window.LuminaDB.state && window.LuminaDB.state.sectionXP) || {};
    if (subKey && custom[`${trackKey}_${subKey}`] !== undefined) {
      return Number(custom[`${trackKey}_${subKey}`]) || 20;
    }
    if (trackKey && custom[trackKey] !== undefined) {
      return Number(custom[trackKey]) || 20;
    }
    if (subKey && DEFAULT_SECTION_XP[`${trackKey}_${subKey}`] !== undefined) {
      return DEFAULT_SECTION_XP[`${trackKey}_${subKey}`];
    }
    if (trackKey && DEFAULT_SECTION_XP[trackKey] !== undefined) {
      return DEFAULT_SECTION_XP[trackKey];
    }
    return 20;
  }

  function getWrongAnswerPenalty() {
    const raw = (window.LuminaDB && window.LuminaDB.state) ? Number(window.LuminaDB.state.wrongAnswerPenalty) : 0;
    return Math.max(0, Math.min(200, Math.round(raw || 0)));
  }

  // XP outcome for a WRONG answer. When the parent penalty is on (> 0), a
  // wrong answer costs that many points; otherwise the activity's usual
  // small effort award (effortFallback) applies, exactly as before.
  function wrongAnswerXP(effortFallback) {
    const penalty = getWrongAnswerPenalty();
    return penalty > 0 ? -penalty : effortFallback;
  }
  window.getWrongAnswerPenalty = getWrongAnswerPenalty;
  window.wrongAnswerXP = wrongAnswerXP;

  function setSectionXP(trackKey, xp) {
    if (!window.LuminaDB) return;
    if (!window.LuminaDB.state.sectionXP) window.LuminaDB.state.sectionXP = {};
    const cleanVal = Math.max(5, Math.min(500, Math.round(Number(xp) || 20)));
    window.LuminaDB.state.sectionXP[trackKey] = cleanVal;
    if (window.LuminaDB.pending) window.LuminaDB.pending.meta = true;
    if (typeof window.LuminaDB.saveLocal === 'function') window.LuminaDB.saveLocal();
    if (typeof window.LuminaDB.scheduleCloudSync === 'function') window.LuminaDB.scheduleCloudSync(500);
    renderAdminSectionXPGrid();
    refreshStudentXPBadges();
    if (typeof window.showToast === 'function') {
      window.showToast(`Updated ${trackKey.replace(/_/g, ' ')} reward to +${cleanVal} XP!`);
    }
  }

  function resetAllSectionXPToDefaults() {
    if (!confirm('Reset all section XP rewards back to standard defaults?')) return;
    if (window.LuminaDB && window.LuminaDB.state) {
      window.LuminaDB.state.sectionXP = {};
      if (typeof window.LuminaDB.saveLocal === 'function') window.LuminaDB.saveLocal();
      if (typeof window.LuminaDB.scheduleCloudSync === 'function') window.LuminaDB.scheduleCloudSync(500);
    }
    renderAdminSectionXPGrid();
    refreshStudentXPBadges();
    if (typeof window.showToast === 'function') {
      window.showToast('All section XP rewards reset to standard defaults.');
    }
  }

  function adminAdjustPoints(sign) {
    const amtEl = document.getElementById('adminAdjustAmount');
    const noteEl = document.getElementById('adminAdjustNote');
    const amount = Math.abs(Math.round(Number(amtEl && amtEl.value) || 0));
    if (!amount) {
      if (typeof window.showToast === 'function') window.showToast('Enter a points amount first.');
      return;
    }
    if (!window.LuminaDB || typeof window.LuminaDB.adjustProfilePoints !== 'function') return;
    const res = window.LuminaDB.adjustProfilePoints(adminActiveStudentId, sign * amount, noteEl ? noteEl.value : '');
    if (!res.ok) {
      if (typeof window.showToast === 'function') window.showToast(res.error || 'Could not adjust points.');
      return;
    }
    if (typeof window.showToast === 'function') {
      const who = (res.profile && res.profile.name) || 'student';
      window.showToast(res.appliedDelta >= 0
        ? `+${res.appliedDelta} XP added to ${who} — new balance ${(res.profile.xp || 0).toLocaleString()} XP`
        : `${res.appliedDelta} XP subtracted from ${who} — new balance ${(res.profile.xp || 0).toLocaleString()} XP`);
    }
    renderAdminPortal();
    refreshHeaderUI();
  }
  window.adminAdjustPoints = adminAdjustPoints;

  function saveWrongAnswerPenaltySetting() {
    const el = document.getElementById('adminPenaltyInput');
    const val = Math.max(0, Math.min(200, Math.round(Number(el && el.value) || 0)));
    if (window.LuminaDB && typeof window.LuminaDB.setWrongAnswerPenalty === 'function') {
      window.LuminaDB.setWrongAnswerPenalty(val);
    } else if (window.LuminaDB && window.LuminaDB.state) {
      window.LuminaDB.state.wrongAnswerPenalty = val;
      if (typeof window.LuminaDB.saveLocal === 'function') window.LuminaDB.saveLocal();
    }
    if (typeof window.showToast === 'function') {
      window.showToast(val > 0
        ? `Wrong-answer penalty ON: −${val} XP for every wrong answer.`
        : 'Wrong-answer penalty OFF — wrong answers earn effort points again.');
    }
    renderAdminPortal();
  }
  window.saveWrongAnswerPenaltySetting = saveWrongAnswerPenaltySetting;

  function renderAdminSectionXPGrid() {
    const grid = document.getElementById('adminSectionXPGrid');
    if (!grid) return;

    grid.innerHTML = ADMIN_XP_SECTIONS.map(sec => {
      const currentXP = getSectionXP(sec.key);
      const isHighXP = currentXP >= 40;
      const isSuperHigh = currentXP >= 75;

      const badgeCls = isSuperHigh
        ? "bg-rose-100 text-rose-950 border-rose-300 animate-pulse"
        : (isHighXP ? "bg-amber-100 text-amber-950 border-amber-300" : "bg-indigo-50 text-indigo-800 border-indigo-200");

      return `
        <div class="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-850 dark:bg-slate-800/60 border-2 ${isHighXP ? 'border-amber-300/80 dark:border-amber-700/80 bg-amber-50/30 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm flex flex-col justify-between transition hover:border-indigo-300 dark:hover:border-indigo-600">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${escapeHtml(sec.group)}</span>
              ${sec.isTough ? '<span class="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-extrabold flex items-center gap-1"><span>🔥</span><span>Tough Topic</span></span>' : ''}
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug">${escapeHtml(sec.title)}</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">${escapeHtml(sec.hint)}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700">
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="text-xs font-bold text-slate-600 dark:text-slate-300">Reward:</span>
              <span class="px-3 py-1 rounded-full text-xs font-black border ${badgeCls} flex items-center gap-1 shadow-2xs">
                <span>${isSuperHigh ? '🚀' : (isHighXP ? '🔥' : '⚡')}</span>
                <span>+${currentXP} XP</span>
              </span>
            </div>

            <!-- Preset buttons -->
            <div class="grid grid-cols-4 gap-1.5 mb-2.5">
              <button onclick="setSectionXP('${sec.key}', 10)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 10 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'}">10</button>
              <button onclick="setSectionXP('${sec.key}', 20)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 20 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'}">20</button>
              <button onclick="setSectionXP('${sec.key}', 50)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 50 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-600'}">50 🌟</button>
              <button onclick="setSectionXP('${sec.key}', 100)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 100 ? 'bg-rose-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-slate-600'}">100 🔥</button>
            </div>

            <!-- Custom input -->
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Custom XP:</span>
              <div class="flex items-center gap-1">
                <input type="number" min="5" max="500" step="5" value="${currentXP}" onchange="setSectionXP('${sec.key}', this.value)" class="w-16 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-indigo-500" />
                <span class="font-bold text-slate-500 dark:text-slate-400">XP</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function refreshStudentXPBadges() {
    // 1. Kid categories
    const catMap = {
      'spelling': () => Math.max(getSectionXP('spelling_big'), getSectionXP('spelling_6'), getSectionXP('spelling_5'), getSectionXP('spelling_4'), getSectionXP('spelling_3'), getSectionXP('spelling')),
      'comprehension': () => getSectionXP('comprehension'),
      'grammar': () => getSectionXP('grammar'),
      'numbers': () => Math.max(getSectionXP('math_division'), getSectionXP('math_multiplication'), getSectionXP('math_subtraction'), getSectionXP('math_addition'), getSectionXP('numbers')),
      'phonics': () => getSectionXP('phonics'),
      'animals': () => getSectionXP('animals'),
      'ai': () => getSectionXP('ai'),
      'malayalam': () => Math.max(getSectionXP('malayalam_sentences', getSectionXP('malayalam_spelling')), getSectionXP('malayalam_words'), getSectionXP('malayalam_letters')),
      'hindi': () => Math.max(getSectionXP('hindi_sentences', getSectionXP('hindi_spelling')), getSectionXP('hindi_words'), getSectionXP('hindi_letters')),
      'spanish': () => Math.max(getSectionXP('spanish_sentences', getSectionXP('spanish_spelling')), getSectionXP('spanish_words')),
      'french': () => Math.max(getSectionXP('french_sentences', getSectionXP('french_spelling')), getSectionXP('french_words')),
      'italian': () => Math.max(getSectionXP('italian_sentences', getSectionXP('italian_spelling')), getSectionXP('italian_words'))
    };

    Object.entries(catMap).forEach(([idSuffix, getVal]) => {
      const btn = document.getElementById(`kidCat-${idSuffix}`);
      if (!btn) return;
      let badge = btn.querySelector('.kid-cat-xp-badge');
      const xp = (typeof getVal === 'function') ? getVal() : getSectionXP(getVal);
      const isHigh = xp >= 40;
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'kid-cat-xp-badge';
        btn.appendChild(badge);
      }
      badge.className = `kid-cat-xp-badge px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${isHigh ? 'bg-rose-500 text-white shadow-xs animate-bounce' : 'bg-slate-900/10 text-slate-800 dark:bg-white/10 dark:text-slate-200'}`;
      badge.innerText = isHigh ? `🔥 +${xp} XP` : `+${xp} XP`;
    });

    // 2. Kid trilingual sub-nav
    const cat = (window.appData && window.appData.kidCategory) || 'malayalam';
    if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish' || cat === 'french' || cat === 'italian') {
      const bLet = document.getElementById('btn-kid-sub-letters');
      const bWrd = document.getElementById('btn-kid-sub-words');
      const bSen = document.getElementById('btn-kid-sub-sentences');
      const xpLet = getSectionXP(cat, 'letters');
      const xpWrd = getSectionXP(cat, 'words');
      const xpSen = getSectionXP(cat, 'sentences');
      if (bLet) bLet.innerHTML = `🔤 Letters <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-900/10 ml-1">+${xpLet}</span>`;
      if (bWrd) bWrd.innerHTML = `📖 Words <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-900/10 ml-1">+${xpWrd}</span>`;
      if (bSen) bSen.innerHTML = `💬 Sentences <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full ${xpSen >= 40 ? 'bg-rose-500 text-white' : 'bg-slate-900/10'} ml-1">${xpSen >= 40 ? '🔥 ' : ''}+${xpSen}</span>`;
    }

    // 3. Teen trilingual sub-nav
    const teenLang = (window.appData && window.appData.activeLanguage) || 'malayalam';
    const tbLet = document.getElementById('btn-teen-sub-letters');
    const tbWrd = document.getElementById('btn-teen-sub-words');
    const tbSen = document.getElementById('btn-teen-sub-sentences');
    const txpLet = getSectionXP(teenLang, 'letters');
    const txpWrd = getSectionXP(teenLang, 'words');
    const txpSen = getSectionXP(teenLang, 'sentences');
    if (tbLet) tbLet.innerHTML = `🔤 Alphabet Letters <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ml-1">+${txpLet}</span>`;
    if (tbWrd) tbWrd.innerHTML = `📖 Core Words <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 ml-1">+${txpWrd}</span>`;
    if (tbSen) tbSen.innerHTML = `💬 Small Sentences <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full ${txpSen >= 40 ? 'bg-rose-500 text-white shadow-xs' : 'bg-indigo-100 text-indigo-900'} ml-1">${txpSen >= 40 ? '🔥 ' : ''}+${txpSen} XP</span>`;

    // 4. Spelling level buttons
    if (typeof window.ensureSpellingLevelBar === 'function') {
      window.ensureSpellingLevelBar();
    }
    // 5. Math operation filter bar
    if (typeof window.ensureMathOpBar === 'function') {
      window.ensureMathOpBar();
    }
  }

  /* =====================================================================
     PARENT PORTAL REWARDS, CASH ALLOWANCES & PIN CONFIGURATOR
     ===================================================================== */
  const PRESET_REWARD_OPTIONS = [
    { id: 'ring_pop', label: '🍭 Ring Pop', value: 'Ring Pop 🍭' },
    { id: 'snickers', label: '🍫 Snickers Bar', value: 'Snickers Bar 🍫' },
    { id: 'tv_1hr', label: '📺 1 Hour TV Time', value: '1 Hour TV Time 📺' },
    { id: 'cash_1', label: '💵 20K XP: $1 Cash', value: '$1 Cash Allowance 💵' },
    { id: 'cash_2', label: '💵 30K XP: $2 Cash', value: '$2 Cash Allowance 💵' },
    { id: 'ice_cream', label: '🍦 Ice Cream Trip', value: 'Ice Cream Trip 🍦' },
    { id: 'book', label: '📚 Book of Choice', value: 'Book of Choice 📚' },
    { id: 'cash_4', label: '💵 60K XP: $4 Cash', value: '$4 Cash Allowance 💵' },
    { id: 'game', label: '🎮 Video Game / Robux', value: 'Video Game / Robux Card 🎮' }
  ];

  const selectedPresetRewardIds = new Set();

  function handleTogglePresetSelection(presetId) {
    if (selectedPresetRewardIds.has(presetId)) {
      selectedPresetRewardIds.delete(presetId);
    } else {
      selectedPresetRewardIds.add(presetId);
    }
    renderAdminRewardsPresetsRow();
  }

  function renderAdminRewardsPresetsRow() {
    const container = document.getElementById('adminRewardPresetsRow');
    if (!container) return;

    container.innerHTML = PRESET_REWARD_OPTIONS.map(p => {
      const isSelected = selectedPresetRewardIds.has(p.id);
      return `
        <button type="button" onclick="handleTogglePresetSelection('${p.id}')"
          class="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 btn-tactile cursor-pointer ${isSelected
            ? 'bg-indigo-600 text-white shadow-xs border-2 border-indigo-700'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}">
          <span>${isSelected ? '✓' : '+'}</span>
          <span>${escapeHtml(p.label)}</span>
        </button>
      `;
    }).join('');

    const countBadge = document.getElementById('adminRewardSelectedPresetsCount');
    if (countBadge) {
      countBadge.textContent = `${selectedPresetRewardIds.size} selected`;
      countBadge.className = `text-[11px] font-bold px-2 py-0.5 rounded-full ${selectedPresetRewardIds.size > 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`;
    }
  }

  function handleAddSelectedPresetsToTier() {
    if (selectedPresetRewardIds.size === 0) {
      showToast('Select one or more popular presets first!');
      return;
    }
    const selectEl = document.getElementById('adminRewardTargetTierSelect');
    const tierId = selectEl ? selectEl.value : null;
    if (!tierId) return;

    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    if (!Array.isArray(tier.options)) tier.options = [];

    let addedCount = 0;
    selectedPresetRewardIds.forEach(pId => {
      const preset = PRESET_REWARD_OPTIONS.find(p => p.id === pId);
      if (preset && !tier.options.includes(preset.value)) {
        tier.options.push(preset.value);
        addedCount++;
      }
    });

    if (window.LuminaDB && typeof window.LuminaDB.saveRewardTiers === 'function') {
      window.LuminaDB.saveRewardTiers(tiers);
    }
    selectedPresetRewardIds.clear();
    renderAdminRewardsSection();
    showToast(`Added ${addedCount} preset reward(s) to ${tier.label || tier.points + ' XP'}!`);
  }

  function renderAdminRewardsSection() {
    const allProfiles = (window.LuminaDB && typeof window.LuminaDB.getAllProfiles === 'function')
      ? window.LuminaDB.getAllProfiles()
      : [];
    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const catalog = (window.LuminaDB && typeof window.LuminaDB.getPrizeCatalog === 'function')
      ? window.LuminaDB.getPrizeCatalog()
      : [];
    const pendingList = (window.LuminaDB && typeof window.LuminaDB.getPendingRedemptions === 'function')
      ? window.LuminaDB.getPendingRedemptions()
      : [];

    // 1. Pending Approvals Queue
    const pendingContainer = document.getElementById('adminPendingApprovalsContainer');
    const pendingHeaderBadge = document.getElementById('adminPendingApprovalsCountBadge');
    if (pendingHeaderBadge) {
      pendingHeaderBadge.innerHTML = pendingList.length > 0
        ? `<span class="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">⚠️ ${pendingList.length} Awaiting Approval</span>`
        : `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">✓ All Caught Up</span>`;
    }

    if (pendingContainer) {
      if (pendingList.length === 0) {
        pendingContainer.innerHTML = `
          <div class="py-6 text-center text-slate-400 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <span class="text-3xl block mb-1">🎉</span>
            <p class="text-xs font-bold text-slate-600 dark:text-slate-300">No pending student redemptions or payout requests!</p>
            <p class="text-[11px] text-slate-400 mt-0.5">When students request prizes or wallet payouts, they will appear here for your review and approval.</p>
          </div>
        `;
      } else {
        pendingContainer.innerHTML = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${pendingList.map(r => `
              <div class="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 shadow-sm flex flex-col justify-between gap-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="text-2xl">${escapeHtml(r.studentAvatar || '👤')}</span>
                    <div>
                      <h4 class="font-extrabold text-sm text-slate-900 dark:text-slate-100">${escapeHtml(r.studentName)}</h4>
                      <p class="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">${new Date(r.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 uppercase">
                    ${r.isPayout ? 'Cash Payout' : (r.isCashConversion ? 'XP to Wallet' : 'Prize Claim')}
                  </span>
                </div>

                <div class="py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80">
                  <p class="font-black text-sm text-slate-900 dark:text-slate-100">${escapeHtml(r.reward)}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Payment: <strong class="text-indigo-600 dark:text-indigo-400">${r.paymentMethod === 'wallet' ? `$${(r.cashCost || 0).toFixed(2)} from Wallet` : `⚡ ${(r.tierPoints || 0).toLocaleString()} XP`}</strong>
                  </p>
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <button type="button" onclick="handleApproveRedemption('${r.studentId}', '${r.id}')"
                    class="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 btn-tactile cursor-pointer">
                    <span>✅</span>
                    <span>Approve</span>
                  </button>
                  <button type="button" onclick="handleRejectRedemption('${r.studentId}', '${r.id}')"
                    class="py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-700 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900 transition btn-tactile cursor-pointer">
                    <span>❌ Reject</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // 2. Student Cash Allowances & Profile PINs
    const cashContainer = document.getElementById('adminStudentCashGrid');
    if (cashContainer) {
      cashContainer.innerHTML = allProfiles.map(p => {
        const cash = p.cashBalance || 0;
        const availableXP = (window.LuminaDB && typeof window.LuminaDB.getAvailableXp === 'function')
          ? window.LuminaDB.getAvailableXp(p)
          : Math.max(0, (p.xp || 0) - (p.totalXpSpent || 0));
        const pendingXp = Math.max(0, (p.xp || 0) - availableXP);
        return `
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-3xl">
                    ${escapeHtml(p.avatar || '👤')}
                  </div>
                  <div>
                    <h4 class="font-extrabold text-base text-slate-900 dark:text-slate-100">${escapeHtml(p.name)}</h4>
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${p.ageGroup === 'kid' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'}">
                      ${escapeHtml(p.ageLabel || p.ageGroup)}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Wallet Cash</span>
                  <span class="text-2xl font-black text-emerald-700 dark:text-emerald-300">$${cash.toFixed(2)}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Current Balance</span>
                  <span class="font-black text-indigo-600 dark:text-indigo-400 text-sm">⚡ ${(p.xp || 0).toLocaleString()} XP</span>
                  ${pendingXp > 0 ? `<span class="text-[10px] text-amber-600 dark:text-amber-400 block font-semibold">(${availableXP.toLocaleString()} available)</span>` : ''}
                </div>
                <div>
                  <span class="text-[10px] uppercase font-bold text-slate-400 block">Total XP Redeemed</span>
                  <span class="font-bold text-slate-700 dark:text-slate-300 text-sm">⚡ ${(p.totalXpSpent || 0).toLocaleString()} XP</span>
                </div>
              </div>

              <!-- Profile PIN Management -->
              <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>Profile PIN:</span>
                </span>
                <div class="flex items-center gap-1.5">
                  <input type="password" id="adminStudentPin_${p.id}" value="${escapeHtml(p.pin || '1234')}" maxlength="4" class="w-16 text-center font-mono font-black text-sm px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-indigo-500 text-slate-900 dark:text-slate-100" />
                  <button type="button" onclick="handleUpdateStudentPin('${p.id}')" class="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition text-xs btn-tactile cursor-pointer">
                    Save PIN
                  </button>
                </div>
              </div>
            </div>

            <!-- Pay Out Cash Button -->
            <div>
              <button type="button" onclick="handleSettleStudentCash('${p.id}')" ${cash > 0 ? '' : 'disabled'}
                class="w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${cash > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs btn-tactile cursor-pointer' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}">
                <span>💵</span>
                <span>${cash > 0 ? `Mark Paid &amp; Settle $${cash.toFixed(2)}` : 'No Cash Owed ($0.00)'}</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 3. Customizable Prize Catalog & Points Exchange Rate Table
    const catalogContainer = document.getElementById('adminPrizeCatalogGrid');
    if (catalogContainer) {
      catalogContainer.innerHTML = catalog.map(item => `
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-2xl">${escapeHtml(item.icon || '🎁')}</span>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${item.category === 'cash' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'}">
                ${escapeHtml(item.category || 'treat')}
              </span>
            </div>
            <input type="text" value="${escapeHtml(item.name)}" onchange="handleUpdateCatalogName('${item.id}', this.value)"
              class="w-full text-xs font-black px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 mb-2" />
            <input type="text" value="${escapeHtml(item.description || '')}" placeholder="Short description..." onchange="handleUpdateCatalogDescription('${item.id}', this.value)"
              class="w-full text-[11px] px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 mb-3" />

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">Price ($)</label>
                <div class="flex items-center gap-1">
                  <span class="font-bold text-slate-500">$</span>
                  <input type="number" step="0.25" value="${item.price}" onchange="handleUpdateCatalogPrice('${item.id}', this.value)"
                    class="w-full font-mono font-black text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-emerald-700 dark:text-emerald-300" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">XP Points</label>
                <div class="flex items-center gap-1">
                  <span class="font-bold text-slate-500">⚡</span>
                  <input type="number" step="1000" value="${item.xpPoints}" onchange="handleUpdateCatalogXP('${item.id}', this.value)"
                    class="w-full font-mono font-black text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-indigo-700 dark:text-indigo-300" />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button type="button" onclick="handleDeleteCatalogItem('${item.id}')" class="text-xs font-bold text-rose-600 hover:text-rose-800 transition p-1 cursor-pointer" title="Delete item">
              🗑️ Remove Prize
            </button>
          </div>
        </div>
      `).join('');
    }

    // 4. Milestone Tiers Editor Grid
    renderAdminRewardsPresetsRow();
    const targetSelect = document.getElementById('adminRewardTargetTierSelect');
    if (targetSelect) {
      targetSelect.innerHTML = tiers.map(t => `
        <option value="${t.id}">${t.points.toLocaleString()} XP Milestone (${escapeHtml(t.label || '')})</option>
      `).join('');
    }

    const tiersContainer = document.getElementById('adminRewardTiersEditorGrid');
    if (tiersContainer) {
      tiersContainer.innerHTML = tiers.map((tier) => {
        const optionsTags = (tier.options || []).map((opt, oIdx) => `
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700">
            <span>${opt.includes('$') ? '💵' : '🎁'}</span>
            <span>${escapeHtml(opt)}</span>
            <button type="button" onclick="handleRemoveRewardOption('${tier.id}', ${oIdx})" class="text-rose-500 hover:text-rose-700 font-extrabold ml-1 cursor-pointer" title="Remove option">✕</button>
          </span>
        `).join('');

        return `
          <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-black text-indigo-600 dark:text-indigo-400">⚡</span>
                  <input type="number" value="${tier.points}" onchange="handleUpdateTierPoints('${tier.id}', this.value)" class="w-28 px-2 py-1 text-sm font-black font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-indigo-500 text-slate-900 dark:text-slate-100" />
                  <span class="text-xs font-bold text-slate-500">XP</span>
                </div>
                <button type="button" onclick="handleDeleteRewardTier('${tier.id}')" class="text-xs font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer" title="Delete Tier">
                  🗑️ Delete
                </button>
              </div>

              <input type="text" value="${escapeHtml(tier.label || '')}" placeholder="Tier Label" onchange="handleUpdateTierLabel('${tier.id}', this.value)" class="w-full text-xs font-bold px-2.5 py-1.5 mb-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200" />

              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Redeemable Rewards</div>
              <div class="flex flex-wrap gap-1.5 mb-3">
                ${optionsTags.length > 0 ? optionsTags : '<span class="text-xs text-slate-400 italic">No options added yet</span>'}
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <input type="text" id="adminNewOptionInput_${tier.id}" placeholder="Add custom reward..." class="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100" onkeydown="if(event.key==='Enter'){handleAddCustomRewardOption('${tier.id}');}" />
              <button type="button" onclick="handleAddCustomRewardOption('${tier.id}')" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition btn-tactile cursor-pointer">
                Add
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 5. Family Redemptions Audit Log
    const logContainer = document.getElementById('adminRedemptionsAuditLog');
    if (logContainer) {
      const allRedemptions = [];
      allProfiles.forEach(p => {
        (p.redemptions || []).forEach(r => {
          allRedemptions.push({ ...r, studentName: p.name, studentAvatar: p.avatar, studentId: p.id });
        });
      });
      allRedemptions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (allRedemptions.length === 0) {
        logContainer.innerHTML = `
          <div class="text-center py-6 text-slate-400 text-xs italic">
            No rewards have been redeemed by any student yet.
          </div>
        `;
      } else {
        logContainer.innerHTML = `
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th class="py-2">Date &amp; Time</th>
                  <th class="py-2">Student</th>
                  <th class="py-2">Reward</th>
                  <th class="py-2">Payment Cost</th>
                  <th class="py-2">Type</th>
                  <th class="py-2">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                ${allRedemptions.slice(0, 30).map(r => {
                  let badge = '';
                  if (r.status === 'Pending Approval' || r.status === 'pending') {
                    badge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">⏳ Pending Approval</span>';
                  } else if (r.status === 'Approved') {
                    badge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">✅ Approved</span>';
                  } else if (r.status === 'Added to Wallet') {
                    badge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">👛 In Wallet</span>';
                  } else if (r.status === 'Paid Out') {
                    badge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 line-through">💵 Paid Out</span>';
                  } else if (r.status === 'Rejected') {
                    badge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">❌ Declined</span>';
                  } else {
                    badge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">${escapeHtml(r.status || 'Done')}</span>`;
                  }

                  const costStr = r.paymentMethod === 'wallet' ? `$${(r.cashCost || 0).toFixed(2)} Wallet` : `⚡ ${(r.tierPoints || 0).toLocaleString()} XP`;

                  return `
                    <tr>
                      <td class="py-2.5 text-slate-500 font-mono text-[11px]">${new Date(r.timestamp).toLocaleString()}</td>
                      <td class="py-2.5 font-bold text-slate-900 dark:text-slate-100">${escapeHtml(r.studentAvatar || '')} ${escapeHtml(r.studentName)}</td>
                      <td class="py-2.5 font-extrabold text-indigo-700 dark:text-indigo-400">${escapeHtml(r.reward)}</td>
                      <td class="py-2.5 font-bold text-slate-700 dark:text-slate-300">${costStr}</td>
                      <td class="py-2.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isCash ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'}">${r.isCash ? '💵 Cash' : '🎁 Treat'}</span></td>
                      <td class="py-2.5">${badge}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }
  }

  function handleApproveRedemption(studentId, redemptionId) {
    if (window.LuminaDB && typeof window.LuminaDB.approveRedemption === 'function') {
      const res = window.LuminaDB.approveRedemption(studentId, redemptionId);
      if (res && res.ok) {
        showToast('Redemption approved successfully!');
        renderAdminRewardsSection();
        refreshHeaderUI();
      } else {
        showToast((res && res.error) || 'Failed to approve redemption.');
      }
    }
  }

  function handleRejectRedemption(studentId, redemptionId) {
    const reason = window.prompt('Reason for declining this request (will refund student):', 'Declined by parent');
    if (reason === null) return;

    if (window.LuminaDB && typeof window.LuminaDB.rejectRedemption === 'function') {
      const res = window.LuminaDB.rejectRedemption(studentId, redemptionId, reason);
      if (res && res.ok) {
        showToast('Redemption declined and points/funds refunded.');
        renderAdminRewardsSection();
        refreshHeaderUI();
      } else {
        showToast((res && res.error) || 'Failed to decline redemption.');
      }
    }
  }

  function handleUpdateCatalogPrice(prizeId, newPrice) {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return;
    if (window.LuminaDB && typeof window.LuminaDB.updatePrizeCatalogItem === 'function') {
      window.LuminaDB.updatePrizeCatalogItem(prizeId, { price: price });
      showToast(`Updated price to $${price.toFixed(2)}`);
    }
  }

  function handleUpdateCatalogXP(prizeId, newXP) {
    const xp = parseInt(newXP, 10);
    if (isNaN(xp) || xp <= 0) return;
    if (window.LuminaDB && typeof window.LuminaDB.updatePrizeCatalogItem === 'function') {
      window.LuminaDB.updatePrizeCatalogItem(prizeId, { xpPoints: xp });
      showToast(`Updated XP cost to ${xp.toLocaleString()} XP`);
    }
  }

  function handleUpdateCatalogName(prizeId, newName) {
    const name = String(newName || '').trim();
    if (!name) return;
    if (window.LuminaDB && typeof window.LuminaDB.updatePrizeCatalogItem === 'function') {
      window.LuminaDB.updatePrizeCatalogItem(prizeId, { name: name });
    }
  }

  function handleUpdateCatalogDescription(prizeId, newDesc) {
    if (window.LuminaDB && typeof window.LuminaDB.updatePrizeCatalogItem === 'function') {
      window.LuminaDB.updatePrizeCatalogItem(prizeId, { description: newDesc });
    }
  }

  function handleDeleteCatalogItem(prizeId) {
    const conf = window.confirm('Delete this prize from the catalog?');
    if (!conf) return;
    if (window.LuminaDB && typeof window.LuminaDB.deletePrizeCatalogItem === 'function') {
      window.LuminaDB.deletePrizeCatalogItem(prizeId);
      renderAdminRewardsSection();
      showToast('Prize removed from catalog.');
    }
  }

  function handleAddNewCatalogItemSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const nameInput = document.getElementById('adminNewCatalogName');
    const priceInput = document.getElementById('adminNewCatalogPrice');
    const xpInput = document.getElementById('adminNewCatalogXP');
    const catInput = document.getElementById('adminNewCatalogCategory');
    const iconInput = document.getElementById('adminNewCatalogIcon');

    const name = nameInput ? nameInput.value.trim() : '';
    const price = priceInput ? parseFloat(priceInput.value) : 1.00;
    const xpPoints = xpInput ? parseInt(xpInput.value, 10) : 20000;
    const category = catInput ? catInput.value : 'treat';
    const icon = iconInput && iconInput.value.trim() ? iconInput.value.trim() : '🎁';

    if (!name) {
      showToast('Please enter a prize name.');
      return;
    }

    if (window.LuminaDB && typeof window.LuminaDB.addPrizeCatalogItem === 'function') {
      window.LuminaDB.addPrizeCatalogItem({
        name,
        price,
        xpPoints,
        category,
        icon,
        description: `${icon} ${name}`
      });
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '1.00';
      if (xpInput) xpInput.value = '20000';
      renderAdminRewardsSection();
      showToast(`Added "${name}" to prize catalog!`);
    }
  }

  function handleResetCatalogToDefaults() {
    const conf = window.confirm('Reset prize catalog to default items (including 20,000 XP for $1 and 30,000 XP for $2)?');
    if (!conf) return;
    if (window.LuminaDB && window.LuminaDB.DEFAULT_PRIZE_CATALOG) {
      window.LuminaDB.savePrizeCatalog(JSON.parse(JSON.stringify(window.LuminaDB.DEFAULT_PRIZE_CATALOG)));
      renderAdminRewardsSection();
      showToast('Prize catalog reset to default options.');
    }
  }

  function handleUpdateStudentPin(pid) {
    const input = document.getElementById(`adminStudentPin_${pid}`);
    const pin = input ? input.value.trim() : '';
    if (!pin || pin.length < 4) {
      showToast('PIN must be at least 4 digits');
      return;
    }
    if (window.LuminaDB && typeof window.LuminaDB.setProfilePin === 'function') {
      window.LuminaDB.setProfilePin(pid, pin);
      showToast('Profile PIN saved successfully!');
    }
  }

  function handleSettleStudentCash(pid) {
    const p = (window.LuminaDB && typeof window.LuminaDB.getProfileById === 'function')
      ? window.LuminaDB.getProfileById(pid)
      : null;
    if (!p) return;
    const amount = p.cashBalance || 0;
    if (amount <= 0) {
      showToast('No cash balance to settle.');
      return;
    }

    const conf = window.confirm(`Mark paid $${amount.toFixed(2)} to ${p.name}?\n\nThis will reset their cash balance to $0.00 and log the payment.`);
    if (!conf) return;

    if (window.LuminaDB && typeof window.LuminaDB.settleStudentCash === 'function') {
      window.LuminaDB.settleStudentCash(pid);
      showToast(`Settled $${amount.toFixed(2)} cash payout for ${p.name}!`);
      renderAdminRewardsSection();
      refreshHeaderUI();
    }
  }

  function handleUpdateTierPoints(tierId, newPoints) {
    const pts = parseInt(newPoints, 10);
    if (isNaN(pts) || pts <= 0) return;
    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      tier.points = pts;
      window.LuminaDB.saveRewardTiers(tiers);
      showToast(`Updated tier points to ${pts} XP`);
    }
  }

  function handleUpdateTierLabel(tierId, newLabel) {
    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      tier.label = String(newLabel || '').trim();
      window.LuminaDB.saveRewardTiers(tiers);
    }
  }

  function handleRemoveRewardOption(tierId, optionIndex) {
    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const tier = tiers.find(t => t.id === tierId);
    if (tier && Array.isArray(tier.options)) {
      tier.options.splice(optionIndex, 1);
      window.LuminaDB.saveRewardTiers(tiers);
      renderAdminRewardsSection();
      showToast('Reward option removed.');
    }
  }

  function handleAddCustomRewardOption(tierId) {
    const input = document.getElementById(`adminNewOptionInput_${tierId}`);
    const val = input ? input.value.trim() : '';
    if (!val) return;

    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const tier = tiers.find(t => t.id === tierId);
    if (tier) {
      if (!Array.isArray(tier.options)) tier.options = [];
      tier.options.push(val);
      window.LuminaDB.saveRewardTiers(tiers);
      input.value = '';
      renderAdminRewardsSection();
      showToast(`Added "${val}" to ${tier.label || tier.points + ' XP'}!`);
    }
  }

  function handleDeleteRewardTier(tierId) {
    const conf = window.confirm('Are you sure you want to delete this reward tier?');
    if (!conf) return;

    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const filtered = tiers.filter(t => t.id !== tierId);
    if (filtered.length === 0) {
      showToast('You must keep at least one reward tier.');
      return;
    }
    window.LuminaDB.saveRewardTiers(filtered);
    renderAdminRewardsSection();
    showToast('Reward tier deleted.');
  }

  function handleAddNewRewardTier() {
    const tiers = (window.LuminaDB && typeof window.LuminaDB.getRewardTiers === 'function')
      ? window.LuminaDB.getRewardTiers()
      : [];
    const maxPoints = tiers.reduce((max, t) => Math.max(max, t.points || 0), 0);
    const newPoints = maxPoints > 0 ? maxPoints + 10000 : 10000;
    const newTier = {
      id: 'tier_' + Date.now().toString(36),
      points: newPoints,
      label: `${newPoints.toLocaleString()} XP Milestone`,
      options: ['$1 Cash Allowance 💵', 'Snickers Bar 🍫', '1 Hour TV Time 📺']
    };
    tiers.push(newTier);
    tiers.sort((a, b) => a.points - b.points);
    window.LuminaDB.saveRewardTiers(tiers);
    renderAdminRewardsSection();
    showToast(`Added new milestone tier for ${newPoints.toLocaleString()} XP!`);
  }

  function handleResetRewardTiersToDefault() {
    const conf = window.confirm('Reset all reward tiers and options to default presets?');
    if (!conf) return;

    if (window.LuminaDB && window.LuminaDB.DEFAULT_REWARD_TIERS) {
      window.LuminaDB.saveRewardTiers(JSON.parse(JSON.stringify(window.LuminaDB.DEFAULT_REWARD_TIERS)));
      renderAdminRewardsSection();
      showToast('Reward tiers reset to default presets.');
    }
  }

  /* =====================================================================
     WINDOW EXPORTS & BOOTSTRAP
     ===================================================================== */
  if (!appData.activeLanguage) appData.activeLanguage = 'malayalam';
  window.multiLangData = multiLangData;
  window.appData = appData;
  window.selectedCalendarDateKey = selectedCalendarDateKey;
  window.activeProfile = activeProfile;
  window.isTeenProfile = isTeenProfile;
  window.getTeenQuestions = getTeenQuestions;
  window.getKidQuestionsByDomain = getKidQuestionsByDomain;
  window.saveState = saveState;
  window.dedupeQuestionsList = dedupeQuestionsList;
  window.getNextFromDeck = getNextFromDeck;
  window.escapeHtml = escapeHtml;
  window.showToast = showToast;
  window.mergeCustomKidCards = mergeCustomKidCards;
  window.mergeLanguagePacksFromDB = mergeLanguagePacksFromDB;
  window.mergeExpandedLanguagePacks = mergeLanguagePacksFromDB;
  window.manualCloudSync = manualCloudSync;
  window.refreshHeaderUI = refreshHeaderUI;
  window.renderCloudStatus = renderCloudStatus;
  window.renderProfileSwitcher = renderProfileSwitcher;
  window.renderTodayStrip = renderTodayStrip;
  window.trackActivity = trackActivity;
  window.showProfilePicker = showProfilePicker;
  window.hideProfilePicker = hideProfilePicker;
  window.switchProfile = switchProfile;
  window.applyActiveProfileView = applyActiveProfileView;
  window.renderSubNavForKid = renderSubNavForKid;
  window.toggleFamilyAuthModal = toggleFamilyAuthModal;
  window.handleFamilyLoginSubmit = handleFamilyLoginSubmit;
  window.handleFamilySignOut = handleFamilySignOut;
  window.continueOfflineMode = continueOfflineMode;
  window.startFriendPreview = startFriendPreview;
  window.exitFriendPreview = exitFriendPreview;
  window.isPreviewMode = isPreviewMode;
    window.placeGoalStrip = placeGoalStrip;
    window.placeDictionaryVault = placeDictionaryVault;
  window.updateFamilyAuthUI = updateFamilyAuthUI;
  window.openParentAdminPortal = openParentAdminPortal;
  window.closeParentAdminPortal = closeParentAdminPortal;
  window.selectAdminStudent = selectAdminStudent;
  window.getStudentTrackProgressList = getStudentTrackProgressList;
  window.renderAdminPortal = renderAdminPortal;
  window.resetStudentArea = resetStudentArea;
  window.resetStudentAllCompletedAreas = resetStudentAllCompletedAreas;
  window.updateAdminDomainDropdown = updateAdminDomainDropdown;
  window.prefillAdminQuestionCreator = prefillAdminQuestionCreator;
  window.resetAdminQuestionForm = resetAdminQuestionForm;
  window.handleAdminCreateQuestionSubmit = handleAdminCreateQuestionSubmit;
  window.DEFAULT_SECTION_XP = DEFAULT_SECTION_XP;
  window.ADMIN_XP_SECTIONS = ADMIN_XP_SECTIONS;
  window.getSectionXP = getSectionXP;
  window.setSectionXP = setSectionXP;
  window.resetAllSectionXPToDefaults = resetAllSectionXPToDefaults;
  window.renderAdminSectionXPGrid = renderAdminSectionXPGrid;
  window.refreshStudentXPBadges = refreshStudentXPBadges;

  // Theme & Profile PIN Exports
  window.initTheme = initTheme;
  window.toggleTheme = toggleTheme;
  window.updateThemeIcon = updateThemeIcon;
  window.promptProfilePin = promptProfilePin;
  window.closeProfilePinModal = closeProfilePinModal;
  window.handlePinInput = handlePinInput;
  window.handlePinBackspace = handlePinBackspace;
  window.handlePinClear = handlePinClear;
  window.verifyAndSubmitPin = verifyAndSubmitPin;
  window.completeProfileSwitch = completeProfileSwitch;

  // Family Leaderboard & Rewards Bazaar Exports
  window.openLeaderboardModal = openLeaderboardModal;
  window.closeLeaderboardModal = closeLeaderboardModal;
  window.renderLeaderboardModal = renderLeaderboardModal;
  window.openRewardsModal = openRewardsModal;
  window.closeRewardsModal = closeRewardsModal;
  window.renderRewardsModal = renderRewardsModal;
  window.handleRedeemReward = handleRedeemReward;
  window.handleConvertXPToWallet = handleConvertXPToWallet;
  window.handlePurchasePrize = handlePurchasePrize;
  window.handleRequestCashPayout = handleRequestCashPayout;

  // Parent Portal Rewards, Approvals & Cash Allowance Configurator Exports
  window.PRESET_REWARD_OPTIONS = PRESET_REWARD_OPTIONS;
  window.handleTogglePresetSelection = handleTogglePresetSelection;
  window.handleAddSelectedPresetsToTier = handleAddSelectedPresetsToTier;
  window.renderAdminRewardsSection = renderAdminRewardsSection;
  window.handleApproveRedemption = handleApproveRedemption;
  window.handleRejectRedemption = handleRejectRedemption;
  window.handleUpdateCatalogPrice = handleUpdateCatalogPrice;
  window.handleUpdateCatalogXP = handleUpdateCatalogXP;
  window.handleUpdateCatalogName = handleUpdateCatalogName;
  window.handleUpdateCatalogDescription = handleUpdateCatalogDescription;
  window.handleDeleteCatalogItem = handleDeleteCatalogItem;
  window.handleAddNewCatalogItemSubmit = handleAddNewCatalogItemSubmit;
  window.handleResetCatalogToDefaults = handleResetCatalogToDefaults;
  window.handleUpdateStudentPin = handleUpdateStudentPin;
  window.handleSettleStudentCash = handleSettleStudentCash;
  window.handleUpdateTierPoints = handleUpdateTierPoints;
  window.handleUpdateTierLabel = handleUpdateTierLabel;
  window.handleRemoveRewardOption = handleRemoveRewardOption;
  window.handleAddCustomRewardOption = handleAddCustomRewardOption;
  window.handleDeleteRewardTier = handleDeleteRewardTier;
  window.handleAddNewRewardTier = handleAddNewRewardTier;
  window.handleResetRewardTiersToDefault = handleResetRewardTiersToDefault;

  // Keyboard support for PIN modal
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('profilePinModal');
    if (!modal || modal.classList.contains('hidden')) return;
    if (e.key >= '0' && e.key <= '9') {
      handlePinInput(e.key);
    } else if (e.key === 'Backspace') {
      handlePinBackspace();
    } else if (e.key === 'Escape') {
      closeProfilePinModal();
    } else if (e.key === 'Enter') {
      verifyAndSubmitPin();
    }
  });

  if (window.LuminaDB && typeof window.LuminaDB.onChange === 'function') {
    window.LuminaDB.onChange(() => {
      refreshHeaderUI();
      refreshStudentXPBadges();
      const adminSec = document.getElementById('section-parent-admin');
      if (adminSec && !adminSec.classList.contains('hidden')) {
        renderAdminPortal();
      }
      const rewardsModal = document.getElementById('rewardsModal');
      if (rewardsModal && !rewardsModal.classList.contains('hidden')) {
        renderRewardsModal();
      }
      const leaderboardModal = document.getElementById('leaderboardModal');
      if (leaderboardModal && !leaderboardModal.classList.contains('hidden')) {
        renderLeaderboardModal();
      }
    });
  }

  // Cross-tab synchronization via localStorage storage event
  window.addEventListener('storage', (e) => {
    if (e.key === 'lumina_db_state_v1' || e.key === 'lumina_theme') {
      if (window.LuminaDB && typeof window.LuminaDB.loadFromLocal === 'function') {
        window.LuminaDB.loadFromLocal();
        window.LuminaDB.notify();
      }
    }
  });

  window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    if (isPreviewMode()) {
      // Restore a Friend Preview session after a page reload (same tab):
      // keep the content unlocked and the banner visible without sign-in.
      setProtectedContentVisible(true);
      refreshPreviewBanner();
    }
    if (typeof window.initDictionaryChips === 'function') {
      window.initDictionaryChips();
    }
    mergeLanguagePacksFromDB();
    mergeCustomKidCards();
    applyActiveProfileView();
    refreshStudentXPBadges();
    placeGoalStrip();
    placeDictionaryVault();

    if (window.LuminaDB && typeof window.LuminaDB.pullFromCloud === 'function') {
      const res = await window.LuminaDB.pullFromCloud();
      if (res && res.ok) {
        mergeLanguagePacksFromDB();
        mergeCustomKidCards();
        applyActiveProfileView();
        refreshStudentXPBadges();
      }
    }
  });

})(window);
