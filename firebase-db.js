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
  const QUESTIONS_VERSION_KEY = 'lumina_questions_bank_version_v1';
  const LANGUAGE_PACKS_VERSION_KEY = 'lumina_language_packs_version_v1';
  const LOCAL_DAYS_TO_KEEP = 90;       // days of history cached on each device (Firebase keeps everything)
  const MAX_ACTIVITIES_PER_DAY = 100;
  const MAX_TELEMETRY_LOGS = 300;
  const QUESTION_CHUNK_SIZE = 100;

  // Default seed questions loaded from external JSON (data/questions.json) or Firebase Cloud Firestore
  function getDefaultQuestions() {
    if (Array.isArray(window.DEFAULT_QUESTIONS) && window.DEFAULT_QUESTIONS.length > 0) {
      return window.DEFAULT_QUESTIONS;
    }
    return [];
  }
  const DEFAULT_QUESTIONS = getDefaultQuestions();

  /* ------------------------------------------------------------------ helpers */
  function clean(obj) { return JSON.parse(JSON.stringify(obj)); } // strips `undefined` (Firestore rejects it)

  // Content version (FNV-1a hash) used to skip re-downloading unchanged cloud
  // data (question chunks, language packs). Change detection only - it is not
  // a security or authenticity mechanism.
  function computeDataVersion(data) {
    let text;
    try { text = JSON.stringify(data) || ''; } catch (e) { text = String(data); }
    let h = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return 'v' + text.length + '-' + h.toString(36);
  }

  function getStoredVersion(key) {
    try { return localStorage.getItem(key) || null; } catch (e) { return null; }
  }

  function setStoredVersion(key, version) {
    try {
      if (version) localStorage.setItem(key, version);
      else localStorage.removeItem(key);
    } catch (e) {}
  }

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

  const DEFAULT_REWARD_TIERS = [
    {
      id: 'tier_5000',
      points: 5000,
      label: '5,000 XP Quick Treats',
      options: ['Extra 15 Min Bedtime 🌙', 'Pick Dinner Tonight 🍕', 'Skip 1 Small Chore 🧹']
    },
    {
      id: 'tier_10000',
      points: 10000,
      label: '10,000 XP Bronze Treats',
      options: ['Ring Pop 🍭', 'Snickers Mini Pack 🍫', '30 Min Extra Screen Time 📺']
    },
    {
      id: 'tier_20000',
      points: 20000,
      label: '20,000 XP Tier ($1.00 Cash Milestone)',
      options: ['$1 Cash Allowance 💵', 'Snickers Bar 🍫', '1 Hour TV Time 📺']
    },
    {
      id: 'tier_30000',
      points: 30000,
      label: '30,000 XP Tier ($2.00 Cash Bonus Milestone)',
      options: ['$2 Cash Allowance 💵', 'Movie Night Ticket 🍿', 'Ice Cream Trip 🍦']
    },
    {
      id: 'tier_60000',
      points: 60000,
      label: '60,000 XP Gold Champion',
      options: ['$4 Cash Allowance 💵', 'Book of Your Choice 📚', 'Robux / Game Card 🎁']
    }
  ];

  const DEFAULT_PRIZE_CATALOG = [
    {
      id: 'prize_cash_1',
      name: '$1.00 Cash to Wallet',
      price: 1.00,
      xpPoints: 20000,
      category: 'cash',
      icon: '💵',
      description: 'Exchange 20,000 XP for $1.00 added to your Learning Wallet'
    },
    {
      id: 'prize_cash_2',
      name: '$2.00 Cash to Wallet (Bonus)',
      price: 2.00,
      xpPoints: 30000,
      category: 'cash',
      icon: '💵',
      description: 'Bonus Exchange: 30,000 XP for $2.00 added to your Learning Wallet'
    },
    {
      id: 'prize_ring_pop',
      name: 'Ring Pop 🍭',
      price: 0.50,
      xpPoints: 10000,
      category: 'treat',
      icon: '🍭',
      description: 'Fruity Ring Pop lollipop treat'
    },
    {
      id: 'prize_snickers',
      name: 'Snickers Bar 🍫',
      price: 1.00,
      xpPoints: 20000,
      category: 'treat',
      icon: '🍫',
      description: 'Full-size Snickers candy bar'
    },
    {
      id: 'prize_tv_1hr',
      name: '1 Hour TV / Screen Time 📺',
      price: 1.00,
      xpPoints: 20000,
      category: 'activity',
      icon: '📺',
      description: '1 extra hour of TV, iPad, or streaming time'
    },
    {
      id: 'prize_ice_cream',
      name: 'Ice Cream Parlor Trip 🍦',
      price: 3.00,
      xpPoints: 45000,
      category: 'treat',
      icon: '🍦',
      description: 'Trip to local ice cream shop for a scoop'
    },
    {
      id: 'prize_book',
      name: 'New Book of Choice 📚',
      price: 5.00,
      xpPoints: 75000,
      category: 'activity',
      icon: '📚',
      description: 'Pick any new book from bookstore or Amazon'
    },
    {
      id: 'prize_game',
      name: 'Video Game / Robux Card 🎮',
      price: 10.00,
      xpPoints: 150000,
      category: 'activity',
      icon: '🎮',
      description: '$10 Robux or digital app purchase'
    }
  ];

  function ensureProfileFields(p) {
    if (!p) return p;
    if (!Array.isArray(p.completedQuestionIds)) p.completedQuestionIds = [];
    if (!p.dailyActivity) p.dailyActivity = {};
    if (!p.domainMastery) p.domainMastery = {};
    if (!Array.isArray(p.telemetryLogs)) p.telemetryLogs = [];
    if (!p.pin) p.pin = '1234';
    if (typeof p.cashBalance !== 'number') p.cashBalance = 0;
    if (!Array.isArray(p.redemptions)) p.redemptions = [];
    if (!Array.isArray(p.pointsAdjustments)) p.pointsAdjustments = [];
    if (typeof p.totalXpSpent !== 'number') p.totalXpSpent = 0;
    if (typeof p.xp !== 'number') p.xp = 0;

    // Calculate sum of already approved XP redemptions
    const approvedXpCost = p.redemptions
      .filter(r => (r.status === 'Approved' || r.status === 'Added to Wallet') && r.paymentMethod === 'xp' && Number(r.tierPoints) > 0)
      .reduce((sum, r) => sum + Number(r.tierPoints), 0);

    // Initialize lifetime XP if not set
    if (typeof p.lifetimeXp !== 'number') {
      p.lifetimeXp = p.xp;
    }

    // Auto-reconcile existing profiles where XP was never reduced after previous approvals
    if (approvedXpCost > 0 && !p._reconciledV2) {
      if (p.xp >= p.lifetimeXp) {
        p.xp = Math.max(0, p.lifetimeXp - approvedXpCost);
      }
      p.totalXpSpent = approvedXpCost;
      p._reconciledV2 = true;
    }

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
      xp: Number(fields.xp) || 0,
      lifetimeXp: Number(fields.lifetimeXp || fields.xp) || 0,
      streakDays: 0,
      lastActiveDate: null,
      createdAt: new Date().toISOString(),
      dailyActivity: {},
      domainMastery: {},
      telemetryLogs: [],
      completedQuestionIds: Array.isArray(fields.completedQuestionIds) ? fields.completedQuestionIds : [],
      pin: fields.pin || '1234',
      isPreview: !!fields.isPreview,
      cashBalance: Number(fields.cashBalance) || 0,
      redemptions: Array.isArray(fields.redemptions) ? fields.redemptions : [],
      totalXpSpent: Number(fields.totalXpSpent) || 0
    };
  }

  function defaultProfiles() {
    return {
      teen_1: newProfile({ id: 'teen_1', name: '13yo Scholar', avatar: '🎓', ageGroup: 'teen', ageLabel: '13yo Teen Scholar', dailyGoalQuestions: 12, dailyGoalMinutes: 20 }),
      kid_1: newProfile({ id: 'kid_1', name: '6yo Explorer', avatar: '🦁', ageGroup: 'kid', ageLabel: '6yo Little Explorer', dailyGoalQuestions: 10, dailyGoalMinutes: 15 })
    };
  }

  // Friend Preview profiles are demo profiles for visitors: they live only
  // on the device, are never written to the shared family cloud database,
  // and survive cloud pulls so a sync cannot wipe a guest session.
  function isPreviewProfile(p) {
    return !!(p && (p.isPreview || String(p.id || '').indexOf('preview_') === 0));
  }

  function isPreviewId(id) {
    return String(id || '').indexOf('preview_') === 0;
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

  const PERSISTED_KEYS = ['activeProfileId', 'teenSubTab', 'activeLanguage', 'kidCategory', 'profiles', 'customKidCards', 'sectionXP', 'rewardTiers', 'rewardCatalog', 'wrongAnswerPenalty', 'lastCloudSync'];

  /* ------------------------------------------------------------------ engine */
  const LuminaDB = {
    FIREBASE_CONFIG: FIREBASE_CONFIG,
    DEFAULT_QUESTIONS: DEFAULT_QUESTIONS,
    DEFAULT_REWARD_TIERS: DEFAULT_REWARD_TIERS,
    DEFAULT_PRIZE_CATALOG: DEFAULT_PRIZE_CATALOG,
    getDefaultQuestions: getDefaultQuestions,
    getTodayDateKey: dateKey,

    state: {
      activeProfileId: 'teen_1',
      teenSubTab: 'dashboard',
      activeLanguage: 'malayalam',
      kidCategory: 'malayalam',
      profiles: defaultProfiles(),
      questions: clean(getDefaultQuestions()),
      customKidCards: [],
      sectionXP: {},
      wrongAnswerPenalty: 0,
      rewardTiers: clean(DEFAULT_REWARD_TIERS),
      rewardCatalog: clean(DEFAULT_PRIZE_CATALOG),
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
              this.setStatus('connected', "Sign in required to access Roy's Learning Hub");
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
          this.state.questions = clean(getDefaultQuestions());
        }
        if (!Array.isArray(this.state.rewardTiers) || this.state.rewardTiers.length === 0) {
          this.state.rewardTiers = clean(DEFAULT_REWARD_TIERS);
        }
        if (!Array.isArray(this.state.rewardCatalog) || this.state.rewardCatalog.length === 0) {
          this.state.rewardCatalog = clean(DEFAULT_PRIZE_CATALOG);
        }
        if (this.state.profiles) {
          Object.keys(this.state.profiles).forEach(pid => {
            ensureProfileFields(this.state.profiles[pid]);
          });
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
      ['malayalam', 'hindi', 'spanish', 'french', 'italian'].forEach(lang => {
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
      // Record a content version so other devices can skip re-downloading
      // unchanged packs on future syncs (best effort - never fail the seed).
      try {
        const versionSource = {};
        ['malayalam', 'hindi', 'spanish', 'french', 'italian'].forEach(lang => {
          if (pMap[lang]) versionSource[lang] = { words: pMap[lang].words || [], sentences: pMap[lang].sentences || [] };
        });
        const packsVersion = computeDataVersion(versionSource);
        await db.collection('app_state').doc('meta').set(clean({
          languagePacksVersion: packsVersion,
          languagePacksUpdatedAt: ts
        }), { merge: true });
        setStoredVersion(LANGUAGE_PACKS_VERSION_KEY, packsVersion);
      } catch (vErr) { /* versioning is an optimization only */ }
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
    isPreviewProfile: function (p) { return isPreviewProfile(p); },

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
          if (domainOrCategory === 'math_addition' && id.startsWith('kid_math_addition_')) return false;
          if (domainOrCategory === 'math_subtraction' && id.startsWith('kid_math_subtraction_')) return false;
          if (domainOrCategory === 'math_multiplication' && id.startsWith('kid_math_multiplication_')) return false;
          if (domainOrCategory === 'math_division' && id.startsWith('kid_math_division_')) return false;
          if ((domainOrCategory === 'teen_spelling' || domainOrCategory === '13+ SAT & Academic Spelling') && id.startsWith('teen_spelling_')) return false;
          if (domainOrCategory === 'sat_reading_writing') {
            const matchQ = (this.state.questions || []).find(q => q.id === id);
            if (matchQ && (matchQ.domain || '').includes('Reading') || (matchQ && (matchQ.domain || '').includes('Writing')) || (matchQ && (matchQ.domain || '').includes('Ideas')) || (matchQ && (matchQ.domain || '').includes('Craft')) || (matchQ && (matchQ.domain || '').includes('Conventions'))) return false;
          }
          if (domainOrCategory === 'sat_math') {
            const matchQ = (this.state.questions || []).find(q => q.id === id);
            if (matchQ && (matchQ.domain || '').includes('Math') || (matchQ && (matchQ.domain || '').includes('Algebra'))) return false;
          }
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
        isPreview: fields.isPreview !== undefined ? !!fields.isPreview : !!p.isPreview,
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

    /* ------------------------------------------------ profile pin security */
    setProfilePin: function (pid, pin) {
      const p = this.getProfileById(pid);
      if (!p) return false;
      p.pin = String(pin || '1234').trim().slice(0, 4);
      this.markProfile(pid);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return true;
    },

    verifyProfilePin: function (pid, enteredPin) {
      const p = this.getProfileById(pid);
      if (!p) return false;
      const cleanEntered = String(enteredPin || '').trim();
      // Parent master PIN '0000' or matching profile PIN
      return cleanEntered === '0000' || cleanEntered === (p.pin || '1234');
    },

    /* ------------------------------------------------ rewards & redemption */
    getRewardTiers: function () {
      if (!Array.isArray(this.state.rewardTiers) || this.state.rewardTiers.length === 0) {
        this.state.rewardTiers = clean(DEFAULT_REWARD_TIERS);
      }
      return this.state.rewardTiers;
    },

    saveRewardTiers: function (tiers) {
      if (Array.isArray(tiers) && tiers.length > 0) {
        this.state.rewardTiers = clean(tiers);
        this.pending.meta = true;
        this.saveLocal();
        this.scheduleCloudSync();
        this.notify();
        return true;
      }
      return false;
    },

    /* ------------------------------------------------ prize catalog & wallet */
    getPrizeCatalog: function () {
      if (!Array.isArray(this.state.rewardCatalog) || this.state.rewardCatalog.length === 0) {
        this.state.rewardCatalog = clean(DEFAULT_PRIZE_CATALOG);
      }
      return this.state.rewardCatalog;
    },

    savePrizeCatalog: function (catalog) {
      if (Array.isArray(catalog)) {
        this.state.rewardCatalog = clean(catalog);
        this.pending.meta = true;
        this.saveLocal();
        this.scheduleCloudSync();
        this.notify();
        return true;
      }
      return false;
    },

    addPrizeCatalogItem: function (item) {
      const catalog = this.getPrizeCatalog();
      const newItem = {
        id: 'prize_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
        name: String(item.name || 'New Prize').trim(),
        price: Number(item.price) || 1.00,
        xpPoints: Number(item.xpPoints) || 20000,
        category: item.category || 'treat',
        icon: item.icon || '🎁',
        description: item.description || ''
      };
      catalog.push(newItem);
      this.savePrizeCatalog(catalog);
      return newItem;
    },

    updatePrizeCatalogItem: function (id, fields) {
      const catalog = this.getPrizeCatalog();
      const item = catalog.find(i => i.id === id);
      if (!item) return false;
      if (fields.name !== undefined) item.name = String(fields.name).trim();
      if (fields.price !== undefined) item.price = Math.max(0, Number(fields.price) || 0);
      if (fields.xpPoints !== undefined) item.xpPoints = Math.max(1, Number(fields.xpPoints) || 1000);
      if (fields.category !== undefined) item.category = fields.category;
      if (fields.icon !== undefined) item.icon = fields.icon;
      if (fields.description !== undefined) item.description = fields.description;
      this.savePrizeCatalog(catalog);
      return true;
    },

    deletePrizeCatalogItem: function (id) {
      const catalog = this.getPrizeCatalog();
      const filtered = catalog.filter(i => i.id !== id);
      if (filtered.length === 0) return false;
      this.savePrizeCatalog(filtered);
      return true;
    },

    getAvailableXp: function (p) {
      if (!p) return 0;
      ensureProfileFields(p);
      const pendingXp = (p.redemptions || [])
        .filter(r => (r.status === 'Pending Approval' || r.status === 'pending') && r.paymentMethod === 'xp')
        .reduce((sum, r) => sum + (Number(r.tierPoints) || 0), 0);
      return Math.max(0, (p.xp || 0) - pendingXp);
    },

    /* -------------------------------------------- manual points adjustment */
    // Parent-driven bonus or deduction. Positive deltas also raise lifetimeXp
    // (they are spendable XP, same as earned XP); the balance never goes
    // below zero — the applied delta reflects any flooring. Every adjustment
    // is audit-logged on the profile and in the daily activity feed.
    adjustProfilePoints: function (pid, delta, reason) {
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p) return { ok: false, error: 'Profile not found' };
      ensureProfileFields(p);
      const requested = Math.round(Number(delta) || 0);
      if (!requested) return { ok: false, error: 'Enter a points amount first.' };
      const before = p.xp || 0;
      p.xp = Math.max(0, before + requested);
      const applied = p.xp - before;
      if (applied > 0) p.lifetimeXp = (p.lifetimeXp || 0) + applied;
      const entry = {
        id: 'adj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
        date: dateKey(),
        timestamp: new Date().toISOString(),
        delta: applied,
        requestedDelta: requested,
        reason: String(reason || '').slice(0, 80),
        balanceAfter: p.xp
      };
      p.pointsAdjustments.unshift(entry);
      if (p.pointsAdjustments.length > 50) p.pointsAdjustments.length = 50;
      this.recordActivity({
        type: 'points_adjustment',
        isQuestion: false,
        domain: 'Parent Adjustment',
        title: `Parent adjustment: ${applied >= 0 ? '+' : ''}${applied} XP${entry.reason ? ' — ' + entry.reason : ''}`,
        xp: 0,
        durationSec: 0,
        profileId: p.id
      });
      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return { ok: true, appliedDelta: applied, profile: p, entry: entry };
    },

    /* ------------------------------------------ wrong-answer penalty setting */
    // Parent-configurable: 0 = off (wrong answers earn the small effort
    // award, as before); >0 = each wrong answer deducts that many XP.
    setWrongAnswerPenalty: function (n) {
      const val = Math.max(0, Math.min(200, Math.round(Number(n) || 0)));
      this.state.wrongAnswerPenalty = val;
      this.pending.meta = true;
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return val;
    },

    redeemReward: function (pid, tierOrPrizeId, rewardItem, opts = {}) {
      const p = this.getProfileById(pid || this.state.activeProfileId);
      if (!p) return { ok: false, error: 'Profile not found' };
      ensureProfileFields(p);

      const paymentMethod = opts.paymentMethod || 'xp'; // 'xp' | 'wallet'
      const parentApproved = Boolean(opts.parentApproved);
      const availableXP = this.getAvailableXp(p);
      const walletCash = p.cashBalance || 0;

      let xpCost = Number(opts.xpCost) || 0;
      let cashCost = Number(opts.cashCost || opts.price) || 0;
      let isCashConversion = Boolean(opts.isCashConversion);
      let cashAmount = Number(opts.cashAmount) || 0;

      // Detect if reward text has cash conversion rate (e.g. $1 for 20k, $2 for 30k)
      if (!isCashConversion) {
        const cashMatch = String(rewardItem).match(/\$(\d+(?:\.\d{1,2})?)/);
        if (cashMatch) {
          isCashConversion = true;
          cashAmount = parseFloat(cashMatch[1]);
        }
      }

      // If costs not provided, try to find in catalog or tiers
      if (paymentMethod === 'xp' && xpCost === 0) {
        const catalog = this.getPrizeCatalog();
        const catItem = catalog.find(i => i.id === tierOrPrizeId || i.name === rewardItem);
        if (catItem) {
          xpCost = catItem.xpPoints;
          if (catItem.category === 'cash' && !cashAmount) {
            isCashConversion = true;
            cashAmount = catItem.price;
          }
        } else {
          const tiers = this.getRewardTiers();
          const tier = tiers.find(t => t.id === tierOrPrizeId) || tiers.find(t => t.options && t.options.includes(rewardItem));
          if (tier) {
            xpCost = tier.points;
          } else {
            // Default based on conversion rate: 20k for $1, 30k for $2
            if (cashAmount === 1) xpCost = 20000;
            else if (cashAmount === 2) xpCost = 30000;
            else xpCost = 20000;
          }
        }
      } else if (paymentMethod === 'wallet' && cashCost === 0) {
        const catalog = this.getPrizeCatalog();
        const catItem = catalog.find(i => i.id === tierOrPrizeId || i.name === rewardItem);
        if (catItem) {
          cashCost = catItem.price;
        } else {
          cashCost = 1.00;
        }
      }

      // Validate balances
      if (paymentMethod === 'xp') {
        if (availableXP < xpCost) {
          return { ok: false, error: `You need ${xpCost.toLocaleString()} XP, but only have ${availableXP.toLocaleString()} available XP.` };
        }
        // If parent pre-approved on spot (e.g. Master PIN 0000), immediately reduce XP
        if (parentApproved) {
          p.xp = Math.max(0, (p.xp || 0) - xpCost);
          p.totalXpSpent = (p.totalXpSpent || 0) + xpCost;
        }
      } else if (paymentMethod === 'wallet') {
        if (walletCash < cashCost) {
          return { ok: false, error: `You need $${cashCost.toFixed(2)} in your Wallet, but only have $${walletCash.toFixed(2)}.` };
        }
        // Deduct/reserve Wallet Cash
        p.cashBalance = Number(Math.max(0, walletCash - cashCost).toFixed(2));
      }

      let initialStatus = 'Pending Approval';
      if (parentApproved) {
        if (isCashConversion && cashAmount > 0) {
          p.cashBalance = Number(((p.cashBalance || 0) + cashAmount).toFixed(2));
          initialStatus = 'Added to Wallet';
        } else {
          initialStatus = 'Approved';
        }
      }

      const redemptionRecord = {
        id: 'red_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        date: dateKey(),
        timestamp: new Date().toISOString(),
        reward: rewardItem,
        tierPoints: xpCost,
        cashCost: cashCost,
        paymentMethod: paymentMethod,
        isCash: isCashConversion,
        isCashConversion: isCashConversion,
        cashAmount: cashAmount,
        status: initialStatus,
        parentApproved: parentApproved
      };

      p.redemptions.unshift(redemptionRecord);

      // Record in daily activity
      this.recordActivity({
        type: 'reward_redemption',
        isQuestion: false,
        domain: 'Prize & Wallet Store',
        title: `Redeemed: ${rewardItem} (${initialStatus})`,
        xp: 0,
        durationSec: 10,
        profileId: p.id
      });

      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return { ok: true, redemption: redemptionRecord, profile: p };
    },

    approveRedemption: function (pid, redemptionId) {
      const p = this.getProfileById(pid);
      if (!p) return { ok: false, error: 'Profile not found' };
      ensureProfileFields(p);

      const r = (p.redemptions || []).find(item => item.id === redemptionId);
      if (!r) return { ok: false, error: 'Redemption record not found' };
      if (r.status === 'Approved' || r.status === 'Added to Wallet') {
        return { ok: false, error: 'Redemption has already been approved.' };
      }

      // Deduct XP points upon parent approval
      if (r.paymentMethod === 'xp' && Number(r.tierPoints) > 0) {
        p.xp = Math.max(0, (p.xp || 0) - Number(r.tierPoints));
        p.totalXpSpent = (p.totalXpSpent || 0) + Number(r.tierPoints);
      }

      r.status = 'Approved';
      r.approvedAt = new Date().toISOString();

      // If it was an XP to Wallet Cash conversion, credit to wallet balance now!
      if (r.isCashConversion && r.cashAmount > 0) {
        p.cashBalance = Number(((p.cashBalance || 0) + r.cashAmount).toFixed(2));
        r.status = 'Added to Wallet';
      }

      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return { ok: true, redemption: r, profile: p };
    },

    rejectRedemption: function (pid, redemptionId, reason = 'Declined by parent') {
      const p = this.getProfileById(pid);
      if (!p) return { ok: false, error: 'Profile not found' };
      ensureProfileFields(p);

      const r = (p.redemptions || []).find(item => item.id === redemptionId);
      if (!r) return { ok: false, error: 'Redemption record not found' };
      if (r.status === 'Rejected') {
        return { ok: false, error: 'Redemption has already been rejected.' };
      }

      const wasApproved = r.status === 'Approved' || r.status === 'Added to Wallet';
      r.status = 'Rejected';
      r.rejectedAt = new Date().toISOString();
      r.rejectReason = reason;

      // Refund payment if necessary
      if (r.paymentMethod === 'wallet' && r.cashCost > 0) {
        p.cashBalance = Number(((p.cashBalance || 0) + r.cashCost).toFixed(2));
      } else if (r.paymentMethod === 'xp' && wasApproved && Number(r.tierPoints) > 0) {
        // If it was previously approved and deducted from p.xp, restore it
        p.xp = (p.xp || 0) + Number(r.tierPoints);
        p.totalXpSpent = Math.max(0, (p.totalXpSpent || 0) - Number(r.tierPoints));
        if (r.isCashConversion && r.cashAmount > 0) {
          p.cashBalance = Number(Math.max(0, (p.cashBalance || 0) - r.cashAmount).toFixed(2));
        }
      }
      // If was 'Pending Approval', simply changing status to 'Rejected' releases the pending hold from getAvailableXp

      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return { ok: true, redemption: r, profile: p };
    },

    getPendingRedemptions: function () {
      const list = [];
      const profiles = this.getAllProfiles();
      profiles.forEach(p => {
        ensureProfileFields(p);
        (p.redemptions || []).forEach(r => {
          if (r.status === 'Pending Approval' || r.status === 'pending') {
            list.push({ ...r, studentId: p.id, studentName: p.name, studentAvatar: p.avatar });
          }
        });
      });
      return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    requestCashPayout: function (pid, amount) {
      const p = this.getProfileById(pid);
      if (!p) return { ok: false, error: 'Profile not found' };
      ensureProfileFields(p);

      const availableCash = p.cashBalance || 0;
      const payoutAmount = Math.min(availableCash, Number(amount) || availableCash);
      if (payoutAmount <= 0) return { ok: false, error: 'No wallet balance available for payout.' };

      // Deduct from wallet balance
      p.cashBalance = Number(Math.max(0, availableCash - payoutAmount).toFixed(2));

      const payoutRecord = {
        id: 'payout_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        date: dateKey(),
        timestamp: new Date().toISOString(),
        reward: `Cash Payout Request: $${payoutAmount.toFixed(2)}`,
        tierPoints: 0,
        cashCost: payoutAmount,
        paymentMethod: 'wallet',
        isCash: true,
        isPayout: true,
        cashAmount: payoutAmount,
        status: 'Pending Approval',
        parentApproved: false
      };

      p.redemptions.unshift(payoutRecord);
      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return { ok: true, payout: payoutRecord, profile: p };
    },

    settleStudentCash: function (pid) {
      const p = this.getProfileById(pid);
      if (!p) return { ok: false, error: 'Profile not found' };
      ensureProfileFields(p);
      const settledAmount = p.cashBalance || 0;
      p.cashBalance = 0;
      if (Array.isArray(p.redemptions)) {
        p.redemptions.forEach(r => {
          if ((r.isCash || r.isPayout) && r.status !== 'Paid Out' && r.status !== 'Rejected') {
            r.status = 'Paid Out';
          }
        });
      }
      this.markProfile(p.id);
      this.saveLocal();
      this.scheduleCloudSync();
      this.notify();
      return { ok: true, settledAmount: settledAmount };
    },

    getLeaderboardData: function () {
      const profiles = this.getAllProfiles();
      return profiles.map(p => {
        ensureProfileFields(p);
        const totalCashEarned = (p.redemptions || []).filter(r => r.isCash).reduce((sum, r) => sum + (r.cashAmount || 0), 0);
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          ageGroup: p.ageGroup,
          ageLabel: p.ageLabel,
          xp: p.xp || 0,
          lifetimeXp: p.lifetimeXp || ((p.xp || 0) + (p.totalXpSpent || 0)),
          availableXp: this.getAvailableXp(p),
          streakDays: this.getCurrentStreak(p),
          cashBalance: p.cashBalance || 0,
          totalCashEarned: Number(totalCashEarned.toFixed(2)),
          redemptionsCount: (p.redemptions || []).length,
          recentRedemptions: (p.redemptions || []).slice(0, 5)
        };
      }).sort((a, b) => (b.lifetimeXp || b.xp) - (a.lifetimeXp || a.xp));
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
      const xp = Math.round(Number(opts.xp) || 0); // may be negative: wrong-answer penalty
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

      p.xp = Math.max(0, (p.xp || 0) + xp);
      p.lifetimeXp = (p.lifetimeXp || p.xp || 0) + Math.max(0, xp);
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
      if (!this.state.questions.length) this.state.questions = clean(getDefaultQuestions());
      this.markQuestions();
      this.saveQuestionsLocal();
      this.saveLocal();
      this.scheduleCloudSync();
    },

    resetQuestionsToDefault: function () {
      this.state.questions = clean(getDefaultQuestions());
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
      // Friend Preview profiles are local-only: strip them (and their daily
      // activity) from anything written to the shared family cloud database.
      const isPrevId = (id) => isPreviewId(id) || isPreviewProfile(this.state.profiles[id]);
      snap.profiles = snap.profiles.filter(id => !isPrevId(id));
      snap.days = snap.days.filter(k => !isPrevId(k.slice(0, k.indexOf('|'))));
      snap.deletes = snap.deletes.filter(id => !isPrevId(id));
      this.pending = { profiles: new Set(), days: new Set(), deletes: new Set(), questions: false, meta: false };

      const db = this.db;
      const ts = new Date().toISOString();
      try {
        let pushedBankVersion = null;
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
            pushedBankVersion = computeDataVersion(qs);
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
            const metaData = { updatedAt: ts, questionsCount: this.state.questions.length, customKidCards: this.state.customKidCards || [], sectionXP: this.state.sectionXP || {}, rewardTiers: this.state.rewardTiers || [], rewardCatalog: this.state.rewardCatalog || [], wrongAnswerPenalty: this.state.wrongAnswerPenalty || 0 };
            if (chunkCount !== null) metaData.questionChunks = chunkCount;
            if (pushedBankVersion) metaData.questionBankVersion = pushedBankVersion;
            ops.push(metaRef.set(clean(metaData), { merge: true }));
          }
        }

        await Promise.all(ops);
        if (snap.questions && pushedBankVersion) { setStoredVersion(QUESTIONS_VERSION_KEY, pushedBankVersion); window.__cloudBankPulled = true; }
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
        const localPreviewProfiles = {};
        Object.values(this.state.profiles || {}).forEach(p => { if (isPreviewProfile(p)) localPreviewProfiles[p.id] = p; });
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
          // Keep this device's Friend Preview profiles (they exist only locally)
          Object.assign(this.state.profiles, localPreviewProfiles);
        }

        // ---- Question bank + custom kid cards (Read-only for kids app; Admin seeds if empty)
        const metaDoc = await db.collection('app_state').doc('meta').get();
        const meta = metaDoc.exists ? metaDoc.data() : null;
        if (!meta || !meta.questionChunks) {
          if (this.isAdmin) this.markQuestions();
        } else {
          if (!this.pending.questions || !this.isAdmin) {
            const cloudBankVersion = meta.questionBankVersion || null;
            const localBankVersion = getStoredVersion(QUESTIONS_VERSION_KEY);
            const haveLocalBank = Array.isArray(this.state.questions) && this.state.questions.length > 0;
            if (cloudBankVersion && haveLocalBank && localBankVersion === cloudBankVersion) {
              // Bank is unchanged since the last pull - skip re-downloading every chunk.
            } else {
              const chunkDocs = await Promise.all(
                Array.from({ length: meta.questionChunks }, (_, c) => db.collection('question_chunks').doc('chunk_' + c).get())
              );
              let qs = [];
              chunkDocs.forEach(d => { if (d.exists && Array.isArray(d.data().questions)) qs = qs.concat(d.data().questions); });
              if (qs.length) {
                this.state.questions = qs;
                window.__cloudBankPulled = true;
                this.saveQuestionsLocal();
                if (cloudBankVersion) setStoredVersion(QUESTIONS_VERSION_KEY, cloudBankVersion);
              }
            }
          }
          if (!this.pending.meta && Array.isArray(meta.customKidCards)) this.state.customKidCards = meta.customKidCards;
          if (!this.pending.meta && Array.isArray(meta.rewardTiers) && meta.rewardTiers.length > 0) this.state.rewardTiers = meta.rewardTiers;
          if (!this.pending.meta && Array.isArray(meta.rewardCatalog)) this.state.rewardCatalog = meta.rewardCatalog;
          if (!this.pending.meta && typeof meta.wrongAnswerPenalty === 'number') this.state.wrongAnswerPenalty = meta.wrongAnswerPenalty;
          if (meta.sectionXP && typeof meta.sectionXP === 'object') {
            this.state.sectionXP = Object.assign({}, meta.sectionXP, this.state.sectionXP || {});
          }
        }

        // ---- Language packs (Malayalam, Hindi, Spanish in Cloud Firestore)
        try {
          const cloudPacksVersion = (meta && meta.languagePacksVersion) || null;
          const localPacksVersion = getStoredVersion(LANGUAGE_PACKS_VERSION_KEY);
          const haveLocalPacks = this.state.languagePacks && Object.keys(this.state.languagePacks).length > 0;
          if (cloudPacksVersion && haveLocalPacks && localPacksVersion === cloudPacksVersion) {
            // Packs are unchanged since the last pull - keep the local copy.
          } else {
            const langSnap = await db.collection('language_packs').get();
            if (!langSnap.empty) {
              if (!this.state.languagePacks) this.state.languagePacks = {};
              langSnap.forEach(d => {
                this.state.languagePacks[d.id] = d.data();
              });
              this.saveLanguagePacksLocal();
              if (cloudPacksVersion) setStoredVersion(LANGUAGE_PACKS_VERSION_KEY, cloudPacksVersion);
            } else if (window.EXPANDED_LANGUAGE_PACKS) {
              await this.seedLanguagePacksToCloud(window.EXPANDED_LANGUAGE_PACKS);
            }
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
