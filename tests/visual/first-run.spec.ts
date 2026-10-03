import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { completeSyntheticDraft, syntheticScope } from "../fixtures/onboarding";
import { scopeKey } from "../../src/lib/onboarding/draft-adapter";
const sizes = [
  { width: 1440, height: 1000 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
];
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function axe(page: Page) {
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}
async function visit(page: Page) {
  await page.goto("/setup");
  await expect(
    page.getByRole("heading", { name: "Your readiness checklist" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) =>
    ["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
});
test("credential-free sign-in and sign-out errors stay truthful", async ({
  page,
}, info) => {
  await page.goto("/login?next=https://example.invalid");
  await page
    .getByLabel("Email", { exact: true })
    .fill("synthetic.owner@example.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Synthetic-UI-test-no-account");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".fr-auth-error")).toContainText(
    "Sign-in is unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("Synthetic-sign-in-unavailable.png"),
    fullPage: true,
  });
  await page.goto("/guard");
  await page
    .getByRole("button", { name: "Sign out and use another account" })
    .click();
  await expect(page.locator(".fr-auth-error")).toContainText(
    "session may still be active",
  );
  await page.screenshot({
    path: info.outputPath("Synthetic-sign-out-unconfirmed.png"),
    fullPage: true,
  });
});
for (const size of sizes)
  test(`Synthetic first result and auth at ${size.width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(size);
    const mutations: string[] = [];
    page.on("request", (r) => {
      if (!["GET", "HEAD"].includes(r.method()))
        mutations.push(r.method() + " " + new URL(r.url()).pathname);
    });
    await page.goto("/login");
    await expect(
      page.getByRole("heading", {
        name: "Bring every enquiry to a clear next step.",
      }),
    ).toBeVisible();
    await noOverflow(page);
    await axe(page);
    await page.screenshot({
      path: info.outputPath("login.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Need help with access?" }).click();
    await expect(
      page.getByRole("heading", { name: "Recover access safely" }),
    ).toBeVisible();
    await page.goto("/guard");
    await noOverflow(page);
    await axe(page);
    await page.screenshot({
      path: info.outputPath("pending-access.png"),
      fullPage: true,
    });
    await visit(page);
    await noOverflow(page);
    await axe(page);
    await page.screenshot({
      path: info.outputPath("Synthetic-readiness.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Try a Synthetic enquiry", exact: true })
      .click();
    await page
      .getByLabel("Synthetic enquiry", { exact: true })
      .fill("मुझे आपकी service के बारे में जानना है।");
    await noOverflow(page);
    await axe(page);
    await page.screenshot({
      path: info.outputPath("Synthetic-enquiry.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Run Synthetic test" }).click();
    await expect(
      page.getByRole("heading", {
        name: "Your configured workflow, explained",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Not activated · security / pilot NO-GO", { exact: true }),
    ).toBeVisible();
    await noOverflow(page);
    await axe(page);
    await page.screenshot({
      path: info.outputPath("Synthetic-result.png"),
      fullPage: true,
    });
    expect(mutations).toEqual([]);
  });
test("resume, review invalidation, local-only saving and return to Control", async ({
  page,
}, info) => {
  const draft = completeSyntheticDraft();
  draft.revision = 1;
  draft.savedAt = "2026-10-02T12:00:00Z";
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    {
      key: scopeKey(syntheticScope),
      value: JSON.stringify({ version: 1, drafts: [draft] }),
    },
  );
  const mutations: string[] = [];
  page.on("request", (r) => {
    if (!["GET", "HEAD"].includes(r.method())) mutations.push(r.method());
  });
  await visit(page);
  await page.getByRole("button", { name: "Resume local proposal" }).click();
  await expect(
    page.locator('input[value="Synthetic setup example"]'),
  ).toBeVisible();
  await page
    .locator('input[value="Synthetic setup example"]')
    .fill("Synthetic · संशोधित service");
  await page
    .getByRole("button", { name: "Back to readiness", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("Synthetic-unsaved-dialog.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Keep editing" }).click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText(/Saved locally · revision 2/)).toBeVisible();
  await page
    .getByRole("button", { name: "Back to readiness", exact: true })
    .click();
  await page.getByRole("button", { name: "Resume local proposal" }).click();
  await expect(
    page.locator('input[value="Synthetic · संशोधित service"]'),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Onboarding steps" })
    .getByRole("button")
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Continue to Synthetic test" }),
  ).toBeDisabled();
  await page.screenshot({
    path: info.outputPath("Synthetic-review-reset.png"),
    fullPage: true,
  });
  await page.getByLabel(/I reviewed this proposal/).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText(/Saved locally · revision 3/)).toBeVisible();
  await page
    .getByRole("button", { name: "Continue to Synthetic test" })
    .click();
  await page.getByRole("button", { name: "Run Synthetic test" }).click();
  await expect(
    page.getByText("Unknown for this proposal", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /03.*First result/ }).click();
  await expect(
    page.getByRole("heading", { name: "No Synthetic test result yet" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue to Control" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
  expect(mutations).toEqual([]);
});
test("teaching states, storage denial, validation and keyboard/reflow", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit(page);
  await page.getByText("Synthetic state examples", { exact: true }).click();
  const states = [
    "empty",
    "loading",
    "partial",
    "stale",
    "denied",
    "disconnected",
    "error",
    "unavailable",
  ];
  for (const state of states) {
    await page.getByLabel("Readiness teaching state").selectOption(state);
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath("Synthetic-" + state + ".png"),
      fullPage: true,
    });
    if (state === "denied")
      await expect(
        page.getByRole("button", {
          name: "Try a Synthetic enquiry",
          exact: true,
        }),
      ).toBeDisabled();
  }
  await page.getByLabel("Readiness teaching state").selectOption("ready");
  await page
    .getByRole("button", { name: "Try a Synthetic enquiry", exact: true })
    .click();
  await page
    .getByLabel("Synthetic enquiry", { exact: true })
    .fill("call +91 9876543210");
  await page.getByRole("button", { name: "Run Synthetic test" }).click();
  await expect(page.locator(".fr-journey").getByRole("alert")).toContainText(
    "without contact details",
  );
  await page.setViewportSize({ width: 720, height: 500 });
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("Synthetic-200-percent-reflow.png"),
    fullPage: true,
  });
  await page.evaluate(() => (document.documentElement.style.zoom = "1"));
  // Start from a known control: Tab after the last page control may enter
  // browser chrome, which is normal and differs from the dev overlay order.
  await page.getByLabel("Synthetic enquiry", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Run Synthetic test", exact: true }),
  ).toBeFocused();
  await page.context().clearCookies();
  await page.addInitScript(
    ({ key }) => localStorage.setItem(key, "not-valid-json"),
    { key: scopeKey(syntheticScope) },
  );
  await page.reload();
  await expect(page.locator(".fr-journey").getByRole("alert")).toContainText(
    "Nothing was overwritten",
  );
  await page.screenshot({
    path: info.outputPath("Synthetic-invalid-storage.png"),
    fullPage: true,
  });
});
