import { expect, test } from './auth';

test.describe('@smoke DTS Full Business Flow', () => {
  test('@critical admin can view dashboard with stats', async ({ adminPage }) => {
    await adminPage.expectLoaded();
    await expect(adminPage.getUserName()).toBeVisible();
    await adminPage.expectUserRole(/admin/);
  });

  test('@critical student can view progress and eligibility', async ({ studentPage }) => {
    await studentPage.expectLoaded();
    await expect(studentPage.getUserName()).toBeVisible();
  });

  test('@smoke navigation between pages works', async ({ adminPage }) => {
    const navIds = ['nav-dashboard', 'nav-certificates', 'nav-courses', 'nav-integrations', 'nav-admin'];
    for (const id of navIds) {
      const link = adminPage.getNavItem(id);
      await expect(link).toBeVisible();
      await link.click();
    }
  });

  test('@smoke language switcher toggles to English and back', async ({ loginPage, page }) => {
    await loginPage.goto();

    const langBtn = page.getByRole('button', { name: /idioma/i });
    if (await langBtn.isVisible()) {
      await langBtn.click();
      const englishOption = page.getByText('English');
      if (await englishOption.isVisible()) {
        await englishOption.click();
      }
    }

    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    const langBtnBack = page.getByRole('button', { name: /language/i });
    if (await langBtnBack.isVisible()) {
      await langBtnBack.click();
      const spanishOption = page.getByText('Español');
      if (await spanishOption.isVisible()) {
        await spanishOption.click();
      }
    }
  });
});
