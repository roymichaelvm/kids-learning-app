# Lumina — Kids Learning Hub & Parent Progress Studio

A family learning web app for your kids (`13yo Teen Scholar` & `6yo Little Explorer`) backed by **Firebase Cloud Firestore** (`kids-learning-714a2`).

## Project Files
- **`index.html`** — Kids Learning Portal:
  - Profile switcher in the top bar (plus the *"Who's learning today?"* profile picker) so each child has their own isolated streak, XP, daily goals, 14-day activity calendar, subject mastery breakdown, and SAT first-click telemetry.
  - **Teen Scholar Mode**: Digital SAT Bluebook Simulator (split-screen passage & choices, precision stopwatch, option eliminator, first-click instinct vs. final answer telemetry) + Trilingual Immersion Studio (Malayalam, Hindi, Spanish).
  - **Little Explorer Mode (6yo)**: Voice-enabled interactive flashcards, picture-matching games, and subject star stickers across Malayalam, Hindi, Spanish, Animals, Numbers & Math, and Sight Words.
- **`admin.html`** — Parent Progress, Profile & Database Studio:
  - **Family Progress & Daily Activity Monitor**: Side-by-side daily goal progress (questions answered today, active minutes today, accuracy %, streak, total XP) for each child.
  - **14-Day Activity Calendar & Subject Mastery Inspector**: Click any day on a child's calendar to inspect their chronological question/activity log and accuracy by subject/domain.
  - **Profile & Daily Goals Manager**: Customize each child's name, avatar emoji, learning mode, daily question target, and daily active-minute target, or add additional kid profiles.
  - **Question Bank Studio**: Drag-and-drop `SAT.json` bulk import, paste JSON arrays, or create custom questions/cards — automatically chunked and synced to Firebase Cloud Firestore.
- **`firebase-db.js`** — Shared Cloud Firestore & offline-first profile telemetry engine configured for Firebase project `kids-learning-714a2`.

## Firebase Cloud Firestore Collections (`kids-learning-714a2`)
- `profiles/{profileId}` — Stores each child's profile settings, daily goals, cumulative XP, streak, `domainMastery`, and `telemetryLogs`.
- `profiles/{profileId}/days/{YYYY-MM-DD}` — Stores daily activity metrics (`questionsAttempted`, `questionsCorrect`, `xpEarned`, `secondsSpent`, per-subject breakdown, and chronological `activities` log).
- `question_chunks/chunk_{n}` & `app_state/meta` — Stores the shared SAT, STEM, and 6+ Spelling/Comprehension/Grammar question bank (read-only in `index.html`, writable only by Parent Admin).

## Reusable Local Scripts (`scripts/`)
All automation scripts and supplemental question sets are saved in `scripts/` and read your local `admin-secret.js` credentials automatically:

1. **Upload / Sync All Questions to Firebase Cloud Firestore**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\upload-questions.ps1
   ```
   - Merges and deduplicates `SAT.json`, `scripts/extra_teen_questions.json` (SAT Math & Science), and `scripts/extra_kid_questions.json` (6+ Spelling Bee, Story Comprehension, Grammar).
   - To include additional JSON files when uploading:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\scripts\upload-questions.ps1 -ExtraJsonFiles @(".\my_new_questions.json")
     ```

2. **Deploy / Update Firestore Security Rules**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-firestore-rules.ps1
   ```
   - Enforces public read-only access on `question_chunks` and `app_state`, while restricting question writes to your local Parent Admin account.
