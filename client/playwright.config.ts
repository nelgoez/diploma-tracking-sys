import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
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
      },
    },
    {
      command: 'bun run dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
