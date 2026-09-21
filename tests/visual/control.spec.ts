import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const surfaces = [
  ["Today", "/dashboard"],
  ["Inbox", "/chats"],
  ["Pipeline", "/leads"],
  ["Follow-ups", "/follow-ups"],
  ["Appointments", "/calendar"],
] as const;
const sizes = [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
];
async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.locator("[data-control]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function overflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
const attemptedWrites = new WeakMap<BrowserContext, string[]>();
const pageErrors = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context, page }) => {
  const writes: string[] = [];
  const errors: string[] = [];
  pageErrors.set(context, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  attemptedWrites.set(context, writes);
  context.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      writes.push(`${request.method()} ${request.url()}`);
  });
  await context.route("**/*", (route) =>
    ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
});
test.afterEach(async ({ context }) => {
  expect(attemptedWrites.get(context)).toEqual([]);
  expect(pageErrors.get(context)).toEqual([]);
});
for (const size of sizes)
  for (const [title, path] of surfaces)
    test(`${title} readable and accessible at ${size.width}`, async ({
      page,
    }, info) => {
      await page.setViewportSize(size);
      await open(page, path);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      await expect(page.locator(".co-provenance")).toContainText("Synthetic");
      await overflow(page);
      expect(
        (
          await new AxeBuilder({ page })
            .include("[data-control]")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await page.screenshot({
        path: info.outputPath(`${title}-${size.width}.png`),
        fullPage: true,
      });
    });
test("mobile queue to conversation to context and back, no network mutations", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/chats");
  const mutations: string[] = [];
  page.on("request", (r) => {
    if (!["GET", "HEAD"].includes(r.method())) mutations.push(r.url());
  });
  await page.locator("#queue-E-05").click();
  await expect(
    page.getByRole("region", { name: "Conversation queue" }),
  ).toBeHidden();
  await expect(
    page.getByRole("region", { name: "Conversation timeline" }),
  ).toBeVisible();
  await overflow(page);
  await page.screenshot({
    path: info.outputPath("mobile-conversation.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "View context" }).click();
  await expect(
    page.getByRole("heading", { name: "Business context" }),
  ).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Conversation timeline" }),
  ).toBeHidden();
  await overflow(page);
  await page.screenshot({
    path: info.outputPath("mobile-context.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back to conversation" }).click();
  await expect(
    page.getByRole("button", { name: "View context" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Preview human takeover" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Preview human takeover" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Preview human takeover" }).click();
  await page.getByRole("button", { name: "Simulate acknowledgement" }).click();
  await expect(page.locator(".co-notice")).toContainText("No live ownership");
  await page.getByRole("button", { name: "Back to queue" }).click();
  await expect(page.locator("#queue-E-05")).toBeFocused();
  expect(mutations).toEqual([]);
});
test("zero, unavailable, stale, partial and error remain distinct", async ({
  page,
}, info) => {
  await open(page, "/dashboard");
  const select = page.getByLabel("Review data state");
  for (const state of [
    "empty",
    "loading",
    "disconnected",
    "unavailable",
    "permission",
    "error",
    "stale",
    "partial",
  ]) {
    await select.selectOption(state);
    const count = page.locator(".co-metrics strong").first();
    await expect(count).toHaveText(
      state === "empty"
        ? "0"
        : state === "stale"
          ? "Last known 10"
          : state === "partial"
            ? "≥ 10"
            : "—",
    );
    if (!["stale", "partial"].includes(state))
      await expect(page.locator(".co-attention article")).toHaveCount(0);
    await page.screenshot({
      path: info.outputPath(`state-${state}.png`),
      fullPage: true,
    });
  }
});
test("pipeline filtering, board and source receipt inspection", async ({
  page,
}) => {
  await open(page, "/leads");
  await page.getByLabel("Stage", { exact: true }).selectOption("Won/completed");
  await expect(page.locator(".co-pipeline-row")).toHaveCount(1);
  await page.getByText("Inspect evidence", { exact: true }).click();
  await expect(page.locator(".co-evidence")).toContainText(
    "Synthetic reviewer",
  );
  await page.getByRole("button", { name: "Board", exact: true }).click();
  await expect(page.locator(".co-board article")).toHaveCount(1);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".co-board article")).toHaveCount(10);
});
test("every surface reflows at 200 percent zoom", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const [title, path] of surfaces) {
    await open(page, path);
    await page.evaluate(() => (document.documentElement.style.zoom = "2"));
    await overflow(page);
    await page.screenshot({
      path: info.outputPath(`zoom-${title}.png`),
      fullPage: true,
    });
  }
});
test("appointments and follow-ups keep unsupported proof unknown", async ({
  page,
}) => {
  await open(page, "/calendar");
  await page
    .getByLabel("Appointment status")
    .selectOption("Verification unavailable");
  await expect(page.locator(".co-operation-row")).toHaveCount(1);
  await expect(page.locator(".co-operation-row")).toContainText(
    "no authoritative receipt",
  );
  await open(page, "/follow-ups");
  await page.getByLabel("Follow-up status").selectOption("Outcome unknown");
  await expect(page.locator(".co-operation-row")).toHaveCount(1);
  await expect(page.locator(".co-operation-row")).toContainText(
    "Unknown — no attempt receipt",
  );
});
