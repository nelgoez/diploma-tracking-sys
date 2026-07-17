import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page.getByTestId('main-content')).toBeVisible();
    await expect(this.page.getByTestId('app-bar')).toBeVisible();
  }

  async expectUserRole(expected: RegExp) {
    const roleText = await this.page.getByTestId('user-role').textContent();
    expect(roleText?.toLowerCase()).toMatch(expected);
  }

  getUserName() {
    return this.page.getByTestId('user-name');
  }

  getNavItem(id: string) {
    return this.page.getByTestId(id);
  }

  async navigateTo(route: string) {
    await this.page.goto(route);
    await this.page.waitForLoadState('networkidle');
  }

  async reload() {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  async assertNo404() {
    await expect(this.page.getByTestId('main-content')).toBeVisible({ timeout: 8000 });
    await expect(this.page.locator('text=404')).not.toBeVisible();
  }
}
