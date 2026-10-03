import { defineConfig } from "@playwright/test";
const baseURL = process.env.PHASE6_TEST_URL ?? "http://127.0.0.1:3160";
if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname))
  throw Error("Phase 6 verification is local-only");
export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "phase6.spec.ts",
  workers: 1,
  timeout: 120000,
  retries: 0,
  reporter: [["list"]],
  outputDir: process.env.PHASE6_TEST_OUTPUT ?? "/tmp/xerowa-phase6-results",
  use: { baseURL, headless: true, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
