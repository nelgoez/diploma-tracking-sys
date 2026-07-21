import { Hono } from 'hono';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

const analytics = new Hono();

analytics.use('/*', authenticate);
analytics.use('/*', requireRole('admin', 'sysadmin'));

const cache = new Map<string, { data: unknown, expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) { return entry.data; }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) { cache.delete(oldestKey); }
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

analytics.get('/enrollments', async (c) => {
  const cacheKey = 'analytics:enrollments';
  const cached = getCached(cacheKey);
  if (cached) { return c.json(cached); }

  const [{ count: totalEnrollments }] = await Promise.all([
    supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }),
  ]);

  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('status, exam_status, created_at, track_id, tracks!inner(name)');

  if (!enrollments) {
    return c.json({ error: 'Failed to fetch enrollment data' }, 500);
  }

  const byTrackMap = new Map<string, { count: number, eligible: number }>();
  const byStatusMap = new Map<string, number>();
  const monthlyMap = new Map<string, number>();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  let activeCount = 0;

  for (const e of enrollments) {
    const status = e.status;
    byStatusMap.set(status, (byStatusMap.get(status) || 0) + 1);

    if (status === 'active' || status === 'in_progress' || status === 'pending') {
      activeCount++;
    }

    const trackName = (e.tracks as { name: string }).name;
    const trackEntry = byTrackMap.get(trackName) || { count: 0, eligible: 0 };
    trackEntry.count++;
    // NOTE: Simplified proxy — counts enrollment-level exam_status as eligibility.
    // This is NOT rule-engine evaluation. Rule engine considers prerequisite tree,
    // student certificates, and manual overrides. If rule-based accuracy is needed,
    // replace this block with a batched call to evaluateEligibilityFromData().
    if (e.exam_status === 'aprobado' || status === 'completed') {
      trackEntry.eligible++;
    }
    byTrackMap.set(trackName, trackEntry);

    const createdAt = e.created_at;
    if (createdAt && createdAt >= twelveMonthsAgo.toISOString()) {
      const month = createdAt.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    }
  }

  const byTrack = Array.from(byTrackMap.entries())
    .map(([track, d]) => ({ track, count: d.count, eligible: d.eligible }))
    .sort((a, b) => b.count - a.count);

  const byStatus: Record<string, number> = {};
  for (const [status, count] of byStatusMap) {
    byStatus[status] = count;
  }

  const monthlyTrend = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, enrollments]) => ({ month, enrollments }));

  const result = {
    total_enrollments: totalEnrollments || 0,
    active_enrollments: activeCount,
    by_track: byTrack,
    by_status: byStatus,
    monthly_trend: monthlyTrend,
  };

  setCache(cacheKey, result);
  return c.json(result);
});

analytics.get('/certificates', async (c) => {
  const cacheKey = 'analytics:certificates';
  const cached = getCached(cacheKey);
  if (cached) { return c.json(cached); }

  const [{ count: totalCertificates }] = await Promise.all([
    supabaseAdmin.from('certificates').select('*', { count: 'exact', head: true }),
  ]);

  const { data: certificates, error: certError } = await supabaseAdmin
    .from('certificates')
    .select('course_id, qualification, issue_date, status, courses!inner(name, track_id, tracks!inner(name))')
    .eq('status', 'approved');

  if (certError || !certificates) {
    return c.json({ error: 'Failed to fetch certificate data' }, 500);
  }

  const byCourseMap = new Map<string, { completed: number, totalGrade: number, count: number }>();
  const byTrackMap = new Map<string, { completed: number }>();
  const monthlyMap = new Map<string, number>();

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  for (const cert of certificates) {
    const course = cert.courses as { name: string, track_id: string, tracks: { name: string } };
    const courseName = course.name;
    const trackName = course.tracks.name;

    const courseEntry = byCourseMap.get(courseName) || { completed: 0, totalGrade: 0, count: 0 };
    courseEntry.completed++;
    if (cert.qualification !== null) {
      courseEntry.totalGrade += cert.qualification;
      courseEntry.count++;
    }
    byCourseMap.set(courseName, courseEntry);

    const trackEntry = byTrackMap.get(trackName) || { completed: 0 };
    trackEntry.completed++;
    byTrackMap.set(trackName, trackEntry);

    const issueDate = cert.issue_date;
    if (issueDate && issueDate >= twelveMonthsAgo.toISOString().substring(0, 10)) {
      const month = issueDate.substring(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    }
  }

  const byCourse = Array.from(byCourseMap.entries())
    .map(([course, d]) => ({
      course,
      completed: d.completed,
      avg_grade: d.count > 0 ? Math.round((d.totalGrade / d.count) * 100) / 100 : null,
    }))
    .sort((a, b) => b.completed - a.completed);

  const { data: studentsByTrack } = await supabaseAdmin
    .from('enrollments')
    .select('student_id, track_id, tracks!inner(name)');

  const trackStudentCountMap = new Map<string, Set<string>>();
  for (const e of studentsByTrack || []) {
    const trackName = (e.tracks as { name: string }).name;
    if (!trackStudentCountMap.has(trackName)) {
      trackStudentCountMap.set(trackName, new Set());
    }
    trackStudentCountMap.get(trackName)!.add(e.student_id);
  }

  const byTrack = Array.from(byTrackMap.entries())
    .map(([track, d]) => ({
      track,
      completed: d.completed,
      total_students: trackStudentCountMap.get(track)?.size || 0,
    }))
    .sort((a, b) => b.completed - a.completed);

  const monthlyIssued = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const result = {
    total_certificates: totalCertificates || 0,
    by_course: byCourse,
    by_track: byTrack,
    monthly_issued: monthlyIssued,
  };

  setCache(cacheKey, result);
  return c.json(result);
});

analytics.get('/certificates/export', async (c) => {
  const format = c.req.query('format') || 'csv';

  if (format !== 'csv') {
    return c.json({ error: 'Only CSV format is supported' }, 400);
  }

  const { data: certificates } = await supabaseAdmin
    .from('certificates')
    .select(`
      id, student_id, course_id, issue_date, status, qualification, is_valid, created_at,
      students!inner(name, email, dni),
      courses!inner(name, code, tracks!inner(name))
    `)
    .order('issue_date', { ascending: false });

  if (!certificates) {
    return c.json({ error: 'Failed to fetch certificate data' }, 500);
  }

  const BOM = '\uFEFF';
  const headers = [
    'ID',
    'Estudiante',
    'Email',
    'DNI',
    'Curso',
    'Código Curso',
    'Diplomatura',
    'Fecha Emisión',
    'Estado',
    'Nota',
    'Válido',
    'Creado',
  ];

  const rows = certificates.map((cert) => {
    const student = cert.students as { name: string, email: string, dni: string | null };
    const course = cert.courses as { name: string, code: string, tracks: { name: string } };
    return [
      cert.id,
      student.name,
      student.email,
      student.dni || '',
      course.name,
      course.code,
      course.tracks.name,
      cert.issue_date,
      cert.status,
      cert.qualification !== null ? String(cert.qualification) : '',
      cert.is_valid ? 'Sí' : 'No',
      cert.created_at,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = `${BOM + headers.join(',')}\n${rows.join('\n')}`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="certificados-${new Date().toISOString().substring(0, 10)}.csv"`,
    },
  });
});

export { analytics as analyticsRoutes };
