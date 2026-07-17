import { expect, test } from '@playwright/test';

const PROD_URL = process.env.PROD_BASE_URL || 'https://diplomatrackingsystem.qzz.io';
const ADMIN_EMAIL = process.env.PROD_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD || '';
const STUDENT_EMAIL = process.env.PROD_STUDENT_EMAIL || '';
const STUDENT_PASSWORD = process.env.PROD_STUDENT_PASSWORD || '';

test.describe('@prod Production Validation', () => {
  test('@prod page loads and login form is visible', async ({ page }) => {
    test.skip(!ADMIN_EMAIL, 'TEST_ADMIN_EMAIL not set');
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

    await expect(page).toHaveTitle(/Diploma/i);
    await expect(page.getByTestId('email-input')).toBeVisible();
  });

  test('@prod @critical admin can login and see dashboard', async ({ page }) => {
    test.skip(!ADMIN_EMAIL, 'TEST_ADMIN_EMAIL not set');
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.getByTestId('app-bar')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('user-role')).toBeVisible();
  });

  test('@prod admin nav shows correct items', async ({ page }) => {
    test.skip(!ADMIN_EMAIL, 'TEST_ADMIN_EMAIL not set');
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await expect(page.getByTestId('nav-admin')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('nav-sysadmin')).not.toBeVisible();
    await expect(page.getByTestId('nav-integrations')).toBeVisible();
  });

  test('@prod @critical student cannot access admin', async ({ page }) => {
    test.skip(!STUDENT_EMAIL, 'TEST_STUDENT_EMAIL not set');
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

    await page.getByTestId('email-input').fill(STUDENT_EMAIL);
    await page.getByTestId('password-input').fill(STUDENT_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await expect(page.getByTestId('nav-admin')).not.toBeVisible({ timeout: 5000 });
  });

  test('@prod page refresh does not cause 404 on any route', async ({ page }) => {
    test.skip(!ADMIN_EMAIL, 'TEST_ADMIN_EMAIL not set');
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    const routes = ['/dashboard', '/certificates', '/courses', '/integrations', '/admin'];
    for (const route of routes) {
      await page.goto(`${PROD_URL}${route}`, { timeout: 15000, waitUntil: 'domcontentloaded' });
      await page.reload({ timeout: 15000, waitUntil: 'domcontentloaded' });

      await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('app-bar')).toBeVisible({ timeout: 5000 });
    }
  });

  test('@prod browser back button does not cause 404', async ({ page }) => {
    test.skip(!STUDENT_EMAIL, 'TEST_STUDENT_EMAIL not set');
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

    await page.getByTestId('email-input').fill(STUDENT_EMAIL);
    await page.getByTestId('password-input').fill(STUDENT_PASSWORD);
    await page.getByTestId('login-btn').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await page.goto(`${PROD_URL}/courses`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    await page.goto(`${PROD_URL}/certificates`, { timeout: 15000, waitUntil: 'domcontentloaded' });

    await page.goBack({ timeout: 15000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 5000 });

    await page.goBack({ timeout: 15000, waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 5000 });
  });
});
