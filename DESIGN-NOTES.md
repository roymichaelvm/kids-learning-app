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
