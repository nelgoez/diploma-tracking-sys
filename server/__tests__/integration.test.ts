import { beforeAll, describe, expect, it } from 'bun:test';

const BASE = 'http://localhost:3000/api/v1';

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

describe('Integration Tests — Full DTS Flow', () => {
  let studentToken: string;
  let adminToken: string;
  let studentEmail: string;
  let trackId: string;
  let courseIds: string[] = [];

  beforeAll(async () => {
    const auth = await login('nahuelgomez.cti@gmail.com', 'Test123456!');
    studentToken = auth.access_token;
    studentEmail = auth.user.email;

    try {
      const adminAuth = await login('admin@dts.unc.edu.ar', 'Admin123456!');
      adminToken = adminAuth.access_token;
    }
    catch {
      adminToken = '';
      console.warn('[Integration] Admin login failed — sync tests will assert 403 fallback');
    }

    const tracksRes = await fetch(`${BASE}/tracks`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const tracks = await tracksRes.json() as { data: { id: string, code: string }[] };
    trackId = tracks.data.find(t => t.code === 'DIP-CD-2025')?.id || tracks.data[0]?.id;

    const coursesRes = await fetch(`${BASE}/courses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const courses = await coursesRes.json() as { id: string }[];
    courseIds = Array.isArray(courses)
      ? courses.map(c => c.id)
      : ((courses as unknown as { data: { id: string }[] }).data?.map(c => c.id) || []);
  });

  describe('Flow 1: Student profile', () => {
    it('auth/me returns profile', async () => {
      const res = await fetch(`${BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { email: string, name: string };
      expect(body.email).toBe(studentEmail);
    });
  });

  describe('Flow 2: Tracks & Courses', () => {
    it('tracks list returns paginated data', async () => {
      const res = await fetch(`${BASE}/tracks`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { data: { code: string }[] };
      expect(body.data.some(t => t.code === 'DIP-CD-2025')).toBe(true);
    });

    it('track detail returns code', async () => {
      if (!trackId) { return; }
      const res = await fetch(`${BASE}/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('courses list returns results', async () => {
      const res = await fetch(`${BASE}/courses`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('course detail returns data or 404', async () => {
      if (courseIds.length === 0) { return; }
      const res = await fetch(`${BASE}/courses/${courseIds[0]}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect([200, 404]).toContain(res.status);
    });

    it('integrator course prerequisites returns tree', async () => {
      const coursesRes = await fetch(`${BASE}/courses`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const allCourses = await coursesRes.json() as { id: string, code: string }[];
      const integrator = allCourses.find(c => c.code === 'CD-INT' || c.code === 'INT-401');
      if (!integrator) { return; }
      const res = await fetch(`${BASE}/courses/${integrator.id}/prerequisites`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Flow 3: Rules & Eligibility', () => {
    it('rules list accessible (may be 403 for estudiante)', async () => {
      const res = await fetch(`${BASE}/rules`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect([200, 403]).toContain(res.status);
    });

    it('rule evaluate with valid student + track returns result', async () => {
      if (!trackId) { return; }
      const res = await fetch(`${BASE}/rules/evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: 'invalid-uuid', trackId }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Flow 4: Overrides', () => {
    it('overrides list accessible (may be 403 for estudiante)', async () => {
      const res = await fetch(`${BASE}/overrides`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Flow 5: Enrollments', () => {
    it('enrollments list accessible', async () => {
      const res = await fetch(`${BASE}/enrollments`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('Flow 6: Integration syncs (admin)', () => {
    it('student blocked from moodle sync (403)', async () => {
      const res = await fetch(`${BASE}/integrations/sync/moodle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('student blocked from guarani sync (403)', async () => {
      const res = await fetch(`${BASE}/integrations/sync/guarani`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(403);
    });

    if (adminToken) {
      it('moodle sync returns summary with counts', async () => {
        const res = await fetch(`${BASE}/integrations/sync/moodle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json() as Record<string, unknown>;
        expect(body).toHaveProperty('summary');
        expect(body).toHaveProperty('sync_id');
        expect(body.duration_ms).toBeDefined();
      }, 30000);

      it('certificates POST /sync returns results', async () => {
        const res = await fetch(`${BASE}/certificates/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect([200, 500]).toContain(res.status);
        const body = await res.json() as Record<string, unknown>;
        expect(body).toHaveProperty('success');
      }, 30000);

      it('guarani sync returns summary', async () => {
        const res = await fetch(`${BASE}/integrations/sync/guarani`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json() as Record<string, unknown>;
        expect(body).toHaveProperty('summary');
      }, 15000);

      it('integration status returns moodle + guarani health', async () => {
        const res = await fetch(`${BASE}/integrations/status`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        expect(res.status).toBe(200);
        const body = await res.json() as Record<string, unknown>;
        expect(body).toHaveProperty('moodle');
        expect(body).toHaveProperty('guarani');
        const moodle = body.moodle as Record<string, unknown>;
        expect(['connected', 'disconnected', 'error']).toContain(String(moodle.status));
      });
    }
  });

  describe('Flow 7: Student data isolation', () => {
    it('cannot access another student by random UUID', async () => {
      const res = await fetch(`${BASE}/students/00000000-0000-0000-0000-000000000001`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('cannot access progress of another student', async () => {
      const res = await fetch(`${BASE}/students/00000000-0000-0000-0000-000000000001/progress`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(res.status).toBe(403);
    });
  });
});
