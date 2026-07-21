import type { HonoVariables } from '../types/hono';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { createEligibilityDataAccess } from '../services/eligibility-data-access';
import { evaluateEligibilityFromData, evaluateTrackEligibility } from '../services/rule-engine';

const coordinator = new Hono<{ Variables: HonoVariables }>();

coordinator.use('/*', authenticate);
coordinator.use('/*', requireRole('coordinador', 'admin', 'sysadmin'));

coordinator.get('/dashboard', async (c) => {
  const auth = c.get('auth');

  const { data: coordTracks } = await supabase
    .from('track_coordinators' as never)
    .select('track_id')
    .eq('user_id', auth.userId) as never;

  const rows = coordTracks as unknown as Array<{ track_id: string }> | null;
  const managedTrackIds = (rows || []).map(t => t.track_id);

  const trackQuery = managedTrackIds.length > 0
    ? supabase.from('tracks').select('*').in('id', managedTrackIds).eq('is_active', true)
    : supabase.from('tracks').select('*').eq('is_active', true);

  const { data: tracks } = await trackQuery;

  if (!tracks || tracks.length === 0) {
    return c.json({ tracks: [] });
  }

  const trackSummaries = [];

  for (const track of tracks) {
    const { count: totalEnrolled } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', track.id)
      .eq('status', 'active');

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('track_id', track.id)
      .eq('status', 'active');

    const studentIds = (enrollments || []).map(e => e.student_id);

    let eligibleCount = 0;
    let notEligibleCount = 0;

    if (studentIds.length > 0) {
      const [rulesResult, certsResult, overridesResult] = await Promise.all([
        supabase.from('prerequisite_rules').select('*').eq('target_course_id', track.id).eq('is_active', true).order('order_index', { ascending: true }),
        supabase.from('certificates').select('student_id, course_id').in('student_id', studentIds).eq('status', 'approved').eq('is_valid', true),
        supabase.from('manual_overrides').select('*').in('student_id', studentIds).eq('status', 'active'),
      ]);

      const rules = rulesResult.data || [];

      const certsByStudent = new Map<string, string[]>();
      for (const cert of certsResult.data || []) {
        if (!certsByStudent.has(cert.student_id)) { certsByStudent.set(cert.student_id, []); }
        certsByStudent.get(cert.student_id)!.push(cert.course_id);
      }

      const overridesByStudent = new Map<string, any[]>();
      for (const o of overridesResult.data || []) {
        if (!overridesByStudent.has(o.student_id)) { overridesByStudent.set(o.student_id, []); }
        overridesByStudent.get(o.student_id)!.push(o);
      }

      let sources: any[] = [];
      if (rules.length > 0) {
        const { data: srcData } = await supabase
          .from('prerequisite_sources')
          .select('*')
          .in('rule_id', rules.map(r => r.id));
        sources = srcData || [];
      }

      for (const studentId of studentIds) {
        try {
          const result = evaluateEligibilityFromData({
            studentId,
            trackId: track.id,
            rules,
            sources,
            passedCourseIds: certsByStudent.get(studentId) || [],
            overrides: overridesByStudent.get(studentId) || [],
          });
          if (result.eligible) { eligibleCount++; }
          else { notEligibleCount++; }
        }
        catch {
          notEligibleCount++;
        }
      }
    }

    const { count: pendingGrades } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('track_id', track.id)
      .eq('exam_status', 'inscripto');

    trackSummaries.push({
      track_id: track.id,
      track_name: track.name,
      track_code: track.code,
      total_enrolled: totalEnrolled || 0,
      eligible: eligibleCount,
      not_eligible: notEligibleCount,
      pending_grades: pendingGrades || 0,
    });
  }

  return c.json({ tracks: trackSummaries });
});

coordinator.get('/students', async (c) => {
  const trackId = c.req.query('track_id');
  const search = c.req.query('search');
  const eligibility = c.req.query('eligibility');
  const examStatus = c.req.query('exam_status');
  const fromDate = c.req.query('from_date');
  const toDate = c.req.query('to_date');
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  if (!trackId) {
    return c.json({ error: 'track_id is required' }, 400);
  }

  let enrollmentQuery = supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      exam_status,
      exam_date,
      qualification,
      students!inner(id, name, email, dni)
    `, { count: 'exact' })
    .eq('track_id', trackId)
    .eq('status', 'active');

  if (search) {
    enrollmentQuery = enrollmentQuery.or(
      `students.name.ilike.%${search}%,students.email.ilike.%${search}%,students.dni.ilike.%${search}%`,
      { referencedTable: 'students' },
    );
  }

  if (examStatus && examStatus !== 'all') {
    enrollmentQuery = enrollmentQuery.eq('exam_status', examStatus);
  }

  if (fromDate) {
    enrollmentQuery = enrollmentQuery.gte('exam_date', fromDate);
  }

  if (toDate) {
    enrollmentQuery = enrollmentQuery.lte('exam_date', toDate);
  }

  const { data: enrollments, error, count } = await enrollmentQuery
    .order('exam_status', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return c.json({ error: 'Failed to fetch students' }, 500);
  }

  const dataAccess = createEligibilityDataAccess();
  const students = [];

  for (const enrollment of (enrollments || [])) {
    const row = enrollment as unknown as Record<string, unknown>;
    const studentData = (row.students as Record<string, unknown>) || {};

    let isEligible: boolean | null = null;

    try {
      const eligibilityResult = await evaluateTrackEligibility({
        studentId: row.student_id as string,
        trackId,
        ...dataAccess,
      });
      isEligible = eligibilityResult.eligible;
    }
    catch {
      isEligible = null;
    }

    if (eligibility && eligibility !== 'all' && eligibility !== String(isEligible)) {
      continue;
    }

    students.push({
      enrollment_id: row.id,
      student_id: row.student_id,
      name: studentData.name,
      email: studentData.email,
      dni: studentData.dni,
      exam_status: row.exam_status,
      exam_date: row.exam_date,
      qualification: row.qualification,
      eligible: isEligible,
    });
  }

  return c.json({
    data: students,
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  });
});

const bulkGradeSchema = z.object({
  exam_date: z.string(),
  grades: z.array(z.object({
    enrollment_id: z.string().uuid(),
    grade: z.number().int().min(1).max(10),
  })),
});

coordinator.post('/bulk-grade', zValidator('json', bulkGradeSchema), async (c) => {
  const body = c.req.valid('json');
  const auth = c.get('auth');
  const now = new Date().toISOString();

  const enrollmentIds = body.grades.map(g => g.enrollment_id);
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, exam_status, student_id, track_id')
    .in('id', enrollmentIds);

  const enrollmentMap = new Map((enrollments || []).map(e => [e.id, e]));

  const results: Array<{ enrollment_id: string, success: boolean, error?: string }> = [];
  const updateTasks: Array<{ enrollment_id: string, promise: Promise<void> }> = [];

  for (const entry of body.grades) {
    const enrollment = enrollmentMap.get(entry.enrollment_id);
    if (!enrollment) {
      results.push({ enrollment_id: entry.enrollment_id, success: false, error: 'Enrollment not found' });
      continue;
    }
    if (enrollment.exam_status !== 'inscripto') {
      results.push({
        enrollment_id: entry.enrollment_id,
        success: false,
        error: `Expected exam_status=inscripto, got ${enrollment.exam_status}`,
      });
      continue;
    }

    const newStatus = entry.grade >= 4 ? 'aprobado' : 'desaprobado';
    const eid = entry.enrollment_id;
    const grade = entry.grade;

    updateTasks.push({
      enrollment_id: eid,
      promise: (async () => {
        await supabase
          .from('enrollments')
          .update({
            qualification: grade,
            exam_status: newStatus,
            updated_at: now,
          } as unknown as Record<string, unknown> as never)
          .eq('id', eid);

        await supabase.from('audit_log').insert({
          user_id: auth.userId,
          action: 'grade_recorded',
          entity_type: 'enrollments',
          entity_id: eid,
          details: {
            grade,
            result: newStatus,
            graded_by: auth.userId,
            bulk_grading: true,
            exam_date: body.exam_date,
          },
          created_at: now,
        } as any);
      })(),
    });
  }

  const settled = await Promise.allSettled(updateTasks.map(async t => t.promise));

  for (let i = 0; i < updateTasks.length; i++) {
    const st = settled[i];
    if (st.status === 'fulfilled') {
      results.push({ enrollment_id: updateTasks[i].enrollment_id, success: true });
    }
    else {
      results.push({
        enrollment_id: updateTasks[i].enrollment_id,
        success: false,
        error: st.reason instanceof Error ? st.reason.message : 'Update failed',
      });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return c.json({
    summary: { total: results.length, succeeded, failed },
    results,
  });
});

export { coordinator as coordinatorRoutes };
