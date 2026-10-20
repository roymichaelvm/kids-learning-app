# Project Guidelines, Agent Permissions & Codebase Architecture Reference

## Permissions
- The AI assistant is explicitly authorized and has full permission to read, write, edit, and create all JavaScript (`.js`), HTML (`.html`), and JSON (`.json`) files within this repository.
- Feel free to directly apply edits and write code changes to project files when responding to user requests without requiring extra confirmation prompts.
- **Avoid redundant codebase analysis**: Use the architecture and symbol reference below instead of re-scanning files on each turn.

---

## Codebase Architecture & File Reference

### 1. HTML Pages
- **[`index.html`](file:///c:/Users/nikhi/code/kids-learning-app/index.html)** — Student Learning Hub (Teen Scholar 13+ & Little Explorer 6+):
  - **Header**: Gamification counters (`#totalQuestionsCounter`, `#headerStreakCount`, `#headerXPCount`), Cloud status (`#cloudStatusPill`), Family Auth (`#familyAuthPill`), Profile Switcher (`showProfilePicker()`). *(Note: Parent Portal is intentionally excluded from `index.html`).*
  - **Main Content (`#mainAppContent`)**:
    - `#section-teen-dashboard`: Teen Hero banner, `#teenTopicsBentoGrid`, 14-day streak calendar (`#teenStreakCalendarGrid`), domain mastery (`#teenDomainMasteryList`), and Bluebook second-guess telemetry (`#telemetryTableBody`).
    - `#section-teen-sat`: Digital SAT Bluebook Exam Simulator (split passage/question layout, `#satDomainFilter`, stopwatch `#satStopwatch`, Eliminator tool, `#satExplanationDrawer`).
    - `#section-languages`: Trilingual Studio (`malayalam`, `hindi`, `spanish`) with sub-modes (`letters`, `words`, `sentences`) and view tabs (`#teenSectionPractice`, `#teenSectionFlashcards`).
    - `#section-teen-spelling`: 13+ Teen Scholar SAT & Academic Spelling & Etymology Studio (`all`, `core`, `sat`, `bee` tiers) with 3 modes:
      - `#teenSpellingBuilderCard`: Audio dictation, etymology/root clue, blanked context sentence, keyboard input (`#teenSpellTypedInput`), and interactive scrambled letter tiles (`#teenSpellSlotsRow`, `#teenSpellTilesTray`).
      - `#teenSpellingQuizCard`: 4-choice orthography trap quiz.
      - `#teenSpellingFlashcardsCard`: 3D flip flashcards for roots, mnemonics, and context sentences.
    - `#section-kid-playground`: 6+ Little Explorer Playground with 9 categories (`spelling`, `comprehension`, `grammar`, `numbers`, `phonics`, `animals`, `malayalam`, `hindi`, `spanish`), `#kidSectionPractice` (with `#spellingBuilderZone`), and `#kidSectionFlashcards`.
- **[`parent.html`](file:///c:/Users/nikhi/code/kids-learning-app/parent.html)** — Standalone Parent & Admin Portal (`#section-parent-admin`):
  - Student Selector (`#adminStudentPillsBar`), Completed Areas Highlight (`#adminCompletedAreasGrid`), All Curriculum Tracks (`#adminAllTracksGrid`), Custom XP Multipliers (`#adminSectionXPGrid`), and Fast Cloud Question Creator (`#adminNewQuestionForm`).
- **[`admin.html`](file:///c:/Users/nikhi/code/kids-learning-app/admin.html)** — Advanced Parent Progress, Profile Manager & Firebase DB Studio:
  - Profile CRUD modal (`#profileModal`), 14-day heatmap inspector, bulk `SAT.json` uploader, and full question bank table.

---

### 2. External Data Files (`data/*.json`, `data/*.data.js` & `SAT.json`)
All static questions, language packs, and spelling word banks are stored **outside** the JS application code in `data/` and synced with Firebase Cloud Firestore. To guarantee 100% compatibility both offline via `file://` (avoiding CORS blocks) and on web servers/Firebase:
- **[`data/questions.json`](file:///c:/Users/nikhi/code/kids-learning-app/data/questions.json)** & **[`data/questions.data.js`](file:///c:/Users/nikhi/code/kids-learning-app/data/questions.data.js)** — Default SAT & 6+ Kid starter questions (`window.DEFAULT_QUESTIONS`).
- **[`data/curriculum.json`](file:///c:/Users/nikhi/code/kids-learning-app/data/curriculum.json)** & **[`data/curriculum.data.js`](file:///c:/Users/nikhi/code/kids-learning-app/data/curriculum.data.js)** — Foundational `multiLangData` (phonics, numbers, animals, spelling, Malayalam/Hindi/Spanish alphabets & starter decks) and `expandedLanguagePacks` (100+ words & 100+ sentences per language).
- **[`data/spelling.json`](file:///c:/Users/nikhi/code/kids-learning-app/data/spelling.json)** & **[`data/spelling.data.js`](file:///c:/Users/nikhi/code/kids-learning-app/data/spelling.data.js)** — Contains:
  - `kidWordsRaw`: 205 graded 6+ spelling words across 3, 4, 5, 6, and 7+ letters (`[word, emoji, clue]`).
  - `teenWords`: 109 graded 13+ Teen Scholar words across `core` (36 High School Core), `sat` (41 SAT Honors), and `bee` (32 Scripps Bee & Etymology) tiers (`{ word, tier, root, meaning, tip, sentence }`).
- **[`SAT.json`](file:///c:/Users/nikhi/code/kids-learning-app/SAT.json)** — Full SAT question bank for bulk import into Firebase Firestore (`question_chunks`).

---

### 3. JavaScript Modules (`firebase-db.js` & `js/*.js`)
- **[`js/seed-data.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/seed-data.js)** — Lightweight data loader (`hydrateDataFromJson()`) that hydrates questions, curriculum, and spelling banks (supporting both in-memory script objects, `localStorage` cache fallback, and async `fetch()` on HTTP/HTTPS).
- **[`firebase-db.js`](file:///c:/Users/nikhi/code/kids-learning-app/firebase-db.js)** — `window.LuminaDB` Cloud Firestore & `localStorage` engine:
  - Manages `profiles`, `dailyActivity`, `completedQuestionIds`, `question_chunks`, `language_packs`, and `sectionXP`.
  - Key methods: `init()`, `signIn()`, `signOut()`, `pullFromCloud()`, `pushToCloud()`, `getAllProfiles()`, `getActiveProfile()`, `setActiveProfile()`, `recordActivity()`, `markQuestionCompleted()`, `resetCompletedQuestions()`, `addQuestion()`, `mergeQuestions()`.
- **[`js/app.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/app.js)** — Core app coordinator, profile view switcher (`applyActiveProfileView()`), header/streak UI (`refreshHeaderUI()`, `renderTodayStrip()`, `trackActivity()`), Parent Portal controller (`renderAdminPortal()`, `getStudentTrackProgressList()`, `resetStudentArea()`), and Section XP Multiplier system (`DEFAULT_SECTION_XP`, `ADMIN_XP_SECTIONS`, `getSectionXP()`, `setSectionXP()`). Includes local/offline mode fallback (`continueOfflineMode()`).
- **[`js/teen-studio.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/teen-studio.js)** — 13+ Teen Scholar Studio:
  - Tab router: `openTeenTab('dashboard' | 'sat' | 'spelling' | 'languages')` & `renderSubNavForTeen()`.
  - Digital SAT Bluebook simulator & telemetry (`loadSatQuestionByIndex()`, `submitSatAnswer()`, `updateTelemetryWidgets()`).
  - Teen Spelling & Etymology Bee (`setTeenSpellingTier()`, `setTeenSpellingMode()`, `renderTeenSpellingStudio()`, `submitTeenSpellingBuilder()`, `checkTeenSpellingQuiz()`, `renderTeenSpellingFlashcard()`).
  - Trilingual Vocabulary & Sentence Studio (`selectActiveLanguage()`, `setTeenLangSubMode()`, `setTeenLangViewTab()`).
- **[`js/kid-playground.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/kid-playground.js)** — 6+ Little Explorer Playground (`selectKidCategory()`, `setKidSubMode()`, `setKidViewTab()`, `generateKidQuizRound()`, `renderKidFlashcard()`, `getGeneratedMathQuestions()`).
- **[`js/spelling-builder.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/spelling-builder.js)** — 6+ Kid Spelling Bee letter-tile builder (`getAllSpellingItems()`, `generateSpellingTileRound()`, `placeSpellingTile()`, `checkSpellingCompletion()`).
- **[`js/dictionary.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/dictionary.js)** — Click-any-word instant dictionary modal & Tough Words Vault.
- **[`js/speech.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/speech.js)** — Web Speech API TTS synthesizer (`speakNativeAudio()`, `speakText()`).
- **[`js/utils.js`](file:///c:/Users/nikhi/code/kids-learning-app/js/utils.js)** — Shared DOM/string utilities.
