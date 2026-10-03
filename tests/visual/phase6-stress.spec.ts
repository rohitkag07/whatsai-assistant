import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const profile = "http://127.0.0.1:3163";
const attemptedWrites = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context }) => {
  const writes: string[] = [];
  attemptedWrites.set(context, writes);
  context.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      writes.push(request.method() + " " + new URL(request.url()).pathname);
  });
  await context.route("**/*", (r) =>
    ["127.0.0.1", "localhost"].includes(new URL(r.request().url()).hostname) &&
    ["GET", "HEAD"].includes(r.request().method())
      ? r.continue()
      : r.abort(),
  );
});
test.afterEach(async ({ context }) => {
  expect(attemptedWrites.get(context)).toEqual([]);
});
for (const role of ["owner", "operator", "viewer"])
  test(`Phase 6 stress: Synthetic ${role} presentation`, async ({
    page,
  }, info) => {
    await page.goto(`${profile}/phase6-profile/first-run-${role}`, {
      waitUntil: "networkidle",
    });
    await expect(
      page.getByRole("heading", { name: "Your readiness checklist" }),
    ).toBeVisible();
    await expect(
      page.getByText("Synthetic · Local production-build component profile.", {
        exact: false,
      }),
    ).toBeVisible();
    if (role !== "owner")
      await expect(
        page.getByText("Only an active business owner can edit", {
          exact: false,
        }),
      ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`Synthetic-${role}-presentation.png`),
      fullPage: true,
    });
  });
test("Phase 6 stress: large Synthetic collection and mixed script", async ({
  page,
}, info) => {
  await page.goto(`${profile}/phase6-profile/large`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("[data-control]")).toBeVisible();
  for (const width of [768, 320]) {
    await page.setViewportSize({ width, height: 1024 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByText("Synthetic-stress-119", { exact: false }).first(),
    ).toBeAttached();
    await page.screenshot({
      path: info.outputPath(`Synthetic-130-records-${width}.png`),
    });
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    document.body.style.zoom = "2";
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Phase 6 stress: retained form labels and keyboard tab recovery", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/assistant-setup", { waitUntil: "networkidle" });
  await page
    .getByLabel("Business name", { exact: true })
    .fill("Synthetic · संकल्प learning and professional development workspace");
  await expect(
    page.getByRole("progressbar", { name: "Setup completion" }),
  ).toHaveAttribute("aria-valuenow");
  await page.getByRole("button", { name: "Next", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() => document.activeElement !== document.body),
  ).toBe(true);
  await page.goto("/settings", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Ops", exact: false }).focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Billing", exact: false }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Billing status unverified", { exact: true }),
  ).toBeVisible();
});
