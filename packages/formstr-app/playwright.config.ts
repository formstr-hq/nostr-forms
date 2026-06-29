import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the formstr web app.
 *
 * The tests drive the real app against a local in-memory nostr relay (started
 * as a webServer below), so they are fast and deterministic — no live relays.
 * The app is pointed at it via REACT_APP_DEFAULT_RELAYS.
 */
const RELAY_PORT = 7448;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node tests/e2e/relay-server.cjs",
      port: RELAY_PORT,
      reuseExistingServer: !process.env.CI,
      env: { RELAY_PORT: String(RELAY_PORT) },
    },
    {
      command: "yarn start",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        BROWSER: "none",
        REACT_APP_DEFAULT_RELAYS: `ws://localhost:${RELAY_PORT}`,
      },
    },
  ],
});
