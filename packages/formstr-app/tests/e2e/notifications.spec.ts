import { test, expect } from "@playwright/test";
import { generateSecretKey } from "nostr-tools";
import {
  gotoBuilder,
  addField,
  publishAndGetUrls,
  login,
  completeSignupModal,
  addAccount,
  switchToAccount,
  activeAccountNpub,
  activeAccountPubkeyHex,
  dismissStraySignInPrompt,
  publishToLocalRelay,
  unreadNotificationsCount,
  openNotifications,
  getLocalForm,
} from "./helpers";

/**
 * "My submissions" tracks the filler side; this is the owner side — a form
 * owner should be told in-app when a response arrives, and this must work
 * for forms saved only on-device with nobody signed in (a fully supported
 * way to own a form in this app). See Dashboard/FormCards/Submissions.tsx
 * for the filler-side counterpart to this.
 */
test("response notifications work for a local-only form with nobody signed in, and clear when read", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });

  await gotoBuilder(page);
  await addField(page, "Short answer");
  await publishAndGetUrls(page);

  // The builder has its own header (no bell) — move somewhere the main
  // NostrHeader renders.
  await page.goto("/dashboard/local");
  expect(await unreadNotificationsCount(page)).toBe(0);

  const localForm = await getLocalForm(page, 0);
  expect(localForm?.publicKey).toBeTruthy();
  expect(localForm?.formId).toBeTruthy();

  // Simulate someone else submitting a response, directly on the relay.
  const responderSk = generateSecretKey();
  await publishToLocalRelay(
    {
      kind: 1069,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["a", `30168:${localForm.publicKey}:${localForm.formId}`]],
      content: "",
    },
    responderSk,
  );

  await expect(async () => {
    expect(await unreadNotificationsCount(page)).toBe(1);
  }).toPass({ timeout: 15_000 });

  await openNotifications(page);
  await expect(page.getByText(/New response on/)).toBeVisible();
  await page.getByText(/New response on/).click();

  await expect(async () => {
    expect(await unreadNotificationsCount(page)).toBe(0);
  }).toPass({ timeout: 5_000 });
});

/**
 * The share signal reuses the existing editor/collaborator `p`-tag
 * mechanism (Form Settings -> Sharing -> Editors), which is also how the
 * "Shared" dashboard tab already works. Two correctness requirements that
 * are easy to get wrong: every form auto-`p`-tags its own creator (so
 * self-shares must not notify), and kind 30168 is a replaceable event (so
 * editing an already-shared form must not re-notify).
 */
test("share notifications exclude your own forms, dedupe on edit, and stay scoped per account", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });

  await page.goto("/dashboard/local");
  await login(page);
  await completeSignupModal(page, "share-test-a");
  const npubA = await activeAccountNpub(page);

  // Publish a form while logged in as A - auto-p-tags A as its own editor.
  await gotoBuilder(page);
  await addField(page, "Short answer");
  await publishAndGetUrls(page);
  await page.goto("/dashboard/local");
  await dismissStraySignInPrompt(page);

  // Self-share exclusion: creating your own form must not notify you.
  await page.waitForTimeout(2_000);
  expect(await unreadNotificationsCount(page)).toBe(0);

  const pubkeyAOrNull = await activeAccountPubkeyHex(page);
  expect(pubkeyAOrNull).toBeTruthy();
  const pubkeyA = pubkeyAOrNull as string;

  // Simulate someone else sharing a different form with A, directly on the relay.
  const sharerSk = generateSecretKey();
  const sharedFormId = `shared-${Date.now()}`;
  await publishToLocalRelay(
    {
      kind: 30168,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["d", sharedFormId],
        ["name", "Shared Test Form"],
        ["p", pubkeyA],
      ],
      content: "",
    },
    sharerSk,
  );

  await expect(async () => {
    expect(await unreadNotificationsCount(page)).toBe(1);
  }).toPass({ timeout: 15_000 });

  await openNotifications(page);
  await expect(page.getByText(/was shared with you/)).toBeVisible();

  // Edit (republish same d tag, changed name) — must not duplicate the notification.
  await publishToLocalRelay(
    {
      kind: 30168,
      created_at: Math.floor(Date.now() / 1000) + 1,
      tags: [
        ["d", sharedFormId],
        ["name", "Shared Test Form (edited)"],
        ["p", pubkeyA],
      ],
      content: "",
    },
    sharerSk,
  );
  await page.waitForTimeout(2_000);
  expect(await unreadNotificationsCount(page)).toBe(1);

  // Multi-account: adding B starts fresh (no bleed-through from A).
  await addAccount(page);
  await completeSignupModal(page, "share-test-b");
  await expect(async () => {
    expect(await unreadNotificationsCount(page)).toBe(0);
  }).toPass({ timeout: 10_000 });

  // Switching back to A restores A's unread notification.
  await switchToAccount(page, npubA, "share-test-a");
  await expect(async () => {
    expect(await unreadNotificationsCount(page)).toBe(1);
  }).toPass({ timeout: 10_000 });
});
