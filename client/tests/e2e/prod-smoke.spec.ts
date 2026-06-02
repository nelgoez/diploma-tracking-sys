/**
 * PRODUCTION VALIDATION — runs against live deployment.
 *
 * One-liner: cd client && bun validate:prod --project=chromium --headed
 *
 * @prod tag: run only these tests with --grep @prod
 */

import { expect, test } from '@playwright/test';

const PROD_URL = 'https://nelgoez-diploma-tracking-sys.vercel.app';

const ADMIN = {
  email: 'admin@dts.unc.edu.ar',
  password: 'Admin123456!',
};

const STUDENT = {
  email: 'nahuelgomez.cti@gmail.com',
  password: 'Test123456!',
};

test.describe('@prod Production Validation', () => {
  test('page loads and login form is visible', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await expect(page).toHaveTitle(/Diploma/i);
    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
  });

  test('admin can login and see dashboard', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN.email);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN.password);
    await page.getByRole('button', { name: /entrar|login/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.getByTestId('app-bar')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('user-role')).toBeVisible();
  });

  test('admin nav shows correct items', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN.email);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN.password);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await expect(page.getByTestId('nav-admin')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('nav-sysadmin')).not.toBeVisible();
    await expect(page.getByTestId('nav-integrations')).toBeVisible();
  });

  test('student cannot access admin', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT.email);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT.password);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await expect(page.getByTestId('nav-admin')).not.toBeVisible({ timeout: 5000 });
  });

  test('admin dashboard shows stats with numbers', async ({ page }) => {
    await page.goto(`${PROD_URL}/login`, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN.email);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN.password);
    await page.getByRole('button', { name: /entrar|login/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('user-role')).toBeVisible();
    await expect(page.getByTestId('user-name')).toBeVisible();
  });
});
