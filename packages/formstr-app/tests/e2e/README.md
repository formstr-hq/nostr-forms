# E2E tests

A small, deliberately focused Playwright suite that exercises the core formstr
flows end to end. These are **health checks**, not UI specs.

## Tests

- **form-roundtrip** — create a form → publish → fill → submit (anonymous) →
  read the response back. The core spine.
- **sign-as-yourself** — submit a response as a logged-in user (signs up through
  the real login modal). The key guard for the signer migration.
- **required-field** — a required field blocks submission until answered.
- **all-field-types** — one of every field type is filled and verified to
  round-trip into the responses view (see notes below).

## Running

```bash
# from packages/formstr-app
yarn test:e2e        # headless
yarn test:e2e:ui     # Playwright UI mode
yarn test:e2e form-roundtrip   # a single file
```

Playwright boots two servers itself (via the `webServer` config; both are reused
if already running):

1. a **local in-memory nostr relay** (`tests/e2e/relay-server.cjs`) on port 7448, and
2. the dev server (`yarn start` on port 3000), started with
   `REACT_APP_DEFAULT_RELAYS=ws://localhost:7448` so the whole app reads/writes
   against the local relay only.

## Principles

- Interactions are driven the way a **user** would: accessible roles, visible
  text, placeholders, labels — never `data-testid`. A few icon-only controls the
  app ships without an accessible name (the "required" asterisk, the submit
  split-button caret) are reached by their semantic markup; adding `aria-label`s
  in the app would let us drop even those.
- Tests never touch `localStorage` or signer internals, so they stay valid after
  `LocalSigner` is replaced by `@formstr/signer`.

## Notes

- No live relays — fast (~3–15s per test) and deterministic, retries disabled so
  real flakiness surfaces. The relay is in-memory and wiped on restart.
- `getDefaultRelays()` (`src/nostr/common.ts`) honors the `REACT_APP_DEFAULT_RELAYS`
  env var; it's unset in production. `form-roundtrip` decodes the published form's
  `naddr` and asserts it points at the local relay, so a broken override fails
  loudly instead of silently using live relays.
- The `all-field-types` form is **seeded** as a signed event directly to the relay
  (a fixture — full control over labels/options/grids); only the fill is driven as
  a user. Fields with verbatim responses (text/number/email/choices/file/rating)
  are checked by value; the rest (date/time/grids/signature) are marked REQUIRED so
  a green run proves their fill captured a value. The Blossom upload is mocked via
  `page.route` so the file field works offline.
- Browsers are installed with `npx playwright install chromium`.
