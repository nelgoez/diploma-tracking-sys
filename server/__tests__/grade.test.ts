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

describe('Grade Recording — PUT /enrollments/:id/grade', () => {
  let adminToken: string;
  let studentToken: string;
  let enrollmentId: string;

  beforeAll(async () => {
    const adminAuth = await login('admin@dts.unc.edu.ar', 'Admin123456!');
    adminToken = adminAuth.access_token;

    const studentAuth = await login('nahuelgomez.cti@gmail.com', 'Test123456!');
    studentToken = studentAuth.access_token;

    const enrollRes = await fetch(`${BASE}/enrollments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const enrollments = await enrollRes.json() as { data?: { id: string, exam_status: string | null }[] };
    const inscripto = (enrollments.data || []).find(e => e.exam_status === 'inscripto');
    if (inscripto) {
      enrollmentId = inscripto.id;
    }
  });

  describe('Authorization', () => {
    it('returns 401 without token', async () => {
      const res = await fetch(`${BASE}/enrollments/123/grade`, { method: 'PUT' });
      expect(res.status).toBe(401);
    });

    it('returns 403 for student role', async () => {
      const res = await fetch(`${BASE}/enrollments/123/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${studentToken}`,
        },
        body: JSON.stringify({ qualification: 7 }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Validation', () => {
    it('returns 400 for grade below 1', async () => {
      const res = await fetch(`${BASE}/enrollments/${enrollmentId || 'none'}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 0 }),
      });
      expect(res.status).toBe(400);
      const body = await res.json() as { error: string };
      expect(body.error).toContain('1');
    });

    it('returns 400 for grade above 10', async () => {
      const res = await fetch(`${BASE}/enrollments/${enrollmentId || 'none'}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 11 }),
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-numeric grade', async () => {
      const res = await fetch(`${BASE}/enrollments/${enrollmentId || 'none'}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 'abc' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Enrollment validation', () => {
    it('returns 404 for non-existent enrollment', async () => {
      const res = await fetch(`${BASE}/enrollments/00000000-0000-0000-0000-000000000000/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 7 }),
      });
      expect(res.status).toBe(404);
    });

    it('returns 409 when enrollment not in exam status', async () => {
      const enrollRes = await fetch(`${BASE}/enrollments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const enrollments = await enrollRes.json() as { data?: { id: string, exam_status: string | null }[] };
      const nonExam = (enrollments.data || []).find(
        e => e.exam_status !== 'inscripto' && e.exam_status !== null,
      );

      if (!nonExam) { return; }

      const res = await fetch(`${BASE}/enrollments/${nonExam.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 7 }),
      });
      expect(res.status).toBe(409);
      const body = await res.json() as { error: string };
      expect(body.error).toContain('not registered');
    });
  });

  describe('Status transitions', () => {
    it('sets exam_status=aprobado for grade >= 4', async () => {
      if (!enrollmentId) { return; }

      const res = await fetch(`${BASE}/enrollments/${enrollmentId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 7 }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { exam_status: string, status?: string, qualification: number };
      expect(body.exam_status).toBe('aprobado');
      expect(body.qualification).toBe(7);
    });

    it('sets exam_status=desaprobado for grade < 4', async () => {
      const enrollRes = await fetch(`${BASE}/enrollments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const enrollments = await enrollRes.json() as { data?: { id: string, exam_status: string | null }[] };
      const inscripto = (enrollments.data || []).find(e => e.exam_status === 'inscripto');
      if (!inscripto) { return; }

      const res = await fetch(`${BASE}/enrollments/${inscripto.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 2 }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { exam_status: string, qualification: number };
      expect(body.exam_status).toBe('desaprobado');
      expect(body.qualification).toBe(2);
    });

    it('accepts observations field', async () => {
      const enrollRes = await fetch(`${BASE}/enrollments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const enrollments = await enrollRes.json() as { data?: { id: string, exam_status: string | null }[] };
      const inscripto = (enrollments.data || []).find(e => e.exam_status === 'inscripto');
      if (!inscripto) { return; }

      const res = await fetch(`${BASE}/enrollments/${inscripto.id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qualification: 6, observations: 'Good work' }),
      });
      expect(res.status).toBe(200);
      const body = await res.json() as { exam_status: string, observations?: string };
      expect(body.exam_status).toBe('aprobado');
    });
  });
});
