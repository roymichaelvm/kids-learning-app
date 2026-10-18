/**
 * Lumina Family Learning Hub — shared Firebase (Cloud Firestore) + kid profile engine.
 * Used by BOTH index.html (kids) and admin.html (parent).
 *
 * Firestore layout:
 *   profiles/{profileId}                  -> name, avatar, goals, xp, streak, domainMastery, telemetryLogs
 *   profiles/{profileId}/days/{YYYY-MM-DD} -> that day's questions, accuracy, minutes, XP, subjects, activity log
 *   question_chunks/chunk_{n}             -> question bank (split into chunks to stay under Firestore's 1 MB doc limit)
 *   app_state/meta                        -> question count, chunk count, custom 6yo picture cards
 *
 * Everything is also saved in localStorage, so the app keeps working offline and syncs when back online.
 */
(function (window) {
  'use strict';

  /* =========================================================================
     FIREBASE WEB APP CONFIG
     May be loaded externally via 'firebase-config.js' (ignored by git),
     or falls back to default project settings.
     ========================================================================= */
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyBQk1RPwmFn8mIotcN-JeLWGiPCRKNQPL8",
    authDomain: "kids-learning-714a2.firebaseapp.com",
    projectId: "kids-learning-714a2",
    storageBucket: "kids-learning-714a2.firebasestorage.app",
    messagingSenderId: "1027042382883",
    appId: "1:1027042382883:web:568461c9a630099fc14d96",
    measurementId: "G-FWKTR21DEZ"
  };
  const FIREBASE_CONFIG = window.LUMINA_FIREBASE_CONFIG || DEFAULT_CONFIG;

  const STORAGE_KEY = 'lumina_family_hub_v3';
  const QUESTIONS_STORAGE_KEY = 'lumina_questions_cache_v3';
  const LANGUAGE_PACKS_STORAGE_KEY = 'lumina_language_packs_cache_v1';
  const LOCAL_DAYS_TO_KEEP = 90;       // days of history cached on each device (Firebase keeps everything)
  const MAX_ACTIVITIES_PER_DAY = 100;
  const MAX_TELEMETRY_LOGS = 300;
  const QUESTION_CHUNK_SIZE = 100;

  // Default seed questions (SAT Reading/Writing, SAT Math, Science, and 6+ Kid Spelling/Comprehension/Grammar)
  const DEFAULT_QUESTIONS = [
    {
      id: "sat_rw_01", targetProfile: "teen", domain: "Information and Ideas", difficulty: "Medium",
      question: {
        paragraph: "In the essay \"On Liberty,\" John Stuart Mill argues that \"the peculiar evil of silencing the expression of an opinion is, that it is robbing the human race; posterity as well as the existing generation; those who dissent from the opinion, still more than those who hold it.\"",
        question: "What is Mill's main point in this passage from \"On Liberty\"?",
        choices: {
          A: "Suppressing opinions robs future generations of the chance to hear them, even if they disagree with them.",
          B: "It is harmful to silence opinions that are held by a majority of people.",
          C: "People who dissent from an opinion are more likely to be harmed by its suppression than those who hold it.",
          D: "It is important to respect all opinions, even if they are wrong."
        },
        correct_answer: "A",
        explanation: "Mill argues that suppressing opinions is a harm to everyone, including future generations, because it prevents them from hearing and potentially engaging with these ideas."
      }
    },
    {
      id: "sat_rw_02", targetProfile: "teen", domain: "Standard English Conventions", difficulty: "Medium",
      question: {
        paragraph: "The researchers concluded that, in fact, as many as half of the hunters in the groups they studied were female. This finding was a direct challenge to the accepted view that female participation in hunting was negligible.",
        question: "Which choice best combines the sentences to create a grammatically correct and stylistically effective sentence?",
        choices: {
          A: "This finding was a direct challenge to the accepted view, that female participation in hunting was negligible.",
          B: "This finding directly challenged the accepted view, that female participation in hunting was negligible.",
          C: "This finding directly challenged the accepted view that female participation in hunting was negligible.",
          D: "This finding, a direct challenge to the accepted view, that female participation in hunting was negligible."
        },
        correct_answer: "C",
        explanation: "Choice C keeps a correct grammatical structure and avoids an unnecessary comma before the restrictive 'that' clause."
      }
    },
    {
      id: "sat_rw_03", targetProfile: "teen", domain: "Expression of Ideas", difficulty: "Medium",
      question: {
        paragraph: "The article argues that the way people use technology can be divided into two categories. One category is the use of technology for specific tasks, which the authors call \"instrumental\" use. The other category is the use of technology for pleasure or entertainment, which the authors call \"noninstrumental\" use. This distinction is important because it can help explain why people use technology in different ways, and how these different uses can affect people’s lives.",
        question: "What is the main idea of this article?",
        choices: {
          A: "Instrumental use of technology is more important than noninstrumental use.",
          B: "The distinction between instrumental and noninstrumental use of technology is important for understanding how people use technology in the twenty-first century.",
          C: "Noninstrumental use of technology is more important than instrumental use.",
          D: "The use of technology has a significant impact on people’s lives in the twenty-first century."
        },
        correct_answer: "B",
        explanation: "The passage centers on why distinguishing between instrumental and noninstrumental technology use helps explain different usage patterns and effects."
      }
    },
    {
      id: "sat_rw_04", targetProfile: "teen", domain: "Information and Ideas", difficulty: "Hard",
      question: {
        paragraph: "The author is most interested in the impact of the internet on the way information is spread, focusing on the ways that individuals have become more powerful in shaping and distributing information. One of the key points the author makes is that information is no longer solely controlled by institutions and governments. This can be seen in the rise of citizen journalism. The author also notes the downsides of the internet, such as the spread of misinformation. However, the author’s primary focus is on the positive ways that the internet has empowered individuals.",
        question: "Which statement best describes the author’s main point?",
        choices: {
          A: "The internet has revolutionized the way information is distributed, making it more accessible and empowering individuals.",
          B: "The internet has both positive and negative effects on the way information is shared.",
          C: "Traditional sources of information are no longer as trustworthy as they once were.",
          D: "The internet has made the world a smaller place, making it easier for people to connect with one another."
        },
        correct_answer: "A",
        explanation: "While acknowledging downsides, the author's primary focus is on the positive ways the internet has empowered individuals."
      }
    },
    {
      id: "sat_rw_05", targetProfile: "teen", domain: "Craft and Structure", difficulty: "Medium",
      question: {
        paragraph: "The novel \"Jane Eyre\" by Charlotte Bronte features scenes that use several literary devices, such as foreshadowing and imagery, to create a powerful and engaging reading experience. The novel is narrated by Jane Eyre herself, and the reader only sees the world through Jane’s eyes. This literary device is key in building empathy for Jane and her character.",
        question: "In this passage, the use of the first-person perspective primarily serves to",
        choices: {
          A: "create suspense and intrigue for the reader.",
          B: "develop the reader’s understanding of the story’s setting.",
          C: "emphasize the importance of the speaker’s feelings and experiences.",
          D: "suggest that the speaker is addressing a large audience."
        },
        correct_answer: "C",
        explanation: "First-person narration lets the reader experience Jane's feelings directly, building empathy."
      }
    },
    {
      id: "sat_math_01", targetProfile: "teen", domain: "SAT Math — Algebra", difficulty: "Medium",
      question: {
        paragraph: "A research drone ascends at a constant rate of 14 meters per second from an initial platform 28 meters above ground level. The height h(t), in meters, after t seconds is modeled by h(t) = 14t + 28.",
        question: "After how many seconds will the drone reach an altitude of 140 meters?",
        choices: { A: "6 seconds", B: "8 seconds", C: "10 seconds", D: "12 seconds" },
        correct_answer: "B",
        explanation: "14t + 28 = 140 → 14t = 112 → t = 8 seconds."
      }
    },
    {
      id: "sat_math_adv_01", targetProfile: "teen", domain: "SAT Math — Advanced Math & Data", difficulty: "Medium",
      question: {
        paragraph: "A ball is launched vertically upward from a platform. Its height h(t), in meters above the ground, after t seconds is given by the quadratic function h(t) = -5(t - 3)² + 52.",
        question: "What is the maximum height, in meters, that the ball reaches above the ground?",
        choices: { A: "3 meters", B: "45 meters", C: "47 meters", D: "52 meters" },
        correct_answer: "D",
        explanation: "In vertex form h(t) = a(t - h)² + k with a = -5 < 0, the vertex (3, 52) gives the maximum height of 52 meters at t = 3 seconds."
      }
    },
    {
      id: "sat_math_02", targetProfile: "teen", domain: "SAT Math — Geometry & Trig", difficulty: "Hard",
      question: {
        paragraph: "A right circular cylinder has a volume of 45π cubic centimeters and a radius of 3 centimeters. The formula for the volume of a cylinder is V = πr²h.",
        question: "What is the total surface area (including both circular bases) of this cylinder?",
        choices: { A: "30π cm²", B: "39π cm²", C: "48π cm²", D: "54π cm²" },
        correct_answer: "C",
        explanation: "45π = 9πh → h = 5. Surface area = 2πr² + 2πrh = 18π + 30π = 48π cm²."
      }
    },
    {
      id: "sci_stem_01", targetProfile: "teen", domain: "Science & Biology", difficulty: "Medium",
      question: {
        paragraph: "CRISPR-Cas9 is a genome-editing tool that acts like molecular scissors, allowing geneticists to cut DNA at precise locations directed by a guide RNA sequence.",
        question: "What is the primary role of the guide RNA (gRNA) in the CRISPR-Cas9 complex?",
        choices: {
          A: "It provides the metabolic energy required to cleave the cell membrane.",
          B: "It binds to the matching target DNA sequence so the Cas9 enzyme cuts at the exact intended locus.",
          C: "It synthesizes new amino acids directly inside the ribosome.",
          D: "It prevents the cell from undergoing mitosis."
        },
        correct_answer: "B",
        explanation: "The guide RNA's complementary sequence binds the target DNA, directing Cas9 to cut at the right spot."
      }
    },
    {
      id: "kid_spell_01", targetProfile: "kid", domain: "6+ Spelling Bee", difficulty: "Easy",
      question: {
        paragraph: "🐝 Phonics Clue: It starts with 'FR' and ends with 'END'. It means someone you love to play and share with!",
        question: "Which is the correct spelling for the word 'FRIEND'?",
        choices: { A: "FREND", B: "FRIEND", C: "FREIND", D: "FRAND" },
        correct_answer: "B",
        explanation: "Remember the fun rhyme: 'A FRIEND is a pal to the END!' -> F - R - I - E - N - D."
      }
    },
    {
      id: "kid_comp_01", targetProfile: "kid", domain: "6+ Story Comprehension", difficulty: "Easy",
      question: {
        paragraph: "🦁 Leo the Little Lion loved wearing his bright yellow sun hat. One windy afternoon, a big gust of wind blew his hat right into the tall green grass! Leo's friend, Zara the tall Giraffe, looked down from above the trees and spotted the yellow hat right away.",
        question: "How was Zara the Giraffe able to find Leo's lost hat so quickly?",
        choices: {
          A: "She used a pair of binoculars.",
          B: "She was tall enough to look down from above the trees and grass.",
          C: "She dug a hole under the river.",
          D: "It was glowing in the dark at midnight."
        },
        correct_answer: "B",
        explanation: "The story says Zara the tall Giraffe looked down from above the trees and spotted the yellow hat in the tall grass!"
      }
    },
    {
      id: "kid_gram_01", targetProfile: "kid", domain: "6+ Grammar & Sentences", difficulty: "Easy",
      question: {
        paragraph: "🏃 Grammar Tip: An ACTION VERB is a word that shows what someone or something DOES (like run, jump, read, or sing).",
        question: "Which word in this sentence is the ACTION VERB?\n'The happy puppy jumped over the red ball.'",
        choices: { A: "puppy", B: "happy", C: "jumped", D: "ball" },
        correct_answer: "C",
        explanation: "'Jumped' is the action verb because it tells what the puppy did!"
      }
    }
  ];

  /* ------------------------------------------------------------------ helpers */
  function clean(obj) { return JSON.parse(JSON.stringify(obj)); } // strips `undefined` (Firestore rejects it)

  function dateKey(d) {
    const x = d || new Date();
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  }

  function daysAgoKey(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return dateKey(d);
  }

  function emptyDay(key) {
    return { date: key, questionsAttempted: 0, questionsCorrect: 0, xpEarned: 0, secondsSpent: 0, cardsViewed: 0, subjects: {}, activities: [] };
  }

  function ensureProfileFields(p) {
    if (!p) return p;
    if (!Array.isArray(p.completedQuestionIds)) p.completedQuestionIds = [];
    if (!p.dailyActivity) p.dailyActivity = {};
    if (!p.domainMastery) p.domainMastery = {};
    if (!Array.isArray(p.telemetryLogs)) p.telemetryLogs = [];
    return p;
  }

  function newProfile(fields) {
    const ageGroup = fields.ageGroup === 'kid' ? 'kid' : 'teen';
    return {
      id: fields.id,
      name: fields.name || 'New Learner',
      avatar: fields.avatar || '🌟',
      ageGroup: ageGroup,
      ageLabel: fields.ageLabel || (ageGroup === 'kid' ? 'Little Explorer' : 'Teen Scholar'),
      dailyGoalQuestions: Number(fields.dailyGoalQuestions) || (ageGroup === 'kid' ? 10 : 12),
      dailyGoalMinutes: Number(fields.dailyGoalMinutes) || (ageGroup === 'kid' ? 15 : 20),
      xp: 0,
      streakDays: 0,
      lastActiveDate: null,
      createdAt: new Date().toISOString(),
      dailyActivity: {},
      domainMastery: {},
      telemetryLogs: [],
      completedQuestionIds: Array.isArray(fields.completedQuestionIds) ? fields.completedQuestionIds : []
    };
  }

  function defaultProfiles() {
    return {
      teen_1: newProfile({ id: 'teen_1', name: '13yo Scholar', avatar: '🎓', ageGroup: 'teen', ageLabel: '13yo Teen Scholar', dailyGoalQuestions: 12, dailyGoalMinutes: 20 }),
      kid_1: newProfile({ id: 'kid_1', name: '6yo Explorer', avatar: '🦁', ageGroup: 'kid', ageLabel: '6yo Little Explorer', dailyGoalQuestions: 10, dailyGoalMinutes: 15 })
    };
  }

  function friendlyError(e) {
    const code = String((e && e.code) || '');
    const msg = (e && e.message) || String(e);
    if (code.includes('operation-not-allowed') || code.includes('admin-restricted-operation'))
      return 'Turn on Anonymous sign-in: Firebase Console → Authentication → Sign-in method → Anonymous → Enable.';
    if (code.includes('api-key-not-valid') || code.includes('invalid-api-key'))
      return 'The apiKey in firebase-db.js is not valid. Copy it again from Project settings.';
    if (code.includes('permission-denied'))
      return 'Firestore security rules blocked the request. Publish the rules from the README setup guide.';
    if (code.includes('not-found') || msg.includes('does not exist'))
      return 'Firestore database not found. Create it in Firebase Console → Firestore Database → Create database.';
    if (code.includes('unavailable'))
      return 'Offline. Progress is saved on this device and will sync when back online.';
    return msg;
  }

  const PERSISTED_KEYS = ['activeProfileId', 'teenSubTab', 'activeLanguage', 'kidCategory', 'profiles', 'customKidCards', 'lastCloudSync'];

  /* ------------------------------------------------------------------ engine */
  const LuminaDB = {
    FIREBASE_CONFIG: FIREBASE_CONFIG,
    DEFAULT_QUESTIONS: DEFAULT_QUESTIONS,
    getTodayDateKey: dateKey,

    state: {
      activeProfileId: 'teen_1',
      teenSubTab: 'dashboard',
      activeLanguage: 'malayalam',
      kidCategory: 'malayalam',
      profiles: defaultProfiles(),
      questions: clean(DEFAULT_QUESTIONS),
      customKidCards: [],
      languagePacks: {},
      lastCloudSync: null,
      cloudStatus: 'local',   // 'local' | 'syncing' | 'connected' | 'error'
      cloudMessage: ''
    },

    db: null,
    readyPromise: Promise.resolve(false),
    pushing: false,
    syncTimer: null,
    syncDue: 0,
    listeners: [],
    pending: { profiles: new Set(), days: new Set(), deletes: new Set(), questions: false, meta: false },

    isConfigured: function () {
      const k = FIREBASE_CONFIG.apiKey || '';
      return k.length > 10 && k.indexOf('PASTE') !== 0;
    },

    init: function () {
      this.loadFromLocal();
      this.ensureDefaultProfiles();
      this.pruneOldDays();
      this.readyPromise = this.connect();
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.hasPending()) this.pushToCloud();
      });
      return this.readyPromise;
    },

    isAdmin: false,
    user: null,

    checkIfAdmin: function (user) {
      if (!user) return false;
      const em = (user.email || '').toLowerCase().trim();
      const uid = user.uid || '';
      return (
        em === 'admin@lumina.local' ||
        em === 'admin@lumina.com' ||
        em === 'parent-admin@kids-learning-714a2.local' ||
        em.startsWith('parent-admin@') ||
        em.startsWith('admin@') ||
        uid === 'PhoXVNDqH0SsQhlejoY7ko3zvee2' ||
        uid === 'yc14OBS0vKWh2tjfTf6H3ez41P23'
      );
    },

    connect: async function () {
      if (!this.isConfigured()) {
        this.setStatus('local', 'Firebase is not set up yet. Paste your web config into firebase-config.js (see README).');
        return false;
      }
      if (!window.firebase || !window.firebase.firestore) {
        this.setStatus('error', 'Firebase SDK could not be loaded (are you offline?). Progress is saved on this device.');
        return false;
      }
      try {
        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        this.db = firebase.firestore();

        if (firebase.auth) {
          firebase.auth().onAuthStateChanged(user => {
            this.user = user;
            this.isAdmin = this.checkIfAdmin(user);
            if (user) {
              this.setStatus('connected', this.isAdmin
                ? 'Authenticated as Parent Admin (Full Write Access)'
                : `Signed in as ${user.email || 'Family Account'}`);
              this.pullFromCloud();
            } else {
              this.setStatus('connected', 'Sign in required to access Lumina Learning Hub');
            }
            this.notify();
          });
          this.user = firebase.auth().currentUser;
          if (this.user) {
            this.isAdmin = this.checkIfAdmin(this.user);
          }
        }

        this.setStatus('connected', this.user
          ? (this.isAdmin ? 'Authenticated as Parent Admin (Full Write Access)' : `Signed in as ${this.user.email || 'Family'}`)
          : 'Connected to Firebase (Sign in for Cloud Access)');
        return true;
      } catch (e) {
        console.warn('Firebase connect error:', e);
        this.setStatus('error', friendlyError(e));
        return false;
      }
    },

    signIn: async function (email, password) {
      if (!window.firebase || !firebase.auth) {
        return { ok: false, error: 'Firebase Auth is not available' };
      }
      try {
        const res = await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
        this.user = res.user;
        this.isAdmin = this.checkIfAdmin(res.user);
        this.notify();
        return { ok: true, user: res.user, isAdmin: this.isAdmin };
      } catch (err) {
        return { ok: false, error: (err && err.message) || String(err) };
      }
    },

    signUp: async function (email, password) {
      if (!window.firebase || !firebase.auth) {
        return { ok: false, error: 'Firebase Auth is not available' };
      }
      try {
        const res = await firebase.auth().createUserWithEmailAndPassword(email.trim(), password);
        this.user = res.user;
        this.notify();
        return { ok: true, user: res.user };
      } catch (err) {
        return { ok: false, error: (err && err.message) || String(err) };
      }
    },

    signOut: async function () {
      if (!window.firebase || !firebase.auth) return { ok: true };
      try {
        await firebase.auth().signOut();
        this.user = null;
        this.isAdmin = false;
        this.setStatus('connected', 'Signed out of Firebase.');
        this.notify();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err && err.message) || String(err) };
      }
    },

    getCurrentUser: function () {
      return (window.firebase && firebase.auth && firebase.auth().currentUser) || this.user || null;
    },

    /* ------------------------------------------------ local persistence */
    loadFromLocal: function () {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          PERSISTED_KEYS.forEach(k => {
            if (saved[k] !== undefined && saved[k] !== null) this.state[k] = saved[k];
          });
          if (Array.isArray(saved.questions) && saved.questions.length) {
            this.state.questions = saved.questions;
          }
          if (saved.pending) {
            this.pending.profiles = new Set(saved.pending.profiles || []);
            this.pending.days = new Set(saved.pending.days || []);
            this.pending.deletes = new Set(saved.pending.deletes || []);
            this.pending.questions = Boolean(saved.pending.questions);
            this.pending.meta = Boolean(saved.pending.meta);
          }
        } else {
          this.migrateLegacy();
        }
        const cachedQs = localStorage.getItem(QUESTIONS_STORAGE_KEY);
        if (cachedQs) {
          const parsedQs = JSON.parse(cachedQs);
          if (Array.isArray(parsedQs) && parsedQs.length) this.state.questions = parsedQs;
        }
        if (!Array.isArray(this.state.questions) || this.state.questions.length === 0) {
          this.state.questions = clean(DEFAULT_QUESTIONS);
        }
        const cachedPacks = localStorage.getItem(LANGUAGE_PACKS_STORAGE_KEY);
        if (cachedPacks) {
          try { this.state.languagePacks = JSON.parse(cachedPacks) || {}; } catch (e) {}
        }
      } catch (e) {
        console.warn('LuminaDB local load warning:', e);
      }
    },

    // One-time import of data saved by the older versions of the app on this device
    migrateLegacy: function () {
      try {
        const v2 = JSON.parse(localStorage.getItem('lumina_family_hub_v2') || 'null');
        if (v2) {
          if (Array.isArray(v2.questions) && v2.questions.length) this.state.questions = v2.questions;
          const teen = this.state.profiles.teen_1;
          if (teen && Array.isArray(v2.telemetryLogs)) {
            teen.telemetryLogs = v2.telemetryLogs;
            teen.xp = Number(v2.xp) || 0;
          }
        }
        const bank = JSON.parse(localStorage.getItem('custom_sat_bank') || 'null');
        if (Array.isArray(bank) && bank.length) this.mergeQuestions(bank);
      } catch (e) { /* ignore corrupt legacy data */ }
      // Nothing is marked pending here: if Firebase is empty, pullFromCloud() seeds it with this device's data.
      this.pending = { profiles: new Set(), days: new Set(), deletes: new Set(), questions: false, meta: false };
    },

    ensureDefaultProfiles: function () {
      if (!this.state.profiles || Object.keys(this.state.profiles).length === 0) {
        this.state.profiles = defaultProfiles();
      }
      Object.keys(this.state.profiles).forEach(id => {
        const p = this.state.profiles[id];
        p.id = id;
        if (!p.dailyActivity) p.dailyActivity = {};
        if (!p.domainMastery) p.domainMastery = {};
        if (!Array.isArray(p.telemetryLogs)) p.telemetryLogs = [];
        if (!Array.isArray(p.completedQuestionIds)) p.completedQuestionIds = [];
        if (!p.dailyGoalQuestions) p.dailyGoalQuestions = p.ageGroup === 'kid' ? 10 : 12;
        if (!p.dailyGoalMinutes) p.dailyGoalMinutes = p.ageGroup === 'kid' ? 15 : 20;
      });
      if (!this.state.profiles[this.state.activeProfileId]) {
        this.state.activeProfileId = Object.keys(this.state.profiles)[0];
      }
    },

    pruneOldDays: function () {
      const cutoff = daysAgoKey(LOCAL_DAYS_TO_KEEP);
      Object.values(this.state.profiles).forEach(p => {
        Object.keys(p.dailyActivity || {}).forEach(k => {
          if (k < cutoff && !this.pending.days.has(p.id + '|' + k)) delete p.dailyActivity[k];
        });
      });
    },

    saveQuestionsLocal: function () {
      try {
        localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(this.state.questions));
      } catch (e) {
        console.warn('Could not cache full question bank to localStorage (will stream from Firebase):', e);
      }
    },

    saveLanguagePacksLocal: function () {
      try {
        if (this.state.languagePacks) {
          localStorage.setItem(LANGUAGE_PACKS_STORAGE_KEY, JSON.stringify(this.state.languagePacks));
        }
      } catch (e) {
        console.warn('Could not cache language packs to localStorage:', e);
      }
    },

    getLanguagePack: function (lang) {
      return (this.state.languagePacks && this.state.languagePacks[lang]) || null;
    },

    setLanguagePack: function (lang, pack) {
      if (!this.state.languagePacks) this.state.languagePacks = {};
      this.state.languagePacks[lang] = pack;
      this.saveLanguagePacksLocal();
      this.notify();
    },

    seedLanguagePacksToCloud: async function (packs) {
      const ok = await this.readyPromise;
      if (!ok || !this.db) return { ok: false, error: 'Database not connected' };
      const db = this.db;
      const ts = new Date().toISOString();
      const pMap = packs || this.state.languagePacks || {};
      const ops = [];
      ['malayalam', 'hindi', 'spanish'].forEach(lang => {
        if (pMap[lang]) {
          ops.push(db.collection('language_packs').doc(lang).set(clean({
            lang: lang,
            updatedAt: ts,
            words: pMap[lang].words || [],
            sentences: pMap[lang].sentences || []
          })));
        }
      });
      await Promise.all(ops);
      if (!this.state.languagePacks) this.state.languagePacks = {};
      Object.assign(this.state.languagePacks, pMap);
      this.saveLanguagePacksLocal();
      return { ok: true, count: ops.length };
    },

    saveLocal: function () {
      try {
        const out = {};
        PERSISTED_KEYS.forEach(k => { out[k] = this.state[k]; });
        out.pending = {
          profiles: [...this.pending.profiles],
          days: [...this.pending.days],
          deletes: [...this.pending.deletes],
          questions: this.pending.questions,
          meta: this.pending.meta
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      this.notify();
    },

    onChange: function (cb) { if (typeof cb === 'function') this.listeners.push(cb); },
    notify: function () { this.listeners.forEach(cb => { try { cb(this.state); } catch (e) { console.error(e); } }); },
    setStatus: function (status, msg) {
      this.state.cloudStatus = status;
      if (msg !== undefined) this.state.cloudMessage = msg;
      this.notify();
    },

    hasPending: function () {
      const p = this.pending;
      return p.profiles.size > 0 || p.days.size > 0 || p.deletes.size > 0 || p.questions || p.meta;
    },
    markProfile: function (id) {
      this.pending.profiles.add(id);
      if (this.state.profiles[id]) this.state.profiles[id].updatedAt = new Date().toISOString();
    },
    markDay: function (id, key) { this.pending.days.add(id + '|' + key); },
    markQuestions: function () { this.pending.questions = true; this.pending.meta = true; },

    /* ------------------------------------------------ profiles */
    getActiveProfile: function () {
      const p = this.state.profiles[this.state.activeProfileId] || Object.values(this.state.profiles)[0];
      return ensureProfileFields(p);
    },
    getProfileById: function (id) {
      return ensureProfileFields(this.state.profiles[id] || null);
    },
    getAllProfiles: function () {
      return Object.values(this.state.profiles)
        .map(p => ensureProfileFields(p))
        .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    },
    setActiveProfile: function (id) {
      if (this.state.profiles[id]) {
        this.state.activeProfileId = id;
        this.saveLocal();
      }
    },

    isQuestionCompleted: function (pid, qId) {
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p || !Array.isArray(p.completedQuestionIds)) return false;
      return p.completedQuestionIds.includes(qId);
    },

    markQuestionCompleted: function (pid, qId) {
      if (!qId) return;
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p) return;
      if (!Array.isArray(p.completedQuestionIds)) p.completedQuestionIds = [];
      if (!p.completedQuestionIds.includes(qId)) {
        p.completedQuestionIds.push(qId);
        this.markProfile(p.id);
        this.saveLocal();
        this.scheduleCloudSync();
        this.notify();
      }
    },

    unmarkQuestionCompleted: function (pid, qId) {
      if (!qId) return;
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p || !Array.isArray(p.completedQuestionIds)) return;
      const idx = p.completedQuestionIds.indexOf(qId);
      if (idx !== -1) {
        p.completedQuestionIds.splice(idx, 1);
        this.markProfile(p.id);
        this.saveLocal();
        this.scheduleCloudSync();
        this.notify();
      }
    },

    resetCompletedQuestions: function (pid, domainOrCategory) {
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p || !Array.isArray(p.completedQuestionIds)) return 0;
      let count = 0;
      if (!domainOrCategory || domainOrCategory === 'ALL') {
        count = p.completedQuestionIds.length;
        p.completedQuestionIds = [];
      } else {
        const initialLen = p.completedQuestionIds.length;
        const qIdsInDomain = new Set(
          (this.state.questions || [])
            .filter(q => (q.domain || '') === domainOrCategory)
            .map(q => q.id)
        );
        p.completedQuestionIds = p.completedQuestionIds.filter(id => {
          if (qIdsInDomain.has(id)) return false;
          if (id.startsWith('item_' + domainOrCategory + '_') || id.startsWith('kid_match_' + domainOrCategory + '_')) return false;
          if ((domainOrCategory === 'spelling' || domainOrCategory === '6+ Spelling Bee') && (id.startsWith('spelling_') || id.startsWith('kid_spell_'))) return false;
          if ((domainOrCategory === 'numbers' || domainOrCategory === '6+ Numbers & Math') && id.startsWith('kid_math_')) return false;
          return true;
        });
        count = initialLen - p.completedQuestionIds.length;
      }
      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return count;
    },

    getCompletedQuestionsCount: function (pid, domain) {
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p || !Array.isArray(p.completedQuestionIds)) return 0;
      if (!domain || domain === 'ALL') return p.completedQuestionIds.length;
      const qIdsInDomain = new Set(
        (this.state.questions || [])
          .filter(q => (q.domain || '') === domain)
          .map(q => q.id)
      );
      return p.completedQuestionIds.filter(id => qIdsInDomain.has(id)).length;
    },

    upsertProfile: function (fields) {
      const id = fields.id || ('p_' + Date.now().toString(36));
      const p = this.state.profiles[id] || newProfile(Object.assign({}, fields, { id: id }));
      Object.assign(p, {
        name: String(fields.name || '').trim() || p.name,
        avatar: String(fields.avatar || '').trim() || p.avatar,
        ageGroup: fields.ageGroup ? (fields.ageGroup === 'kid' ? 'kid' : 'teen') : p.ageGroup,
        ageLabel: String(fields.ageLabel || '').trim() || p.ageLabel,
        dailyGoalQuestions: Math.max(1, Number(fields.dailyGoalQuestions) || p.dailyGoalQuestions),
        dailyGoalMinutes: Math.max(1, Number(fields.dailyGoalMinutes) || p.dailyGoalMinutes)
      });
      this.state.profiles[id] = p;
      this.pending.deletes.delete(id);
      this.markProfile(id);
      this.saveLocal();
      this.scheduleCloudSync();
      return p;
    },

    deleteProfile: function (id) {
      if (!this.state.profiles[id] || Object.keys(this.state.profiles).length <= 1) return false;
      delete this.state.profiles[id];
      this.pending.profiles.delete(id);
      [...this.pending.days].forEach(k => { if (k.indexOf(id + '|') === 0) this.pending.days.delete(k); });
      this.pending.deletes.add(id);
      if (this.state.activeProfileId === id) this.state.activeProfileId = Object.keys(this.state.profiles)[0];
      this.saveLocal();
      this.scheduleCloudSync();
      return true;
    },

    clearTelemetry: function (id) {
      const p = this.getProfileById(id || this.state.activeProfileId);
      if (!p) return;
      p.telemetryLogs = [];
      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
    },

    getCurrentStreak: function (p) {
      if (!p || !p.lastActiveDate) return 0;
      return (p.lastActiveDate === dateKey() || p.lastActiveDate === daysAgoKey(1)) ? (p.streakDays || 0) : 0;
    },

    ensureDay: function (p, key) {
      if (!p.dailyActivity) p.dailyActivity = {};
      if (!p.dailyActivity[key]) p.dailyActivity[key] = emptyDay(key);
      const d = p.dailyActivity[key];
      if (!d.subjects) d.subjects = {};
      if (!Array.isArray(d.activities)) d.activities = [];
      return d;
    },

    /**
     * Record one learning event for a profile.
     * opts: { type: 'sat'|'language_quiz'|'kid_quiz'|'flashcard', domain, title, isCorrect, xp, durationSec, detail, telemetry, profileId }
     */
    recordActivity: function (opts) {
      const pid = opts.profileId || this.state.activeProfileId;
      const p = this.getProfileById(pid);
      if (!p) return null;

      const today = dateKey();
      const day = this.ensureDay(p, today);

      if (p.lastActiveDate !== today) {
        p.streakDays = (p.lastActiveDate === daysAgoKey(1)) ? (p.streakDays || 0) + 1 : 1;
        p.lastActiveDate = today;
      }

      const isFlashcard = opts.type === 'flashcard';
      const isQuestion = !isFlashcard && opts.isQuestion !== false;
      const isCorrect = Boolean(opts.isCorrect);
      const xp = Math.max(0, Number(opts.xp) || 0);
      const dur = Math.max(0, Math.round(Number(opts.durationSec) || 0));
      const domain = opts.domain || 'General';

      day.xpEarned = (day.xpEarned || 0) + xp;
      const subj = day.subjects[domain] || (day.subjects[domain] = { attempted: 0, correct: 0, seconds: 0, cardsViewed: 0 });
      subj.seconds = (subj.seconds || 0) + dur;
      if (isFlashcard) {
        day.cardsViewed = (day.cardsViewed || 0) + 1;
        subj.cardsViewed = (subj.cardsViewed || 0) + 1;
      }
      if (isQuestion) {
        day.questionsAttempted = (day.questionsAttempted || 0) + 1;
        subj.attempted = (subj.attempted || 0) + 1;
        if (isCorrect) {
          day.questionsCorrect = (day.questionsCorrect || 0) + 1;
          subj.correct = (subj.correct || 0) + 1;
        }
        day.activities.unshift({
          time: new Date().toISOString(),
          type: opts.type || 'quiz',
          domain: domain,
          title: String(opts.title || domain).slice(0, 140),
          isCorrect: isCorrect,
          xp: xp,
          durationSec: dur,
          detail: String(opts.detail || '').slice(0, 140)
        });
        if (day.activities.length > MAX_ACTIVITIES_PER_DAY) day.activities.length = MAX_ACTIVITIES_PER_DAY;
      }

      p.xp = (p.xp || 0) + xp;
      const m = p.domainMastery[domain] || (p.domainMastery[domain] = { attempted: 0, correct: 0, totalTimeSec: 0, cardsViewed: 0, lastPracticed: today });
      m.totalTimeSec = (m.totalTimeSec || 0) + dur;
      m.lastPracticed = today;
      if (isFlashcard) m.cardsViewed = (m.cardsViewed || 0) + 1;
      if (isQuestion) {
        m.attempted = (m.attempted || 0) + 1;
        if (isCorrect) m.correct = (m.correct || 0) + 1;
      }

      if (opts.questionId && isCorrect) {
        if (!Array.isArray(p.completedQuestionIds)) p.completedQuestionIds = [];
        if (!p.completedQuestionIds.includes(opts.questionId)) {
          p.completedQuestionIds.push(opts.questionId);
        }
      }

      if (opts.telemetry) {
        p.telemetryLogs.push(Object.assign({}, opts.telemetry, { date: today }));
        if (p.telemetryLogs.length > MAX_TELEMETRY_LOGS) p.telemetryLogs = p.telemetryLogs.slice(-MAX_TELEMETRY_LOGS);
      }

      this.markProfile(pid);
      this.markDay(pid, today);
      this.saveLocal();
      this.scheduleCloudSync();
      return day;
    },

    // Active study time (called by a heartbeat in index.html while a child is actively using the app)
    addStudySeconds: function (seconds, profileId) {
      const p = this.getProfileById(profileId || this.state.activeProfileId);
      if (!p) return;
      const today = dateKey();
      const day = this.ensureDay(p, today);
      day.secondsSpent = (day.secondsSpent || 0) + seconds;
      this.markDay(p.id, today);
      this.saveLocal();
      this.scheduleCloudSync(60000);
    },

    getLastNDaysSummary: function (profileId, numDays) {
      const p = this.getProfileById(profileId || this.state.activeProfileId);
      const out = [];
      const n = numDays || 14;
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = dateKey(d);
        const data = (p && p.dailyActivity && p.dailyActivity[key]) || emptyDay(key);
        out.push(Object.assign({}, emptyDay(key), data, {
          dateKey: key,
          label: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          shortDay: d.toLocaleDateString([], { weekday: 'short' }),
          isToday: i === 0
        }));
      }
      return out;
    },

    /* ------------------------------------------------ question bank */
    normalizeQuestion: function (item, idx) {
      return {
        id: String(item.id || ('q_' + Date.now() + '_' + idx)),
        targetProfile: item.targetProfile === 'kid' ? 'kid' : 'teen',
        domain: item.domain || 'Information and Ideas',
        difficulty: item.difficulty || 'Medium',
        visuals: item.visuals || null,
        question: item.question
      };
    },

    mergeQuestions: function (dataArray) {
      const arr = Array.isArray(dataArray) ? dataArray : [dataArray];
      const signatures = new Set(this.state.questions.map(q => (q.domain || '') + '::' + ((q.question && q.question.question) || '')));
      const ids = new Set(this.state.questions.map(q => q.id));
      let added = 0;
      arr.forEach((item, idx) => {
        if (!item || !item.question || !item.question.question) return;
        const q = this.normalizeQuestion(item, idx);
        const sig = q.domain + '::' + q.question.question;
        if (signatures.has(sig)) return;
        if (ids.has(q.id)) q.id = q.id + '_' + (this.state.questions.length + idx);
        signatures.add(sig);
        ids.add(q.id);
        this.state.questions.push(q);
        added++;
      });
      if (added > 0) {
        this.markQuestions();
        this.saveQuestionsLocal();
        this.saveLocal();
        this.scheduleCloudSync();
      }
      return added;
    },

    replaceAllQuestions: function (dataArray) {
      const arr = (Array.isArray(dataArray) ? dataArray : []).filter(i => i && i.question && i.question.question);
      if (!arr.length) return 0;
      this.state.questions = arr.map((item, idx) => this.normalizeQuestion(item, idx));
      this.markQuestions();
      this.saveQuestionsLocal();
      this.saveLocal();
      this.scheduleCloudSync();
      return this.state.questions.length;
    },

    addQuestion: function (q) {
      this.state.questions.unshift(this.normalizeQuestion(q, 0));
      this.markQuestions();
      this.saveQuestionsLocal();
      this.saveLocal();
      this.scheduleCloudSync();
    },

    deleteQuestionAt: function (idx) {
      if (idx < 0 || idx >= this.state.questions.length) return;
      this.state.questions.splice(idx, 1);
      if (!this.state.questions.length) this.state.questions = clean(DEFAULT_QUESTIONS);
      this.markQuestions();
      this.saveQuestionsLocal();
      this.saveLocal();
      this.scheduleCloudSync();
    },

    resetQuestionsToDefault: function () {
      this.state.questions = clean(DEFAULT_QUESTIONS);
      this.markQuestions();
      this.saveQuestionsLocal();
      this.saveLocal();
      this.scheduleCloudSync();
    },

    /* ------------------------------------------------ custom 6yo picture cards */
    addKidCard: function (card) {
      this.state.customKidCards = this.state.customKidCards || [];
      this.state.customKidCards.push(card);
      this.pending.meta = true;
      this.saveLocal();
      this.scheduleCloudSync();
    },
    deleteKidCardAt: function (idx) {
      this.state.customKidCards.splice(idx, 1);
      this.pending.meta = true;
      this.saveLocal();
      this.scheduleCloudSync();
    },

    /* ------------------------------------------------ Firestore sync */
    scheduleCloudSync: function (delay) {
      if (!this.isConfigured()) return;
      const wait = delay || 2000;
      const due = Date.now() + wait;
      if (this.syncTimer && this.syncDue <= due) return; // an earlier sync is already scheduled
      clearTimeout(this.syncTimer);
      this.syncDue = due;
      this.syncTimer = setTimeout(() => {
        this.syncTimer = null;
        this.pushToCloud();
      }, wait);
    },

    pushToCloud: async function () {
      const ok = await this.readyPromise;
      if (!ok || !this.db) return { ok: false, error: this.state.cloudMessage || 'Not connected to Firebase' };
      if (this.pushing) { this.scheduleCloudSync(1500); return { ok: true, queued: true }; }
      if (!this.hasPending()) return { ok: true, nothing: true };

      this.pushing = true;
      this.setStatus('syncing');
      const snap = {
        profiles: [...this.pending.profiles],
        days: [...this.pending.days],
        deletes: [...this.pending.deletes],
        questions: this.pending.questions,
        meta: this.pending.meta
      };
      this.pending = { profiles: new Set(), days: new Set(), deletes: new Set(), questions: false, meta: false };

      const db = this.db;
      const ts = new Date().toISOString();
      try {
        const ops = [];

        snap.profiles.forEach(pid => {
          const p = this.state.profiles[pid];
          if (!p) return;
          const summary = Object.assign({}, p);
          delete summary.dailyActivity; // days live in the sub-collection
          summary.updatedAt = ts;
          ops.push(db.collection('profiles').doc(pid).set(clean(summary)));
        });

        snap.days.forEach(key => {
          const i = key.indexOf('|');
          const pid = key.slice(0, i);
          const date = key.slice(i + 1);
          const p = this.state.profiles[pid];
          const d = p && p.dailyActivity && p.dailyActivity[date];
          if (d) {
            ops.push(db.collection('profiles').doc(pid).collection('days').doc(date)
              .set(clean(Object.assign({}, d, { date: date, profileId: pid, updatedAt: ts }))));
          }
        });

        if (this.isAdmin) {
          for (const pid of snap.deletes) {
            const daysSnap = await db.collection('profiles').doc(pid).collection('days').get();
            daysSnap.forEach(d => ops.push(d.ref.delete()));
            ops.push(db.collection('profiles').doc(pid).delete());
          }

          const metaRef = db.collection('app_state').doc('meta');
          let chunkCount = null;
          if (snap.questions) {
            const oldMeta = await metaRef.get();
            const oldChunks = oldMeta.exists ? (oldMeta.data().questionChunks || 0) : 0;
            const qs = this.state.questions;
            chunkCount = Math.max(1, Math.ceil(qs.length / QUESTION_CHUNK_SIZE));
            for (let c = 0; c < chunkCount; c++) {
              ops.push(db.collection('question_chunks').doc('chunk_' + c).set(clean({
                chunkIndex: c,
                updatedAt: ts,
                questions: qs.slice(c * QUESTION_CHUNK_SIZE, (c + 1) * QUESTION_CHUNK_SIZE)
              })));
            }
            for (let c = chunkCount; c < oldChunks; c++) {
              ops.push(db.collection('question_chunks').doc('chunk_' + c).delete());
            }
          }
          if (snap.questions || snap.meta) {
            const metaData = { updatedAt: ts, questionsCount: this.state.questions.length, customKidCards: this.state.customKidCards || [] };
            if (chunkCount !== null) metaData.questionChunks = chunkCount;
            ops.push(metaRef.set(clean(metaData), { merge: true }));
          }
        }

        await Promise.all(ops);
        this.pushing = false;
        this.state.lastCloudSync = ts;
        this.setStatus('connected', this.isAdmin ? 'Admin changes synced to Firebase' : 'Progress synced to Firebase');
        this.saveLocal();
        if (this.hasPending()) this.scheduleCloudSync(1500);
        return { ok: true };
      } catch (e) {
        console.warn('Firestore push error:', e);
        snap.profiles.forEach(x => this.pending.profiles.add(x));
        snap.days.forEach(x => this.pending.days.add(x));
        if (this.isAdmin) {
          snap.deletes.forEach(x => this.pending.deletes.add(x));
          if (snap.questions) this.pending.questions = true;
          if (snap.meta) this.pending.meta = true;
        }
        this.pushing = false;
        this.setStatus('error', friendlyError(e));
        this.saveLocal();
        return { ok: false, error: friendlyError(e) };
      }
    },

    pullFromCloud: async function () {
      const ok = await this.readyPromise;
      if (!ok || !this.db) return { ok: false, error: this.state.cloudMessage || 'Not connected to Firebase' };
      this.setStatus('syncing');
      try {
        const db = this.db;
        const cutoff = daysAgoKey(LOCAL_DAYS_TO_KEEP);

        // ---- Profiles + recent daily activity
        const profSnap = await db.collection('profiles').get();
        if (profSnap.empty) {
          // First run: seed Firebase with this device's profiles
          Object.values(this.state.profiles).forEach(p => {
            this.pending.profiles.add(p.id);
            Object.keys(p.dailyActivity || {}).forEach(k => this.pending.days.add(p.id + '|' + k));
          });
        } else {
          const merged = {};
          await Promise.all(profSnap.docs.map(async doc => {
            if (this.pending.deletes.has(doc.id)) return;
            const local = this.state.profiles[doc.id];
            const daysSnap = await doc.ref.collection('days').where('date', '>=', cutoff).get();
            const dailyActivity = {};
            daysSnap.forEach(d => { dailyActivity[d.id] = d.data(); });
            // Days changed on this device that haven't been uploaded yet win over the cloud copy
            if (local) {
              Object.keys(local.dailyActivity || {}).forEach(k => {
                if (this.pending.days.has(doc.id + '|' + k)) dailyActivity[k] = local.dailyActivity[k];
              });
            }
            const base = (local && this.pending.profiles.has(doc.id)) ? local : doc.data();
            merged[doc.id] = Object.assign({}, base, { id: doc.id, dailyActivity: dailyActivity });
          }));
          // Keep profiles created on this device that haven't been uploaded yet
          Object.values(this.state.profiles).forEach(p => {
            if (!merged[p.id] && this.pending.profiles.has(p.id)) merged[p.id] = p;
          });
          this.state.profiles = merged;
        }

        // ---- Question bank + custom kid cards (Read-only for kids app; Admin seeds if empty)
        const metaDoc = await db.collection('app_state').doc('meta').get();
        const meta = metaDoc.exists ? metaDoc.data() : null;
        if (!meta || !meta.questionChunks) {
          if (this.isAdmin) this.markQuestions();
        } else {
          if (!this.pending.questions || !this.isAdmin) {
            const chunkDocs = await Promise.all(
              Array.from({ length: meta.questionChunks }, (_, c) => db.collection('question_chunks').doc('chunk_' + c).get())
            );
            let qs = [];
            chunkDocs.forEach(d => { if (d.exists && Array.isArray(d.data().questions)) qs = qs.concat(d.data().questions); });
            if (qs.length) {
              this.state.questions = qs;
              this.saveQuestionsLocal();
            }
          }
          if (!this.pending.meta && Array.isArray(meta.customKidCards)) this.state.customKidCards = meta.customKidCards;
        }

        // ---- Language packs (Malayalam, Hindi, Spanish in Cloud Firestore)
        try {
          const langSnap = await db.collection('language_packs').get();
          if (!langSnap.empty) {
            if (!this.state.languagePacks) this.state.languagePacks = {};
            langSnap.forEach(d => {
              this.state.languagePacks[d.id] = d.data();
            });
            this.saveLanguagePacksLocal();
          } else if (window.EXPANDED_LANGUAGE_PACKS) {
            await this.seedLanguagePacksToCloud(window.EXPANDED_LANGUAGE_PACKS);
          }
        } catch (lErr) {
          console.warn('Language packs sync note:', lErr);
        }

        this.ensureDefaultProfiles();
        this.pruneOldDays();
        this.state.lastCloudSync = new Date().toISOString();
        this.setStatus('connected', 'Up to date with Firebase');
        this.saveLocal();
        if (this.hasPending()) await this.pushToCloud();
        return { ok: true };
      } catch (e) {
        console.warn('Firestore pull error:', e);
        this.setStatus('error', friendlyError(e));
        return { ok: false, error: friendlyError(e) };
      }
    }
  };

  window.LuminaDB = LuminaDB;
})(window);
