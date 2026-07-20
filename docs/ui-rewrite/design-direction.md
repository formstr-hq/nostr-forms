# Design direction — UI rewrite (antd → MUI)

Decided 2026-07-20 from the mockups in `docs/ui-rewrite/mockups/` (00–06). User-approved with the feedback recorded below.

## Direction

Clean Linear/Typeform-style surfaces + Formstr brand kept. Border-first cards (1px `#E8E8E8`, elevation 0; shadows only for dialogs/popovers), flat brand color, one centered 1200px grid for all surfaces, 8px spacing scale, radii 4/8/12 (inputs/buttons/cards).

## Tokens (authoritative values)

- Primary: `#FF4D00` (canonical `FORMSTR_BRAND.primary` — note: the mockups show the legacy `#FF5733`; the theme uses the canonical value), hover `#E84400`, tint `#FFF1EC`
- Neutrals: ink `#1A1A1A`, secondary `#6B6B6B`, muted `#A3A3A3`, border `#E8E8E8`, page `#FAFAFA`, card `#FFFFFF`
- Status: success `#16A34A`, warning `#D97706`, danger `#DC2626` (+ tinted chips)
- Type: system font stack for ALL UI text; Anek Devanagari for display headings only (its ~170%-em line box was the root cause of the recurring control-alignment bugs — never a UI font again)
- Buttons sentence-case (no all-caps), elevation 0

## User feedback on mockups (binding)

1. **Dashboard:** card layout approved — BUT keep the existing filter dimensions (My Forms / Drafts / Shared with me / Purchases / Submissions) as filters above the card grid. The mockup's "All/Published/Drafts" tabs alone are not sufficient.
2. **Builder:** desktop 3-pane layout is fine mostly unchanged — uplift is styling-level (tokens, surfaces, spacing), not a layout rethink.
3. **Mobile settings interaction:** tapping a question card selects it (orange ring + left bar); the selected card's footer shows a toolbar (duplicate / delete / settings gear). Gear or type-chip tap opens a bottom sheet with two tabs — **Question** (type, required, scale, labels) and **Answer** (right-answer config, points — today's `AnswerSettings`). Sheet dismisses by swipe; desktop keeps the right panel.

## Deferred

- Dark mode: mockup `04-filler-dark.svg` produced; no explicit approval yet. Tokens are organized so a `palette.mode: "dark"` variant can be added later without touching components. Out of scope for the rewrite unless the user pulls it in.
