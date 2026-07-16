import { test, expect } from "@playwright/test";
import {
  gotoBuilder,
  addField,
  publishAndGetUrls,
  answerBox,
  completeSignupModal,
  submitVia,
  expectThankYou,
  activeAccountNpub,
  addAccount,
  switchToAccount,
  dismissStraySignInPrompt,
} from "./helpers";

const PASSWORD_A = "e2e-submissions-a";
const PASSWORD_B = "e2e-submissions-b";

/**
 * "My submissions" is tracked on-device (utils/submissions.ts), not on
 * Nostr, and is scoped to whichever account is currently signed in — a
 * signed submission made as one account must not leak into another
 * account's view (Dashboard/FormCards/Submissions.tsx filters by
 * `submittedAs`). This is the key guard for that scoping.
 */
test("my submissions are recorded on-device and scoped to the signed-in account", async ({
  page,
}) => {
  // At the default viewport, the header's responsive nav collapses the
  // account avatar into a hidden overflow bucket — this test needs to open
  // it, so give the header room to lay everything out inline.
  await page.setViewportSize({ width: 1600, height: 1000 });

  const uniqueAnswer = `my-submissions-${Date.now()}`;

  await gotoBuilder(page);
  await addField(page, "Short answer");
  const { fillUrl } = await publishAndGetUrls(page);

  await page.goto(fillUrl);
  const answer = answerBox(page);
  await expect(answer).toBeVisible({ timeout: 20_000 });
  await answer.fill(uniqueAnswer);

  // "Submit As Yourself" while logged out opens the login modal (and does
  // not submit). Sign up as account A, then submit for real.
  await submitVia(page, "Submit As Yourself");
  await completeSignupModal(page, PASSWORD_A);
  await submitVia(page, "Submit As Yourself");
  await expectThankYou(page);

  // The fill page has no header (it's public, unauthenticated chrome) — read
  // the active account's npub once we're on a page that has one.
  await page.goto("/dashboard/submissions");
  await dismissStraySignInPrompt(page);
  const npubA = await activeAccountNpub(page);
  const submissionCell = page.getByRole("cell", { name: npubA });
  await expect(submissionCell).toBeVisible({ timeout: 20_000 });

  // Add a second account (B) — it becomes active, and A's signed submission
  // is no longer visible under it.
  await addAccount(page);
  await completeSignupModal(page, PASSWORD_B);

  await page.goto("/dashboard/submissions");
  await dismissStraySignInPrompt(page);
  await expect(
    page.getByText("No submissions yet. Forms you fill out will show up here."),
  ).toBeVisible({ timeout: 20_000 });
  await expect(submissionCell).toBeHidden();

  // Switching back to A brings its submission back into view.
  await switchToAccount(page, npubA, PASSWORD_A);
  await page.goto("/dashboard/submissions");
  await dismissStraySignInPrompt(page);
  await expect(submissionCell).toBeVisible({ timeout: 20_000 });
});

/**
 * Anonymous submissions aren't tied to any identity, so unlike signed ones
 * they should show up in "My submissions" regardless of which account (if
 * any) is currently active.
 */
test("anonymous submissions show up in my submissions for any account", async ({
  page,
}) => {
  const uniqueAnswer = `anon-submission-${Date.now()}`;

  await gotoBuilder(page);
  await addField(page, "Short answer");
  const { fillUrl } = await publishAndGetUrls(page);

  await page.goto(fillUrl);
  const answer = answerBox(page);
  await expect(answer).toBeVisible({ timeout: 20_000 });
  await answer.fill(uniqueAnswer);
  await submitVia(page, "Submit Anonymously");
  await expectThankYou(page);

  await page.goto("/dashboard/submissions");
  await expect(page.getByText("Anonymous")).toBeVisible({ timeout: 20_000 });
});
