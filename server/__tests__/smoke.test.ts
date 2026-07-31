import { beforeAll, describe, expect, it } from 'bun:test';
import { BASE, TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD } from './test-config';

const INVALID_PASSWORD = 'THIS_IS_A_TEST_INVALID_PASSWORD_DO_NOT_USE';

interface AuthResult {
  access_token: string
  refresh_token: string
  user: { id: string, email: string, role: string, name: string }
}

async function login(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json() as AuthResult & { error?: string };
  if (!res.ok || body.error) { throw new Error(`Login failed: ${body.error || res.status}`); }
  return body;
}

describe('Smoke Tests — DTS System Health', () => {
  describe('Server availability', () => {
    it('health endpoint returns ok', async () => {
      const res = await fetch('http://localhost:3000/health');
      expect(res.status).toBe(200);
      const body = await res.json() as { status: string };
      expect(body.status).toBe('ok');
    });

    it('API base responds with 401 for unauthenticated', async () => {
      const res = await fetch(`${BASE}/auth/me`);
      expect(res.status).toBe(401);
    });

    it('login accepts POST with body', async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'x@x.com', password: INVALID_PASSWORD }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Auth flow — credentials', () => {
    let accessToken: string;
    let refreshToken: string;

    it('login returns tokens + user for valid credentials', async () => {
      const body = await login(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD);
      expect(body.access_token).toBeTruthy();
      expect(body.user.email).toBe(TEST_STUDENT_EMAIL);
      expect(body.user.role).toBe('estudiante');
      accessToken = body.access_token;
      refreshToken = body.refresh_token;
    });

    it('auth/me returns user with valid token', async () => {
      const res = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { email: string };
      expect(body.email).toBe(TEST_STUDENT_EMAIL);
    });

    it('refresh returns new token pair', async () => {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      expect(res.status).toBe(200);
    });
  });

  describe('RBAC enforcement', () => {
    let studentToken = '';
    beforeAll(async () => {
      const auth = await login(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD);
      studentToken = auth.access_token;
    });

    it('estudiante cannot access admin dashboard', async () => {
      const res = await fetch(`${BASE}/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('estudiante cannot access integrations status', async () => {
      const res = await fetch(`${BASE}/integrations/status`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('estudiante can access their own profile', async () => {
      const res = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('Database connectivity', () => {
    it('tracks list returns paginated data', async () => {
      const auth = await login(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD);
      const res = await fetch(`${BASE}/tracks`, {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { data: unknown[], pagination: unknown };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('courses list returns data', async () => {
      const auth = await login(TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD);
      const res = await fetch(`${BASE}/courses`, {
        headers: { Authorization: `Bearer ${auth.access_token}` },
      });
      expect(res.status).toBe(200);
    });
  });
});
