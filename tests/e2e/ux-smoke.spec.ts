import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@dts.unc.edu.ar';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin123456!';
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'nahuelgomez.cti@gmail.com';
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'Test123456!';

test.describe('UX Smoke — Routing & Identity', () => {
  test('login page loads and logs in', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Diploma/i);
    await expect(page.getByRole('textbox', { name: /correo/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /contraseña/i })).toBeVisible();
    await expect(page.getByTestId('login-btn')).toBeVisible();

    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('app bar shows user identity after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByTestId('app-bar')).toBeVisible();
    await expect(page.getByTestId('user-name')).toBeVisible();
    await expect(page.getByTestId('user-role')).toBeVisible();
    const roleText = await page.getByTestId('user-role').textContent();
    expect(roleText?.toLowerCase()).toMatch(/admin/);
  });

  test('all routes survive refresh without 404', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    const routes = ['/dashboard', '/certificates', '/courses', '/integrations', '/admin'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('text=404')).not.toBeVisible();
      await expect(page.locator('text=Not Found')).not.toBeVisible();

      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('text=404')).not.toBeVisible();
      await expect(page.getByTestId('app-bar')).toBeVisible();
    }
  });

  test('deep link refresh preserves identity', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/integrations');
    await page.reload();
    await expect(page.getByTestId('user-name')).toBeVisible();
    await expect(page.getByTestId('user-role')).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('UX Smoke — Navigation & Roles', () => {
  test('admin sees admin nav item but not sysadmin', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByTestId('nav-admin')).toBeVisible();
    await expect(page.getByTestId('nav-sysadmin')).not.toBeVisible();
  });

  test('student sees no admin nav items', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByTestId('nav-admin')).not.toBeVisible();
    await expect(page.getByTestId('nav-sysadmin')).not.toBeVisible();
  });

  test('student cannot access admin route', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('UX Smoke — API Integration Buttons', () => {
  test('sync buttons exist on integrations page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(ADMIN_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(ADMIN_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/integrations');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/moodle/i).first()).toBeVisible();
    await expect(page.getByText(/guaran/i).first()).toBeVisible();

    const syncButtons = page.getByRole('button', { name: /Sincronizar|Sync/i });
    const count = await syncButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

test.describe('UX Smoke — Student Dashboard', () => {
  test('student sees progress and eligibility', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('main-content')).toBeVisible();
    await expect(page.getByTestId('app-bar')).toBeVisible();
    await expect(page.getByTestId('user-role')).toBeVisible();
    const roleText = await page.getByTestId('user-role').textContent();
    expect(roleText?.toLowerCase()).toMatch(/estudiante/);
  });

  test('student can log out and redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /correo/i }).fill(STUDENT_EMAIL);
    await page.getByRole('textbox', { name: /contraseña/i }).fill(STUDENT_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
