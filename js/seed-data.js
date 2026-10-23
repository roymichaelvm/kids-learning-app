/**
 * Lumina Learning Hub — External Curriculum & Question Bank Loader
 * Loads data from external data scripts and JSON:
 *   - data/questions.data.js & data/questions.json (SAT & Kid questions)
 *   - data/curriculum.data.js & data/curriculum.json (Foundational multiLangData & Trilingual 100+ decks)
 *   - data/spelling.data.js & data/spelling.json (6+ Kid Spelling & 13+ Teen Spelling Bee banks)
 * 100% compatible with both direct file:// opening and http(s):// hosting.
 */
(function (window) {
  'use strict';

  const CURRICULUM_CACHE_KEY = 'lumina_curriculum_json_v1';
  const SPELLING_CACHE_KEY = 'lumina_spelling_json_v1';
  const QUESTIONS_CACHE_KEY = 'lumina_default_questions_json_v1';

  // Base fallback skeletons so references are never undefined
  const EMPTY_PACK = (label, domain, lang) => ({
    label: label || '',
    cloudDomain: domain || '',
    langCode: lang || 'en-US',
    kidItems: [],
    letters: [],
    sentences: [],
    teenCards: [],
    teenQuiz: [],
    teenSentenceQuiz: []
  });

  window.multiLangData = window.multiLangData || {
    malayalam: EMPTY_PACK('Malayalam (മലയാളം)', 'Malayalam', 'ml-IN'),
    hindi: EMPTY_PACK('Hindi (हिंदी)', 'Hindi', 'hi-IN'),
    spanish: EMPTY_PACK('Spanish (Español)', 'Spanish', 'es-ES'),
    french: EMPTY_PACK('French (Français)', 'French', 'fr-FR'),
    italian: EMPTY_PACK('Italian (Italiano)', 'Italian', 'it-IT'),
    animals: EMPTY_PACK('Animals & Science', 'Animals & Science', 'en-US'),
    phonics: EMPTY_PACK('Sight Words & Phonics', 'Sight Words & Phonics', 'en-US'),
    numbers: EMPTY_PACK('6+ Numbers & Math', '6+ Numbers & Math', 'en-US'),
    spelling: EMPTY_PACK('6+ Spelling Bee', '6+ Spelling Bee', 'en-US'),
    comprehension: EMPTY_PACK('6+ Story Reading & Comprehension', '6+ Story Reading & Comprehension', 'en-US'),
    grammar: EMPTY_PACK('6+ Grammar & Sentence Building', '6+ Grammar & Sentence Building', 'en-US')
  };

  window.EXPANDED_LANGUAGE_PACKS = window.EXPANDED_LANGUAGE_PACKS || {
    malayalam: { words: [], sentences: [] },
    hindi: { words: [], sentences: [] },
    spanish: { words: [], sentences: [] },
    french: { words: [], sentences: [] },
    italian: { words: [], sentences: [] }
  };
  window.DEFAULT_QUESTIONS = Array.isArray(window.DEFAULT_QUESTIONS) ? window.DEFAULT_QUESTIONS : [];
  window.SHORT_SPELLING_WORDS_RAW = Array.isArray(window.SHORT_SPELLING_WORDS_RAW) ? window.SHORT_SPELLING_WORDS_RAW : [];
  window.TEEN_SPELLING_WORDS = Array.isArray(window.TEEN_SPELLING_WORDS) ? window.TEEN_SPELLING_WORDS : [];

  function applyCurriculumData(currData) {
    if (!currData) return;
    if (currData.multiLangData && typeof currData.multiLangData === 'object') {
      Object.keys(currData.multiLangData).forEach(k => {
        window.multiLangData[k] = currData.multiLangData[k];
      });
    }
    if (currData.expandedLanguagePacks && typeof currData.expandedLanguagePacks === 'object') {
      window.EXPANDED_LANGUAGE_PACKS = currData.expandedLanguagePacks;
    }
  }

  function applySpellingData(spellData) {
    if (!spellData) return;
    if (Array.isArray(spellData.kidWordsRaw) && spellData.kidWordsRaw.length > 0) {
      window.SHORT_SPELLING_WORDS_RAW = spellData.kidWordsRaw;
    }
    if (Array.isArray(spellData.teenWords) && spellData.teenWords.length > 0) {
      window.TEEN_SPELLING_WORDS = spellData.teenWords;
    }
  }

  function applyQuestionsData(qData) {
    if (Array.isArray(qData) && qData.length > 0) {
      window.DEFAULT_QUESTIONS = qData;
      if (window.LuminaDB && window.LuminaDB.state) {
        if (!Array.isArray(window.LuminaDB.state.questions) || window.LuminaDB.state.questions.length === 0) {
          window.LuminaDB.state.questions = JSON.parse(JSON.stringify(qData));
        }
      }
    }
  }

  function hydrateDataFromJson() {
    // 1. First hydrate from in-memory objects loaded via data/*.data.js
    if (window.CURRICULUM_DATA) {
      applyCurriculumData(window.CURRICULUM_DATA);
    }
    if (window.SPELLING_DATA) {
      applySpellingData(window.SPELLING_DATA);
    }
    if (Array.isArray(window.DEFAULT_QUESTIONS) && window.DEFAULT_QUESTIONS.length > 0) {
      applyQuestionsData(window.DEFAULT_QUESTIONS);
    }

    // 2. Fallback to localStorage cache if memory was empty
    try {
      if (!window.CURRICULUM_DATA) {
        const cachedCurr = localStorage.getItem(CURRICULUM_CACHE_KEY);
        if (cachedCurr) applyCurriculumData(JSON.parse(cachedCurr));
      }
      if (!window.SPELLING_DATA) {
        const cachedSpell = localStorage.getItem(SPELLING_CACHE_KEY);
        if (cachedSpell) applySpellingData(JSON.parse(cachedSpell));
      }
      if (!window.DEFAULT_QUESTIONS || window.DEFAULT_QUESTIONS.length === 0) {
        const cachedQ = localStorage.getItem(QUESTIONS_CACHE_KEY);
        if (cachedQ) applyQuestionsData(JSON.parse(cachedQ));
      }
    } catch (e) {
      // LocalStorage access may be restricted in some contexts
    }

    // 3. If running via HTTP/HTTPS, fetch a data/*.json file ONLY when its in-memory
    // copy is missing. The data/*.data.js scripts loaded in <head> mirror the .json
    // files exactly, so fetching when they are present would download the same
    // bytes a second time on every page load.
    // Trade-off: editing ONLY a .json file on a server no longer overrides the
    // bundled .data.js at runtime - always keep the paired files in sync.
    if (typeof window.fetch === 'function' && window.location && window.location.protocol && window.location.protocol.startsWith('http')) {
      if (!window.__QUESTION_LOADER_ACTIVE && (!Array.isArray(window.DEFAULT_QUESTIONS) || window.DEFAULT_QUESTIONS.length === 0)) {
        fetch('data/questions.json')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              applyQuestionsData(data);
              try { localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
            }
          })
          .catch(() => {});
      }

      if (!window.CURRICULUM_DATA) {
        fetch('data/curriculum.json')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              applyCurriculumData(data);
              try { localStorage.setItem(CURRICULUM_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
            }
          })
          .catch(() => {});
      }

      if (!window.SPELLING_DATA) {
        fetch('data/spelling.json')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              applySpellingData(data);
              try { localStorage.setItem(SPELLING_CACHE_KEY, JSON.stringify(data)); } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }
  }

  hydrateDataFromJson();
  window.hydrateDataFromJson = hydrateDataFromJson;
})(window);
