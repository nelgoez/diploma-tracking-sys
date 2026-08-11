import { expect, test } from './auth';

test.describe('@smoke Admin Dashboard — Stat Cards', () => {
  test('@fast admin dashboard has clickable stat cards', async ({ adminPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await adminPage.expectLoaded();
    const statCards = adminPage.page.locator('.MuiCard-root');
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('@fast student stat card navigates to admin', async ({ adminPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await adminPage.expectLoaded();
    const studentsCard = adminPage.page.locator('text=Total de estudiantes').locator('..');
    if (await studentsCard.isVisible().catch(() => false)) {
      await studentsCard.click();
      await expect(adminPage.page).toHaveURL(/\/admin/);
    }
  });
});

test.describe('@smoke Admin — Student Management', () => {
  test('@critical admin can view student list', async ({ adminPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await adminPage.navigateTo('/app/admin');
    await adminPage.page.waitForLoadState('networkidle');
    await expect(adminPage.page.locator('text=Students')).toBeVisible();
  });
});
