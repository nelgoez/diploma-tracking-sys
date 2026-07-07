import type { ReporterDescription } from '@playwright/test';
import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

const reporters: ReporterDescription[] = [['html']];

if (process.env.ALLURE_DIR) {
  reporters.push(['allure-playwright', { outputFolder: process.env.ALLURE_DIR }]);
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: CI ? 2 : 1,
  reporter: reporters,
  globalSetup: './tests/e2e/global-setup',
  grep: process.env.TEST_GREP ? new RegExp(process.env.TEST_GREP) : undefined,
  use: {
    testIdAttribute: "data-testid",
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: CI ? 'on' : 'off',
    launchOptions: CI ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] } : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../server && bun run src/index.ts',
      port: 3000,
      reuseExistingServer: true,
      env: {
        MOCK_MODE: 'true',
        NODE_ENV: 'test',
        SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
      },
    },
    {
      command: 'bun run dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
