import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillCredentials(email: string, password: string) {
    await this.page.getByTestId('email-input').fill(email);
    await this.page.getByTestId('password-input').fill(password);
  }

  async submit() {
    await this.page.getByTestId('login-btn').click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async loginAs(email: string, password: string) {
    await this.goto();
    await this.fillCredentials(email, password);
    await this.submit();
  }
}
