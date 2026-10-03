import base from "./playwright.phase6.config";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  ...base,
  testMatch: "phase6-stress.spec.ts",
  outputDir:
    process.env.PHASE6_STRESS_OUTPUT ??
    process.env.PHASE6_TEST_OUTPUT ??
    "/tmp/xerowa-phase6-stress",
});
