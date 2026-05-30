import { ApiBase } from './ApiBase';

class TestContext {
  readonly api: ApiBase;
  private adminToken: string | null = null;
  private studentToken: string | null = null;
  private tokens = new Map<string, string>();

  constructor(apiBaseUrl?: string) {
    this.api = new ApiBase(apiBaseUrl);
  }

  async loginAs(role: 'admin' | 'student'): Promise<string> {
    if (role === 'admin' && this.adminToken) { return this.adminToken; }
    if (role === 'student' && this.studentToken) { return this.studentToken; }

    const result = await this.api.loginAs(role);
    const token = result.access_token;
    this.tokens.set(role, token);
    if (role === 'admin') { this.adminToken = token; }
    if (role === 'student') { this.studentToken = token; }
    this.api.setToken(token);
    return token;
  }

  getToken(role: string): string | undefined {
    return this.tokens.get(role);
  }

  async reset(): Promise<void> {
    this.adminToken = null;
    this.studentToken = null;
    this.tokens.clear();
    this.api.setToken(null);
  }
}

export { TestContext };
