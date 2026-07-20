# nostr-forms UI Rewrite (antd → MUI) Implementation Plan

> **For Hermes:** Use subagent-driven-development to implement this plan phase-by-phase. Each phase ends with jest + e2e green and a commit. Do NOT start a later phase until the earlier phase is committed.

**Goal:** Rewrite the entire formstr-app UI on MUI to permanently eliminate the alignment defect class (font-metric + competing layout systems) and uplift the visual design of every screen in the process.

**Architecture:** Single design system — MUI `createTheme` (one source of truth, replacing the current duplicate antd `ConfigProvider`s) + `CssBaseline`. System font stack for UI text (fixes the Anek Devanagari ~170%-em line box that vertically misaligns every compact control); Anek kept for headings only. antd Form (shallow usage: ~3 `useForm` sites, 1 `FormInstance` site) replaced by a small custom answers-state hook — no react-hook-form (YAGNI). styled-components (37 files) purged in favor of MUI `sx`/`styled` (emotion ships with MUI anyway).

**Tech Stack:** React 18 + TS (CRA), MUI v7 (`@mui/material`, `@mui/icons-material`, `@mui/x-date-pickers` + dayjs adapter), react-router v6, i18next, Playwright e2e + Jest (existing infra).

---

## Current context / root causes (established, do not re-litigate)

1. **Font metrics:** `Anek Devanagari` was the global UI font (`index.css` body + antd theme `fontFamily`). Its line box ≈170% of em vs ≈115% for system fonts → text sits off-center in every compact control (buttons, menus, inputs, tags). Unfixable per-component.
2. **Duplicate theming:** two competing antd `ConfigProvider` themes (App.js `formstrTheme` vs AppProviders.tsx hardcoded). A dirty-tree fix exists (uncommitted) consolidating them.
3. **Header/layout:** antd `Layout.Header` inherits `line-height: 64px` → inline content baseline-aligns ~6px above optical center; header not on the same 1200px centered grid as page content.
4. **Competing styling systems:** antd + styled-components (37 files) + plain CSS + inline styles.

**antd footprint (census 2026-07-20):** 133 of 266 src files import antd. Concentration: CreateFormNew (builder) ~50 files, FormFillerNew ~20, Dashboard/ResponsesNew ~20, Header/shell ~10, modals ~15. antd Form is shallow: `Form.useForm()` only in `containers/CreateFormNew/index.tsx:15` + FormFillerNew entry/FormRendererContainer; `FormInstance` only in `FormFillerNew/SubmitButton/submit.tsx:18,53`. All answer data already flows through a single `onInput(questionId, answer, message?)` callback in FormRenderer — the migration seam.

## Branch + test discipline (user's standing rules)

- Work on branch `ui-rewrite-mui` cut from `upgrade-signer` AFTER committing the in-flight baseline fix (Phase 0).
- Jest: `CI=true yarn test` from `packages/formstr-app` (transformIgnorePatterns allowlists ESM; setupTests.js polyfills TextDecoder/matchMedia).
- E2E: `yarn test:e2e` — playwright boots its own in-memory relay :7448 + dev server; **kill anything on :3000 first** or it reuses the wrong server. `notifications.spec` flakes on modal timing — rerun before suspecting regression.
- Every phase: existing tests green + add/extend tests for what changed. E2E for user flows, jest for logic units.
- CRA css-loader pitfall: root-relative `url()` in CSS resolves as webpack module — fonts/ stays at package root. Do not move it.

---

## Phase 0 — Baseline + MUI foundation (half day)

**Objective:** clean tree, MUI installed and themed, both frameworks coexisting (antd still renders everything; MUI renders nothing yet except theme).

1. Commit the uncommitted alignment fix as-is (it is directionally correct: consolidates ConfigProvider, demotes Anek to headings): `git add -A && git commit -m "Baseline: consolidate antd theme, demote Anek Devanagari to headings, header grid alignment"`. Delete stray `verify2.js` first (untracked scratch file — confirm with user before deleting; else leave it).
2. `git checkout -b ui-rewrite-mui`.
3. Install: `yarn add @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-date-pickers dayjs` in `packages/formstr-app`.
4. Create `packages/formstr-app/src/theme/muiTheme.ts`:
   - `createTheme({ palette: { primary: { main: '#FF5733' } }, typography: { fontFamily: system stack, h1–h5: { fontFamily: "'Anek Devanagari', sans-serif" } }, shape: { borderRadius: 8 } })`.
   - Wrap app in MUI `ThemeProvider` + `CssBaseline` inside `AppProviders.tsx`, OUTSIDE the antd ConfigProvider (both coexist until Phase 6).
5. Add jest test `src/theme/muiTheme.test.ts`: asserts primary color token, UI fontFamily excludes Anek, heading variants include it.
6. Run jest + e2e, commit.

**Files:** Create `src/theme/muiTheme.ts`, `src/theme/muiTheme.test.ts`; Modify `src/providers/AppProviders.tsx`, `package.json`.

## Phase 1 — Design direction gate (user decision, no production code)

**Objective:** pick the visual language before rewriting 133 files.

1. Build 2–3 static HTML mockup variants of three key screens: Dashboard (form cards), Builder (CreateFormNew), Filler (FormFillerNew). Use the sketch skill (throwaway HTML, 2–3 variants to compare). Directions: (a) Typeform-clean minimal, (b) Linear/Notion-style dense+crisp, (c) Formstr-brand-forward (orange accents, Anek display headings).
2. User picks one (or a blend). Record the decision + tokens (spacing scale, card style, button style) in `docs/ui-rewrite/design-direction.md` in the repo.
3. **GATE: do not proceed until the user picks.**

## Phase 2 — App shell (Header, AppLayout, Routing, Sidebar)

**Objective:** MUI layout shell on the chosen design; all routes render inside it; alignment grid fixed by construction (single `Container maxWidth="lg"` system, MUI `AppBar` + `Toolbar` — no line-height hacks).

1. Rewrite `components/AppLayout/index.tsx`: MUI `Box` flex column, `AppBar` header, `Container` outlet.
2. Rewrite `components/Header/index.tsx` + `AccountsMenu.tsx` + `NotificationsBell.tsx` + `NostrAvatar.tsx` + `UnlockAccountModal.tsx`: MUI `AppBar/Toolbar/IconButton/Menu/Badge/Avatar/Dialog`. Preserve responsive behavior from commit 474d09c (icon-only Create below sm breakpoint, no flex-crushed icons — use MUI `useMediaQuery(theme.breakpoints.down('sm'))`).
3. Rewrite `components/Sidebar/index.tsx` (antd `Layout` → MUI `Drawer`/Box) and `components/Routing/index.js` (antd `Result` 404 → MUI).
4. Delete `components/Header/index.css` and `.style.ts` files for rewritten components.
5. Tests: extend header jest tests (render, nav, mobile icon-only); run Playwright responsive probe at 375/768/1280 (browser-e2e-testing skill, `scripts/responsive-layout-probe.js`).
6. jest + e2e green, commit.

**Files:** `src/components/{AppLayout,Header,Sidebar,Routing}/**`.

## Phase 3 — Filler surface (respondent-facing, highest visibility)

**Objective:** FormFillerNew fully on MUI, including the antd Form removal via the `onInput` seam.

1. Create `containers/FormFillerNew/hooks/useFormAnswers.ts`: `{ answers, setAnswer(questionId, answer, message?), errors, validate() }` — replaces the antd Form instance. Jest-test the hook (set/clear/validate/required).
2. Rewire `FormFillerNew/index.tsx`, `FormRendererContainer.tsx`, `FormRenderer.tsx`, `FormFields/index.tsx`, `SubmitButton/submit.tsx` to the hook (drop `form: any` / `FormInstance` props).
3. Rewrite all `QuestionNode/InputTypes/*` to MUI controls: `TextField`, `RadioGroup`/`Checkbox` (`FormControlLabel`), `Select`, MUI X `DatePicker`/`TimePicker` (dayjs adapter), custom upload dropzone replacing antd `Upload`, `Stepper`+`LinearProgress` replacing `Steps`/`Progress`, MUI `Card` for QuestionNode.
4. Rewrite `SectionProgressIndicator`, `ThankYouScreen`, `CustomUrlForm`, `components/{FormSettingsPopover,AutoSaveIndicator}`.
5. Update `FormRenderer.sections.test.tsx` and filler e2e specs (poll creation+vote equivalent: fill-and-submit flow against the local-relay fixture pattern from commit 04fa796).
6. jest + e2e green, commit.

**Files:** `src/containers/FormFillerNew/**`, `src/components/FormBanner`, `src/components/SafeMarkdown/ColorfulMarkdownInput.tsx`.

## Phase 4 — Dashboard, Responses, Drafts, PublicForms

**Objective:** list/detail surfaces on MUI with the uplift (card grid, tables, tabs, analytics cards).

1. Dashboard: `index.tsx`, `FormCards/*` (antd `Card/Table/Dropdown/Menu` → MUI `Card/DataGrid` (MIT) or `Table`, `Menu`), `LoggedOutScreen`.
2. ResponsesNew: `index.tsx` (`Tabs`, `Table`), `Export.tsx`, `components/{ResponseDetailModal,ResponseHeader,ResponseNavigator,AIAnalysisChat,FormAnalytics/*}` (chart cards → MUI `Card`+`Grid`; keep existing chart internals, restyle containers).
3. Drafts, PublicForms (+`PublicFormCard`).
4. EditForm shell (Spin/Typography → MUI `CircularProgress/Typography`).
5. Tests: dashboard render/empty/loading states (jest), responses-table e2e flow.
6. jest + e2e green, commit.

**Files:** `src/containers/{Dashboard,ResponsesNew,Drafts,PublicForms,EditForm}/**`.

## Phase 5 — Builder (CreateFormNew — largest surface, ~50 files)

**Objective:** builder fully on MUI; fix known dead code while rewriting (FormRenderer step-nav already fixed at a2a138f; remaining: FormFields grid validation never runs, builder drag-drop dead code, menuConfig grid types swapped, drafts save on unmount only — from project memory).

1. Replace `Form.useForm()` in `CreateFormNew/index.tsx` with builder-local state (the form template already lives in `useFormBuilderContext`; the antd Form is only for title/description inputs).
2. Rewrite in dependency order: `FormTitle` → `QuestionCard` (+`InputElements/*`, `OptionTypes/*`) → `QuestionsList` → menus (`BasicMenu`, `InputsMenu`, `PreBuiltMenu` — antd `Menu` → MUI `MenuList`/`Drawer`) → `AnswerSettings/*` → `Validation/*` → `SectionManager/*` → `FormSettings/**` (incl. `Drawer`s → MUI `Drawer`) → `FormDetails/**` (modals, tabs) → builder `Header/Header.tsx` → `Sidebar`.
3. antd `Carousel` (BackgroundImagePicker) → MUI-compatible lightweight approach (horizontal scroll snap — no new dep).
4. Tests: builder jest tests for question add/edit/reorder + section logic; extend sections e2e (04fa796 pattern) to cover create→fill→submit round trip.
5. jest + e2e green, commit.

**Files:** `src/containers/CreateFormNew/**`.

## Phase 6 — Shared modals, purge, final pass

**Objective:** zero antd imports left; dependencies removed; visual consistency sweep.

1. Rewrite remaining shared components: `LoginModal`, `ImportFormModal`, `BroadcastModal`, `FAQModal`, `UniversalMarkdownModal`, `TemplateSelectorModal`, `RelayPublishModal`, `NIP07Interactions`, `ProfileProvider` Modal, `GoogleFormImportModal`, `AIFormGeneratorModal`, `OllamaSettings`, `ModelSelector`, `CopyButton`, `EmptyScreen`, `TemplateCard`, `RelayStatusIndicator`, `utils/fileDownload.ts` (antd `message` → MUI `Snackbar` via a small `useSnackbar` context — create `src/providers/SnackbarProvider.tsx`).
2. Remove antd ConfigProvider from `AppProviders.tsx`; delete `src/theme/index.ts` (antd theme) and remaining `.style.ts`/CSS files for rewritten components.
3. `yarn remove antd @ant-design/icons styled-components`; grep `from "antd"` → must be zero; grep `styled-components` → zero (except maybe nostr-polls — different repo).
4. Full jest + full e2e; Playwright responsive probe at 375/768/1280 on dashboard/builder/filler; verify `document.fonts.check` for Anek on headings only.
5. Final commit; PR-style summary.

**Files:** `src/components/**` (remainder), `src/providers/AppProviders.tsx`, `src/theme/`, `package.json`.

---

## Risks / tradeoffs / open questions

- **MUI X date/time pickers** behave differently from antd's (input masking, popover). Filler date answers must keep the same stored value format — add a jest test pinning the serialized answer format BEFORE swapping controls (Phase 3 step 1.5).
- **antd Table → MUI DataGrid MIT**: pagination/sorting API differs; ResponsesNew and Dashboard/Submissions rely on it. Keep column shapes identical.
- **antd `message`** is called from deep utility files (`utils/fileDownload.ts`) — the SnackbarProvider must expose an imperative API (e.g. `snackbarRef` or event emitter) so non-component code keeps working.
- **Bundle size**: MUI + emotion + x-pickers roughly replaces antd + rc-* + styled-components; expect neutral-to-better after purge (antd ships moment via rc-picker — verify moment/dayjs duplication after Phase 0 and standardize on dayjs).
- **i18n**: antd locale wiring in AppProviders goes away; MUI components have no locale dependency here except x-pickers (dayjs locale) — wire to the i18next language.
- **Open questions for user (Phase 1 gate):** visual direction pick; keep or drop the `#FF5733` orange as primary; dark mode in scope or not (currently no dark mode — adding it during a theme rewrite is cheap, adding it later is not).

## Verification (every phase)

```bash
cd /Volumes/AppsDrive/Dev/nostr-forms/packages/formstr-app
CI=true yarn test            # jest green
lsof -ti:3000 | xargs kill   # ensure playwright boots its own server
yarn test:e2e                # e2e green (rerun notifications.spec once if it flakes)
BROWSER=none yarn start      # manual visual check of the phase's screens
```
