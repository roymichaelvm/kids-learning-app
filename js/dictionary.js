/**
 * Lumina Learning Hub — Tough Words Glossary & Vocabulary Vault Engine
 * Features single-click word lookup, pronunciation, SAT & 6+ Explorer glossaries,
 * and per-profile Tough Words Vault persistence.
 */
(function (window) {
  'use strict';

  const escapeHtml = window.escapeHtml || function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const showToast = function (msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  };

  const TOUGH_WORDS_GLOSSARY = {
    // High-Frequency SAT Vocabulary
    "ubiquitous": {
      pos: "adjective", phonetic: "/juːˈbɪk.wə.təs/",
      def: "Present, appearing, or found everywhere at the same time.",
      simple: "Everywhere you look! Like smartphones or sunlight on Earth.",
      example: "Smartphones have become ubiquitous in modern adolescent life."
    },
    "ephemeral": {
      pos: "adjective", phonetic: "/əˈfem.ər.əl/",
      def: "Lasting for a very short, fleeting period of time.",
      simple: "Short-lived! Like a shooting star or a soap bubble.",
      example: "The ephemeral beauty of cherry blossoms lasts for just a few days each spring."
    },
    "pragmatic": {
      pos: "adjective", phonetic: "/præɡˈmæt.ɪk/",
      def: "Dealing with things sensibly and realistically based on practical rather than theoretical considerations.",
      simple: "Practical and realistic — focused on what really works in real life.",
      example: "The engineer proposed a pragmatic solution that reduced costs without sacrificing safety."
    },
    "ameliorate": {
      pos: "verb", phonetic: "/əˈmiː.li.ə.reɪt/",
      def: "To make something bad, unsatisfactory, or painful much better.",
      simple: "To make things better or improve a tough situation.",
      example: "New medical research helped ameliorate the patients' symptoms."
    },
    "superfluous": {
      pos: "adjective", phonetic: "/suːˈpɜː.flu.əs/",
      def: "Exceeding what is sufficient or necessary; extra and unneeded.",
      simple: "Extra stuff you don't actually need.",
      example: "The editor eliminated superfluous words to make the essay concise."
    },
    "substantiate": {
      pos: "verb", phonetic: "/səbˈstæn.ʃi.eɪt/",
      def: "To provide evidence or proof to support or demonstrate the truth of something.",
      simple: "To prove with solid evidence and facts.",
      example: "The scientist published rigorous lab data to substantiate her hypothesis."
    },
    "anachronism": {
      pos: "noun", phonetic: "/əˈnæk.rə.nɪ.zəm/",
      def: "Something or someone that is chronologically out of place in history.",
      simple: "Something from the wrong time period (like a Roman soldier holding a smartphone).",
      example: "Seeing an airplane flying over the medieval battlefield in the movie was an obvious anachronism."
    },
    "lucid": {
      pos: "adjective", phonetic: "/ˈluː.sɪd/",
      def: "Expressed clearly; very easy to comprehend and understand.",
      simple: "Crystal clear and easy to follow.",
      example: "The professor gave a lucid explanation of quantum mechanics."
    },
    "mitigate": {
      pos: "verb", phonetic: "/ˈmɪt.ɪ.ɡeɪt/",
      def: "To make less severe, serious, or painful.",
      simple: "To lessen harm or ease a problem.",
      example: "Planting mangroves along coastlines helps mitigate storm surge flooding."
    },
    "resilient": {
      pos: "adjective", phonetic: "/rɪˈzɪl.jənt/",
      def: "Able to withstand or recover quickly from difficult conditions or adversity.",
      simple: "Bouncing back strong when things get hard.",
      example: "Desert cacti are resilient plants that endure long droughts."
    },
    "sagacious": {
      pos: "adjective", phonetic: "/səˈɡeɪ.ʃəs/",
      def: "Having or showing keen mental discernment and good judgment; wise.",
      simple: "Wise and having great judgment.",
      example: "The tribal elder gave sagacious counsel to the young leaders."
    },
    "tenacious": {
      pos: "adjective", phonetic: "/təˈneɪ.ʃəs/",
      def: "Tending to keep a firm hold of something; persistent and determined.",
      simple: "Never giving up! Holding on tight to your goals.",
      example: "Her tenacious study habits earned her top marks on the SAT."
    },
    "alacrity": {
      pos: "noun", phonetic: "/əˈlæk.rə.ti/",
      def: "Brisk, cheerful, and eager readiness to do something.",
      simple: "Excited speed and enthusiasm to jump into action.",
      example: "The puppies sprinted into the yard with joyful alacrity."
    },
    "deleterious": {
      pos: "adjective", phonetic: "/ˌdel.ɪˈtɪə.ri.əs/",
      def: "Causing harm, destruction, or damage.",
      simple: "Harmful or bad for health and nature.",
      example: "Chronic sleep deprivation causes deleterious effects on memory."
    },
    "empathy": {
      pos: "noun", phonetic: "/ˈem.pə.θi/",
      def: "The ability to understand and share the feelings of another.",
      simple: "Understanding and caring about how someone else feels inside.",
      example: "Reading diverse novels builds empathy for people from all backgrounds."
    },
    "innocuous": {
      pos: "adjective", phonetic: "/ɪˈnɒk.ju.əs/",
      def: "Not harmful, toxic, or offensive.",
      simple: "Completely harmless (safe).",
      example: "The garden snake looked scary to Maya, but it was completely innocuous."
    },
    "prolific": {
      pos: "adjective", phonetic: "/prəˈlɪf.ɪk/",
      def: "Producing much fruit or foliage or many works.",
      simple: "Creating lots and lots of wonderful things.",
      example: "The prolific author wrote over forty adventure novels in her lifetime."
    },
    // 6+ Explorer Science & Story Words
    "chrysalis": {
      pos: "noun", phonetic: "/ˈkrɪs.ə.lɪs/",
      def: "The hard protective shell inside which a caterpillar transforms into a butterfly.",
      simple: "A magical sleeping pod where a caterpillar turns into a butterfly!",
      example: "The green chrysalis hung quietly beneath the milkweed leaf."
    },
    "nocturnal": {
      pos: "adjective", phonetic: "/nɒkˈtɜː.nəl/",
      def: "Active primarily during the night rather than daytime.",
      simple: "Awake and active at night, and sleeping all day (like an owl or bat).",
      example: "Barn owls are nocturnal hunters with amazing night eyesight."
    },
    "photosynthesis": {
      pos: "noun", phonetic: "/ˌfəʊ.təʊˈsɪn.θə.sɪs/",
      def: "The chemical process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.",
      simple: "How plants use sunshine and water to cook their own food!",
      example: "Green leaves absorb golden sunlight to carry out photosynthesis."
    },
    "pollinate": {
      pos: "verb", phonetic: "/ˈpɒl.ə.neɪt/",
      def: "To transfer pollen to a flower or plant to allow fertilization and seed formation.",
      simple: "Moving yellow pollen from flower to flower so fruit and seeds can grow.",
      example: "Fuzzy honeybees pollinate apple trees in the farm orchard."
    },
    "habitat": {
      pos: "noun", phonetic: "/ˈhæb.ɪ.tæt/",
      def: "The natural home or environment of an animal, plant, or other organism.",
      simple: "The special natural home where an animal or plant lives best.",
      example: "The coral reef provides a colorful habitat for clownfish and sea turtles."
    },
    "camouflage": {
      pos: "noun / verb", phonetic: "/ˈkæm.ə.flɑːʒ/",
      def: "Natural coloring or patterns that help an animal blend in with its surroundings.",
      simple: "Nature's invisible cloak! Blending in with trees, sand, or snow.",
      example: "The chameleon used green camouflage to hide among leafy branches."
    },
    "hibernate": {
      pos: "verb", phonetic: "/ˈhaɪ.bə.neɪt/",
      def: "To spend the winter in a dormant, deep sleeping state to save energy.",
      simple: "Taking a super-long cozy winter sleep to save energy until warm spring.",
      example: "Bears eat berries in autumn so they can hibernate safely through winter."
    },
    "fossil": {
      pos: "noun", phonetic: "/ˈfɒs.əl/",
      def: "The preserved remains or traces of an ancient plant or animal preserved in rock.",
      simple: "Ancient footprints or bones turned into hard stone over millions of years!",
      example: "The paleontologist uncovered a dinosaur footprint fossil on the cliff."
    },
    "metamorphosis": {
      pos: "noun", phonetic: "/ˌmet.əˈmɔː.fə.sɪs/",
      def: "A complete physical transformation in the shape or structure of an animal during its life cycle.",
      simple: "A complete body transformation, like a tadpole turning into a leaping frog!",
      example: "A tadpole undergoes metamorphosis to become an adult frog."
    },
    "constellation": {
      pos: "noun", phonetic: "/ˌkɒn.stəˈleɪ.ʃən/",
      def: "A recognizable group of stars forming a pattern in the night sky.",
      simple: "A dot-to-dot picture of stars in the night sky (like the Big Dipper!).",
      example: "Orion is a famous constellation with three bright stars in its belt."
    }
  };

  let activeLookupWord = "";

  function openDictionaryModal(initialWord) {
    const overlay = document.getElementById('dictionaryModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    initDictionaryChips();
    renderDictionaryVault();

    if (initialWord && typeof initialWord === 'string') {
      const clean = initialWord.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
      document.getElementById('dictSearchInput').value = clean;
      lookupDictionaryWord(clean);
    } else {
      const firstChip = "ubiquitous";
      document.getElementById('dictSearchInput').value = firstChip;
      lookupDictionaryWord(firstChip);
    }
  }

  function closeDictionaryModal() {
    const overlay = document.getElementById('dictionaryModalOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function lookupDictionaryWord(wordOverride) {
    const inputEl = document.getElementById('dictSearchInput');
    const query = (wordOverride || (inputEl ? inputEl.value : "")).trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (!query) {
      if (typeof window.showToast === 'function') window.showToast("Type or click a word to look up!");
      return;
    }
    activeLookupWord = query;
    const resContainer = document.getElementById('dictResultContainer');
    resContainer.innerHTML = `
      <div class="text-center py-6">
        <div class="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
        <p class="text-xs font-bold text-slate-500">Looking up "${escapeHtml(query)}"...</p>
      </div>
    `;

    // 1. Check Offline Curated Glossary
    if (TOUGH_WORDS_GLOSSARY[query]) {
      renderDictionaryResultCard(query, TOUGH_WORDS_GLOSSARY[query]);
      return;
    }

    // 2. Fetch from Free Dictionary API
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          const entry = data[0];
          const meaning = (entry.meanings && entry.meanings[0]) || {};
          const defObj = (meaning.definitions && meaning.definitions[0]) || {};
          const item = {
            pos: meaning.partOfSpeech || "word",
            phonetic: entry.phonetic || (entry.phonetics && entry.phonetics[0] && entry.phonetics[0].text) || "",
            def: defObj.definition || "No definition found.",
            simple: defObj.definition || "",
            example: defObj.example || `Used in sentence context for: "${query}".`
          };
          renderDictionaryResultCard(query, item);
          return;
        }
      }
    } catch (err) {
      console.warn("Dictionary API lookup error:", err);
    }

    // 3. Fallback when word not found in online dictionary
    resContainer.innerHTML = `
      <div class="text-center py-4 space-y-3">
        <div class="text-4xl">🔍</div>
        <h3 class="text-lg font-extrabold text-slate-900 capitalize">${escapeHtml(query)}</h3>
        <p class="text-xs font-medium text-slate-600 max-w-md mx-auto">
          This specific word wasn't found in the instant English glossary. Double-check your spelling, or tap <strong>Pronounce</strong> to hear it phonetically!
        </p>
        <div class="flex items-center justify-center gap-2 pt-2">
          <button onclick="speakNativeAudio('${escapeHtml(query)}', 'en-US')" class="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5">
            🔊 Pronounce Phonics
          </button>
          <button onclick="toggleSaveToughWord('${escapeHtml(query)}')" class="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 border border-amber-200">
            ⭐ Save to Vault Anyway
          </button>
        </div>
      </div>
    `;
  }

  function renderDictionaryResultCard(word, data) {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : {};
    const isSaved = (p.savedToughWords && p.savedToughWords.includes(word));
    const resContainer = document.getElementById('dictResultContainer');

    resContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
          <div>
            <div class="flex items-center gap-2.5">
              <h3 class="text-2xl font-black text-slate-900 capitalize tracking-tight">${escapeHtml(word)}</h3>
              <button onclick="speakNativeAudio('${escapeHtml(word)}', 'en-US')" class="w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center text-sm shadow-xs transition" title="Listen to pronunciation">
                🔊
              </button>
            </div>
            <p class="text-xs font-mono font-bold text-indigo-600 mt-0.5">
              ${data.pos ? `[${escapeHtml(data.pos)}]` : ''} ${escapeHtml(data.phonetic || '')}
            </p>
          </div>
          <button onclick="toggleSaveToughWord('${escapeHtml(word)}')" class="px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition ${
            isSaved ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200'
          }">
            <span>${isSaved ? '⭐ In My Vault' : '☆ Save to Vault'}</span>
          </button>
        </div>

        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student &amp; Official Definition</span>
          <p class="text-sm font-semibold text-slate-800 mt-1 leading-relaxed">${escapeHtml(data.def)}</p>
        </div>

        ${data.simple ? `
          <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <span>💡</span> <span>Quick &amp; Simple Meaning</span>
            </span>
            <p class="text-xs sm:text-sm font-bold mt-0.5">${escapeHtml(data.simple)}</p>
          </div>
        ` : ''}

        ${data.example ? `
          <div class="p-3 rounded-2xl bg-slate-100/90 text-xs text-slate-700 leading-relaxed italic">
            <strong>Example:</strong> "${escapeHtml(data.example)}"
          </div>
        ` : ''}
      </div>
    `;
  }

  function toggleSaveToughWord(word) {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    if (!p) return;
    if (!p.savedToughWords) p.savedToughWords = [];
    const idx = p.savedToughWords.indexOf(word);
    if (idx >= 0) {
      p.savedToughWords.splice(idx, 1);
      if (typeof window.showToast === 'function') window.showToast(`Removed "${word}" from your vault.`);
    } else {
      p.savedToughWords.push(word);
      if (typeof window.showToast === 'function') window.showToast(`⭐ Saved "${word}" to your Tough Words Vault!`);
    }
    if (typeof window.saveState === 'function') window.saveState();
    renderDictionaryVault();
    if (activeLookupWord === word && TOUGH_WORDS_GLOSSARY[word]) {
      renderDictionaryResultCard(word, TOUGH_WORDS_GLOSSARY[word]);
    }
  }

  function renderDictionaryVault() {
    const p = (typeof window.activeProfile === 'function') ? window.activeProfile() : null;
    const list = (p && p.savedToughWords) || [];
    const countEl = document.getElementById('dictSavedCount');
    const listEl = document.getElementById('dictSavedWordsList');
    if (countEl) countEl.innerText = `${list.length} saved`;
    if (!listEl) return;

    if (list.length === 0) {
      listEl.innerHTML = `<span class="text-xs text-slate-400 italic">No tough words saved yet. Click "☆ Save to Vault" on any word to keep it here!</span>`;
      return;
    }

    listEl.innerHTML = list.map(w => `
      <span onclick="lookupDictionaryWord('${escapeHtml(w)}')" class="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-100/90 hover:bg-amber-200 text-amber-950 font-bold text-xs cursor-pointer border border-amber-300 transition">
        <span>${escapeHtml(w)}</span>
        <button onclick="event.stopPropagation(); toggleSaveToughWord('${escapeHtml(w)}')" class="text-amber-700 hover:text-rose-600 font-extrabold ml-1">&times;</button>
      </span>
    `).join('');
  }

  function initDictionaryChips() {
    const satChipsEl = document.getElementById('dictSatQuickChips');
    const kidChipsEl = document.getElementById('dictKidQuickChips');
    if (satChipsEl && satChipsEl.children.length === 0) {
      const satWords = ["ubiquitous", "ephemeral", "pragmatic", "ameliorate", "substantiate", "anachronism", "mitigate", "resilient", "sagacious", "tenacious", "alacrity", "deleterious"];
      satChipsEl.innerHTML = satWords.map(w => `
        <button onclick="document.getElementById('dictSearchInput').value='${w}'; lookupDictionaryWord('${w}')" class="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition">
          ${w}
        </button>
      `).join('');
    }

    if (kidChipsEl && kidChipsEl.children.length === 0) {
      const kidWords = ["chrysalis", "nocturnal", "photosynthesis", "pollinate", "habitat", "camouflage", "hibernate", "fossil", "metamorphosis", "constellation"];
      kidChipsEl.innerHTML = kidWords.map(w => `
        <button onclick="document.getElementById('dictSearchInput').value='${w}'; lookupDictionaryWord('${w}')" class="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition">
          ${w}
        </button>
      `).join('');
    }
  }

  function renderInteractiveText(text) {
    if (!text) return '';
    const safe = escapeHtml(text);
    return safe.replace(/\b([a-zA-Z]{2,})\b/g, (match) => {
      return `<span class="interactive-word cursor-pointer hover:bg-amber-200/90 hover:text-indigo-950 rounded px-1 py-0.5 transition inline-block select-none active:scale-95" onclick="handleWordSingleClick(event, '${match}')">${match}</span>`;
    });
  }

  function handleWordSingleClick(event, word) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!word) return;
    const clean = word.trim().toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (clean.length >= 2) {
      openDictionaryModal(clean);
    }
  }

  window.TOUGH_WORDS_GLOSSARY = TOUGH_WORDS_GLOSSARY;
  window.openDictionaryModal = openDictionaryModal;
  window.closeDictionaryModal = closeDictionaryModal;
  window.lookupDictionaryWord = lookupDictionaryWord;
  window.renderDictionaryResultCard = renderDictionaryResultCard;
  window.toggleSaveToughWord = toggleSaveToughWord;
  window.renderDictionaryVault = renderDictionaryVault;
  window.initDictionaryChips = initDictionaryChips;
  window.renderInteractiveText = renderInteractiveText;
  window.handleWordSingleClick = handleWordSingleClick;
})(window);
