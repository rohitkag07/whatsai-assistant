import { defineConfig } from "@playwright/test";
const baseURL = process.env.FIRST_RUN_TEST_URL ?? "http://127.0.0.1:3150";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname))
  throw Error("First-run review is local-only");
export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "first-run.spec.ts",
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  outputDir:
    process.env.FIRST_RUN_TEST_OUTPUT ?? "/tmp/xerowa-first-run-results",
  use: { baseURL, headless: true, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
