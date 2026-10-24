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
