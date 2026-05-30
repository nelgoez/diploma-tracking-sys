import { expect, test } from '@playwright/test';

test.describe('DTS Smoke Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Sistema de Gestión de Diplomas/);
    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /contraseña/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should login as admin and see dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: /correo/i }).fill('admin@dts.unc.edu.ar');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('Admin123456!');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Bienvenido\/a/i)).toBeVisible();
  });

  test('should login as student and see progress', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: /correo/i }).fill('nahuelgomez.cti@gmail.com');
    await page.getByRole('textbox', { name: /contraseña/i }).fill('Test123456!');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Bienvenido\/a/i)).toBeVisible();
  });
});
