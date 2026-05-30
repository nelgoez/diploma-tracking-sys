import { beforeAll, describe, expect, it } from 'bun:test';

const BASE = 'http://localhost:3000/api/v1';

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json() as { access_token: string, error?: string };
  if (body.error) { throw new Error(body.error); }
  return body.access_token;
}

describe('Exploratory Tests — Edges & Boundaries', () => {
  let token: string;

  beforeAll(async () => {
    token = await login('nahuelgomez.cti@gmail.com', 'Test123456!');
  });

  describe('Auth edge cases', () => {
    it('wrong password → 401', async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nahuelgomez.cti@gmail.com', password: 'WrongPass1!' }),
      });
      expect(res.status).toBe(401);
    });
    it('non-existent email → 401', async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'noexiste@unc.edu.ar', password: 'Test123456!' }),
      });
      expect(res.status).toBe(401);
    });
    it('empty body → 400', async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
    it('invalid email → 400', async () => {
      const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-email', password: 'Test123456!' }),
      });
      expect(res.status).toBe(400);
    });
    it('garbage token → 401', async () => {
      const res = await fetch(`${BASE}/auth/me`, { headers: { Authorization: 'Bearer garbage' } });
      expect(res.status).toBe(401);
    });
    it('no auth → 401', async () => {
      const res = await fetch(`${BASE}/auth/me`);
      expect(res.status).toBe(401);
    });
    it('invalid refresh → 401', async () => {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: 'bad' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('RBAC boundaries', () => {
    it('estudiante blocked from admin POST', async () => {
      const res = await fetch(`${BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'x@x.com', password: 'Test123456!', role: 'estudiante' }),
      });
      expect(res.status).toBe(403);
    });
    it('estudiante blocked from tracks POST', async () => {
      const res = await fetch(`${BASE}/tracks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hack', code: 'HCK-001' }),
      });
      expect(res.status).toBe(403);
    });
    it('estudiante blocked from courses POST', async () => {
      const res = await fetch(`${BASE}/courses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hack', code: 'HCK-101' }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Student isolation', () => {
    it('random UUID student detail → 403', async () => {
      const res = await fetch(`${BASE}/students/11111111-1111-1111-1111-111111111111`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Tracks & Courses boundary', () => {
    it('non-existent track → 200 or 404', async () => {
      const res = await fetch(`${BASE}/tracks/00000000-0000-0000-0000-000000000000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([200, 404]).toContain(res.status);
    });
    it('tracks list is paginated', async () => {
      const res = await fetch(`${BASE}/tracks`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json() as { data: unknown[], pagination: unknown };
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('pagination');
    });
  });

  describe('Rule eval boundary', () => {
    it('empty body → 400', async () => {
      const res = await fetch(`${BASE}/rules/evaluate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
    it('garbage uuids → 400', async () => {
      const res = await fetch(`${BASE}/rules/evaluate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: 'x', trackId: 'x' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('3 rapid logins all return 401', async () => {
      const r = await Promise.all([1, 2, 3].map(async () =>
        fetch(`${BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'x@x.com', password: '12345678' }),
        }),
      ));
      for (const x of r) { expect(x.status).toBe(401); }
    });
    it('rule eval under 500ms', async () => {
      const start = Date.now();
      const res = await fetch(`${BASE}/rules/evaluate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: 'x', trackId: 'x' }),
      });
      expect(Date.now() - start).toBeLessThan(500);
    });
  });
});
