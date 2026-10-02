import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const viewports = [{ width:1440,height:1000 },{ width:1280,height:800 },{ width:768,height:1024 },{ width:390,height:844 }];
const sections = ['Overview','Runs','Agents','Approvals','Businesses','System'];
test.beforeEach(async ({ context }) => {
  await context.route('**/*', r => ['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort());
});
for (const viewport of viewports) test(`six Synthetic sections ${viewport.width}`, async ({ page }, info) => {
  const mutations: string[] = [];
  page.on('request', r => { if (!['GET','HEAD'].includes(r.method())) mutations.push(r.url()); });
  await page.setViewportSize(viewport); await page.goto('/admin', { waitUntil:'networkidle' }); await page.evaluate(() => document.fonts.ready);
  for (const section of sections) {
    await page.getByRole('navigation', { name:'Command sections' }).getByRole('button', { name:section, exact:true }).click();
    await expect(page.locator('.xc-source')).toContainText('Synthetic');
    await expect(page.locator('.xc-mode')).toContainText('Read-only');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).include('[data-shell="foundation"]').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(axe.violations).toEqual([]);
    await page.screenshot({ path:info.outputPath(`synthetic-${section.toLowerCase()}-${viewport.width}.png`), fullPage:true });
  }
  expect(mutations).toEqual([]);
});
test('alert to business, run, policy, approval and recovery; stale decisions never execute', async ({ page }) => {
  await page.goto('/admin', { waitUntil:'networkidle' });
  await page.getByRole('button', { name:'Inspect trace' }).first().click();
  await expect(page.getByRole('heading', { name:'Trace inspector' })).toBeVisible();
  await page.getByRole('button', { name:'xerowa-test-gym ↗', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Business inspector' })).toBeVisible();
  await page.getByRole('button', { name:'Inspect synthetic-run-gym' }).click();
  await page.getByRole('button', { name:'Inspect linked approval ↗' }).click();
  await expect(page.getByText('Not executable from this workspace')).toBeVisible();
  for (const status of ['changed','expired','revoked','executed','denied']) {
    await page.getByRole('button').filter({ hasText:`Configuration review · ${status}` }).click();
    await expect(page.locator('.xc-approval-status')).toContainText(status);
    await expect(page.getByRole('button', { name:/^(Approve|Execute|Reject)$/ })).toHaveCount(0);
  }
  await page.getByRole('button', { name:'Inspect linked run' }).click();
  await expect(page.getByRole('heading', { name:'Recovery context' })).toBeVisible();
  await expect(page.locator('.xc-details')).not.toHaveAttribute('open','');
  await page.locator('.xc-details summary').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.xc-details')).toHaveAttribute('open','');
});
test('complete states, search, 200 percent reflow and reduced motion', async ({ page }, info) => {
  await page.goto('/admin', { waitUntil:'networkidle' });
  for (const state of ['loading','empty','partial','stale','denied','disconnected','error','unknown']) {
    await page.getByLabel('Synthetic evidence state').selectOption(state);
    await expect(page.locator(`[data-state="${state}"]`)).toBeVisible();
    if (['denied','error','empty'].includes(state)) await expect(page.getByRole('button', { name:'Inspect trace' })).toHaveCount(0);
    await page.screenshot({ path:info.outputPath(`synthetic-state-${state}.png`), fullPage:true });
  }
  await page.getByLabel('Synthetic evidence state').selectOption('ready');
  await page.getByRole('navigation', { name:'Command sections' }).getByRole('button', { name:'Runs',exact:true }).click();
  await page.getByRole('textbox', { name:'Search runs' }).fill('does-not-exist');
  await expect(page.getByText('No matching runs in the available snapshot.')).toBeVisible();
  await page.setViewportSize({ width:1280,height:800 });
  await page.evaluate(() => { document.documentElement.style.zoom='2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path:info.outputPath('synthetic-reflow-200-percent.png'), fullPage:true });
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.getByRole('textbox', { name:'Search runs' }).fill('');
  expect(await page.locator('.xc-row').first().evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
});
test('keyboard shell overlays, mobile navigation and existing routes', async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 }); await page.goto('/admin', { waitUntil:'networkidle' });
  await page.getByRole('button', { name:'Open navigation',exact:true }).click();
  for (let i=0;i<12;i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name:'Open navigation',exact:true })).toBeFocused();
  await page.keyboard.press('Control+k'); await expect(page.getByRole('textbox',{ name:'Search destinations' })).toBeFocused();
  await page.keyboard.press('Escape');
  for (const route of ['/admin/command-os','/admin/clients','/admin/system','/admin/webhooks']) {
    await page.goto(route,{ waitUntil:'networkidle' }); await expect(page.locator('.xc-workspace')).toBeVisible();
  }
  await expect(page.getByRole('heading', { name:'Ingress evidence' })).toBeVisible();
});
