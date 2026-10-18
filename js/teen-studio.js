/**
 * Lumina Learning Hub — 13+ Teen Scholar Studio
 * Includes the Digital SAT Bluebook Exam Simulator, precision telemetry & timing analytics,
 * and the Trilingual Vocabulary Studio (Malayalam, Hindi, Spanish).
 */
(function (window) {
  'use strict';

  const escapeHtml = window.escapeHtml || function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const showToast = function (msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  };

  let filteredSatQuestions = [];
  let satCurrentIndex = 0;
  let satTimerHandle = null;
  let satStartTimestamp = 0;
  let satElapsedSeconds = 0;
  let currentFirstClickOption = null;
  let currentFirstClickTime = null;
  let currentSelectedOption = null;
  let eliminatorMode = false;
  let eliminatedSet = new Set();
  let flaggedQuestions = new Set();
  let satQuestionSubmitted = false;

  let teenSubMode = 'words';
  let teenCardIdx = 0;
  let teenQuizIdx = 0;

  function openTeenTab(tabName) {
    if (window.appData) window.appData.teenSubTab = tabName;
    document.getElementById('section-teen-dashboard').classList.add('hidden');
    document.getElementById('section-teen-sat').classList.add('hidden');
    document.getElementById('section-languages').classList.add('hidden');

    renderSubNavForTeen(tabName);

    if (tabName === 'dashboard') {
      stopSatTimer();
      document.getElementById('section-teen-dashboard').classList.remove('hidden');
      renderTeenDashboard();
    } else if (tabName === 'sat') {
      document.getElementById('section-teen-sat').classList.remove('hidden');
      populateDomainFilterDropdown();
      loadSatQuestionByIndex(satCurrentIndex);
    } else if (tabName === 'languages') {
      stopSatTimer();
      document.getElementById('section-languages').classList.remove('hidden');
      renderTeenLanguageStudio();
    }
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderSubNavForTeen(activeTab) {
    const container = document.getElementById('subNavTabs');
    if (!container) return;
    const tabs = [
      { id: 'dashboard', label: '📊 Analytics, Streak Calendar & Topics' },
      { id: 'sat', label: '📝 Digital SAT & Topic Simulator' },
      { id: 'languages', label: '🌏 Trilingual Studio (Mal / Hin / Spa)' }
    ];
    container.innerHTML = tabs.map(t => `
      <button onclick="openTeenTab('${t.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
        activeTab === t.id
          ? 'bg-indigo-600 text-white shadow-2xs'
          : 'text-slate-600 hover:bg-slate-200/70'
      }">${t.label}</button>
    `).join('');
  }

  function renderTeenDashboard() {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    if (!p) return;
    const teenQs = (typeof window.getTeenQuestions === 'function') ? window.getTeenQuestions(false) : [];
    const allTeenQs = (typeof window.getTeenQuestions === 'function') ? window.getTeenQuestions(true) : [];

    // Group questions by domain
    const allDomainCounts = {};
    const uncompletedCounts = {};
    allTeenQs.forEach(q => {
      const d = q.domain || 'General';
      allDomainCounts[d] = (allDomainCounts[d] || 0) + 1;
    });
    teenQs.forEach(q => {
      const d = q.domain || 'General';
      uncompletedCounts[d] = (uncompletedCounts[d] || 0) + 1;
    });

    const colors = [
      { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
      { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
      { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
    ];

    const grid = document.getElementById('teenTopicsBentoGrid');
    if (grid) {
      const entries = Object.entries(allDomainCounts);
      grid.innerHTML = entries.map(([domain, totalCount], idx) => {
        const theme = colors[idx % colors.length];
        const leftCount = uncompletedCounts[domain] || 0;
        const m = (p.domainMastery && p.domainMastery[domain]) || { attempted: 0, correct: 0 };
        const acc = m.attempted > 0 ? `${Math.round((m.correct / m.attempted) * 100)}% accuracy (${m.correct}/${m.attempted})` : 'Not practiced yet';
        const badgeLabel = leftCount === 0 ? '✓ Mastered' : `${leftCount} Left of ${totalCount}`;
        const badgeStyle = leftCount === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : `${theme.bg} ${theme.text} ${theme.border}`;
        return `
          <div onclick="launchSatWithDomain('${domain.replace(/'/g, "\\'")}')" class="bg-white hover:bg-slate-50/80 rounded-3xl p-5 border border-slate-200/80 shadow-bento cursor-pointer transition group flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeStyle} border">
                  ${badgeLabel}
                </span>
                <i data-lucide="arrow-up-right" class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
              </div>
              <h4 class="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition">${escapeHtml(domain)}</h4>
              <p class="text-xs text-slate-500 mt-1">${acc}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
              <span>${leftCount === 0 ? 'Review & Practice Again' : 'Start Timed Drill'}</span>
              <span>→</span>
            </div>
          </div>
        `;
      }).join('');
    }

    renderTeenCalendarAndMastery(p);
    updateTelemetryWidgets(p);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function renderTeenCalendarAndMastery(p) {
    if (!window.LuminaDB) return;
    const history = window.LuminaDB.getLastNDaysSummary(p.id, 14);
    const calEl = document.getElementById('teen14DayCalendar') || document.getElementById('teenStreakCalendarGrid');
    if (calEl) {
      calEl.innerHTML = history.map(d => {
        const done = (d.questionsAttempted || 0) >= (p.dailyGoalQuestions || 10);
        const hasWork = (d.questionsAttempted || 0) > 0 || (d.cardsViewed || 0) > 0;
        let ring = 'border-slate-200 bg-white';
        let badge = '<span class="text-slate-300">•</span>';
        if (done) {
          ring = 'border-emerald-400 bg-emerald-50/70 text-emerald-900';
          badge = '<span>🔥</span>';
        } else if (hasWork) {
          ring = 'border-amber-300 bg-amber-50/60 text-amber-900';
          badge = '<span>⚡</span>';
        }
        return `
          <div onclick="selectCalendarDay('${d.dateKey}')" class="p-2.5 rounded-2xl border-2 ${ring} text-center cursor-pointer transition transform hover:scale-105">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${d.shortDay}</div>
            <div class="font-mono font-bold text-xs my-0.5">${d.label}</div>
            <div class="text-xs">${badge}</div>
            <div class="text-[10px] font-mono text-slate-500 mt-0.5">${d.questionsAttempted || 0} Qs</div>
          </div>
        `;
      }).join('');
    }

    // Domain Mastery Breakdown
    const masteryEl = document.getElementById('teenDomainMasteryList');
    if (masteryEl) {
      const masteryEntries = Object.entries(p.domainMastery || {});
      if (masteryEntries.length === 0) {
        masteryEl.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center">Answer questions in the SAT Simulator or Language Studio to build your subject mastery profile!</p>`;
      } else {
        masteryEl.innerHTML = masteryEntries.map(([dom, stats]) => {
          const pct = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 100;
          const barColor = pct >= 80 ? 'bg-emerald-500' : (pct >= 60 ? 'bg-indigo-500' : 'bg-amber-500');
          return `
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
              <div class="flex items-center justify-between text-xs font-bold mb-1">
                <span class="text-slate-800 truncate">${escapeHtml(dom)}</span>
                <span class="font-mono text-slate-600">${pct}% (${stats.correct}/${stats.attempted})</span>
              </div>
              <div class="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full rounded-full ${barColor}" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  function selectCalendarDay(dateKey) {
    if (typeof window.showToast === 'function') {
      window.showToast(`Selected date: ${dateKey}`);
    }
  }

  function launchSatWithDomain(domain) {
    openTeenTab('sat');
    const select = document.getElementById('satDomainFilter');
    if (select) {
      select.value = domain;
      onFilterSatQuestions();
    }
  }

  function updateTelemetryWidgets(p) {
    const profile = p || ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);
    if (!profile) return;
    const logs = profile.telemetryLogs || [];
    const tbody = document.getElementById('telemetryTableBody');

    if (logs.length === 0) {
      const bfc = document.getElementById('bentoFirstClickAcc');
      if (bfc) bfc.innerText = '—';
      const bfa = document.getElementById('bentoFinalAcc');
      if (bfa) bfa.innerText = '—';
      const bat = document.getElementById('bentoAvgTime');
      if (bat) bat.innerText = '0s';
      const bmc = document.getElementById('bentoMindChanges');
      if (bmc) bmc.innerText = '0';
      const hfc = document.getElementById('heroFirstClickStat');
      if (hfc) hfc.innerText = 'Ready';
      const sgv = document.getElementById('secondGuessVerdict');
      if (sgv) sgv.innerText = 'Complete a question to see telemetry';
      if (tbody) tbody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-slate-400">No SAT questions answered yet by ${escapeHtml(profile.name)}. Launch the SAT Simulator to record timing and first-click telemetry!</td></tr>`;
      return;
    }

    const firstClickCorrect = logs.filter(l => l.firstClick === l.correctKey).length;
    const finalCorrect = logs.filter(l => l.isCorrect).length;
    const totalTime = logs.reduce((acc, l) => acc + (Number(l.totalTime) || 0), 0);
    const mindChanges = logs.filter(l => l.changedMind).length;

    const fcPct = Math.round((firstClickCorrect / logs.length) * 100);
    const fnPct = Math.round((finalCorrect / logs.length) * 100);
    const avgT = (totalTime / logs.length).toFixed(1);

    const bfc = document.getElementById('bentoFirstClickAcc');
    if (bfc) bfc.innerText = `${fcPct}%`;
    const bfa = document.getElementById('bentoFinalAcc');
    if (bfa) bfa.innerText = `${fnPct}%`;
    const bat = document.getElementById('bentoAvgTime');
    if (bat) bat.innerText = `${avgT}s`;
    const bmc = document.getElementById('bentoMindChanges');
    if (bmc) bmc.innerText = mindChanges;
    const hfc = document.getElementById('heroFirstClickStat');
    if (hfc) hfc.innerText = `${fcPct}%`;

    const verdictEl = document.getElementById('secondGuessVerdict');
    if (verdictEl) {
      if (fcPct > fnPct) {
        verdictEl.innerHTML = `<span class="text-amber-700 font-bold">⚠️ Insight: Your 1st instinct (${fcPct}%) beats revised answers (${fnPct}%). Trust your gut!</span>`;
      } else if (fnPct > fcPct) {
        verdictEl.innerHTML = `<span class="text-emerald-700 font-bold">✓ Insight: Revisions improved accuracy from ${fcPct}% to ${fnPct}%!</span>`;
      } else {
        verdictEl.innerHTML = `<span class="text-indigo-700 font-bold">🎯 Solid consistency between first click and final submission!</span>`;
      }
    }

    if (tbody) {
      tbody.innerHTML = logs.slice().reverse().map(l => {
        let diag = `<span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">Confident 1st Instinct</span>`;
        if (l.changedMind && l.isCorrect) {
          diag = `<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Smart Correction (${l.firstClick}→${l.finalChoice})</span>`;
        } else if (l.changedMind && !l.isCorrect) {
          diag = `<span class="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold">Overthought (${l.firstClick}→${l.finalChoice})</span>`;
        }

        return `
          <tr class="hover:bg-slate-50/90">
            <td class="py-3 px-3 font-mono text-slate-400">${l.date || 'Today'}</td>
            <td class="py-3 px-3 font-mono font-bold text-slate-900">${escapeHtml(l.id)}</td>
            <td class="py-3 px-3 font-semibold">${escapeHtml(l.domain)}</td>
            <td class="py-3 px-3 font-mono text-slate-500">${l.firstClickTime}s</td>
            <td class="py-3 px-3 font-mono font-bold">${l.totalTime}s</td>
            <td class="py-3 px-3 font-mono font-bold text-indigo-600">${l.firstClick}</td>
            <td class="py-3 px-3 font-mono font-bold">${l.finalChoice}</td>
            <td class="py-3 px-3 font-bold ${l.isCorrect ? 'text-emerald-600' : 'text-rose-600'}">${l.isCorrect ? '✓ Correct' : '✗ Missed'}</td>
            <td class="py-3 px-3">${diag}</td>
          </tr>
        `;
      }).join('');
    }
  }

  function resetSatTelemetry() {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    if (!p) return;
    if (!confirm(`Clear SAT telemetry history for ${p.name}?`)) return;
    window.LuminaDB.clearTelemetry(p.id);
    updateTelemetryWidgets();
    if (typeof window.showToast === 'function') window.showToast("SAT Telemetry logs cleared.");
  }

  /* ---------------------------------------------------------------------
     DIGITAL SAT BLUEBOOK ENGINE
     --------------------------------------------------------------------- */
  function populateDomainFilterDropdown() {
    const select = document.getElementById('satDomainFilter');
    if (!select) return;
    const currentVal = select.value || 'ALL';
    const teenQs = (typeof window.getTeenQuestions === 'function') ? window.getTeenQuestions(false) : [];
    const allTeenQs = (typeof window.getTeenQuestions === 'function') ? window.getTeenQuestions(true) : [];
    const domains = Array.from(new Set(allTeenQs.map(q => q.domain || 'General')));

    select.innerHTML = `<option value="ALL">All Topics &amp; SAT Domains (${teenQs.length} left of ${allTeenQs.length})</option>` +
      domains.map(d => {
        const leftCount = teenQs.filter(q => (q.domain || 'General') === d).length;
        const totalCount = allTeenQs.filter(q => (q.domain || 'General') === d).length;
        return `<option value="${escapeHtml(d)}">${escapeHtml(d)} (${leftCount} left of ${totalCount})</option>`;
      }).join('');

    if (domains.includes(currentVal) || currentVal === 'ALL') select.value = currentVal;
    onFilterSatQuestions();
  }

  function onFilterSatQuestions() {
    const filterEl = document.getElementById('satDomainFilter');
    const domain = filterEl ? filterEl.value : 'ALL';
    const teenQs = (typeof window.getTeenQuestions === 'function') ? window.getTeenQuestions(false) : [];
    if (domain === 'ALL') {
      filteredSatQuestions = [...teenQs];
    } else {
      filteredSatQuestions = teenQs.filter(q => (q.domain || 'General') === domain);
    }
    satCurrentIndex = 0;
    loadSatQuestionByIndex(0);
  }

  function startSatTimer() {
    stopSatTimer();
    satStartTimestamp = performance.now();
    satElapsedSeconds = 0;
    satTimerHandle = setInterval(() => {
      satElapsedSeconds = (performance.now() - satStartTimestamp) / 1000;
      const mins = Math.floor(satElapsedSeconds / 60).toString().padStart(2, '0');
      const secs = (satElapsedSeconds % 60).toFixed(1).padStart(4, '0');
      const sw = document.getElementById('satStopwatch') || document.getElementById('satTimerDisplay');
      if (sw) sw.innerText = `${mins}:${secs}`;

      const paceHint = document.getElementById('satPaceHint');
      if (paceHint) {
        if (satElapsedSeconds < 60) {
          paceHint.className = "text-[10px] text-emerald-400 ml-2 font-medium";
          paceHint.innerText = "Optimal Pace";
        } else if (satElapsedSeconds < 95) {
          paceHint.className = "text-[10px] text-amber-400 ml-2 font-medium";
          paceHint.innerText = "Moderate Pace";
        } else {
          paceHint.className = "text-[10px] text-rose-400 ml-2 font-medium";
          paceHint.innerText = "Over Target Time";
        }
      }
    }, 100);
  }

  function stopSatTimer() {
    if (satTimerHandle) {
      clearInterval(satTimerHandle);
      satTimerHandle = null;
    }
  }

  function loadSatQuestionByIndex(idx) {
    const filterEl = document.getElementById('satDomainFilter');
    const selectedDomain = filterEl ? filterEl.value : 'ALL';

    if (!filteredSatQuestions || filteredSatQuestions.length === 0) {
      stopSatTimer();
      const currNumEl = document.getElementById('satCurrNum');
      if (currNumEl) currNumEl.innerText = 0;
      const totalNumEl = document.getElementById('satTotalNum');
      if (totalNumEl) totalNumEl.innerText = 0;
      const counterTextEl = document.getElementById('satQuestionCounterText');
      if (counterTextEl) counterTextEl.innerText = '0 of 0';

      const passageEl = document.getElementById('satPassageContent');
      const promptEl = document.getElementById('satQuestionPrompt');
      const optionsContainer = document.getElementById('satOptionsList');
      const drawerEl = document.getElementById('satExplanationDrawer');
      if (drawerEl) drawerEl.classList.add('hidden');

      if (passageEl) {
        passageEl.innerHTML = `
          <div class="p-8 text-center bg-indigo-50/70 rounded-3xl border-2 border-indigo-200 space-y-3 animate-fade">
            <span class="text-6xl">🏆</span>
            <h3 class="text-xl font-black text-slate-900">All Questions Completed!</h3>
            <p class="text-sm font-semibold text-slate-600">Great work! You have finished every question in <strong>${escapeHtml(selectedDomain === 'ALL' ? 'all SAT topics' : selectedDomain)}</strong>.</p>
            <div class="pt-3 flex flex-wrap gap-2.5 justify-center">
              <button onclick="window.resetTopicQuestions('${selectedDomain.replace(/'/g, "\\'")}')" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition">
                🔄 Replay This Topic (Reset)
              </button>
              <button onclick="openTeenTab('dashboard')" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 shadow-sm transition">
                📊 View Analytics &amp; Topics
              </button>
            </div>
          </div>
        `;
      }
      if (promptEl) promptEl.innerText = "No remaining uncompleted questions in this topic.";
      if (optionsContainer) optionsContainer.innerHTML = '';
      return;
    }

    if (idx < 0) idx = 0;
    if (idx >= filteredSatQuestions.length) idx = filteredSatQuestions.length - 1;
    satCurrentIndex = idx;

    const item = filteredSatQuestions[satCurrentIndex] || {};
    const qObj = item.question || {};

    currentFirstClickOption = null;
    currentFirstClickTime = null;
    currentSelectedOption = null;
    eliminatedSet.clear();
    satQuestionSubmitted = false;

    const currNumEl = document.getElementById('satCurrNum');
    if (currNumEl) currNumEl.innerText = satCurrentIndex + 1;
    const totalNumEl = document.getElementById('satTotalNum');
    if (totalNumEl) totalNumEl.innerText = filteredSatQuestions.length;
    const counterTextEl = document.getElementById('satQuestionCounterText');
    if (counterTextEl) counterTextEl.innerText = `${satCurrentIndex + 1} of ${filteredSatQuestions.length}`;

    const diffEl = document.getElementById('satDifficultyPill');
    if (diffEl) diffEl.innerText = item.difficulty || 'Medium';

    const qBadgeEl = document.getElementById('satQuestionIdBadge') || document.getElementById('satQuestionIdTag');
    if (qBadgeEl) qBadgeEl.innerText = `#${item.id || 'Q' + (idx + 1)}`;

    const domainTitleEl = document.getElementById('satRightDomainTitle') || document.getElementById('satDomainLabel');
    if (domainTitleEl) domainTitleEl.innerText = item.domain || 'SAT Reading & Writing';

    const rawPara = qObj.paragraph;
    const passageEl = document.getElementById('satPassageContent');
    if (passageEl) {
      if (rawPara && rawPara !== 'null' && rawPara.trim() !== '') {
        passageEl.innerHTML = `
          <div class="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200/60 text-[11px] font-bold text-indigo-600 select-none">
            <span>💡</span>
            <span>Tip: Single-click or tap any word to look it up in the Dictionary!</span>
          </div>
          <p>${(typeof window.renderInteractiveText === 'function' ? window.renderInteractiveText(rawPara) : escapeHtml(rawPara)).replace(/\n/g, '</p><p class="mt-3">')}</p>
        `;
      } else {
        passageEl.innerHTML = `<p class="italic text-slate-400">Direct prompt question — read the stem on the right carefully and apply Standard English or subject conventions.</p>`;
      }
    }

    const visContainer = document.getElementById('satVisualContainer');
    if (visContainer) {
      if (item.visuals && item.visuals.svg_content && item.visuals.svg_content !== 'null') {
        visContainer.classList.remove('hidden');
        visContainer.innerHTML = item.visuals.svg_content;
      } else {
        visContainer.classList.add('hidden');
        visContainer.innerHTML = '';
      }
    }

    const promptEl = document.getElementById('satQuestionPrompt');
    if (promptEl) {
      promptEl.innerHTML = (typeof window.renderInteractiveText === 'function')
        ? window.renderInteractiveText(qObj.question || 'Select the best answer.')
        : escapeHtml(qObj.question || 'Select the best answer.');
    }

    const firstClickEl = document.getElementById('liveFirstClickLabel');
    if (firstClickEl) firstClickEl.innerText = 'Waiting for first click...';
    const firstClickTimeEl = document.getElementById('liveFirstClickTimeLabel');
    if (firstClickTimeEl) firstClickTimeEl.innerText = '';
    const drawerEl = document.getElementById('satExplanationDrawer');
    if (drawerEl) drawerEl.classList.add('hidden');

    renderSatOptions(qObj.choices || {});
    startSatTimer();
  }

  function renderSatOptions(choices) {
    const container = document.getElementById('satOptionsList');
    if (!container) return;
    container.innerHTML = '';

    ['A', 'B', 'C', 'D'].forEach(letter => {
      if (!choices[letter]) return;
      const isEliminated = eliminatedSet.has(letter);
      const isSelected = (currentSelectedOption === letter);

      const wrapper = document.createElement('div');
      wrapper.id = `sat-opt-wrap-${letter}`;
      wrapper.className = `flex items-center gap-2 ${isEliminated ? 'option-eliminated' : ''}`;

      const btn = document.createElement('button');
      btn.id = `sat-opt-btn-${letter}`;
      btn.onclick = () => handleSatOptionClick(letter);
      btn.className = `flex-1 text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
        isSelected
          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
          : 'border-slate-200 hover:border-slate-300 bg-white'
      }`;

      btn.innerHTML = `
        <span class="w-7 h-7 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
          isSelected
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-slate-100 text-slate-700 border-slate-200'
        }">${letter}</span>
        <span class="choice-content text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">${escapeHtml(choices[letter])}</span>
      `;

      const strikeBtn = document.createElement('button');
      strikeBtn.onclick = (e) => {
        e.stopPropagation();
        toggleOptionStrikeout(letter);
      };
      strikeBtn.title = "Cross out / restore option";
      strikeBtn.className = "p-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 text-xs font-mono font-bold transition shrink-0";
      strikeBtn.innerText = isEliminated ? 'Undo' : '̶A̶';

      wrapper.appendChild(btn);
      wrapper.appendChild(strikeBtn);
      container.appendChild(wrapper);
    });
  }

  function toggleEliminatorMode() {
    eliminatorMode = !eliminatorMode;
    const btn = document.getElementById('btnEliminatorTool');
    const hint = document.getElementById('eliminatorActiveHint');
    if (eliminatorMode) {
      if (btn) btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white border border-rose-500 transition flex items-center gap-1.5";
      if (hint) hint.classList.remove('hidden');
    } else {
      if (btn) btn.className = "px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5";
      if (hint) hint.classList.add('hidden');
    }
  }

  function toggleOptionStrikeout(letter) {
    if (satQuestionSubmitted) return;
    if (eliminatedSet.has(letter)) {
      eliminatedSet.delete(letter);
    } else {
      eliminatedSet.add(letter);
      if (currentSelectedOption === letter) currentSelectedOption = null;
    }
    const item = filteredSatQuestions[satCurrentIndex];
    if (item && item.question) renderSatOptions(item.question.choices || {});
  }

  function handleSatOptionClick(letter) {
    if (satQuestionSubmitted) return;

    if (eliminatorMode) {
      toggleOptionStrikeout(letter);
      return;
    }

    if (eliminatedSet.has(letter)) {
      eliminatedSet.delete(letter);
    }

    if (!currentFirstClickOption) {
      currentFirstClickOption = letter;
      currentFirstClickTime = Number(satElapsedSeconds.toFixed(1));
      const fl = document.getElementById('liveFirstClickLabel');
      if (fl) fl.innerText = `Choice ${letter}`;
      const ft = document.getElementById('liveFirstClickTimeLabel');
      if (ft) ft.innerText = `(at ${currentFirstClickTime}s)`;
    }

    currentSelectedOption = letter;
    const item = filteredSatQuestions[satCurrentIndex];
    if (item && item.question) renderSatOptions(item.question.choices || {});
  }

  function submitSatAnswer() {
    if (!currentSelectedOption) {
      if (typeof window.showToast === 'function') window.showToast("Please select an option (A, B, C, or D) first!");
      return;
    }
    if (satQuestionSubmitted) return;

    stopSatTimer();
    satQuestionSubmitted = true;

    const item = filteredSatQuestions[satCurrentIndex];
    const qObj = item.question;
    const correctKey = qObj.correct_answer;
    const isCorrect = (currentSelectedOption === correctKey);
    const totalSeconds = Number(satElapsedSeconds.toFixed(1));
    const changedMind = (currentFirstClickOption !== currentSelectedOption);
    const xpEarned = isCorrect ? 25 : 5;

    // Record in active child's profile & sync to Firebase
    const p = (window.LuminaDB && typeof window.LuminaDB.getActiveProfile === 'function')
      ? window.LuminaDB.getActiveProfile()
      : ((typeof window.activeProfile === 'function') ? window.activeProfile() : null);

    if (isCorrect && p && window.LuminaDB && typeof window.LuminaDB.markQuestionCompleted === 'function') {
      window.LuminaDB.markQuestionCompleted(p.id, item.id);
    }

    if (typeof window.trackActivity === 'function') {
      window.trackActivity({
        type: 'sat',
        domain: item.domain || 'SAT',
        title: qObj.question || item.id,
        questionId: item.id,
        isCorrect: isCorrect,
        xp: xpEarned,
        durationSec: totalSeconds,
        detail: `Q #${item.id} (${currentSelectedOption})`,
        telemetry: {
          id: item.id || `Q_${satCurrentIndex + 1}`,
          domain: item.domain || 'SAT',
          firstClickTime: currentFirstClickTime || totalSeconds,
          totalTime: totalSeconds,
          firstClick: currentFirstClickOption,
          finalChoice: currentSelectedOption,
          correctKey: correctKey,
          isCorrect: isCorrect,
          changedMind: changedMind
        }
      });
    }

    if (isCorrect && typeof window.confetti === 'function') {
      window.confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
    }

    ['A', 'B', 'C', 'D'].forEach(letter => {
      const btn = document.getElementById(`sat-opt-btn-${letter}`);
      if (!btn) return;
      if (letter === correctKey) {
        btn.className = "flex-1 text-left p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 flex items-start gap-3.5 shadow-sm";
      } else if (letter === currentSelectedOption && !isCorrect) {
        btn.className = "flex-1 text-left p-4 rounded-2xl border-2 border-rose-500 bg-rose-50 text-rose-950 flex items-start gap-3.5";
      }
    });

    const drawer = document.getElementById('satExplanationDrawer');
    if (drawer) drawer.classList.remove('hidden');

    const iconBox = document.getElementById('satResultIconBox');
    const headline = document.getElementById('satFeedbackHeadline');
    if (isCorrect) {
      if (iconBox) {
        iconBox.className = "w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold";
        iconBox.innerText = "✓";
      }
      if (headline) headline.innerText = "Spot On! +25 XP";
    } else {
      if (iconBox) {
        iconBox.className = "w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold";
        iconBox.innerText = "✗";
      }
      if (headline) headline.innerText = `Not quite — Correct Answer is ${correctKey} (+5 XP for effort)`;
    }

    const keyBadge = document.getElementById('satOfficialKeyBadge');
    if (keyBadge) keyBadge.innerText = `Official Key: ${correctKey}`;
    const teleLine = document.getElementById('satFeedbackTelemetryLine');
    if (teleLine) {
      teleLine.innerText = `Total Time: ${totalSeconds}s • 1st Click: ${currentFirstClickOption} (${currentFirstClickTime}s) • ${
        changedMind ? `Switched from ${currentFirstClickOption} to ${currentSelectedOption}` : 'Stuck with 1st instinct'
      }`;
    }
    const expText = document.getElementById('satExplanationText');
    if (expText) expText.innerText = qObj.explanation || "Review the passage context and grammatical structure.";
  }

  function navigateSat(delta) {
    if (satQuestionSubmitted) {
      // Re-filter so completed question is removed
      const filterEl = document.getElementById('satDomainFilter');
      const domain = filterEl ? filterEl.value : 'ALL';
      const teenQs = (typeof window.getTeenQuestions === 'function') ? window.getTeenQuestions(false) : [];
      filteredSatQuestions = (domain === 'ALL') ? [...teenQs] : teenQs.filter(q => (q.domain || 'General') === domain);
      if (filteredSatQuestions.length === 0) {
        loadSatQuestionByIndex(0);
        return;
      }
      if (satCurrentIndex >= filteredSatQuestions.length) {
        satCurrentIndex = 0;
      }
      loadSatQuestionByIndex(satCurrentIndex);
      return;
    }
    const nextIdx = satCurrentIndex + delta;
    if (nextIdx >= 0 && nextIdx < filteredSatQuestions.length) {
      loadSatQuestionByIndex(nextIdx);
    } else {
      if (typeof window.showToast === 'function') window.showToast("Reached the end of this question set!");
    }
  }

  function toggleFlagSatQuestion() {
    const item = filteredSatQuestions[satCurrentIndex];
    if (!item) return;
    if (flaggedQuestions.has(item.id)) {
      flaggedQuestions.delete(item.id);
      if (typeof window.showToast === 'function') window.showToast("Removed flag from question.");
    } else {
      flaggedQuestions.add(item.id);
      if (typeof window.showToast === 'function') window.showToast("Question flagged for review.");
    }
  }

  /* ---------------------------------------------------------------------
     TRILINGUAL VOCABULARY STUDIO (TEEN)
     --------------------------------------------------------------------- */
  function setTeenLangSubMode(mode) {
    const pack = window.multiLangData && window.multiLangData[window.appData.activeLanguage];
    if (mode === 'letters' && (!pack || !pack.letters || pack.letters.length === 0)) {
      if (typeof window.showToast === 'function') window.showToast("Alphabet Letters mode is available for Malayalam & Hindi!");
      return;
    }
    teenSubMode = mode;
    ['letters', 'words', 'sentences'].forEach(m => {
      const b = document.getElementById(`btn-teen-sub-${m}`);
      if (!b) return;
      if (m === mode) {
        b.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition bg-white text-slate-900 shadow-xs";
      } else {
        b.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900";
      }
    });
    teenCardIdx = 0;
    teenQuizIdx = 0;
    renderTeenLanguageStudio();
  }

  function selectActiveLanguage(lang) {
    if (window.appData) window.appData.activeLanguage = lang;
    ['malayalam', 'hindi', 'spanish'].forEach(l => {
      const pill = document.getElementById(`pill-${l}`);
      if (!pill) return;
      if (l === lang) {
        pill.className = "px-4 py-2 rounded-xl text-xs font-bold transition bg-white text-slate-900 shadow-xs flex items-center gap-2";
      } else {
        pill.className = "px-4 py-2 rounded-xl text-xs font-bold transition text-slate-600 hover:text-slate-900 flex items-center gap-2";
      }
    });
    const pack = window.multiLangData && window.multiLangData[lang];
    const lettersBtn = document.getElementById('btn-teen-sub-letters');
    if (lettersBtn && pack) {
      if (!pack.letters || pack.letters.length === 0) {
        lettersBtn.classList.add('opacity-40', 'cursor-not-allowed');
        if (teenSubMode === 'letters') teenSubMode = 'words';
      } else {
        lettersBtn.classList.remove('opacity-40', 'cursor-not-allowed');
      }
    }
    setTeenLangSubMode(teenSubMode);
  }

  function getActiveTeenCardList() {
    const pack = window.multiLangData[window.appData.activeLanguage];
    if (teenSubMode === 'letters' && pack.letters && pack.letters.length > 0) {
      return pack.letters.map(item => ({
        script: item.char,
        translit: item.translit,
        meaning: `${item.word} • ${item.wordMeaning}`,
        example: `Letter sound & vocabulary in ${pack.label}`
      }));
    }
    if (teenSubMode === 'sentences' && pack.sentences && pack.sentences.length > 0) {
      return pack.sentences.map(item => ({
        script: item.script,
        translit: item.translit || '',
        meaning: item.meaning,
        example: `Natural everyday sentence in ${pack.label}`
      }));
    }
    return pack.teenCards || [];
  }

  function renderTeenLanguageStudio() {
    const pack = window.multiLangData && window.multiLangData[window.appData.activeLanguage];
    if (!pack) return;
    const list = getActiveTeenCardList();
    if (list.length === 0) return;
    const card = list[teenCardIdx % list.length];

    const flipCard = document.getElementById('teenFlipCard');
    if (flipCard) flipCard.classList.remove('flipped');
    const counter = document.getElementById('teenCardCounter');
    if (counter) counter.innerText = `${(teenCardIdx % list.length) + 1} / ${list.length}`;
    const sc = document.getElementById('teenLangScript');
    if (sc) sc.innerText = card.script;
    const tr = document.getElementById('teenLangTranslit');
    if (tr) tr.innerText = card.translit;
    const me = document.getElementById('teenLangMeaning');
    if (me) me.innerText = card.meaning;
    const ex = document.getElementById('teenLangExample');
    if (ex) ex.innerText = card.example;

    // Pull quiz question with zero repeats using Fisher-Yates deck queue
    const quiz = (typeof window.getNextFromDeck === 'function' && pack.teenQuiz)
      ? window.getNextFromDeck('teen_quiz_' + window.appData.activeLanguage, pack.teenQuiz, q => q.q)
      : (pack.teenQuiz && pack.teenQuiz[0]);

    if (quiz) {
      const qEl = document.getElementById('teenLangQuizQuestion');
      if (qEl) qEl.innerText = quiz.q;
      const bEl = document.getElementById('teenLangQuizBanner');
      if (bEl) bEl.classList.add('hidden');
      window._currentTeenQuiz = quiz;

      const choicesEl = document.getElementById('teenLangQuizChoices');
      if (choicesEl) {
        choicesEl.innerHTML = quiz.choices.map((c, i) => `
          <button onclick="checkTeenLangQuiz(${i}, ${quiz.answer})" class="p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 text-left font-bold text-xs sm:text-sm text-slate-800 transition">
            ${escapeHtml(c)}
          </button>
        `).join('');
      }
    }
  }

  function stepTeenLangCard(delta) {
    const pack = window.multiLangData[window.appData.activeLanguage];
    const list = getActiveTeenCardList();
    if (list.length === 0) return;
    teenCardIdx = (teenCardIdx + delta + list.length) % list.length;
    if (window.LuminaDB && typeof window.LuminaDB.recordActivity === 'function') {
      window.LuminaDB.recordActivity({
        type: 'flashcard',
        isQuestion: false,
        domain: pack.label,
        title: list[teenCardIdx].script,
        xp: 2,
        durationSec: 4
      });
    }
    renderTeenLanguageStudio();
    speakCurrentTeenWord();
  }

  function speakCurrentTeenWord() {
    const pack = window.multiLangData[window.appData.activeLanguage];
    const list = getActiveTeenCardList();
    if (list.length === 0) return;
    const card = list[teenCardIdx % list.length];
    if (typeof window.speakNativeAudio === 'function') {
      window.speakNativeAudio(card.script, pack.langCode);
    }
  }

  function checkTeenLangQuiz(chosen, correct) {
    const pack = window.multiLangData[window.appData.activeLanguage];
    const quiz = window._currentTeenQuiz || (pack && pack.teenQuiz && pack.teenQuiz[0]);
    if (!quiz) return;
    const isCorrect = (chosen === correct);
    const banner = document.getElementById('teenLangQuizBanner');
    if (banner) banner.classList.remove('hidden');

    if (typeof window.trackActivity === 'function') {
      window.trackActivity({
        type: 'language_quiz',
        domain: pack.label,
        title: quiz.q,
        isCorrect: isCorrect,
        xp: isCorrect ? 20 : 2,
        durationSec: 8,
        detail: quiz.choices[chosen] || ''
      });
    }

    if (isCorrect) {
      if (typeof window.confetti === 'function') {
        window.confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      }
      if (banner) {
        banner.className = "mt-5 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200";
        banner.innerHTML = `<span>🎉 Correct! +20 XP earned!</span> <button onclick="nextTeenLangQuizQuestion()" class="px-3 py-1 rounded-lg bg-emerald-600 text-white">Next Question →</button>`;
      }
    } else {
      if (banner) {
        banner.className = "mt-5 p-4 rounded-2xl text-xs font-bold flex items-center justify-between bg-rose-50 text-rose-800 border border-rose-200";
        banner.innerHTML = `<span>Not quite! Try another option or flip the study card.</span>`;
      }
    }
  }

  function nextTeenLangQuizQuestion() {
    teenQuizIdx++;
    renderTeenLanguageStudio();
  }

  window.openTeenTab = openTeenTab;
  window.renderSubNavForTeen = renderSubNavForTeen;
  window.renderTeenDashboard = renderTeenDashboard;
  window.selectCalendarDay = selectCalendarDay;
  window.launchSatWithDomain = launchSatWithDomain;
  window.updateTelemetryWidgets = updateTelemetryWidgets;
  window.resetSatTelemetry = resetSatTelemetry;
  window.populateDomainFilterDropdown = populateDomainFilterDropdown;
  window.onFilterSatQuestions = onFilterSatQuestions;
  window.startSatTimer = startSatTimer;
  window.stopSatTimer = stopSatTimer;
  window.loadSatQuestionByIndex = loadSatQuestionByIndex;
  window.renderSatOptions = renderSatOptions;
  window.toggleEliminatorMode = toggleEliminatorMode;
  window.toggleOptionStrikeout = toggleOptionStrikeout;
  window.handleSatOptionClick = handleSatOptionClick;
  window.submitSatAnswer = submitSatAnswer;
  window.navigateSat = navigateSat;
  window.toggleFlagSatQuestion = toggleFlagSatQuestion;
  window.setTeenLangSubMode = setTeenLangSubMode;
  window.selectActiveLanguage = selectActiveLanguage;
  window.getActiveTeenCardList = getActiveTeenCardList;
  window.renderTeenLanguageStudio = renderTeenLanguageStudio;
  window.stepTeenLangCard = stepTeenLangCard;
  window.speakCurrentTeenWord = speakCurrentTeenWord;
  window.checkTeenLangQuiz = checkTeenLangQuiz;
  window.nextTeenLangQuizQuestion = nextTeenLangQuizQuestion;
})(window);
