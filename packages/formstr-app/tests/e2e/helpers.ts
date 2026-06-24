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
export async function completeSignupModal(page: Page, password = "e2e-pass-1234") {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Create Account" }).click();
  await dialog.getByPlaceholder("Password", { exact: true }).fill(password);
  await dialog.getByPlaceholder("Confirm password").fill(password);
  await dialog.getByRole("button", { name: "Create Account" }).click();
  // Backup step: a primary button proceeds into the app.
  await dialog.getByRole("button").last().click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
}

/**
 * Open the submit split-button's dropdown (its caret is an icon-only button
 * whose accessible name is "down") and click one of its options.
 */
export async function submitVia(page: Page, option: string | RegExp) {
  await page.getByRole("button", { name: "down" }).last().click();
  await page.getByRole("menuitem", { name: option }).click();
}
