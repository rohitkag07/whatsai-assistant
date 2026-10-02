import { defineConfig } from '@playwright/test';
const baseURL = process.env.COMMAND_TEST_URL || 'http://127.0.0.1:3140';
if (!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('Command tests are local only.');
export default defineConfig({ testDir: './tests/visual', testMatch: 'command.spec.ts', workers: 1, timeout: 120_000, retries: 0, reporter: [['list']], outputDir: process.env.COMMAND_TEST_OUTPUT || '/tmp/xerowa-command-results', use: { baseURL, headless: true, trace: 'retain-on-failure' }, projects: [{ name: 'chromium', use: { browserName: 'chromium' } }, { name: 'webkit', use: { browserName: 'webkit' } }] });
