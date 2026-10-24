# Fresh layout branch — `fresh-layout`

Cut from `main` on 2026-10-24 as a clean bisect: the redesign
preview (`redesign-frontend-design`) stopped responding to all
buttons on the user's phone while `main` kept working there and
the preview kept working on desktop. This branch answers one
question: does the *layout* work on the phone when nothing else
changes?

## Scope — layout only, zero JavaScript changes
- `index.html` only: the Workbook skin CSS (Exam Paper
  `#F5F7FA` + graph grid, Ink Navy `#16233D`, Ballpoint Blue
  `#2B4BD8`, Highlighter `#FFCF3F`, Red Pen `#D64541`,
  Newsreader Scholar headings, divider tabs, workbook-cover
  dashboard hero) and the question-focus CSS (prompt
  1.3rem phone / 1.5rem desktop, prompt-on-paper instead of
  grey inset boxes, one quiet `.q-meta` line, one quiet badge
  style, unified speak buttons, SAT question-before-passage
  on phones, scrollable sign-in modal with a 44px Friend
  Preview target).
- Inert id additions only (`brandMark`, `brandName`,
  `satQuestionCard`, `teenSpellDefBox`,
  `teenSpellQuizPromptBox`, `teenLangBeePromptBox`,
  `teenLangSpellBtnSpeak`, `btnFriendPreview`) plus the SAT
  header's quiet meta line (counter id preserved) and the
  modal's scroll classes. No `onclick` handler, no script,
  and no JS file was touched.
- `tailwind.config.js` only: the `bento` shadow becomes the
  hard offset ink shadow (same value as the redesign).

## Deliberately NOT here
Bottom bars, More sheet, contextual bar, language picker,
topic picker, domain/tier pickers, view toggles, badge
movers, the Friend Preview resilience handler — all of that
is JavaScript, and all of it stays out until this branch
proves the layout itself is innocent on the phone.

## Test
If every button works on the user's phone here, the breakage
lives in the redesign branch's JavaScript/HTML additions (or
that branch's drift from main), not in the layout. If buttons
are still dead here, the breakage is in the CSS/HTML itself
or in the preview deployment, and the next step is to bisect
the CSS block.

## Redeploy note
First Vercel build of this branch failed (deployment error page, tree verified complete). Retriggering the build with this note.

## Explorer port — Step 1: kid bottom bar (Round 5 kid parts only)
- `#mobileKidBar` nav (Practice/Flashcards, `data-kview`) placed after
  `</main>`; hidden by default, shown on phones only when
  `body.kid-mode` and `#mainAppContent` is visible.
- Phones in kid mode: `#profileQuickBar` + `#kidStickersCard` hidden,
  `#subNavBar` + `#kidViewTabsBar` hidden, content bottom padding
  5.25rem so the fixed bar never covers the question.
- JS: `renderSubNavForKid` adds `kid-mode` to body;
  `renderSubNavForTeen` removes it (so the bar never leaks into
  Scholar); `setKidViewTab` syncs the bar's `mtab-active` state.
- Deliberately NOT in this step: topic switcher (round 6), chip-strip
  hiding (round 6), modes/views bar gating (round 7), shrunken
  buttons + moved badge (round 8). Each follows as its own step
  with its own phone test.

## Explorer port — Step 2: topic switcher (Round 6 only)
- `#kidTopicBtn` joins the bar (Practice / Topics / Flashcards);
  the button shows the current topic's icon + name, synced by
  `syncKidTopicButton()` at the end of `selectKidCategory`.
- `#topicPickerOverlay` lists all 12 subjects; one tap switches
  topic and closes (renderTopicPicker / openTopicPicker /
  closeTopicPicker in kid-playground.js, window-exposed like
  the other kid handlers).
- Phones in kid mode: the chip strip (`#kidCategoryGrid`) is
  hidden — the Topics button replaces it.
- Deliberately NOT in this step: the modes/views bar gating
  (round 7) — all three bar buttons show for now, on every
  subject, until that step adds the language sub-modes.

## Explorer port — Step 1 correction: stickers card id
- The Round 5 phone rule hides `#kidStickersCard`, but main's
  stickers card div had no id — so the rule matched nothing and
  the card stayed visible on phones. Fix: the card div now
  carries `id="kidStickersCard"` (identical markup to the
  redesign branch apart from that id). No JS touches the id;
  desktop is unaffected (the rule is phone-only).

## Explorer port — Step 3: language sub-modes bar gating (Round 7 kid parts)
- The bar is now two-state, switched in `selectKidCategory` via
  `isLangPackCategory`: non-language subjects show Practice /
  Topics / Flashcards (`kid-bar-views`); language subjects show
  Topics + Alphabet / Words / Sentences / Bee + a view toggle
  (`kid-bar-modes`), and the in-page language sub-nav pills hide
  on phones (the bar carries them).
- `setKidSubMode` syncs the bar's sub-mode highlight;
  `setKidViewTab` updates the toggle button to point at the
  OTHER view (Cards ↔ Quiz); `toggleKidViewTab` (new, window-
  exposed) flips the view.
- Deliberately NOT in this step: shrunken buttons + moved badge
  (round 8) — the last Explorer piece.

## Scholar port — Step 1: main teen bar (Round 2 bar only)
- `#mobileTeenBar` nav (Home / SAT / Spelling / Languages /
  Wallet) placed after `</main>`; hidden by default, shown on
  phones only when `body.teen-mode` and `#mainAppContent` is
  visible. Wallet opens the existing rewards modal.
- Phones in teen mode: the top tab strip
  (`#subNavTabs.teen-main-tabs`) and the header Wallet +
  Rankings pills retire (the bar replaces them); content
  bottom padding 5.25rem so the bar never covers content.
- JS: `renderSubNavForTeen` adds `teen-mode` + `has-bottom-bar`,
  removes all kid-bar classes, and syncs the bar's `mtab-active`
  highlight; `renderSubNavForKid` removes `teen-mode` +
  `has-bottom-bar` so the bars never show together.
- Deliberately NOT in this step: the contextual per-section bar
  (round 4), the language picker (round 5), the SAT/spelling/
  language pickers (round 7), the SAT More sheet (round 3),
  the goal-strip thinning (round 2 polish). The in-page
  section controls stay where they are until the context-bar
  step moves them.

## Scholar port — Step 2: Languages context bar + language popup (Rounds 4+5 teen, Languages only)
- Main bar first button renamed Home → 📚 Courses (still opens
  the dashboard); Wallet moved OUT of the bar back to the top
  navigation (header pill unhidden on phones in teen mode) —
  the bar is now Courses / SAT / Spelling / Languages.
- `#mobileTeenContextBar` (empty nav after the main bar) is
  rendered by `setTeenContextBar` (teen-studio.js). Selecting
  Languages swaps the bottom bar for Back / Alphabet / Words /
  Sentences / Bee / Cards↔Quiz toggle, and on phones the
  Language Studio header (title + language pills), the
  sub-mode row, and the view tabs retire from the page.
- Back: one tap goes up one level (Languages → language
  picker popup); a double tap (within 400ms) goes straight to
  Courses (dashboard). The first tap acts immediately, so no
  tap delay on the single-tap action.
- `#teenLangPickerOverlay` mirrors the Explorer topic-picker
  overlay: 5 full-width language rows calling
  `pickTeenLanguage` (existing `selectActiveLanguage` +
  context-bar restore); closing without picking keeps the
  current language and restores the context bar.
- `setTeenLangSubMode` syncs the bar highlight;
  `setTeenLangViewTab` updates the toggle label;
  `toggleTeenLangViewTab` flips practice↔flashcards.
- `openTeenTab` now wires the context bar (Languages →
  'languages', everything else → main bar for now).
- Deliberately NOT in this step: Spelling and SAT context
  states (their Tier/Topic pickers arrive with their steps),
  the SAT More sheet (round 3), the goal-strip thinning.

## Scholar Step 2 RESTORED (2026-10-24)
- Step 2 was reverted at e711ff7 after the user reported dead
  buttons on their phone, but the revert did NOT fix their
  phone while a new incognito tab worked — proving the
  breakage was their main browser's cached copy (frozen
  during deploy propagation), not Step 2's code. Step 2 is
  therefore re-pushed unchanged for a clean-browser test.
  Lesson: after every push, confirm the preview serves the
  new bundle on two consecutive checks before asking the
  user to test, so a half-propagated deploy can't fake a
  regression.

## Scholar Step 2 fix: Sections escape hatch (2026-10-24)
- The Languages context bar replaced the main bar entirely,
  leaving no VISIBLE way out of a section to SAT, Spelling or
  Courses (Back → language picker, double-tap Back → Courses
  is undiscoverable). Unlike Explorer, whose Topics button is
  always in the bar, Scholar trapped the user in the section.
- Fix, Explorer-style: the context bar gains a first button,
  ☰ Sections, opening `#teenSectionPickerOverlay` (same
  overlay pattern as the topic/language pickers) with rows
  Courses / Digital SAT / Spelling Bee / Language Studio.
  `pickTeenSection` closes the popup and calls `openTeenTab`,
  which restores the right bar for that section (main bar for
  Courses/SAT/Spelling today; context bar for Languages).
- Context-bar buttons now flex (`flex: 1 1 0; min-width: 0`)
  so 7 buttons fit a phone row instead of overflowing.

## Scholar Step 3: all sections get bottom sub-menus (2026-10-24)
- Context bar now covers every Scholar section, same clean
  arrangement as Languages (question/reading material on top,
  all chrome in the bottom bar):
  - Languages: Courses / Lang Select / Alphabet / Words /
    Sentences / Bee / Cards↔Quiz (Back renamed Lang Select,
    since it opens the language picker).
  - Spelling: Courses / Back / Builder / Quiz / Flashcards /
    Tier (tier picker popup mirrors the tier pills).
  - SAT: Courses / Exit / Topic / Eliminator / Passage / Flag
    / Dictionary (topic picker rows built from the toolbar's
    domain dropdown at open time).
- Sections button renamed Courses everywhere (bar button +
  "Choose a course" popup title).
- SAT passage-first on phones: the question-before-passage
  order rule is reversed (passage order 1, question order 2),
  matching how language shows its material before the
  question. The toolbar Passage control still shows/hides
  the passage card.
- Spelling question-on-top on phones: the header card (title
  + tier pills) and the mode tabs retire under the context
  bar, so the question card sits on top; their controls live
  in the bar (Tier picker + mode buttons).
- `openTeenTab` wires all three states; `syncTeenContextBar`
  covers sub-mode, spelling-mode and Eliminator highlights;
  `setTeenSpellingMode` and `toggleEliminatorMode` sync the
  bar. SAT Back (Exit) goes to Courses; double-tap Back
  anywhere goes to Courses.

## Step 4 — QA bug batch (2026-10-24, desktop audit + failed phone-emulation attempt)
- Phone emulation is NOT available in the test browser (no viewport
  control) and local headless screenshots produced no output, so
  phone layout still rests on the user's real-device test. The
  desktop audits did find real bugs, fixed here and verified in
  jsdom (quotetest.js 12/12 PASS against the new bundle):
- `&quot;` in SAT reading: `renderInteractiveText` (js/dictionary.js)
  escaped the passage first, then wrapped words in spans — the
  "quot" inside `&quot;` got wrapped, breaking the entity so
  passages showed literal `&quot;`. Fixed by splitting the RAW
  text into words first, then escaping each part (words get the
  clickable span, everything else gets escaped). Same fix
  benefits kid-mode passages, which share the function.
- SAT eliminator buttons all showed a struck-through 'A'
  (hardcoded `'̶A̶'`); each now shows its own struck letter.
- Spelling Builder placeholder shortened to "Type the spelling
  here..." (was truncating on phones).
- Language Bee badge now names the language ("Malayalam
  Spelling Bee"); the header Listen Prompt hides in Bee mode
  (the panel's own Hear the Word covers audio); header XP text
  reads +30 in Bee mode, +20 in quiz mode (was +20 always).
  Badge/listens/XP restore when leaving Bee mode.
- Bar consistency: Courses icon unified to 📚 in all context
  bars (was ☰); SAT bar Passage 📖 -> 📄, Dictionary 📖 -> 🔍
  (📖 was used twice in one bar).
- Spelling Back renamed Exit and now goes straight to Courses
  like SAT Exit (was: cleared the bar but stayed on the
  spelling page, restoring the old header + tab row above the
  question — the reported "builder tab not fixed, questions
  not first" layout). Double-tap Back still goes to Courses.

## Step 5 — Desktop mobile-view toggle (2026-10-24, QA tool)
- The test browser has no viewport/emulation control and local
  headless screenshots produced no output, so phone layout could
  not be visually verified from here. Fix: a "📱 Mobile view"
  button (desktop widths only, bottom-right) opens the live app
  inside a 390px phone frame overlay; the frame loads this same
  page in an iframe, so every phone media query and JS width
  check applies naturally, and profile/progress storage is
  shared (same origin). "💻 Desktop view" (or Escape) closes
  it and unloads the frame. The button removes itself inside
  the frame so previews cannot nest. QA tool for the preview
  branch — remove before any main merge if it should not ship.
- Verified in jsdom (mobilepreviewtest.js 9/9 PASS): button
  present on desktop, open sets the frame src + locks outer
  scroll, close clears it, CSS gates the button to >=640px
  and sizes the frame at 390px.

## Step 6 — Symbol-only math buttons + per-profile courses (2026-10-24)
- Math operation filter bar (kid Numbers & Math): the five buttons
  are now symbol-only — 🌟 ➕ ➖ ✖️ ➗, 44px square targets, no
  (25) counts, no XP pills. Names live in title/aria-label.
  (ensureMathOpBar in js/kid-playground.js.)
- Per-profile courses: profile.enabledCourses (array of course
  keys; null/undefined = all on, so older profiles need no
  migration; newProfile passes the field through). Kid catalog =
  the 12 ALL_KID_CATEGORIES subjects; teen catalog = 3 sections
  (Digital SAT, Spelling Bee, Language Studio) + 5 languages.
  Helpers in js/app.js: getCourseCatalogForProfile,
  isCourseEnabled, setProfileCourseEnabled (refuses to turn off
  the last course; collapses back to null when all are on),
  firstEnabledCourseKey. Saves via saveState() (local + cloud).
- Enforcement: kid grid buttons hide, topic picker + progress
  summary filter, selectKidCategory falls through to the first
  enabled subject; teen main tabs + bottom bar + section picker
  + language picker filter, openTeenTab redirects a turned-off
  section to Courses with a toast, selectActiveLanguage falls
  back to the first enabled language, dashboard shows a quiet
  note instead of SAT tiles when SAT is off.
- Parent Portal (parent.html): new "📚 Courses — <Student>" card
  right after the student selector, rendered by
  renderAdminCoursesBox in js/app.js. One 48px toggle row per
  course with a switch, on/off state text, "X of Y on" badge,
  "Show all courses" reset. Toggles save instantly + toast.
  Design review (UI designer + visual QA): portal already has a
  consistent card system + polish layer (brand tokens, card
  shadows, focus rings, phone button-compaction rule); the
  Courses card follows the Adjust Points card pattern. One real
  find fixed in this step: the phone compaction rule would have
  shrunk the 48px course toggles to 34px — #adminCoursesBox
  buttons are now excluded, like the exercise controls. The
  portal is a long single scroll on phones (no jump nav) — noted
  as a follow-up, not changed here. parent.html also gains the
  same 📱 Mobile view toggle/frame as index.html for desktop QA.
- Verified in jsdom (coursetest.js 28/28 PASS): symbol-only bar,
  kid/teen filtering + guards, admin card toggles + last-course
  guard + reset, parent mobile preview open/close.

## Step 7 — 100 more math questions per operation (2026-10-24)
- EXTRA_MATH_BANK in js/kid-playground.js: 100 -> 500 items
  (125 per operation: 25 originals + 100 new). Generated by
  ~/workspace/mathgen/gen_math_batch2.py (seeded, deterministic):
  plain regrouping/borrowing, 2- and 3-digit, doubles, money,
  tables 2-12, 2-digit x 1-digit, x10/x100, and word problems
  with names and everyday objects. Every answer was computed
  arithmetically and re-validated (recompute from the equation,
  distinct positive distractors, no duplicate equations or
  prompts, exact division only). New items also flow into the
  Numbers flashcards via ensureMathItemsInNumbersPack (deduped
  by equation). No other files change: the bank is generated
  in-code, not in data/*.json, and the symbol-only op bar needs
  no count updates.
- Trap found by the jsdom test (see AGENTS.md): the insert
  initially missed the comma after the previous last element,
  silently swallowing one item as a subscript index (499 items,
  one undefined slot, runtime crash). Fixed with the comma;
  mathtest.js now asserts the runtime counts (125/125/125/125/
  500) and independently recomputes all 500 answers from the
  prompts — 4/4 PASS.
