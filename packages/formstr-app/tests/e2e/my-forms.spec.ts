import { test, expect } from "@playwright/test";
import { completeSignupModal, login } from "./helpers";

/**
 * "My Forms" is the login-scoped list of forms you authored. Forms are
 * published under a form-specific signing key (not your identity key), so they
 * can't be found by `authors: [you]`; instead the app keeps an encrypted
 * kind-14083 bookmark list under your identity. Creating a form while signed in
 * appends to it; the dashboard's "My forms" filter reads it back and decrypts
 * it with the live signer.
 *
 * The whole flow stays in one session (SPA navigation only). A full page reload
 * would, by design, drop a password account's signer — the passphrase is never
 * persisted — so we never `page.goto` after signing in.
 */
test("a form created while signed in appears under My Forms", async ({
  page,
}) => {
  // Wide viewport so the header's account controls lay out inline instead of
  // collapsing into a hidden overflow bucket.
  await page.setViewportSize({ width: 1600, height: 1000 });

  // 1. Sign up first, so the form is authored while signed in.
  await page.goto("/dashboard");
  await login(page);
  await completeSignupModal(page, "e2e-myforms");

  // 2. The empty "On this device" dashboard shows template cards. RSVP ships
  //    with fields, so picking it (SPA nav to the builder, session intact) can
  //    be published as-is.
  await page.getByText("RSVP", { exact: true }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("link", { name: /\/f\// })).toBeVisible({
    timeout: 20_000,
  });

  // 3. Publishing while signed in saved it to My Forms. Close the share dialog
  //    (MUI dialogs dismiss on Escape) and open the My Forms filter via its tab
  //    — SPA navigation, so the signer stays live to decrypt the list.
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: "My forms" }).click();

  // 4. Force a fresh read of the kind-14083 list (the save + this read race), then
  //    assert the authored form surfaces by its name.
  const reload = page.getByRole("button", { name: "Reload" });
  await expect(reload).toBeVisible({ timeout: 20_000 });
  await reload.click();
  await expect(page.getByText("Event RSVP").first()).toBeVisible({
    timeout: 25_000,
  });
});
