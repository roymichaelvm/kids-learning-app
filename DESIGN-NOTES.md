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
