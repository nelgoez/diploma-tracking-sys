import { test as base } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@dts.unc.edu.ar';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123456!';
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'estudiante@dts.unc.edu.ar';
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'Demo2024!';

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
