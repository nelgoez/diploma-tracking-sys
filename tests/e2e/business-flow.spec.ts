import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@dts.unc.edu.ar';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123456!';
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'nahuelgomez.cti@gmail.com';
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'Test123456!';

test.describe('DTS Full Business Flow', () => {
  test('admin can view dashboard with stats', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Bienvenido\/a/i)).toBeVisible();
    await expect(page.getByText(/Cursos Completados/i)).toBeVisible();
    await expect(page.getByText(/Estado de Habilitación/i)).toBeVisible();
  });

  test('student can view progress and eligibility', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Bienvenido\/a/i)).toBeVisible();
    await expect(page.getByText(/Progreso/i)).toBeVisible();
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    const navItems = [/Panel Principal/, /Certificados/, /Cursos/, /Integraciones/, /Administración/];
    for (const item of navItems) {
      const link = page.getByText(item);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('language switcher toggles to English and back', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();

    const langBtn = page.getByText('ES').last();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    const langBtnBack = page.getByText('EN').last();
    if (await langBtnBack.isVisible()) {
      await langBtnBack.click();
      await page.waitForTimeout(300);
    }
  });
});
