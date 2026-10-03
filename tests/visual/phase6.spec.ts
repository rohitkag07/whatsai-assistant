import { writeFileSync } from "node:fs";
import { test, expect, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/guard",
  "/login",
  "/assistant-setup",
  "/assistant-setup/whatsapp-connection",
  "/bookings",
  "/calendar",
  "/campaigns",
  "/campaigns/templates",
  "/chats",
  "/conversations",
  "/dashboard",
  "/follow-ups",
  "/knowledge",
  "/leads",
  "/plan-support",
  "/reports",
  "/settings",
  "/setup",
  "/site-visits",
  "/whatsapp-status",
  "/admin/clients/Synthetic-no-record",
  "/admin/clients",
  "/admin/command-os",
  "/admin/conversations",
  "/admin/design-lab",
  "/admin/knowledge",
  "/admin/onboarding",
  "/admin",
  "/admin/playbooks",
  "/admin/system",
  "/admin/team",
  "/admin/webhooks",
  "/evidence/client-1",
  "/",
];
const sizes = [
  [1440, 1000],
  [1280, 800],
  [768, 1024],
  [390, 844],
  [320, 844],
];
const attemptedWrites = new WeakMap<BrowserContext, string[]>();
test.beforeEach(async ({ context }) => {
  const writes: string[] = [];
  attemptedWrites.set(context, writes);
  context.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      writes.push(request.method() + " " + new URL(request.url()).pathname);
  });
  await context.route("**/*", (route) => {
    const request = route.request();
    return ["localhost", "127.0.0.1"].includes(
      new URL(request.url()).hostname,
    ) && ["GET", "HEAD"].includes(request.method())
      ? route.continue()
      : route.abort();
  });
});
test.afterEach(async ({ context }) => {
  expect(attemptedWrites.get(context)).toEqual([]);
});
for (const route of routes)
  test(`Phase 6 route ${route}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(500);
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflow at ${width}`,
      ).toBe(true);
      await expect(page.locator("body")).not.toContainText("Application error");
      await page.screenshot({
        path: info.outputPath(`after-Synthetic-or-unavailable-${width}.png`),
        fullPage: true,
      });
      if (width === 1440 || width === 320) {
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        writeFileSync(
          info.outputPath(`axe-${width}.json`),
          JSON.stringify(result.violations, null, 2),
        );
        await info.attach(`axe-${width}`, {
          body: JSON.stringify(result.violations, null, 2),
          contentType: "application/json",
        });
        expect(
          result.violations.filter(
            (v) => v.impact === "critical" || v.impact === "serious",
          ),
        ).toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });
test("legacy evidence labels never imply measured or active service", async ({
  page,
}) => {
  await page.goto("/reports");
  await expect(page.getByRole("note")).toContainText("Synthetic");
  await expect(
    page.getByRole("button", { name: "PDF" }).first(),
  ).toBeDisabled();
  await page.goto("/plan-support");
  await expect(page.getByText("Status unknown", { exact: true })).toBeVisible();
  await page.goto("/whatsapp-status");
  await expect(
    page.getByRole("heading", { name: "Connection status unavailable" }),
  ).toBeVisible();
  await page.goto("/bookings");
  await expect(page.locator('[data-state="error"]')).toBeVisible();
  await expect(
    page.getByText("No owner handoffs waiting", { exact: true }),
  ).toHaveCount(0);
});

test("legacy catalogues preserve failed-read state without fabricated empty results", async ({
  page,
}) => {
  for (const route of ["/campaigns", "/campaigns/templates", "/knowledge"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator('[data-state="error"]').last()).toBeVisible();
    await expect(
      page.getByText("No templates synced yet", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Your first campaign starts with an approved template", {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      "Supabase service client unavailable",
    );
  }
});

test("retained Synthetic template catalogue and editor stay accessible without submission", async ({
  page,
  context,
}, info) => {
  let templates: Array<Record<string, unknown>> = [];
  await context.route("**/api/whatsai/templates", (route) =>
    route.fulfill({ json: { ok: true, templates } }),
  );
  await page.goto("/campaigns/templates", { waitUntil: "networkidle" });
  await expect(
    page.getByText("No templates synced yet", { exact: true }),
  ).toBeVisible();
  templates = ["APPROVED", "PENDING", "REJECTED"].map((status, index) => ({
    id: `Synthetic-template-${index}`,
    name: `Synthetic_template_${status.toLowerCase()}`,
    language: "hi",
    category: "UTILITY",
    status,
    components: [
      { type: "BODY", text: "Synthetic · कृपया विवरण की पुष्टि करें।" },
    ],
    rejection_reason:
      status === "REJECTED" ? "Synthetic rejection reason" : null,
  }));
  await page.reload({ waitUntil: "networkidle" });
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(
    page.getByText("Synthetic_template_pending", { exact: true }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Create template", exact: true })
    .click();
  await page
    .getByLabel("Template name", { exact: true })
    .fill("synthetic_local_draft");
  await page.getByRole("combobox", { name: "Language", exact: true }).click();
  await page.getByRole("option", { name: "Hindi", exact: true }).click();
  await page
    .getByLabel("Message body", { exact: true })
    .fill("Synthetic · कृपया enquiry details साझा करें।");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page
    .getByLabel("Button 1 label", { exact: true })
    .fill("Synthetic choice");
  await expect(
    page.getByRole("button", { name: "Remove button 1", exact: true }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("Synthetic-template-editor-320.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Create template", exact: true }),
  ).toBeFocused();
});

test("retained Synthetic campaign proposal and knowledge reads never send or publish", async ({
  page,
  context,
}, info) => {
  await context.route("**/api/whatsai/broadcasts", (route) =>
    route.fulfill({
      json: {
        ok: true,
        templates: [
          {
            id: "Synthetic-template",
            name: "Synthetic approved fixture",
            language: "hi",
            category: "UTILITY",
            status: "APPROVED",
            components: [
              { type: "BODY", text: "Synthetic · {{1}} कृपया जानकारी दें।" },
            ],
          },
        ],
        campaigns: [],
        totals: {
          sent: 0,
          delivered: 0,
          read: 0,
          replied: 0,
          failed: 0,
          delivery_rate: 0,
          read_rate: 0,
          reply_rate: 0,
        },
      },
    }),
  );
  await page.goto("/campaigns", { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page
    .getByRole("button", { name: "Create campaign", exact: true })
    .click();
  await page
    .getByLabel("Campaign name", { exact: true })
    .fill("Synthetic local proposal");
  await page
    .getByRole("button", { name: /Synthetic approved fixture/ })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Who should receive this?", exact: true })
    .click();
  await page.getByRole("option", { name: "Lead stage", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Value for variable 1", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Business name", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /^Schedule Choose/ }).click();
  await page.getByLabel("Send at", { exact: true }).fill("2030-01-01T10:00");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: info.outputPath("Synthetic-campaign-proposal-not-submitted.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Create campaign", exact: true }),
  ).toBeFocused();
  await context.route("**/api/whatsai/knowledge", (route) =>
    route.fulfill({
      json: {
        ok: true,
        business: {
          id: "Synthetic-business",
          name: "Synthetic knowledge business",
        },
        playbook: null,
        items: [],
      },
    }),
  );
  await page.goto("/knowledge", { waitUntil: "networkidle" });
  await expect(
    page.getByText("Synthetic knowledge business", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("Synthetic-empty-knowledge-read.png"),
    fullPage: true,
  });
});
