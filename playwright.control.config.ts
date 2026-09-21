import { defineConfig } from "@playwright/test";
const baseURL = process.env.CONTROL_TEST_URL || "http://127.0.0.1:3130";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname))
  throw new Error("Control browser verification is local-only.");
export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "control.spec.ts",
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [["list"]],
  outputDir: process.env.CONTROL_TEST_OUTPUT || "/tmp/xerowa-control-results",
  use: { baseURL, headless: true, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
