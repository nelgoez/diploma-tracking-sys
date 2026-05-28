import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { supabase, supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { evaluateTrackEligibility } from '../services/rule-engine';

const enrollments = new Hono<{ Variables: HonoVariables }>();

enrollments.use('/*', authenticate);

enrollments.get('/', async (c) => {
  const studentId = c.req.query('student_id');
  const courseId = c.req.query('course_id');

  let query = supabase
    .from('enrollments')
    .select(`
      *,
      student:students(id, name, email),
      course:courses(id, name, code),
      track:tracks(id, name)
    `)
    .order('created_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch enrollments' }, 500);
  }

  return c.json(data || []);
});

enrollments.get('/eligibility/:studentId', async (c) => {
  const { studentId } = c.req.param();
  const trackId = c.req.query('track_id');

  if (!trackId) {
    return c.json({ error: 'track_id query parameter is required' }, 400);
  }

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!student) {
    return c.json({ error: 'Student not found' }, 404);
  }

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('student_id', studentId)
    .eq('track_id', trackId)
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    return c.json({ error: 'Student not enrolled in this track' }, 404);
  }

  const result = await evaluateTrackEligibility({
    studentId,
    trackId,
    getRulesForTrack: async (tid) => {
      const { data } = await supabaseAdmin
        .from('prerequisite_rules')
        .select('*')
        .eq('target_course_id', tid)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      return data || [];
    },
    getSourcesForRules: async (ruleIds) => {
      const { data } = await supabaseAdmin
        .from('prerequisite_sources')
        .select('*')
        .in('rule_id', ruleIds);
      return data || [];
    },
    getStudentCertificates: async (sid) => {
      const { data } = await supabaseAdmin
        .from('certificates')
        .select('course_id')
        .eq('student_id', sid)
        .eq('status', 'approved')
        .eq('is_valid', true);
      return (data || []).map(cert => cert.course_id);
    },
    getActiveOverrides: async (sid) => {
      const { data } = await supabaseAdmin
        .from('manual_overrides')
        .select('*')
        .eq('student_id', sid)
        .eq('status', 'active');
      return data || [];
    },
  });

  return c.json(result);
});

enrollments.post('/', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();

  if (body.student_id !== auth.userId && !['admin', 'sysadmin'].includes(auth.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { data, error } = await supabase
    .from('enrollments')
    .insert({
      student_id: body.student_id,
      course_id: body.course_id,
      track_id: body.track_id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to create enrollment' }, 500);
  }

  return c.json(data, 201);
});

enrollments.put('/:id/grade', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  const updateData: Record<string, unknown> = {
    qualification: body.qualification,
  };

  if (body.qualification >= 4) {
    updateData.status = 'completed';
    updateData.completion_date = new Date().toISOString().split('T')[0];
  }

  if (body.observations) {
    updateData.observations = body.observations;
  }

  const { data, error } = await supabase
    .from('enrollments')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to update enrollment' }, 500);
  }

  return c.json(data);
});

export { enrollments as enrollmentsRoutes };
