# Redesign notes — "The Family Workbook"

Branch: `redesign-frontend-design` · Built with the frontend-design skill
(anthropics/skills) as the design guide. Main/live site untouched.

## The brief
Roy's Learning Hub is one family's study app with two learners: a young
kid (Explorer — playful practice) and a teen (Scholar — SAT Bluebook
simulation, academic spelling, five languages). Its world is school
workbooks, marked-up practice tests, and sticker charts — not SaaS
dashboards. The old skin (identical rounded cards, soft grey shadows,
gradient hero) read as a generic template kit.

## Design plan
**Concept:** the app as a family workbook — paper, ink, and highlighter.

**Color (named tokens)**
- Exam Paper `#F5F7FA` — cool blue-grey paper, faint graph grid
- Ink Navy `#16233D` — headings, masthead rule, the workbook cover
- Ballpoint Blue `#2B4BD8` — primary/Scholar accent, dark-mode rule
- Highlighter `#FFCF3F` — emphasis only: the active tab's swipe
- Red Pen `#D64541` — marking only: the cover's margin line
- Graphite `#5B6577` — secondary text (existing slate palette)

**Type**
- Newsreader (serif, already loaded) = the Scholar display voice:
  brand wordmark, hero headline, teen section headings
- Fredoka = the Explorer voice (unchanged, already in kid templates)
- Plus Jakarta Sans = UI/body; JetBrains Mono = exam timer

**Layout & moves**
- Masthead sits on a 2px ink rule; the monogram is a flat bookplate
  stamp (serif R), no gradient.
- Scholar hero = workbook cover: flat Ink Navy, graph-paper grid,
  red margin line, serif headline. The one bold moment; it settles in
  with a single short load animation (off with reduced motion).
- Cards are sheets: `boxShadow.bento` is now a hard offset ink shadow
  instead of the soft grey blur.
- Teen main tabs = notebook divider tabs: the active tab is ink text
  with a highlighter swipe underneath, on the sub-nav rule. Phones
  keep the one-line swipeable strip with short labels.
- Parent portal gets the same paper so both pages feel like one book.

**Deliberately avoided** (generic-default tells): warm cream +
terracotta, gradient washes as decoration, identical soft-shadow
cards, ALL-CAPS eyebrow labels, middot meta strings.

## Safety
CSS-dominant: no JS changed, no ids/handlers touched (two spans gained
ids: `brandMark`, `brandName`). All existing mobile rules (one-line SAT
toolbar, one-line teen tabs, chip strip, compact rhythm) are preserved
and the tab restyle is scoped to `#subNavTabs.teen-main-tabs` so the
Explorer tabs are unaffected. Dark mode has paired rules throughout.

## Try it
Vercel builds a preview for this branch (Deployments → this branch),
or run `npm run build` and serve `dist/`. Compare Scholar dashboard
(cover hero, divider tabs) in light + dark, then Explorer on a phone
width — Explorer should feel familiar, Scholar should feel new.

## Round 2 — Focus Home + bottom tab bar (declutter)
Feedback on round 1: the skin changed but the page still felt
congested. This round rearranges instead of repainting:

- **Focus Home (Scholar dashboard):** the hero is now a slim banner
  (description kept on desktop only). The 14-day calendar + mastery
  cards and the timing/second-guess telemetry moved into collapsed
  panels ("📅 Study calendar & subject mastery", "⏱️ Timing &
  second-guess analytics") — native `<details>`, closed by default,
  one tap to open. Home now shows: banner, topic launchers, and the
  two quiet panel bars.
- **App-style bottom bar (phones, Scholar only):** Home · SAT ·
  Spelling · Languages · Wallet fixed at the thumb, active tab marked
  with the highlighter swipe. It replaces the top tab strip on phones
  (desktop keeps the divider tabs). Visibility is CSS-driven from
  `body.teen-mode` + the main content being shown, so it never appears
  for Explorer or when signed out.
- **Header diet (phones, Scholar):** the Wallet and Rankings pills
  leave the header — Wallet lives in the bottom bar, Rankings is a
  banner button on Home. Explorer keeps its header pills.
- **Goal strip, thinnest form (phones):** avatar + greeting + the
  Questions bar only; the Active Time block and accuracy line retire
  on small screens (all of it still on desktop, and the strip still
  relocates to the page bottom on phones as before).

## Round 3 — Exam tools pop-up menu (focus the question area)
Borrowing from popular apps, applied with the frontend-design skill:

- **Duolingo / Khan Academy lesson screens:** only the progress
  indicator and the question are on screen; everything else is one
  tap away. The SAT toolbar now keeps just Dashboard, Domain,
  difficulty, Q counter, stopwatch, and a ⋮ More button.
- **YouTube / Spotify mobile sheets:** tapping ⋮ opens a bottom
  sheet on phones (centered card on desktop) with the secondary
  tools: ✂️ Eliminator, 📖 Passage (phones only, as before),
  🚩 Flag this question, and 📖 Dictionary & Vault. Tapping any
  item runs it and closes the sheet; tapping outside closes it.
- The passage, question and choices now own the main area; the
  Eliminator's active state still shows via its amber banner, and
  its menu row keeps the full-width row styling (the JS class
  strings were updated for the sheet layout). Motion is one gentle
  slide-up on phones only, off with reduced motion.
- Same sheet pattern can extend later to the Language Studio quiz
  and the bottom bar's extra actions if wanted.

## Round 4 — Contextual bottom bar (question frame owns the screen)
From the user's screenshot of Language Studio: the page stacked
language pills + sub-mode pills + two big Practice/Flashcards
cards before the question. Now the bottom bar itself changes with
the section (phones, Scholar only), and the in-page rows retire:

- **Languages:** ← Back · 🔤 Alphabet · 📖 Words · 💬 Sentences ·
  🐝 Bee (the exact sub-modes). The `#teenLangSubNav` pill row is
  hidden on phones while this bar is active; the language pills
  stay (they are the picker).
- **Spelling:** ← Back · ⌨️ Builder · 📝 Quiz · 🃏 Flashcards.
  The `#teenSpellModeTabs` row hides on phones.
- **SAT exam:** ← Exit · ✂️ Eliminator · 📖 Passage · 🚩 Flag ·
  📖 Dictionary — the exam tools as thumb buttons; the toolbar's
  ⋮ More button retires on phones (desktop keeps it).
- **Dashboard:** the main bar (Home · SAT · Spelling · Languages ·
  Wallet) returns.
- **Back vs Home:** Back wins inside a section — it goes up one
  level (Malayalam quiz → studio top, SAT exam → dashboard) and
  keeps context; Home discards it. Home stays one tap away in the
  main bar. Back on Languages/Spelling restores the main bar and
  scrolls to the section top (pills/tiers); Back on SAT exits to
  the dashboard.
- The big Practice/Flashcards cards also shrink to a compact
  segmented row on phones (`#teenViewTabsBar`).
- Wiring: `setTeenContextBar(state)` renders the bar and toggles
  `body.teen-context-bar`; `openTeenTab` sets the state per
  section; `setTeenLangSubMode` / `setTeenSpellingMode` /
  `toggleEliminatorMode` re-sync the active highlight.
  Explorer is untouched (kid renderer clears the class + bar).

## Round 5 — Language picker + Explorer parity (phone declutter)
- **Language picker:** tapping Languages now opens a picker first
  ("Choose a language", all five as full-width rows); one more tap
  opens that language's question page with NO landing chrome —
  the studio heading + language pills never render on phones
  (`#teenLangStudioHeader` hidden ≤639px), sub-nav already lives
  in the contextual bar, and the bar's ← Back returns to the
  picker (not to a stacked landing page). Wiring:
  `showTeenLangPicker` / `pickTeenLanguage` in teen-studio.js,
  hooked into `openTeenTab('languages')` and
  `teenContextBack('languages')`. Desktop unchanged (picker CSS
  is phone-only; pills still work there).
- **Active Learner bar retired on phones** (both modes): the
  header Switch button already opens the profile picker, so
  `#profileQuickBar` is `display:none` ≤639px. Profile switching
  is unaffected.
- **Stickers & stars leave the question page:** `#kidStickersCard`
  hidden ≤639px (desktop keeps it).
- **Explorer bottom bar:** `#mobileKidBar` (phones, kid mode) with
  🎮 Practice / 🃏 Flashcards, active state synced in
  `setKidViewTab`; `renderSubNavForKid` sets `body.kid-mode`
  (teen renderer clears it). While it shows, the top sub-nav
  buttons and the in-section view cards hide on phones
  (they were duplicates of the same switch). Language sub-modes
  stay in-page, compacted, since the bar has no room for both
  dimensions — same trade-off as Scholar's compact view tabs.

## Round 6 — Explorer topic switcher (phone space saver)
- The whole chip strip retires on phones: `body.kid-mode
  #kidCategoryGrid` is `display:none` ≤639px, so the question
  card moves up by the strip's full height.
- In its place, the kid bottom bar gains a middle **Topics**
  button showing the current topic (emoji + name, like the
  profile switcher shows the current profile). Tapping it opens
  a **topic picker overlay** mirroring the profile picker
  (backdrop, card, 2-column grid of all 12 subjects, active one
  highlighted); one tap switches topic (`selectKidCategory`)
  and closes the overlay.
- Wiring: `openTopicPicker` / `closeTopicPicker` /
  `renderTopicPicker` / `syncKidTopicButton` in kid-playground.js
  (sync runs at the end of `selectKidCategory`, so the button
  always shows the live topic); `applyActiveProfileView` closes
  the overlay on profile switch. Desktop unchanged (chip strip
  still there; the bar is phone-only).
