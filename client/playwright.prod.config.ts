import { defineConfig } from '@playwright/test';

const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'prod-smoke.spec.ts',
  timeout: 60000,
  expect: { timeout: 15000 },
  retries: IS_CI ? 1 : 0,
  use: {
    baseURL:
      process.env.PROD_BASE_URL ||
      'https://nelgoez-diploma-tracking-sys.vercel.app',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
    headless: IS_CI,
    video: IS_CI ? 'on' : 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {},
    },
  ],
});
