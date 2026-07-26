import { test, expect, Page, Download } from "@playwright/test";
import { existsSync } from "fs";
import { resolve } from "path";

/**
 * Regression guard for the "Download" action on a form card.
 *
 * The download produces a SELF-CONTAINED single HTML file (the standalone
 * form-filler at `public/api/form-filler-ui`, with the form's content embedded).
 * It must render on its own from `file://`, with no network and no sibling
 * files. A past regression code-split the i18n locale into a separate
 * `src_i18n_resources_en_ts.chunk.js`; the inlined single-file build doesn't
 * carry lazy chunks, so opening the download threw `ChunkLoadError: Loading
 * chunk ... failed` at init and nothing rendered. This test opens a real
 * downloaded file and asserts it renders without any chunk-load failure.
 *
 * NOTE: the standalone artifact is a BUILD output (gitignored) served from
 * `public/api/form-filler-ui`. `yarn start` does not generate it, so a proper
 * run builds the app first (`yarn workspace @formstr/web-app build`). If the
 * artifact is missing we skip with a clear message rather than fail spuriously.
 */

const FORM_FILLER_ARTIFACT = resolve(
  __dirname,
  "../../public/api/form-filler-ui/index.html",
);

async function addShortAnswerQuestion(page: Page) {
  const shortAnswer = page.getByRole("menuitem", { name: /Short answer/ });
  if (!(await shortAnswer.isVisible())) {
    await page.getByRole("button", { name: "+" }).first().click();
  }
  await shortAnswer.click();
}

/**
 * A local form renders as a card with the "Download" quick action only once its
 * published event has been read back from the relay (before that it's the
 * lighter local-only card, which has no Download). Reopen the menu across
 * reloads until Download appears, then trigger and capture the download.
 */
async function downloadFirstLocalForm(page: Page): Promise<Download> {
  for (let attempt = 0; attempt < 10; attempt++) {
    await page.getByRole("button", { name: "Quick actions" }).first().click();
    const download = page.getByRole("menuitem", { name: "Download" });
    if (await download.isVisible().catch(() => false)) {
      const [captured] = await Promise.all([
        page.waitForEvent("download"),
        download.click(),
      ]);
      return captured;
    }
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
  }
  throw new Error('"Download" action never became available on the form card');
}

test("a downloaded form opens standalone and renders without a chunk error", async ({
  page,
  context,
}, testInfo) => {
  test.skip(
    !existsSync(FORM_FILLER_ARTIFACT),
    "form-filler build artifact missing — build the app before running this test",
  );

  // 1. Create + publish a one-question form (anonymous, no login needed).
  await page.goto("/c");
  await addShortAnswerQuestion(page);
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByRole("link", { name: /\/f\// })).toBeVisible({
    timeout: 20_000,
  });

  // 2. Download it from the "On this device" tab.
  await page.goto("/dashboard/local");
  const download = await downloadFirstLocalForm(page);

  // 3. Save with an .html extension and open it exactly as a user would — from
  //    the local filesystem, no server, no sibling chunk files.
  const savedPath = testInfo.outputPath("downloaded-form.html");
  await download.saveAs(savedPath);

  const consoleErrors: string[] = [];
  const standalone = await context.newPage();
  standalone.on("pageerror", (err) => consoleErrors.push(String(err)));
  standalone.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await standalone.goto("file://" + savedPath);

  // 4. It must actually render past i18n init — the embedded form's Submit
  //    button only appears once the React tree mounts.
  await expect(
    standalone.getByRole("button", { name: "Submit", exact: true }),
  ).toBeVisible({ timeout: 20_000 });

  // 5. The specific regression: a failed lazy-chunk load at startup.
  const chunkError = consoleErrors.find((e) =>
    /ChunkLoadError|Loading chunk .* failed/i.test(e),
  );
  expect(
    chunkError,
    `standalone form logged a chunk-load error:\n${consoleErrors.join("\n")}`,
  ).toBeUndefined();
});
