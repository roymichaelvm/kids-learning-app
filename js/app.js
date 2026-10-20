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

    ['malayalam', 'hindi', 'spanish'].forEach(lang => {
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
    if (xpEl) xpEl.innerText = p.xp || 0;

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
    container.innerHTML = window.LuminaDB.getAllProfiles().map(p => {
      const active = p.id === activeId;
      const activeCls = p.ageGroup === 'kid' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'bg-white text-indigo-950 shadow-xs';
      return `
        <button onclick="switchProfile('${p.id}')" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${active ? activeCls : 'text-slate-600 hover:text-slate-900'}">
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
      <div class="bg-white rounded-3xl border ${kid ? 'border-amber-200' : 'border-slate-200/80'} shadow-bento p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-4 flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${kid ? 'bg-amber-100' : 'bg-indigo-50'} flex items-center justify-center text-2xl shrink-0">${escapeHtml(p.avatar)}</div>
          <div>
            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(p.name)}'s Daily Activity Goal</p>
            <p class="font-extrabold text-slate-900 leading-tight">${goalMet ? '🏆 All daily goals completed!' : `Keep going, ${escapeHtml(p.name)}!`}</p>
            <p class="text-[11px] text-slate-500 font-semibold">${acc === null ? 'No questions answered yet today' : `Accuracy today: ${acc}% (${today.questionsCorrect}/${today.questionsAttempted})`} • ⚡ +${today.xpEarned || 0} XP today</p>
          </div>
        </div>
        <div class="md:col-span-3">
          <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>📝 Questions Goal</span><span class="font-mono">${today.questionsAttempted} / ${p.dailyGoalQuestions || 10}</span></div>
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-indigo-500 transition-all" style="width:${qPct}%"></div></div>
        </div>
        <div class="md:col-span-3">
          <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>⏱️ Active Time Goal</span><span class="font-mono">${mins} / ${p.dailyGoalMinutes || 15} min</span></div>
          <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${mPct}%"></div></div>
        </div>
        <div class="md:col-span-2 flex items-end justify-between gap-1 h-12" title="Questions answered over the last 7 days">
          ${days.map(d => `
            <div class="flex-1 flex flex-col items-center gap-0.5" title="${d.label}: ${d.questionsAttempted} questions">
              <div class="w-full rounded-md ${d.isToday ? 'bg-indigo-600' : (d.questionsAttempted > 0 ? 'bg-indigo-300' : 'bg-slate-200')}" style="height:${Math.max(4, Math.round((d.questionsAttempted / maxQ) * 32))}px"></div>
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
    if (!window.LuminaDB || !window.LuminaDB.getCurrentUser || !window.LuminaDB.getCurrentUser()) {
      updateFamilyAuthUI();
      return;
    }
    pickerOpen = true;
    const grid = document.getElementById('profilePickerGrid');
    if (!grid || !window.LuminaDB) return;
    grid.innerHTML = window.LuminaDB.getAllProfiles().map(p => {
      const today = window.LuminaDB.getLastNDaysSummary(p.id, 1)[0];
      return `
        <button onclick="switchProfile('${p.id}')" class="p-6 rounded-3xl border-4 ${p.ageGroup === 'kid' ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'} btn-tactile transition flex flex-col items-center gap-2">
          <span class="text-6xl">${escapeHtml(p.avatar)}</span>
          <span class="font-extrabold text-xl text-slate-900 font-kids">${escapeHtml(p.name)}</span>
          <span class="text-xs font-bold text-slate-600">${escapeHtml(p.ageLabel || '')}</span>
          <span class="text-xs font-bold px-3 py-1 rounded-full bg-white/80 text-slate-700 mt-1">
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

  function switchProfile(profileId) {
    if (window.LuminaDB) {
      window.LuminaDB.setActiveProfile(profileId);
      selectedCalendarDateKey = window.LuminaDB.getTodayDateKey();
    }
    Object.keys(_shuffledDecks).forEach(k => delete _shuffledDecks[k]);
    hideProfilePicker();
    applyActiveProfileView();
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
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60";
        badge.innerText = `${p.avatar || '🎓'} ${p.name || 'Scholar'} (${p.ageLabel || 'Teen Scholar'})`;
      }
      const appBody = document.getElementById('appBody');
      if (appBody) appBody.className = "bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col font-sans transition-colors duration-300";
      if (typeof window.openTeenTab === 'function') {
        window.openTeenTab(appData.teenSubTab || 'dashboard');
      }
    } else {
      if (typeof window.stopSatTimer === 'function') window.stopSatTimer();
      if (badge) {
        badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300";
        badge.innerText = `${p.avatar || '🌟'} ${p.name || 'Explorer'} (${p.ageLabel || 'Little Explorer'})`;
      }
      const appBody = document.getElementById('appBody');
      if (appBody) appBody.className = "bg-[#FFFBEB] text-slate-900 min-h-screen flex flex-col font-kids transition-colors duration-300";
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
      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition text-slate-700 hover:text-slate-950 hover:bg-slate-100";

    const flashCls = isFlash
      ? "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition bg-amber-400 text-slate-950 border border-amber-500 shadow-xs"
      : "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition text-slate-700 hover:text-slate-950 hover:bg-slate-100";

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
    } else {
      authModalManuallyOpened = false;
      setProtectedContentVisible(false);
      if (modal) modal.classList.remove('hidden');
      if (titleEl) titleEl.innerText = 'Sign In Required';
      if (textEl) textEl.innerText = 'Sign In';
      if (iconEl) iconEl.setAttribute('data-lucide', 'lock');
      if (pill) {
        pill.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer";
        pill.title = "Sign in required to access Lumina Learning Hub";
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
      if (typeof showToast === 'function') showToast('Signed out. Sign in to access Lumina Learning Hub.');
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
      badge.className = "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 border border-slate-700";
      badge.innerText = '⚙️ Parent Admin Portal';
    }

    const appBody = document.getElementById('appBody');
    if (appBody) appBody.className = "bg-[#F8FAFC] text-slate-900 min-h-screen flex flex-col font-sans transition-colors duration-300";

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
          : "px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2 transition btn-tactile";
        return `
          <button onclick="selectAdminStudent('${p.id}')" class="${cls}">
            <span class="text-base">${p.avatar || '👤'}</span>
            <span>${escapeHtml(p.name || 'Student')}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'}">${finishedCount} completed</span>
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
        <button onclick="resetStudentAllCompletedAreas('${student.id}')" class="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 shadow-xs flex items-center gap-1.5 transition btn-tactile">
          <span>🔄</span>
          <span>Reset All Completed Tracks</span>
        </button>
      `;
    }

    // 2. Completed Areas Highlight Section
    const tracks = getStudentTrackProgressList(student.id);
    const completedTracks = tracks.filter(t => t.isCompleted);
    const completedGrid = document.getElementById('adminCompletedAreasGrid');
    const badgeEl = document.getElementById('adminCompletedAreasCountBadge');

    if (badgeEl) {
      badgeEl.innerHTML = `
        <span class="px-3 py-1 rounded-full text-xs font-black ${completedTracks.length > 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-600'}">
          ${completedTracks.length} of ${tracks.length} Tracks Finished
        </span>
      `;
    }

    if (completedGrid) {
      if (completedTracks.length === 0) {
        completedGrid.className = "col-span-full py-8 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200";
        completedGrid.innerHTML = `
          <div class="text-4xl mb-2">🌱</div>
          <p class="text-sm font-bold text-slate-700">${escapeHtml(student.name || 'Student')} has not completely finished any full track yet.</p>
          <p class="text-xs text-slate-500 mt-1">As questions and matching cards are completed, finished tracks will appear right here with one-click question expansion!</p>
        `;
      } else {
        completedGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
        completedGrid.innerHTML = completedTracks.map(t => `
          <div class="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border-2 border-emerald-300 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-950 font-black text-[10px] uppercase tracking-wider">
                  ✓ 100% Completed
                </span>
                <span class="text-xs font-extrabold text-emerald-900">${t.completedCount} / ${t.total} Done</span>
              </div>
              <h4 class="text-base font-black text-slate-900">${escapeHtml(t.title)}</h4>
              <p class="text-xs font-semibold text-emerald-800 mt-1">Student has answered all questions in this track! Ready for new questions.</p>
            </div>
            <div class="mt-4 pt-3 border-t border-emerald-200/70 flex flex-wrap items-center gap-2">
              <button onclick="prefillAdminQuestionCreator('${escapeHtml(t.domain)}', '${t.targetProfile}')" class="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5 transition btn-tactile">
                <span>➕</span>
                <span>Add Questions to This Track</span>
              </button>
              <button onclick="resetStudentArea('${student.id}', '${t.key}')" class="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 transition btn-tactile">
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
        const barColor = isDone ? 'bg-emerald-500' : (t.percent > 0 ? 'bg-indigo-600' : 'bg-slate-300');
        return `
          <div class="p-4 rounded-2xl bg-white border ${isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-1 mb-1.5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${escapeHtml(t.category)}</span>
                <span class="text-xs font-black ${isDone ? 'text-emerald-700' : 'text-slate-700'}">${t.completedCount} / ${t.total} (${t.percent}%)</span>
              </div>
              <h5 class="text-sm font-extrabold text-slate-900 leading-snug">${escapeHtml(t.title)}</h5>
              
              <!-- Progress Bar -->
              <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden my-2.5">
                <div class="h-full rounded-full transition-all duration-500 ${barColor}" style="width: ${t.percent}%"></div>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <button onclick="prefillAdminQuestionCreator('${escapeHtml(t.domain)}', '${t.targetProfile}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition flex items-center gap-1">
                <span>➕ Add Q</span>
              </button>
              <button onclick="resetStudentArea('${student.id}', '${t.key}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold transition" title="Reset this section for ${escapeHtml(student.name)}">
                <span>🔄 Reset</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // 4. Render Section XP Multipliers Grid
    renderAdminSectionXPGrid();
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

    'hindi_sentences': 50,     // 🪔 Hindi Small Sentences (Tough)
    'hindi_words': 20,         // 🪔 Hindi Core Words
    'hindi_letters': 15,       // 🪔 Hindi Alphabet Letters
    'hindi': 30,

    'spanish_sentences': 50,   // 🇪🇸 Spanish Small Sentences (Tough)
    'spanish_words': 20,       // 🇪🇸 Spanish Core Words
    'spanish': 30,

    // Reading Comprehension & Facts
    'comprehension': 35,       // 📖 Story Reading & Comprehension
    'grammar': 25,             // ✏️ Grammar & Sentence Building
    'phonics': 20,             // 🔤 Sight Words & Phonics
    'animals': 20,             // 🦁 Animals & Science Facts

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

    // Reading Comprehension & Facts
    { key: 'comprehension', title: '📖 6+ Story Reading & Comprehension', group: 'Reading & Science', isTough: false, defaultXP: 35, hint: 'Reading passages & paragraph questions' },
    { key: 'grammar', title: '✏️ 6+ Grammar & Sentence Building', group: 'Reading & Science', isTough: false, defaultXP: 25, hint: 'Parts of speech & sentence structure' },
    { key: 'phonics', title: '🔤 Sight Words & Phonics', group: 'Reading & Science', isTough: false, defaultXP: 20, hint: 'Phonetic blends and sight words' },
    { key: 'animals', title: '🦁 Animals & Science Facts', group: 'Reading & Science', isTough: false, defaultXP: 20, hint: 'Animal science and nature facts' },

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

  function setSectionXP(trackKey, xp) {
    if (!window.LuminaDB) return;
    if (!window.LuminaDB.state.sectionXP) window.LuminaDB.state.sectionXP = {};
    const cleanVal = Math.max(5, Math.min(500, Math.round(Number(xp) || 20)));
    window.LuminaDB.state.sectionXP[trackKey] = cleanVal;
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
        <div class="p-5 rounded-3xl bg-slate-50/80 border-2 ${isHighXP ? 'border-amber-300/80 bg-amber-50/30' : 'border-slate-200'} shadow-sm flex flex-col justify-between transition hover:border-indigo-300">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">${escapeHtml(sec.group)}</span>
              ${sec.isTough ? '<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-extrabold flex items-center gap-1"><span>🔥</span><span>Tough Topic</span></span>' : ''}
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 leading-snug">${escapeHtml(sec.title)}</h4>
            <p class="text-[11px] text-slate-500 mt-1">${escapeHtml(sec.hint)}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200/70">
            <div class="flex items-center justify-between gap-2 mb-2.5">
              <span class="text-xs font-bold text-slate-600">Reward:</span>
              <span class="px-3 py-1 rounded-full text-xs font-black border ${badgeCls} flex items-center gap-1 shadow-2xs">
                <span>${isSuperHigh ? '🚀' : (isHighXP ? '🔥' : '⚡')}</span>
                <span>+${currentXP} XP</span>
              </span>
            </div>

            <!-- Preset buttons -->
            <div class="grid grid-cols-4 gap-1.5 mb-2.5">
              <button onclick="setSectionXP('${sec.key}', 10)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 10 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'}">10</button>
              <button onclick="setSectionXP('${sec.key}', 20)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 20 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'}">20</button>
              <button onclick="setSectionXP('${sec.key}', 50)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 50 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-200'}">50 🌟</button>
              <button onclick="setSectionXP('${sec.key}', 100)" class="py-1 px-1.5 rounded-lg text-[11px] font-bold transition ${currentXP === 100 ? 'bg-rose-600 text-white shadow-xs' : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-200'}">100 🔥</button>
            </div>

            <!-- Custom input -->
            <div class="flex items-center justify-between gap-2 text-xs">
              <span class="text-slate-500 font-semibold text-[11px]">Custom XP:</span>
              <div class="flex items-center gap-1">
                <input type="number" min="5" max="500" step="5" value="${currentXP}" onchange="setSectionXP('${sec.key}', this.value)" class="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-lg focus:outline-indigo-500" />
                <span class="font-bold text-slate-500">XP</span>
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
      'malayalam': () => Math.max(getSectionXP('malayalam_sentences'), getSectionXP('malayalam_words'), getSectionXP('malayalam_letters')),
      'hindi': () => Math.max(getSectionXP('hindi_sentences'), getSectionXP('hindi_words'), getSectionXP('hindi_letters')),
      'spanish': () => Math.max(getSectionXP('spanish_sentences'), getSectionXP('spanish_words'))
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
      badge.className = `kid-cat-xp-badge px-2 py-0.5 rounded-full text-[10px] font-black mt-1 ${isHigh ? 'bg-rose-500 text-white shadow-xs animate-bounce' : 'bg-slate-900/10 text-slate-800'}`;
      badge.innerText = isHigh ? `🔥 +${xp} XP` : `+${xp} XP`;
    });

    // 2. Kid trilingual sub-nav
    const cat = (window.appData && window.appData.kidCategory) || 'malayalam';
    if (cat === 'malayalam' || cat === 'hindi' || cat === 'spanish') {
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

  if (window.LuminaDB && typeof window.LuminaDB.onChange === 'function') {
    window.LuminaDB.onChange(() => {
      refreshHeaderUI();
      refreshStudentXPBadges();
      const adminSec = document.getElementById('section-parent-admin');
      if (adminSec && !adminSec.classList.contains('hidden')) {
        renderAdminPortal();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.initDictionaryChips === 'function') {
      window.initDictionaryChips();
    }
    mergeLanguagePacksFromDB();
    mergeCustomKidCards();
    applyActiveProfileView();
    refreshStudentXPBadges();

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
