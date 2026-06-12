import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@dts.unc.edu.ar';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123456!';
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'nahuelgomez.cti@gmail.com';
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'Test123456!';

test.describe('DTS Smoke Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Sistema de Gestión de Diplomas/);
    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /contraseña/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should load landing page and navigate to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar|iniciar/i }).first()).toBeVisible();
  });

  test('should login as admin and see dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Bienvenido\/a/i)).toBeVisible();
  });

  test('should login as student and see progress', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Bienvenido\/a/i)).toBeVisible();
  });
});
