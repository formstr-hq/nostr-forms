import { test, expect } from "@playwright/test";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  gotoBuilder,
  addField,
  publishAndGetUrls,
  answerBox,
  submitVia,
  expectThankYou,
} from "./helpers";

/**
 * Users who signed in under the old, pre-@formstr/signer LocalSigner still
 * have a raw hex secret sitting in localStorage under "formstr:keys". The
 * new signer facade keeps a read-only compatibility shim for exactly this
 * shape, so those sessions keep working without forcing a fresh login.
 *
 * This seeds that legacy shape directly (never through the app, matching how
 * an existing user's browser actually looks) and confirms "Submit As
 * Yourself" succeeds on the first try — no login modal — proving the old
 * identity was silently restored.
 */
test("a pre-migration guest session restores without a fresh login", async ({ page }) => {
  const uniqueAnswer = `legacy-restore-${Date.now()}`;

  // Build and publish while logged out, same as every other test — this
  // keeps the form itself an ordinary public form. The legacy identity is
  // seeded only once we're about to fill it, isolating what's under test:
  // whether that secret silently restores a working signer.
  await gotoBuilder(page);
  await addField(page, "Short answer");
  const { fillUrl, responsesUrl } = await publishAndGetUrls(page);

  const secret = generateSecretKey();
  const pubkey = getPublicKey(secret);
  const legacyKeys = JSON.stringify({ pubkey, secret: bytesToHex(secret) });
  await page.addInitScript((keys) => {
    window.localStorage.setItem("formstr:keys", keys);
  }, legacyKeys);

  await page.goto(fillUrl);
  const answer = answerBox(page);
  await expect(answer).toBeVisible({ timeout: 20_000 });
  await answer.fill(uniqueAnswer);

  // No login modal should appear here — the legacy secret already restored
  // a working signer on load.
  await submitVia(page, "Submit As Yourself");
  await expectThankYou(page);

  await page.goto(responsesUrl);
  await expect(page.getByText(uniqueAnswer, { exact: false })).toBeVisible({
    timeout: 20_000,
  });
});
