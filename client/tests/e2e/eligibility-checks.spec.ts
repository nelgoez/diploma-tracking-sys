import { expect, test } from './auth';

test.describe('@smoke Student — Eligibility Dashboard', () => {
  test('@critical student dashboard loads without 400 error', async ({ studentPage }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-42' });
    await studentPage.expectLoaded();
    const errorAlert = studentPage.page.locator('[role="alert"][class*="error"]');
    await expect(errorAlert).not.toBeVisible({ timeout: 5000 });
  });
});
