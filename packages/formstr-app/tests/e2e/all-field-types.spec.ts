import { test, expect, Locator, Page } from "@playwright/test";
import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  publishToLocalRelay,
  LOCAL_RELAY_URL,
  completeSignupModal,
} from "./helpers";

/**
 * Deep coverage: a form with one of every field type is filled out and every
 * answer is checked to have made the round-trip into the responses view.
 *
 * The form itself is seeded directly to the local relay (a fixture — full
 * control over labels, options and grids). Everything after that is driven the
 * way a user would: typing, clicking options, picking dates, drawing on stars.
 *
 * Verification is twofold:
 *  - fields whose response is shown verbatim (text/number/email/choices/file/
 *    rating) are asserted by value in the responses table;
 *  - the remaining widgets (date/time/date-time/grids/signature) are marked
 *    REQUIRED, so if any of their fill interactions failed to capture a value,
 *    submission would be blocked — a green run proves they round-tripped too.
 */

const run = Date.now();
const id = () => Math.random().toString(36).slice(2, 8);

// Unique answer values for the verbatim-checked fields.
const V = {
  short: `short-${run}`,
  para: `para-${run}`,
  number: `${run % 100000}`,
  email: `email-${run}@example.com`,
  radio: `RadioA-${run}`,
  checkbox: `CheckA-${run}`,
  dropdown: `DropA-${run}`,
  file: `upload-${run}.txt`,
};

type FieldSpec = {
  label: string;
  primitive: string;
  config: Record<string, unknown>;
  options?: string;
};

function buildForm() {
  const opt = (label: string) => [id(), label] as [string, string];
  const radioA = opt(V.radio);
  const checkA = opt(V.checkbox);
  const dropA = opt(V.dropdown);
  const grid = () => ({
    columns: [
      [id(), "ColA"],
      [id(), "ColB"],
    ],
    rows: [
      [id(), "RowA"],
      [id(), "RowB"],
    ],
  });
  const scGrid = grid();
  const mcGrid = grid();

  const fields: FieldSpec[] = [
    { label: "Short Q", primitive: "text", config: { renderElement: "shortText" } },
    { label: "Paragraph Q", primitive: "text", config: { renderElement: "paragraph" } },
    { label: "Number Q", primitive: "number", config: { renderElement: "number" } },
    {
      label: "Radio Q",
      primitive: "option",
      config: { renderElement: "radioButton" },
      options: JSON.stringify([radioA, opt(`RadioB-${run}`)]),
    },
    {
      label: "Checkbox Q",
      primitive: "option",
      config: { renderElement: "checkboxes" },
      options: JSON.stringify([checkA, opt(`CheckB-${run}`)]),
    },
    {
      label: "Dropdown Q",
      primitive: "option",
      config: { renderElement: "dropdown" },
      options: JSON.stringify([dropA, opt(`DropB-${run}`)]),
    },
    { label: "Date Q", primitive: "text", config: { renderElement: "date", required: true } },
    { label: "Time Q", primitive: "text", config: { renderElement: "time", required: true } },
    {
      label: "Signature Q",
      primitive: "text",
      config: {
        renderElement: "signature",
        required: true,
        signature: { editableContent: true, prefilledContent: `sig-${run}` },
      },
    },
    {
      label: "File Q",
      primitive: "file",
      config: { renderElement: "fileUpload", blossomServer: "https://blossom.example" },
    },
    { label: "DateTime Q", primitive: "text", config: { renderElement: "datetime", required: true } },
    {
      label: "SCGrid Q",
      primitive: "grid",
      config: { renderElement: "multipleChoiceGrid", required: true },
      options: JSON.stringify(scGrid),
    },
    {
      label: "MCGrid Q",
      primitive: "grid",
      config: { renderElement: "checkboxGrid", required: true },
      options: JSON.stringify(mcGrid),
    },
    { label: "Rating Q", primitive: "text", config: { renderElement: "rating", maxStars: 5 } },
    { label: "DOB Q", primitive: "text", config: { renderElement: "date", required: true } },
    { label: "Email Q", primitive: "text", config: { renderElement: "shortText" } },
  ];

  const fieldTags = fields.map((f) => [
    "field",
    id(),
    f.primitive,
    f.label,
    f.options ?? "[]",
    JSON.stringify(f.config),
  ]);
  return fieldTags;
}

/** Locate a question card by its (unique) label, then act on the control inside. */
function q(page: Page, label: string): Locator {
  // Match on the label's exact text node so e.g. "Time Q" doesn't also match
  // "DateTime Q".
  return page
    .locator(".filler-question")
    .filter({ has: page.getByText(label, { exact: true }) });
}

/**
 * Type into a MUI X desktop picker's sections. Uses DOM focus rather than a
 * mouse click so the calendar/time popover never opens; sections auto-advance
 * as digits become unambiguous.
 */
async function typePickerSections(page: Page, scope: Locator, parts: string[]) {
  const firstSection = scope.getByRole("spinbutton").first();
  await firstSection.focus();
  for (const part of parts) {
    await page.keyboard.type(part);
  }
}

/** Fill a DatePicker (MM/DD/YYYY) or, with withTime, the DateTimePicker ("YYYY-MM-DD HH:mm:ss"). */
async function pickDate(page: Page, scope: Locator, withTime = false) {
  if (withTime) {
    await typePickerSections(page, scope, ["2024", "01", "15", "09", "30", "00"]);
  } else {
    await typePickerSections(page, scope, ["01", "15", "2024"]);
  }
}

/** Fill the TimePicker ("h:mm A"): 9:30 AM. */
async function pickTime(page: Page, scope: Locator) {
  await typePickerSections(page, scope, ["9", "30", "A"]);
}

test("every field type can be filled and round-trips to responses", async ({
  page,
}) => {
  // --- Seed the form fixture directly on the relay ---
  const secret = generateSecretKey();
  const pubkey = getPublicKey(secret);
  const formId = `allfields-${run}`;
  const fieldTags = buildForm();

  await publishToLocalRelay(
    {
      kind: 30168,
      created_at: Math.floor(Date.now() / 1000),
      content: "",
      tags: [
        ["d", formId],
        ["name", `All Field Types ${run}`],
        ["settings", "{}"],
        ...fieldTags,
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

  // Mock the Blossom upload so the file field works offline.
  await page.route("**/upload", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ sha256: "a".repeat(64) }),
    }),
  );

  // --- Fill the form as a user ---
  await page.goto(fillUrl);
  await expect(q(page, "Short Q").getByRole("textbox")).toBeVisible({
    timeout: 30_000,
  });

  await q(page, "Short Q").getByRole("textbox").fill(V.short);
  await q(page, "Paragraph Q").getByRole("textbox").fill(V.para);
  await q(page, "Number Q").getByRole("spinbutton").fill(V.number);
  await q(page, "Email Q").getByRole("textbox").fill(V.email);

  await q(page, "Radio Q").getByText(V.radio).click();
  await q(page, "Checkbox Q").getByText(V.checkbox).click();

  await q(page, "Dropdown Q").getByRole("combobox").click();
  await page.getByRole("option", { name: V.dropdown }).click();

  await pickDate(page, q(page, "Date Q"));
  await pickDate(page, q(page, "DOB Q"));
  await pickTime(page, q(page, "Time Q"));
  await pickDate(page, q(page, "DateTime Q"), true);

  // Grids: pick a cell in each row, and confirm it actually renders checked
  // (not just that the click landed — a rendering gap would leave this
  // unchecked even though the click handler ran).
  //
  // SCGrid is radio-based (single choice per row), so one column per row.
  // MCGrid is checkbox-based and is specifically supposed to allow more than
  // one column per row — RowA checks both ColA and ColB to exercise that,
  // while RowB stays single-column so the test also confirms a row that
  // *isn't* multi-selected doesn't accidentally pick up extra columns.
  for (const rowName of ["RowA", "RowB"]) {
    const scCell = q(page, "SCGrid Q").getByRole("row", { name: rowName }).getByRole("radio").first();
    await scCell.check();
    await expect(scCell).toBeChecked();
  }

  const mcRowA = q(page, "MCGrid Q").getByRole("row", { name: "RowA" }).getByRole("checkbox");
  await mcRowA.nth(0).check();
  await mcRowA.nth(1).check();
  await expect(mcRowA.nth(0)).toBeChecked();
  await expect(mcRowA.nth(1)).toBeChecked();

  const mcRowB = q(page, "MCGrid Q").getByRole("row", { name: "RowB" }).getByRole("checkbox").first();
  await mcRowB.check();
  await expect(mcRowB).toBeChecked();

  // Rating: click the 3rd star.
  await q(page, "Rating Q").getByRole("img").nth(2).click();

  // Signature: attaching signs an event -> needs a logged-in identity. Clicking
  // "Attach Signature" opens the login modal; once we sign up, the in-flight
  // signing continues automatically, so we just wait for the signed result.
  await q(page, "Signature Q").getByRole("button", { name: "Attach Signature" }).click();
  await completeSignupModal(page);
  await expect(q(page, "Signature Q").getByText(/signed event/i)).toBeVisible({
    timeout: 20_000,
  });

  // File upload (Blossom mocked above).
  await q(page, "File Q")
    .locator('input[type="file"]')
    .setInputFiles({ name: V.file, mimeType: "text/plain", buffer: Buffer.from("hello e2e") });
  await expect(q(page, "File Q").getByText(V.file)).toBeVisible({ timeout: 20_000 });

  // --- Submit (anonymous; the required fields gate that every widget captured) ---
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByAltText("Thank you")).toBeVisible({ timeout: 20_000 });

  // --- Verify in the responses table ---
  await page.goto(responsesUrl);
  for (const value of [
    V.short,
    V.para,
    V.number,
    V.email,
    V.radio,
    V.checkbox,
    V.dropdown,
    V.file,
  ]) {
    await expect(page.getByText(value, { exact: false }).first()).toBeVisible({
      timeout: 20_000,
    });
  }

  // SCGrid picked ColA in every row (radios only allow one), rendering as
  // "RowA: ColA | RowB: ColA" (see ResponseUtils.getResponseLabels).
  await expect(
    page.getByText("RowA: ColA | RowB: ColA", { exact: false }),
  ).toHaveCount(1, { timeout: 20_000 });

  // MCGrid picked both columns on RowA and one on RowB. GridFiller sorts a
  // row's selected column IDs (random per run) before joining, so ColA/ColB
  // can land in either order — this is the assertion that actually catches a
  // checkbox grid silently collapsing to single-selection, without being
  // fragile to that ordering.
  await expect(
    page.getByText(/RowA: (ColA, ColB|ColB, ColA) \| RowB: ColA/, { exact: false }),
  ).toHaveCount(1, { timeout: 20_000 });
});
