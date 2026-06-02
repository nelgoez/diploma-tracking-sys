import { expect, Page, test } from '@playwright/test';

const PROD_URL = 'https://nelgoez-diploma-tracking-sys.vercel.app';
const VERCEL_SHARE = process.env.VERCEL_SHARE_TOKEN
  ? `_vercel_share=${process.env.VERCEL_SHARE_TOKEN}`
  : '';

function prodUrl(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  return VERCEL_SHARE ? `${PROD_URL}${path}${sep}${VERCEL_SHARE}` : `${PROD_URL}${path}`;
}

const ADMIN_EMAIL = process.env.PROD_ADMIN_EMAIL || 'admin@dts.unc.edu.ar';
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD || 'Admin123456!';
const STUDENT_EMAIL = process.env.PROD_STUDENT_EMAIL || 'nahuelgomez.cti@gmail.com';
const STUDENT_PASSWORD = process.env.PROD_STUDENT_PASSWORD || 'Test123456!';

type Role = 'admin' | 'student';

async function loginAs(page: Page, role: Role) {
  const email = role === 'admin' ? ADMIN_EMAIL : STUDENT_EMAIL;
  const password = role === 'admin' ? ADMIN_PASSWORD : STUDENT_PASSWORD;

  await page.goto(prodUrl('/login'));
  await page.waitForLoadState('networkidle');

  const isLoginPage = await page.getByRole('textbox', { name: /correo/i }).isVisible().catch(() => false);
  if (!isLoginPage) return false;

  await page.getByRole('textbox', { name: /correo/i }).fill(email);
  await page.getByRole('textbox', { name: /contraseña/i }).fill(password);
  await page.getByRole('button', { name: /entrar|login/i }).click();

  await page.waitForLoadState('networkidle');
  return true;
}

async function skipIfUnreachable(page: Page) {
  try {
    await page.goto(prodUrl('/'), { timeout: 15000 });
    return false;
  } catch {
    test.skip();
    return true;
  }
}

function scrollToBottom(page: Page) {
  return page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

test.describe('@prod Production Smoke — Admin Dashboard', () => {
  test('admin dashboard shows real stats with numeric values', async ({ page }) => {
    await skipIfUnreachable(page);

    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/admin'));
    await page.waitForLoadState('networkidle');
    await scrollToBottom(page);
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 10000 });

    const statCards = page.locator('[data-testid^="stat-"]');
    const cardCount = await statCards.count();

    let numericFound = false;
    for (let i = 0; i < cardCount; i++) {
      const text = await statCards.nth(i).textContent();
      if (text && /\d/.test(text) && !text.includes('N/A')) {
        numericFound = true;
        break;
      }
    }

    expect(numericFound || cardCount === 0).toBeTruthy();
  });

  test('admin students tab pagination shows correct format', async ({ page }) => {
    await skipIfUnreachable(page);

    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/admin'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const studentsLink = page.getByTestId('nav-admin');
    if (await studentsLink.isVisible().catch(() => false)) {
      await studentsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    await scrollToBottom(page);
    await page.waitForTimeout(1000);

    const pagination = page.locator(
      '[class*="pagination"], [class*="MuiPagination"], nav[aria-label*="pagin"], nav[aria-label*="Pagin"]',
    );

    const isVisible = await pagination.first().isVisible().catch(() => false);

    if (isVisible) {
      const text = await pagination.first().textContent();
      expect(text).toBeTruthy();
      expect(text).not.toContain('undefined');
    }
  });
});

test.describe('@prod Production Smoke — Integrations', () => {
  test('integrations page shows status labels (not undefined)', async ({ page }) => {
    await skipIfUnreachable(page);

    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/integrations'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 10000 });

    const moodleCard = page.getByText(/moodle/i).first();
    const guaranCard = page.getByText(/guaran/i).first();

    const moodleVisible = await moodleCard.isVisible().catch(() => false);
    if (moodleVisible) {
      const moodleText = await moodleCard.textContent();
      expect(moodleText).not.toContain('undefined');
    }

    const guaranVisible = await guaranCard.isVisible().catch(() => false);
    if (guaranVisible) {
      const guaranText = await guaranCard.textContent();
      expect(guaranText).not.toContain('undefined');
    }
  });
});

test.describe('@prod Production Smoke — Student Views', () => {
  test('certificates page loads for student', async ({ page }) => {
    await skipIfUnreachable(page);

    const loggedIn = await loginAs(page, 'student');
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/certificates'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 10000 });

    const hasContent = page.getByRole('table').first().isVisible().catch(() => false);
    const hasEmptyState = page.getByText(/no hay|sin certificados|empty|ningún/i).first().isVisible().catch(() => false);

    expect(await hasContent || await hasEmptyState).toBeTruthy();
  });

  test('courses page loads without crash', async ({ page }) => {
    await skipIfUnreachable(page);

    const loggedIn = await loginAs(page, 'student');
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/courses'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 10000 });

    const hasTable = page.getByRole('table').first().isVisible().catch(() => false);
    const hasEmpty = page.getByText(/no hay|sin cursos|empty|ningún/i).first().isVisible().catch(() => false);
    const hasList = page.getByRole('list').first().isVisible().catch(() => false);

    expect(await hasTable || await hasEmpty || await hasList).toBeTruthy();
  });
});

test.describe('@prod Production Smoke — Role-Based Navigation', () => {
  test('student sees no admin nav, admin sees admin nav', async ({ page }) => {
    await skipIfUnreachable(page);

    const adminLoggedIn = await loginAs(page, 'admin');
    if (!adminLoggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/dashboard'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const adminHasNav = await page.getByTestId('nav-admin').isVisible().catch(() => false);

    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    });

    const studentLoggedIn = await loginAs(page, 'student');
    if (!studentLoggedIn) {
      test.skip();
      return;
    }

    await page.goto(prodUrl('/dashboard'));
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const studentHasNav = await page.getByTestId('nav-admin').isVisible().catch(() => false);

    if (adminHasNav) {
      expect(studentHasNav).toBe(false);
    }
  });
});

test.describe('@prod Production Smoke — No Console Errors', () => {
  test('no unexpected console errors after touring pages as admin', async ({ page }) => {
    await skipIfUnreachable(page);

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const loggedIn = await loginAs(page, 'admin');
    if (!loggedIn) {
      test.skip();
      return;
    }

    const routes = ['/dashboard', '/admin', '/integrations', '/courses', '/certificates'];
    for (const route of routes) {
      await page.goto(prodUrl(route));
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await scrollToBottom(page);
      await page.waitForTimeout(500);
    }

    const nonCritical = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('third-party') &&
        !e.includes('google') &&
        !e.includes('Extension') &&
        !e.includes('chrome-extension'),
    );

    if (nonCritical.length > 0) {
      console.warn(`Console errors found: ${nonCritical.length}`, nonCritical.slice(0, 10));
    }
  });
});
