/* eslint-disable ts/no-explicit-any */
import { SignJWT } from 'jose';
import appModule from './src/index';

const app = { fetch: appModule.fetch };
const baseUrl = 'http://localhost';
const JWT_SECRET = new TextEncoder().encode('placeholder-secret-key-minimum-32-characters');

async function createToken(role: string): Promise<string> {
  return new SignJWT({ sub: 'smoke-test-id', email: `${role}@dts.com`, role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

function headers(token: string) {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function run() {
  const token = await createToken('admin');
  const h = headers(token);
  let passed = 0;
  let total = 0;

  function ok(label: string, status: number, condition: boolean, detail: string) {
    total++;
    const emoji = condition ? '✅' : '❌';
    if (condition) { passed++; }
    console.log(`  ${emoji} ${label}: ${status} ${detail}`);
    return condition;
  }

  // 1. GET enrollments
  let res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments`, { headers: h }));
  let data: any = await res.json();
  const enrollments = Array.isArray(data) ? data : [];
  ok('GET /enrollments', res.status, res.status === 200, `rows=${enrollments.length}`);

  if (enrollments.length === 0) {
    console.log('\n❌ No enrollments in DB — cannot test exam flow.');
    process.exit(1);
  }

  const enrollmentId = enrollments[0].id;
  const _studentId = enrollments[0].student_id;
  const originalExamStatus = enrollments[0].exam_status;
  console.log(`  Using enrollment id=${String(enrollmentId).slice(0, 8)} exam_status=${originalExamStatus || 'null'}`);

  // 2. GET exam_history (filter only exam rows)
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments?exam_history=true`, { headers: h }));
  data = await res.json();
  const examRows = Array.isArray(data) ? data : [];
  ok('GET ?exam_history=true', res.status, res.status === 200, `exam_rows=${examRows.length}`);

  // 3. TRY grade without exam registration (expect 409)
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${enrollmentId}/grade`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ qualification: 7 }),
  }));
  data = await res.json();
  ok('Grade w/o inscripto → 409', res.status, res.status === 409, String(data.error || '').slice(0, 50));

  // 4. Register for exam
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${enrollmentId}/exam`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ exam_date: '2026-06-15' }),
  }));
  data = await res.json();
  ok('PUT exam registration', res.status, res.status === 200, `exam_status=${String(data.exam_status)}`);

  // 5. Invalid grade range (expect 400)
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${enrollmentId}/grade`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ qualification: 0 }),
  }));
  data = await res.json();
  ok('Grade=0 → 400', res.status, res.status === 400, String(data.error || '').slice(0, 50));

  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${enrollmentId}/grade`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ qualification: 11 }),
  }));
  data = await res.json();
  ok('Grade=11 → 400', res.status, res.status === 400, String(data.error || '').slice(0, 50));

  // 6. Record passing grade (7)
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${enrollmentId}/grade`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ qualification: 7 }),
  }));
  data = await res.json();
  ok('Grade=7 aprobado', res.status, res.status === 200, `exam_status=${String(data.exam_status)} grade=${data.qualification}`);
  ok('  → exam_status=aprobado', 0, data.exam_status === 'aprobado', `got: ${String(data.exam_status)}`);
  ok('  → grade=7', 0, data.qualification === 7, `got: ${String(data.qualification)}`);

  // 7. Verify exam_history now includes the exam
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments?exam_history=true`, { headers: h }));
  data = await res.json();
  const afterExamRows = Array.isArray(data) ? data : [];
  const hasAprobado = afterExamRows.some((r: any) => r.exam_status === 'aprobado');
  ok('exam_history has aprobado', res.status, hasAprobado, `exam_rows=${afterExamRows.length}`);

  // 8. TRY grade again (expect 409 — not inscripto anymore)
  res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${enrollmentId}/grade`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ qualification: 6 }),
  }));
  data = await res.json();
  ok('Re-grade → 409', res.status, res.status === 409, String(data.error || '').slice(0, 50));

  // 9. Test failing grade (reset first, or test on different enrollment)
  if (enrollments.length > 1) {
    const secondId = enrollments[1].id;
    // Register for exam
    await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${secondId}/exam`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ exam_date: '2026-06-20' }),
    }));
    // Grade <4
    res = await app.fetch(new Request(`${baseUrl}/api/v1/enrollments/${secondId}/grade`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ qualification: 3 }),
    }));
    data = await res.json();
    ok('Grade=3 desaprobado', res.status, res.status === 200, `exam_status=${String(data.exam_status)} grade=${data.qualification}`);
    ok('  → exam_status=desaprobado', 0, data.exam_status === 'desaprobado', `got: ${String(data.exam_status)}`);
  }
  else {
    console.log('  ⏭️ Skipping fail-grade test (only 1 enrollment)');
  }

  console.log(`\n${passed}/${total} assertions passed`);
  process.exit(passed === total ? 0 : 1);
}

run().catch((err) => {
  console.error('SMOKE CRASH:', err);
  process.exit(1);
});
