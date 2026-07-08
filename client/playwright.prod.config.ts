import type { ReporterDescription } from '@playwright/test';
import { defineConfig } from '@playwright/test';

const IS_CI = !!process.env.CI;
const VERCEl_BYPASS = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const VERCEl_SHARE = process.env.VERCEL_SHARE_TOKEN;

const reporters: ReporterDescription[] = [['list']];
if (process.env.ALLURE_DIR) {
  reporters.push(['allure-playwright', { outputFolder: process.env.ALLURE_DIR }]);
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'prod-smoke.spec.ts',
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: reporters,
  retries: IS_CI ? 1 : 0,
  use: {
    baseURL:
      process.env.PROD_BASE_URL
      || 'https://nelgoez-diploma-tracking-sys.vercel.app',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
    headless: IS_CI,
    video: IS_CI ? 'on' : 'off',
    trace: 'on-first-retry',
    ...(VERCEl_BYPASS && {
      extraHTTPHeaders: { 'x-vercel-protection-bypass': VERCEl_BYPASS },
    }),
    ...(VERCEl_SHARE && !VERCEl_BYPASS && {
      extraHTTPHeaders: {},
    }),
  },
  projects: [
    {
      name: 'chromium',
      use: {},
    },
  ],
});
