import { defineConfig } from "@playwright/test";
const baseURL = process.env.FOUNDATION_TEST_URL || "http://127.0.0.1:3110";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname))
  throw new Error("Foundation browser tests are local-only.");
export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "foundation.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  outputDir:
    process.env.FOUNDATION_TEST_OUTPUT || "/tmp/xerowa-foundation-test-results",
  use: { baseURL, headless: true, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
