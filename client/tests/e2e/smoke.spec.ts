import { expect, test } from './auth';

test.describe('@smoke DTS Smoke Tests', () => {
  test('@fast should load login page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await expect(page).toHaveTitle(/Sistema de Gestión de Diplomas/);
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });

  test('@fast should load landing page and navigate to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar|iniciar/i }).first()).toBeVisible();
  });

  test('@critical should login as admin and see dashboard', async ({ adminPage }) => {
    await adminPage.expectLoaded();
    await expect(adminPage.getUserName()).toBeVisible();
  });

  test('@critical should login as student and see progress', async ({ studentPage }) => {
    await studentPage.expectLoaded();
  });
});
