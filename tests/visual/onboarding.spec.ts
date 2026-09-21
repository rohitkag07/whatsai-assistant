import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { completeSyntheticDraft, syntheticScope } from "../fixtures/onboarding";
import { scopeKey } from "../../src/lib/onboarding/draft-adapter";
import { steps } from "../../src/lib/onboarding/model";
const sizes = [
  { width: 1440, height: 1000 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
];
async function visit(page: Page) {
  await page.goto("/admin/onboarding", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Business onboarding", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
async function seed(page: Page) {
  const draft = completeSyntheticDraft();
  draft.revision = 1;
  draft.savedAt = "2026-09-18T12:00:00.000Z";
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    {
      key: scopeKey(syntheticScope),
      value: JSON.stringify({ version: 1, drafts: [draft] }),
    },
  );
}
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) =>
    ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
});
for (const size of sizes)
  test(`onboarding selection, form and review at ${size.width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(size);
    await seed(page);
    await visit(page);
    await noOverflow(page);
    await expect(
      page.getByRole("button", { name: /Gym & fitness/ }),
    ).toBeVisible();
    expect(
      (
        await new AxeBuilder({ page })
          .include("[data-onboarding]")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: info.outputPath("template-selection.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: /Synthetic setup example/ }).click();
    await noOverflow(page);
    expect(
      (
        await new AxeBuilder({ page })
          .include("[data-onboarding]")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: info.outputPath("business-identity.png"),
      fullPage: true,
    });
    await page
      .getByRole("navigation", { name: "Onboarding steps" })
      .getByRole("button")
      .nth(9)
      .click();
    await expect(
      page.getByRole("button", { name: "Activate business" }),
    ).toBeDisabled();
    await noOverflow(page);
    expect(
      (
        await new AxeBuilder({ page })
          .include("[data-onboarding]")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: info.outputPath("review-readiness.png"),
      fullPage: true,
    });
  });
test("ten-step journey saves locally and never activates or mutates the network", async ({
  page,
}, info) => {
  await visit(page);
  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD"].includes(request.method()))
      mutations.push(request.url());
  });
  await page.getByRole("button", { name: /General services/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("[data-onboarding]").getByRole("alert")).toContainText("Complete these details");
  await page
    .getByLabel("Business name", { exact: false })
    .fill("Synthetic walkthrough business");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved locally · revision 1",
  );
  for (let index = 0; index < steps.length; index++) {
    await page
      .getByRole("navigation", { name: "Onboarding steps" })
      .getByRole("button")
      .nth(index)
      .click();
    await expect(
      page.getByRole("heading", { name: steps[index].title, exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`journey-${index + 1}-${steps[index].id}.png`),
      fullPage: true,
    });
  }
  await page.getByLabel("Preview scenario").selectOption("request");
  await expect(
    page.getByRole("region", { name: "Synthetic conversation preview" }),
  ).toContainText("Requested · not confirmed");
  await page.getByLabel("Preview scenario").selectOption("optout");
  await expect(
    page.getByRole("region", { name: "Synthetic conversation preview" }),
  ).toContainText("no live suppression record was written");
  expect(mutations).toEqual([]);
  await page.reload({ waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: /Synthetic walkthrough business/ }),
  ).toBeVisible();
});
test("all six templates are configurable and clinic intake stays non-clinical", async ({
  page,
}, info) => {
  await visit(page);
  for (const name of [
    "Gym & fitness",
    "Clinic appointments",
    "Real estate sales",
    "Product seller",
    "Coaching & admissions",
    "General services",
  ]) {
    await page
      .getByRole("button", { name: new RegExp(name.replace("&", "&")) })
      .click();
    await page
      .getByRole("navigation", { name: "Onboarding steps" })
      .getByRole("button")
      .nth(3)
      .click();
    if (name === "Clinic appointments") {
      await expect(
        page
          .getByRole("group", { name: "Questions to ask" })
          .getByRole("checkbox"),
      ).toHaveCount(3);
      await expect(
        page.getByText("Appointment operations only.", { exact: false }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: info.outputPath(`template-${name.split(" ")[0]}.png`),
      fullPage: true,
    });
    await page.getByRole("button", { name: "All drafts", exact: true }).click();
    await page
      .getByRole("button", { name: "Discard edits and continue" })
      .click();
  }
});
test("keyboard focus, unsaved protection, mixed script and 200% zoom", async ({
  page,
}) => {
  await visit(page);
  await page.getByRole("button", { name: /General services/ }).click();
  await page
    .getByLabel("Business name", { exact: false })
    .fill(
      "Synthetic · संकल्प प्रशिक्षण संस्थान — an intentionally long business name",
    );
  await page.getByRole("button", { name: "All drafts", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Keep your unsaved changes?" }),
  ).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "All drafts", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Continue", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-onboarding]").getByRole("alert")).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await noOverflow(page);
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true }),
  ).toBeVisible();
});
test("storage permission, disconnected and saving failures remain truthful", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await visit(page);
  await expect(page.locator("[data-onboarding]").getByRole("alert")).toContainText(
    "denied local draft storage",
  );
  await expect(
    page.getByText("Draft count unknown", { exact: false }),
  ).toBeVisible();
  await context.clearCookies();
});
test("quota failure preserves unsaved edits and never reports Saved", async ({
  page,
}) => {
  await visit(page);
  await page.getByRole("button", { name: /General services/ }).click();
  await page
    .getByLabel("Business name", { exact: false })
    .fill("Synthetic unsaved example");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("[data-onboarding]").getByRole("alert")).toContainText("could not be saved");
  await expect(page.getByLabel("Business name", { exact: false })).toHaveValue(
    "Synthetic unsaved example",
  );
  await expect(
    page.getByText("Unsaved changes", { exact: true }),
  ).toBeVisible();
});

test("unavailable Web Locks shows disconnected without creating a draft", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "locks", { value: undefined }));
  await visit(page);
  await expect(page.locator("[data-onboarding]").getByRole("alert")).toContainText("Local draft storage is unavailable");
  await expect(page.getByRole("button", { name: /General services/ })).toBeDisabled();
});

test("save pending, review invalidation and local test readiness stay distinct from activation", async ({ page }, info) => {
  await seed(page);
  await visit(page);
  await page.getByRole("button", { name: /Synthetic setup example/ }).click();
  await expect(page.locator(".ob-draft-heading .ob-state")).toHaveText("Ready for testing");
  await page.getByLabel("Business name", { exact: false }).fill("Synthetic reviewed revision");
  await expect(page.locator(".ob-draft-heading .ob-state")).toHaveText("Draft");
  await page.getByRole("navigation", { name: "Onboarding steps" }).getByRole("button").nth(9).click();
  const review = page.getByRole("checkbox", { name: /I reviewed this proposal/ });
  await expect(review).not.toBeChecked();
  await review.check();
  // A held real browser lock makes the pending state observable without replacing the adapter.
  await page.evaluate(async (key) => {
    await new Promise<void>((acquired) => {
      void navigator.locks.request(key, () => new Promise<void>((release) => {
        Object.assign(window, { releaseOnboardingTestLock: release });
        acquired();
      }));
    });
  }, scopeKey(syntheticScope));
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("[data-onboarding]").getByRole("status")).toContainText("Saving in this browser");
  await page.screenshot({ path: info.outputPath("saving.png"), fullPage: true });
  await page.evaluate(() => (window as typeof window & { releaseOnboardingTestLock: () => void }).releaseOnboardingTestLock());
  await expect(page.locator("[data-onboarding]").getByRole("status")).toContainText("Saved locally · revision 2");
  await expect(page.locator(".ob-draft-heading .ob-state")).toHaveText("Ready for testing");
  await expect(page.getByRole("button", { name: "Activate business" })).toBeDisabled();
  await page.screenshot({ path: info.outputPath("saved-ready-not-activated.png"), fullPage: true });
});

test("two tabs reject a stale save and retain the newer stored revision", async ({ page, context }) => {
  await seed(page);
  await visit(page);
  await page.getByRole("button", { name: /Synthetic setup example/ }).click();
  const other = await context.newPage();
  await visit(other);
  await other.getByRole("button", { name: /Synthetic setup example/ }).click();
  await page.getByLabel("Business name", { exact: false }).fill("Synthetic newer revision");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.locator("[data-onboarding]").getByRole("status")).toContainText("revision 2");
  await other.getByLabel("Business name", { exact: false }).fill("Synthetic stale edits");
  await other.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(other.locator("[data-onboarding]").getByRole("alert")).toContainText("A newer revision exists");
  await expect(other.getByLabel("Business name", { exact: false })).toHaveValue("Synthetic stale edits");
  const saved = await other.evaluate((key) => JSON.parse(localStorage.getItem(key)!).drafts[0], scopeKey(syntheticScope));
  expect(saved.config.identity.name).toBe("Synthetic newer revision");
  expect(saved.revision).toBe(2);
  await other.close();
});
