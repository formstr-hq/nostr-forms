import { test, expect } from "@playwright/test";
import {
  gotoBuilder,
  addField,
  publishAndGetUrls,
  answerBox,
  completeSignupModal,
  submitVia,
} from "./helpers";

/**
 * Submit a response as the logged-in user (not anonymously). This is the path
 * that exercises the global signer end to end — it signs the response with the
 * user's identity — so it's the key guard for the LocalSigner -> @formstr/signer
 * migration.
 */
test("submit a response as your logged-in self", async ({ page }) => {
  const uniqueAnswer = `self-signed-${Date.now()}`;

  await gotoBuilder(page);
  await addField(page, "Short answer");
  const { fillUrl, responsesUrl } = await publishAndGetUrls(page);

  await page.goto(fillUrl);
  const answer = answerBox(page);
  await expect(answer).toBeVisible({ timeout: 20_000 });
  await answer.fill(uniqueAnswer);

  // "Submit As Yourself" while logged out opens the login modal (and does not
  // submit). Sign up, then choose it again to actually submit with our identity.
  await submitVia(page, "Submit As Yourself");
  await completeSignupModal(page);
  await submitVia(page, "Submit As Yourself");

  await expect(page.getByAltText("Thank you")).toBeVisible({ timeout: 20_000 });

  // The self-signed response made the full round-trip.
  await page.goto(responsesUrl);
  await expect(page.getByText(uniqueAnswer, { exact: false })).toBeVisible({
    timeout: 20_000,
  });
});
