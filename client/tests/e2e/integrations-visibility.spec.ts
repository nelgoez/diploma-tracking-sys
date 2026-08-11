import { expect, test } from './auth';

test.describe('@smoke Integrations — Role Visibility', () => {
  test('@critical student does not see integrations in sidebar', async ({ studentPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await studentPage.expectLoaded();
    const integrationsLink = studentPage.page.locator('[data-testid="nav-integrations"]');
    await expect(integrationsLink).not.toBeVisible();
  });

  test('@critical student is redirected when navigating to integrations', async ({ studentPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await studentPage.navigateTo('/app/integrations');
    await studentPage.page.waitForLoadState('networkidle');
    await expect(studentPage.page).toHaveURL(/\/dashboard/);
  });
});
