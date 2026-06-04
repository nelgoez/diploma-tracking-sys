import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../services/audit-log';
import { createEligibilityDataAccess } from '../services/eligibility-data-access';
import { guaraniService } from '../services/guarani.service';
import { createNotification } from '../services/notification.service';
import { evaluateTrackEligibility } from '../services/rule-engine';

const enrollments = new Hono<{ Variables: HonoVariables }>();

enrollments.use('/*', authenticate);

enrollments.get('/', async (c) => {
  const studentId = c.req.query('student_id');
  const courseId = c.req.query('course_id');
  const examHistory = c.req.query('exam_history') === 'true';
  const cohort = c.req.query('cohort');

  // eslint-disable-next-line ts/no-explicit-any
  let query: any = supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      student:students(id, name, email),
      course:courses(id, name, code),
      track:tracks(id, name)
    `)
    .order('exam_date', { ascending: false });

  if (examHistory) {
    query = query.not('exam_status', 'is', null);
  }

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  if (cohort) {
    query = query.like('exam_date', `${cohort}%`);
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
    ...createEligibilityDataAccess(),
  });

  return c.json(result);
});

enrollments.post('/', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();

  if (body.student_id !== auth.userId && !['admin', 'sysadmin'].includes(auth.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { data, error } = await supabaseAdmin
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

enrollments.post('/batch', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const body = await c.req.json();
  const trackId = body.track_id as string;
  const emails = body.emails as string[];

  if (!trackId || !emails || !Array.isArray(emails) || emails.length === 0) {
    return c.json({ error: 'track_id and emails array are required' }, 400);
  }

  const { data: track } = await supabaseAdmin
    .from('tracks')
    .select('id')
    .eq('id', trackId)
    .single();

  if (!track) {
    return c.json({ error: 'Track not found' }, 404);
  }

  const summary = {
    created_students: 0,
    new_enrollments: 0,
    already_enrolled: 0,
    errors: [] as { email: string, reason: string }[],
  };

  for (const email of emails) {
    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail.includes('@')) {
      summary.errors.push({ email: String(email), reason: 'Invalid email format' });
      continue;
    }

    try {
      let { data: student } = await supabaseAdmin
        .from('students')
        .select('id, email')
        .eq('email', trimmedEmail)
        .single();

      if (!student) {
        const { data: newStudent, error: createError } = await supabaseAdmin
          .from('students')
          .insert({
            email: trimmedEmail,
            name: trimmedEmail.split('@')[0],
            is_active: true,
            role: 'estudiante',
          })
          .select('id, email')
          .single();

        if (createError) {
          summary.errors.push({ email: trimmedEmail, reason: 'Failed to create student' });
          continue;
        }
        student = newStudent;
        summary.created_students++;
      }

      const { data: existingEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .eq('student_id', student.id)
        .eq('track_id', trackId)
        .maybeSingle();

      if (existingEnrollment) {
        summary.already_enrolled++;
        continue;
      }

      const { error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .insert({
          student_id: student.id,
          track_id: trackId,
          status: 'pending',
        });

      if (enrollError) {
        summary.errors.push({ email: trimmedEmail, reason: 'Failed to enroll' });
        continue;
      }

      summary.new_enrollments++;
    }
    catch {
      summary.errors.push({ email: trimmedEmail, reason: 'Unexpected error' });
    }
  }

  return c.json(summary, 201);
});

enrollments.put('/:id/exam', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const examDate = body.exam_date as string | undefined;

  if (!examDate) {
    return c.json({ error: 'exam_date is required' }, 400);
  }

  const { data: enrollment, error: fetchError } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !enrollment) {
    return c.json({ error: 'Enrollment not found' }, 404);
  }

  const { data: existing } = await supabaseAdmin
    .from('enrollments')
    .select('id')
    .eq('student_id', enrollment.student_id)
    .eq('exam_date', examDate)
    .not('exam_status', 'is', null)
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({ error: 'Student already has an exam registered on this date' }, 409);
  }

  const eligibility = await evaluateTrackEligibility({
    studentId: enrollment.student_id,
    trackId: enrollment.track_id,
    ...createEligibilityDataAccess(),
  });

  if (!eligibility.eligible) {
    return c.json({ error: 'Student is not eligible for exam', eligibility }, 409);
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('enrollments')
    .update({
      exam_status: 'inscripto',
      exam_date: examDate,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return c.json({ error: 'Failed to register exam' }, 500);
  }

  return c.json(updated);
});

enrollments.put('/:id/grade', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();
  const body = await c.req.json();
  const grade = Number(body.qualification);

  if (!Number.isFinite(grade) || grade < 1 || grade > 10) {
    return c.json({ error: 'qualification must be a number between 1 and 10' }, 400);
  }

  const { data: enrollment, error: fetchError } = await supabaseAdmin
    .from('enrollments')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !enrollment) {
    return c.json({ error: 'Enrollment not found' }, 404);
  }

  if (enrollment.exam_status !== 'inscripto') {
    return c.json({ error: 'Student is not registered for an exam' }, 409);
  }

  const updateData: Record<string, unknown> = {
    qualification: grade,
    exam_status: grade >= 4 ? 'aprobado' : 'desaprobado',
    completion_date: new Date().toISOString().split('T')[0],
  };

  if (grade >= 4) {
    updateData.status = 'completed';
  }

  if (body.observations) {
    updateData.observations = body.observations;
  }

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to update enrollment' }, 500);
  }

  if (grade >= 4 && enrollment.track_id) {
    guaraniService.pushDiploma(data.student_id, {
      trackId: enrollment.track_id,
      grade,
      courseName: 'Módulo Integrador',
    }).catch(err =>
      console.error('[Enrollments] Background diploma push to Guaraní failed:', err),
    );

    await logAudit({
      userId: auth?.userId,
      action: 'grade_recorded',
      entityType: 'enrollment',
      entityId: enrollment.id,
      details: {
        grade,
        exam_status: grade >= 4 ? 'aprobado' : 'desaprobado',
        student_id: data.student_id,
        course_id: enrollment.course_id,
        track_id: enrollment.track_id,
      },
    });
  }

  createNotification({
    studentId: data.student_id,
    type: 'exam_graded',
    title: grade >= 4 ? `Examen aprobado — Nota: ${grade}` : `Examen desaprobado — Nota: ${grade}`,
    body: grade >= 4
      ? '¡Felicitaciones! Aprobaste el examen integrador.'
      : 'No alcanzaste la nota mínima. Podés reinscribirte en la próxima fecha.',
    entityType: 'enrollment',
    entityId: id,
  }).catch(err => console.error('[enrollments] Grade notification failed:', err));

  return c.json(data);
});

export { enrollments as enrollmentsRoutes };
