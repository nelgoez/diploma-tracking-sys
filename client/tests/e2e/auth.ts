import { test as base } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) { throw new Error(`Missing required env var: ${name}`); }
  return val;
}

const ADMIN_EMAIL = requireEnv('TEST_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('TEST_ADMIN_PASSWORD');
const STUDENT_EMAIL = requireEnv('TEST_STUDENT_EMAIL');
const STUDENT_PASSWORD = requireEnv('TEST_STUDENT_PASSWORD');

export const test = base.extend<{
  loginPage: LoginPage
  adminPage: DashboardPage
  studentPage: DashboardPage
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  adminPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    await use(new DashboardPage(page));
  },

  studentPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.loginAs(STUDENT_EMAIL, STUDENT_PASSWORD);
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
