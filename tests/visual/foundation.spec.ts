import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
];
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) =>
    ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
});
for (const viewport of viewports)
  test(`lab responsive and accessibility ${viewport.width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto("/admin/design-lab", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByRole("heading", { name: "Clarity at every step." }),
    ).toBeVisible();
    await expect(page.locator(".x-synthetic-banner")).toContainText(
      "Synthetic",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .include('[data-shell="foundation"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    // Axe does not cover every non-text boundary: verify the semantic control
    // border against its surface separately (WCAG 1.4.11).
    const boundaryContrast = await page
      .locator(".x-preview")
      .evaluate((element) => {
        const style = getComputedStyle(element);
        const luminance = (hex: string) => {
          const value = hex.trim().slice(1);
          const expanded =
            value.length === 3
              ? value
                  .split("")
                  .map((channel) => `${channel}${channel}`)
                  .join("")
              : value;
          const channels = expanded
            .match(/../g)!
            .map((value) => {
              const c = parseInt(value, 16) / 255;
              return c <= 0.04045
                ? c / 12.92
                : Math.pow((c + 0.055) / 1.055, 2.4);
            });
          return (
            channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
          );
        };
        const border = luminance(style.getPropertyValue("--x-border"));
        const surface = luminance(style.getPropertyValue("--x-surface"));
        return (
          (Math.max(border, surface) + 0.05) /
          (Math.min(border, surface) + 0.05)
        );
      });
    expect(boundaryContrast).toBeGreaterThanOrEqual(3);

    await page.screenshot({
      path: testInfo.outputPath(`lab-control-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Command · Dark" }).click();
    const dark = await new AxeBuilder({ page })
      .include(".x-preview")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(dark.violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`lab-command-${viewport.width}.png`),
      fullPage: true,
    });
  });
test("keyboard palette, drawer and local-only fixture interactions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/design-lab", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Workspace navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open navigation", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Search navigation", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Search destinations" }),
  ).toBeFocused();
  await page
    .getByRole("textbox", { name: "Search destinations" })
    .fill("Webhooks");
  await expect(
    page.getByRole("link", { name: "Webhooks", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Search navigation", exact: true }),
  ).toBeFocused();
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      mutations.push(request.url());
  });
  await page.getByRole("button", { name: "Preview acknowledgement" }).click();
  await expect(page.getByRole("status")).toContainText(
    "No action was executed",
  );
  await page.getByLabel("Preview state").selectOption("error");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("status")).toContainText(
    "No data source was contacted",
  );
  expect(mutations).toEqual([]);
});
test("complete states and reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/admin/design-lab", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  for (const state of [
    "loading",
    "empty",
    "error",
    "disconnected",
    "permission",
    "unknown",
    "partial",
  ]) {
    await page.getByLabel("Preview state").selectOption(state);
    await expect(
      page.locator(`.x-preview [data-state="${state}"]`),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`state-${state}.png`),
      fullPage: true,
    });
  }
  expect(
    await page
      .locator(".x-button")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
});
test("200 percent zoom does not clip workspace actions", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/admin/design-lab", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await expect(
    page.getByRole("button", { name: "Preview acknowledgement" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("keyboard focus stays within overlays and collapsed links remain labelled", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/admin/design-lab", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Collapse navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Command", exact: true }).first(),
  ).toBeVisible();
  // Use the keyboard here; the development-only Next indicator overlaps the
  // compact footer in a dev server and is absent from the production build.
  await page.getByRole("button", { name: "Expand navigation" }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("textbox", { name: "Search destinations" }),
  ).toBeFocused();
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true);
  }
});

test("long Synthetic workspace labels and mixed script remain usable", async ({
  page,
}, testInfo) => {
  await page.goto("/admin/design-lab", { waitUntil: "networkidle" });
  await page.locator(".x-workspace-name").evaluate((element) => {
    element.textContent =
      "Synthetic · संकल्प प्रशिक्षण संस्थान — Admissions and customer operations regional workspace";
  });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Search navigation", exact: true }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: testInfo.outputPath("synthetic-long-label-320.png"),
    fullPage: true,
  });
});
