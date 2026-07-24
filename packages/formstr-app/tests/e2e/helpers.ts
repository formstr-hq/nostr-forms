import { Page, expect } from "@playwright/test";
import WebSocket from "ws";
import { finalizeEvent, type EventTemplate } from "nostr-tools";

export const LOCAL_RELAY = "localhost:7448";
export const LOCAL_RELAY_URL = "ws://localhost:7448";

/**
 * Sign and publish an event to the local test relay, resolving once the relay
 * has accepted it (OK). Used to seed fixtures directly, so a test can focus its
 * user-driven steps on the part under test (e.g. filling a form).
 */
export function publishToLocalRelay(
  template: EventTemplate,
  secretKey: Uint8Array,
): Promise<void> {
  const event = finalizeEvent(template, secretKey);
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(LOCAL_RELAY_URL);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("relay publish timed out"));
    }, 10_000);
    ws.on("open", () => ws.send(JSON.stringify(["EVENT", event])));
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg[0] === "OK" && msg[1] === event.id) {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    });
    ws.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
  });
}

/**
 * Shared building blocks for the e2e tests.
 *
 * Everything here interacts the way a real user would — by visible text, roles,
 * placeholders and labels — rather than test-only hooks. The few icon-only
 * controls the app ships without an accessible name (e.g. the "required"
 * asterisk, the submit split-button caret) are reached by their semantic markup
 * and are called out where used.
 */

/** Open the form builder. The field-type menu is open by default on desktop. */
export async function gotoBuilder(page: Page) {
  await page.goto("/c");
}

/**
 * Add a field by its menu label (e.g. "Short answer"). Menu item names also
 * include the icon ("form Short answer") and several labels overlap ("Time" vs
 * "Date & Time"), so we match the item whose own text equals the label exactly.
 */
export async function addField(page: Page, menuLabel: string) {
  const item = page
    .getByRole("menuitem")
    .filter({ has: page.getByText(menuLabel, { exact: true }) });
  await item.click();
}

/** Publish the form and read its fill + responses URLs from the share modal. */
export async function publishAndGetUrls(page: Page) {
  await page.getByRole("button", { name: "Publish" }).click();
  const formLink = page.getByRole("link", { name: /\/f\// });
  await expect(formLink).toBeVisible({ timeout: 20_000 });
  const fillUrl = await formLink.getAttribute("href");
  const responsesUrl = await page
    .getByRole("link", { name: /\/s\// })
    .getAttribute("href");
  expect(fillUrl, "fill URL").toBeTruthy();
  expect(responsesUrl, "responses URL").toBeTruthy();
  return { fillUrl: fillUrl!, responsesUrl: responsesUrl! };
}

/** The single answer textbox on a one-question public form. */
export function answerBox(page: Page) {
  return page.getByRole("textbox").first();
}

/** Click the primary "Submit" action (anonymous submission on a public form). */
export async function submit(page: Page) {
  await page.getByRole("button", { name: "Submit", exact: true }).click();
}

/** Wait for the thank-you screen that confirms a response was published. */
export async function expectThankYou(page: Page) {
  await expect(page.getByAltText("Thank you")).toBeVisible({ timeout: 20_000 });
}

/**
 * Complete the app's sign-up flow in the already-open LoginModal, creating a
 * fresh account and leaving the user logged in. Uses the real modal — no signer
 * internals or storage seeding — so it stays valid after LocalSigner is replaced
 * by @formstr/signer.
 */
export async function completeSignupModal(
  page: Page,
  password = "e2e-pass-1234",
) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Create Account" }).click();
  // The MUI LoginModal (ui-rewrite-mui) mounts only the ACTIVE tab's panel —
  // unlike the old antd Tabs, which kept inactive panes mounted. So the signup
  // form's fields are the only "Password"/"Confirm password" inputs present and
  // we can scope to the whole dialog without matching the Sign In tab's field.
  await dialog.getByPlaceholder("Password", { exact: true }).fill(password);
  await dialog.getByPlaceholder("Confirm password").fill(password);
  await dialog.getByRole("button", { name: "Create Account" }).click();
  // Backup step: the primary button ("I've saved my key") proceeds into the app.
  await dialog.getByRole("button", { name: "I've saved my key" }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

/**
 * Open the submit split-button's dropdown via its caret button and click one
 * of its options.
 */
export async function submitVia(page: Page, option: string | RegExp) {
  await page.getByTestId("submit-options-button").last().click();
  await page.getByRole("menuitem", { name: option }).click();
}

/**
 * Open the header's account/settings dropdown (an icon-only avatar trigger,
 * given an accessible name via `aria-label` since it has no visible text).
 */
export async function openUserMenu(page: Page) {
  await page.getByRole("button", { name: "User menu" }).click();
}

/**
 * Reveal the "Accounts" submenu inside the already-open user menu. Its title
 * row is plain text ("Accounts: <npub>"), which also doubles as the readable
 * label for whichever account is currently active. MUI menus open on click
 * (the antd version expanded on hover).
 */
async function openAccountsSubmenu(page: Page) {
  const accountsRow = page.getByText(/^Accounts:/);
  await accountsRow.click();
  await expect(page.getByText("Add account")).toBeVisible();
  return accountsRow;
}

/** The truncated npub of the currently active account, read from the user menu. */
export async function activeAccountNpub(page: Page): Promise<string> {
  await openUserMenu(page);
  const label = await page.getByText(/^Accounts:/).innerText();
  await page.keyboard.press("Escape");
  return label.replace(/^Accounts:\s*/, "").trim();
}

/**
 * Add another account without disturbing the currently stored ones — opens
 * the login modal from inside the accounts submenu (`ProfileProvider`'s
 * `addAccount`, distinct from the plain sign-in prompt). Caller still needs
 * to drive the login modal itself, e.g. with `completeSignupModal`.
 */
export async function addAccount(page: Page) {
  await openUserMenu(page);
  await openAccountsSubmenu(page);
  await page.getByText("Add account", { exact: true }).click();

  // If unencrypted forms are already saved on this device, adding another
  // account is gated behind a warning that it'll be visible to it too.
  // These modals don't set aria-label/aria-labelledby, so `getByRole` gives
  // them no accessible name to filter on — match by visible text instead.
  const warning = page
    .getByRole("dialog")
    .filter({ hasText: "Local forms aren't encrypted" });
  const appeared = await warning
    .waitFor({ state: "visible", timeout: 2_000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    await warning.getByRole("button", { name: "Continue anyway" }).click();
    await expect(warning).toBeHidden({ timeout: 5_000 });
    // The confirm dialog's own overlay lingers mid-close-animation for a
    // moment, intercepting clicks meant for the login modal underneath.
    await page.waitForTimeout(300);
  }
}

/**
 * Switch the active account to whichever stored account's row contains
 * `npub` (as produced by `activeAccountNpub`). If that account is a locked
 * ncryptsec key, unlocks it with `passphrase` via the passphrase modal.
 */
export async function switchToAccount(
  page: Page,
  npub: string,
  passphrase?: string,
) {
  await openUserMenu(page);
  await openAccountsSubmenu(page);
  await page.getByText(npub, { exact: false }).click();

  if (!passphrase) return;
  const dialog = page.getByRole("dialog").filter({ hasText: "Unlock account" });
  const appeared = await dialog
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!appeared) return;
  await dialog.getByPlaceholder("Passphrase").fill(passphrase);
  await dialog.getByRole("button", { name: "Unlock" }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

/** Click "Login" inside the header's user menu (only present with zero stored accounts). */
export async function login(page: Page) {
  await openUserMenu(page);
  await page.getByText("Login", { exact: true }).click();
}

/**
 * Read the notifications bell's live unread count from its aria-label
 * ("Notifications ({{count}} unread)") — the count itself has no other
 * accessible text, so this is the only way to assert on it without
 * `data-testid`.
 */
export async function unreadNotificationsCount(page: Page): Promise<number> {
  const label = await page
    .getByRole("button", { name: /^Notifications \(/ })
    .first()
    .getAttribute("aria-label");
  const match = label?.match(/\((\d+) unread\)/);
  return match ? parseInt(match[1], 10) : 0;
}

/** Open the notifications bell's dropdown panel. */
export async function openNotifications(page: Page) {
  await page
    .getByRole("button", { name: /^Notifications \(/ })
    .first()
    .click();
}

/** Read a form saved on this device (works logged out) — test-only shortcut to its keys for direct relay publishing. */
export async function getLocalForm(page: Page, index = 0) {
  return page.evaluate((i) => {
    const raw = localStorage.getItem("formstr:forms");
    const forms = raw ? (JSON.parse(raw) as unknown[]) : [];
    return forms[i] as {
      publicKey: string;
      formId: string;
      privateKey: string;
      relays: string[];
    };
  }, index);
}

/** The active account's hex pubkey (not the truncated npub `activeAccountNpub` returns) — needed to construct raw events that tag it. */
export async function activeAccountPubkeyHex(
  page: Page,
): Promise<string | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("formstr:profile");
    return raw ? (JSON.parse(raw) as { pubkey: string }).pubkey : null;
  });
}

/**
 * Dismiss the login modal if a full page reload popped it unprompted. This
 * is a known, pre-existing gap (not introduced by account switching): after
 * a reload, a locked ncryptsec account's `pubkey` is restored from legacy
 * storage before the signer itself is confirmed unlockable, so
 * `LocalFormsProvider` briefly believes a signer should be available and
 * requests one. `pubkey`/account state is unaffected either way — this only
 * clears the stray prompt so the rest of the page can be interacted with.
 */
export async function dismissStraySignInPrompt(page: Page) {
  const dialog = page.getByRole("dialog");
  if (await dialog.isVisible().catch(() => false)) {
    // The MUI LoginModal (ui-rewrite-mui) has no explicit "Close" button — it
    // dismisses on Escape / backdrop. MUI listens for Escape at the document
    // level, so it reaches the dialog regardless of what currently holds focus.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  }
}
