import { test, expect, Page } from "@playwright/test";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils.js";
import { publishToLocalRelay, LOCAL_RELAY_URL } from "./helpers";

/**
 * Sectioned forms: the filler renders a stepper (one step per section, with
 * unsectioned questions grouped into a leading step), gates each step on
 * validation, and lets the user navigate by clicking step titles.
 *
 * This guards the fixed step-click behaviour: clicking the *next* step title
 * validates and advances (previously dead code — `stepIndex === stepIndex + 1`
 * could never be true), clicking a previous step jumps back freely, and
 * skipping more than one step ahead is blocked.
 *
 * The form is seeded directly to the local relay (a fixture); everything after
 * is driven the way a user would.
 */

const run = Date.now();
const fid = () => Math.random().toString(36).slice(2, 8);

// Field ids (referenced by the sections in settings) and unique answers.
const INTRO = { id: fid(), label: `Intro Question ${run}` };
const ONE = { id: fid(), label: `Section One Question ${run}` };
const TWO = { id: fid(), label: `Section Two Question ${run}` };
const A = {
  intro: `intro-answer-${run}`,
  one: `one-answer-${run}`,
  two: `two-answer-${run}`,
};

const fieldTag = (f: { id: string; label: string }, required = false) => [
  "field",
  f.id,
  "text",
  f.label,
  "[]",
  JSON.stringify({ renderElement: "shortText", ...(required ? { required } : {}) }),
];

/** A step title inside the stepper (section titles also render in the card). */
const stepTitle = (page: Page, title: string) =>
  page.locator(".MuiStepButton-root", { hasText: title });

/** The answer textbox of the currently rendered step's question. */
const answerOf = (page: Page, label: string) =>
  page
    .locator(".filler-question")
    .filter({ has: page.getByText(label, { exact: true }) })
    .getByRole("textbox");

test("sectioned form: stepper navigation, per-step validation, round-trip", async ({
  page,
}) => {
  // --- Seed a sectioned form: intro (unsectioned) + two sections ---
  const secret = generateSecretKey();
  const pubkey = getPublicKey(secret);
  const formId = `sections-${run}`;

  await publishToLocalRelay(
    {
      kind: 30168,
      created_at: Math.floor(Date.now() / 1000),
      content: "",
      tags: [
        ["d", formId],
        ["name", `Sectioned Form ${run}`],
        [
          "settings",
          JSON.stringify({
            sections: [
              {
                id: "sec1",
                title: "Section One",
                description: "The first part",
                questionIds: [ONE.id],
              },
              {
                id: "sec2",
                title: "Section Two",
                questionIds: [TWO.id],
              },
            ],
          }),
        ],
        fieldTag(INTRO),
        fieldTag(ONE, true), // required: gates the Continue button on its step
        fieldTag(TWO),
        ["t", "public"],
        ["relay", LOCAL_RELAY_URL],
      ],
    },
    secret,
  );

  const naddr = nip19.naddrEncode({
    kind: 30168,
    pubkey,
    identifier: formId,
    relays: [LOCAL_RELAY_URL],
  });
  const fillUrl = `/f/${naddr}`;
  const responsesUrl = `/s/${naddr}#${bytesToHex(secret)}`;

  // --- Open the fill page: stepper shows both sections, first step renders ---
  await page.goto(fillUrl);
  await expect(answerOf(page, INTRO.label)).toBeVisible({ timeout: 30_000 });
  await expect(stepTitle(page, "Section One")).toBeVisible();
  await expect(stepTitle(page, "Section Two")).toBeVisible();
  // Only the current step's questions are rendered.
  await expect(answerOf(page, ONE.label)).toHaveCount(0);
  await expect(answerOf(page, TWO.label)).toHaveCount(0);

  // --- Skipping two steps ahead by clicking the stepper is blocked ---
  await stepTitle(page, "Section Two").click();
  await expect(answerOf(page, INTRO.label)).toBeVisible();
  await expect(answerOf(page, TWO.label)).toHaveCount(0);

  // --- Continue advances to Section One ---
  await answerOf(page, INTRO.label).fill(A.intro);
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(answerOf(page, ONE.label)).toBeVisible();

  // --- Section One is required: Continue is blocked until it has a value ---
  await page.getByRole("button", { name: /continue/i }).click();
  await expect(answerOf(page, ONE.label)).toBeVisible(); // still on the step
  await expect(answerOf(page, TWO.label)).toHaveCount(0);

  // --- Clicking the *next* step title validates and advances (the fix) ---
  await answerOf(page, ONE.label).fill(A.one);
  await stepTitle(page, "Section Two").click();
  await expect(answerOf(page, TWO.label)).toBeVisible();

  // --- Clicking a previous step title jumps back, keeping the answer ---
  await stepTitle(page, "Section One").click();
  await expect(answerOf(page, ONE.label)).toHaveValue(A.one);
  await stepTitle(page, "Section Two").click();
  await expect(answerOf(page, TWO.label)).toBeVisible();

  // --- Submit on the last step ---
  await answerOf(page, TWO.label).fill(A.two);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByAltText("Thank you")).toBeVisible({ timeout: 20_000 });

  // --- All three answers round-trip into the responses view ---
  await page.goto(responsesUrl);
  for (const value of [A.intro, A.one, A.two]) {
    await expect(page.getByText(value, { exact: false }).first()).toBeVisible({
      timeout: 20_000,
    });
  }
});
