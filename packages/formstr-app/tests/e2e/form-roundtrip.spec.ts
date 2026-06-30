import { test, expect, Page } from "@playwright/test";
import { nip19 } from "nostr-tools";

const LOCAL_RELAY = "localhost:7448";

/**
 * End-to-end "health check" for the core formstr round-trip:
 *
 *   create a form  ->  publish it to relays  ->  fill it out  ->  submit a
 *   response  ->  read that response back from the responses view.
 *
 * This is intentionally the ONLY e2e test. It exercises the whole spine of the
 * app — signing, relay publish, relay read, response encryption and decryption —
 * so it stays meaningful even as the UI changes. It is deliberately written to
 * survive cosmetic UI churn:
 *
 *   - selectors use accessible roles / visible text / stable data-testids,
 *     never CSS classes or DOM structure;
 *   - it does not touch localStorage or any signer internals, so it remains
 *     valid after LocalSigner is swapped for @formstr/signer;
 *   - it asserts on a unique value we type in, not on incidental copy.
 *
 * It talks to live public relays, so it is inherently a little slower and can
 * occasionally need the one configured retry.
 */

// A value unique to each run so the responses view can't show us a stale match.
const uniqueAnswer = `e2e-answer-${Date.now()}`;

async function addShortAnswerQuestion(page: Page) {
  // The field-type menu is open by default on desktop; on narrower layouts the
  // floating "+" button opens it. Open it only if the option isn't already there.
  const shortAnswer = page.getByRole("menuitem", { name: /Short answer/ });
  if (!(await shortAnswer.isVisible())) {
    await page.getByRole("button", { name: "+" }).first().click();
  }
  await shortAnswer.click();
}

test("create a form, publish it, fill it, and read the response back", async ({
  page,
}) => {
  // 1. Go straight to the builder (route is the stable public contract).
  await page.goto("/c");

  // 2. Add one short-answer question.
  await addShortAnswerQuestion(page);

  // 3. Publish to relays. saveForm navigates to the dashboard and opens the
  //    "share" modal once at least one relay has accepted the form event.
  await page.getByRole("button", { name: "Publish" }).click();

  // 4. Grab the live form URL and responses URL from the share modal. These are
  //    rendered as real <a> links, so we read them straight off the href.
  const formLink = page.getByRole("link", { name: /\/f\// });
  await expect(formLink).toBeVisible({ timeout: 20_000 });
  const fillUrl = await formLink.getAttribute("href");

  const responsesLink = page.getByRole("link", { name: /\/s\// });
  const responsesUrl = await responsesLink.getAttribute("href");

  expect(fillUrl, "form fill URL should be present").toBeTruthy();
  expect(responsesUrl, "responses URL should be present").toBeTruthy();

  // Sanity: the form was actually published to our local relay (not live ones).
  // The naddr encodes the relays it was published to.
  const naddr = new URL(fillUrl!).pathname.split("/f/")[1].split("/")[0];
  const decoded = nip19.decode(naddr);
  expect(JSON.stringify(decoded.data)).toContain(LOCAL_RELAY);

  // 5. Open the public fill page. It fetches the form template back from the
  //    relays, which is the read half of the publish round-trip.
  await page.goto(fillUrl!);

  // The only text input on a single-question public form is the answer field.
  const answerInput = page.getByRole("textbox").first();
  await expect(answerInput).toBeVisible({ timeout: 20_000 });
  await answerInput.fill(uniqueAnswer);

  // 6. Submit. The submit control is a split button; its primary action on a
  //    public form is an anonymous submission, which publishes the response event.
  await page.getByRole("button", { name: "Submit", exact: true }).click();

  // 7. Confirm the submission went through: the thank-you screen (a modal with a
  //    "Thank you" image) appears once the response has been published.
  await expect(page.getByAltText("Thank you")).toBeVisible({ timeout: 20_000 });

  // 8. Open the responses view and confirm our answer made the full round-trip:
  //    it was published, read back, and decrypted for display.
  await page.goto(responsesUrl!);
  await expect(page.getByText(uniqueAnswer, { exact: false })).toBeVisible({
    timeout: 20_000,
  });
});
