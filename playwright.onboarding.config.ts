import { defineConfig } from "@playwright/test";
const baseURL = process.env.ONBOARDING_TEST_URL || "http://127.0.0.1:3120";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname))
  throw new Error("Onboarding tests are local-only.");
export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "onboarding.spec.ts",
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  outputDir:
    process.env.ONBOARDING_TEST_OUTPUT || "/tmp/xerowa-onboarding-results",
  use: { baseURL, headless: true, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
