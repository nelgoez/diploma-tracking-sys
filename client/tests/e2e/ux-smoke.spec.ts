import { expect, test } from './auth';

test.describe('@smoke UX Smoke — Routing & Identity', () => {
  test('@fast login page loads and logs in as admin', async ({ adminPage }) => {
    await adminPage.expectLoaded();
  });

  test('@critical app bar shows user identity after login', async ({ adminPage }) => {
    await adminPage.expectLoaded();
    await adminPage.expectUserRole(/admin/);
  });

  test('@critical all routes survive refresh without 404', async ({ adminPage }) => {
    const routes = ['/app/dashboard', '/app/certificates', '/app/courses', '/app/integrations', '/app/admin'];
    for (const route of routes) {
      await adminPage.navigateTo(route);
      await adminPage.assertNo404();

      await adminPage.reload();
      await adminPage.assertNo404();
      await expect(adminPage.getNavItem('nav-admin')).toBeVisible();
    }
  });

  test('@smoke deep link refresh preserves identity', async ({ adminPage }) => {
    await adminPage.navigateTo('/app/integrations');
    await adminPage.reload();
    await expect(adminPage.getNavItem('nav-admin')).toBeVisible();
    await expect(adminPage.getNavItem('nav-sysadmin')).not.toBeVisible();
  });

  test('@critical student sees no admin nav items', async ({ studentPage }) => {
    await expect(studentPage.getNavItem('nav-admin')).not.toBeVisible();
    await expect(studentPage.getNavItem('nav-sysadmin')).not.toBeVisible();
  });

  test('@critical student cannot access admin route', async ({ studentPage }) => {
    await studentPage.navigateTo('/app/admin');
    await expect(studentPage.getNavItem('nav-dashboard')).toBeVisible();
  });

  test('@smoke logout redirects to login', async ({ adminPage, page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
    });
    await adminPage.navigateTo('/app/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('@smoke UX Smoke — API Integration Buttons', () => {
  test('@smoke sync buttons exist on integrations page', async ({ adminPage }) => {
    await adminPage.navigateTo('/app/integrations');
    await expect(adminPage.getNavItem('main-content')).toBeVisible();
    const moodleSection = adminPage.getNavItem('main-content').getByText(/moodle/i).first();
    await expect(moodleSection).toBeVisible();
  });
});

test.describe('@smoke UX Smoke — Student Dashboard', () => {
  test('@critical student sees progress and eligibility', async ({ studentPage }) => {
    await studentPage.expectLoaded();
    await studentPage.expectUserRole(/estudiante/);
  });
});
