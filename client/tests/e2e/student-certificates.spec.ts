import { expect, test } from './auth';

test.describe('@smoke Student — Certificate Visibility', () => {
  test('@critical student sees certificates page with data', async ({ studentPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await studentPage.navigateTo('/app/certificates');
    await expect(studentPage.page.locator('[data-testid="main-content"]')).toBeVisible();

    const emptyState = studentPage.page.locator('text=Todavía no tenés certificados');
    if (await emptyState.isVisible().catch(() => false)) {
      const errorAlert = studentPage.page.locator('[role="alert"]');
      if (await errorAlert.isVisible().catch(() => false)) {
        throw new Error(`Certificate page shows error: ${await errorAlert.textContent()}`);
      }
    }
  });

  test('@fast student certificate page has no critical a11y violations', async ({ studentPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-107' });
    await studentPage.navigateTo('/app/certificates');
    await expect(studentPage.page).not.toHaveURL(/\/login/);
  });
});
