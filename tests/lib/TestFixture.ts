import type { AuthResult } from './ApiBase';
import { TestContext } from './TestContext';

class TestFixture {
  readonly ctx: TestContext;

  constructor(baseUrl?: string) {
    this.ctx = new TestContext(baseUrl);
  }

  async loginAsAdmin(): Promise<AuthResult> {
    const token = await this.ctx.loginAs('admin');
    const res = await this.ctx.api.get('/auth/me');
    const user = await res.json() as AuthResult['user'];
    return { access_token: token, refresh_token: '', user };
  }

  async loginAsStudent(): Promise<AuthResult> {
    const token = await this.ctx.loginAs('student');
    const res = await this.ctx.api.get('/auth/me');
    const user = await res.json() as AuthResult['user'];
    return { access_token: token, refresh_token: '', user };
  }

  async getDashboardStats(): Promise<Record<string, unknown>> {
    const res = await this.ctx.api.get('/admin/dashboard-stats');
    return res.json() as Promise<Record<string, unknown>>;
  }

  async getTracks(): Promise<unknown> {
    const res = await this.ctx.api.get('/tracks');
    return res.json();
  }

  async getIntegrationStatus(): Promise<unknown> {
    const res = await this.ctx.api.get('/integrations/status');
    return res.json();
  }

  async getStudentProgress(studentId: string): Promise<unknown> {
    const res = await this.ctx.api.get(`/students/${studentId}/progress`);
    return res.json();
  }
}

export { TestFixture };
