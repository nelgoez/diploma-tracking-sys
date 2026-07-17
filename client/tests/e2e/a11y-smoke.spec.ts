import { expect, test } from '@playwright/test';
import { checkA11y } from './a11y';

test.describe('@smoke a11y — Critical pages', () => {
  test('@fast login page has no critical a11y violations', async ({ page }) => {
    test.info().annotations.push({ type: 'story', description: 'DTS-107' });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const result = await checkA11y(page);
    const critical = result.violations.filter(v => v.impact === 'critical');
    expect(critical).toEqual([]);
  });
});
