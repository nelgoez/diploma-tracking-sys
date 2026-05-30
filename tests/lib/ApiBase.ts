import { config } from '../config/env-config';

interface AuthResult {
  access_token: string
  refresh_token: string
  user: { id: string, email: string, role: string, name: string }
}

interface RequestOptions {
  headers?: Record<string, string>
  timeout?: number
}

class ApiBase {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.apiUrl;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const res = await this.post('/auth/login', { email, password });
    return res.json() as Promise<AuthResult>;
  }

  async loginAs(role: 'admin' | 'student'): Promise<AuthResult> {
    const creds = config.credentials[role];
    return this.login(creds.email, creds.password);
  }

  async get(path: string, opts?: RequestOptions): Promise<Response> {
    return this.request('GET', path, undefined, opts);
  }

  async post(path: string, body?: unknown, opts?: RequestOptions): Promise<Response> {
    return this.request('POST', path, body, opts);
  }

  async delete(path: string, opts?: RequestOptions): Promise<Response> {
    return this.request('DELETE', path, undefined, opts);
  }

  private async request(method: string, path: string, body?: unknown, opts?: RequestOptions): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(opts?.headers || {}),
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    const signal = AbortSignal.timeout(opts?.timeout || 15000);
    return fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal });
  }
}

export { ApiBase };
export type { AuthResult };
