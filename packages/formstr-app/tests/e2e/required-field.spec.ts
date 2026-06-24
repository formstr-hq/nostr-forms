import { test, expect } from "@playwright/test";
import {
  gotoBuilder,
  addField,
  publishAndGetUrls,
  answerBox,
  submit,
  expectThankYou,
} from "./helpers";

/**
 * A required field must block submission until it's answered. Pure client-side
 * form logic — fast and shouldn't flake.
 */
test("a required field blocks submission until it is answered", async ({
  page,
}) => {
  await gotoBuilder(page);
  await addField(page, "Short answer");

  // Toggle "required". This is an icon-only control with no accessible name
  // (an a11y gap worth fixing in the app); reached here by its markup.
  await page.locator(".asterisk").first().click();

  const { fillUrl } = await publishAndGetUrls(page);
  await page.goto(fillUrl);

  const answer = answerBox(page);
  await expect(answer).toBeVisible({ timeout: 20_000 });

  // Empty submit is rejected with the required message; no thank-you screen.
  await submit(page);
  await expect(page.getByText("This is a required question")).toBeVisible();
  await expect(page.getByAltText("Thank you")).toBeHidden();

  // Once answered, submission goes through.
  await answer.fill("now it is answered");
  await submit(page);
  await expectThankYou(page);
});
