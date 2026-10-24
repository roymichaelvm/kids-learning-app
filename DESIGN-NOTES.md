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
