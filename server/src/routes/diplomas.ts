import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { generateDiplomaForEnrollment, getDiplomaStatus } from '../services/pdf.service';

const diplomas = new Hono<{ Variables: HonoVariables }>();
diplomas.use('/*', authenticate);

const diplomaDb = () => supabaseAdmin.from('diploma_files' as never) as any;

diplomas.get('/:enrollmentId/status', async (c) => {
  const auth = c.get('auth');
  const { enrollmentId } = c.req.param();

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('student_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) {
    return c.json({ error: 'Enrollment not found' }, 404);
  }

  const isOwner = enrollment.student_id === auth.userId;
  const isStaff = ['coordinador', 'admin', 'sysadmin'].includes(auth.role);
  if (!isOwner && !isStaff) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const status = await getDiplomaStatus(enrollmentId);
  return c.json(status);
});

diplomas.get('/:enrollmentId/download', async (c) => {
  const auth = c.get('auth');
  const { enrollmentId } = c.req.param();

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('student_id')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) {
    return c.json({ error: 'Enrollment not found' }, 404);
  }

  const isOwner = enrollment.student_id === auth.userId;
  const isStaff = ['coordinador', 'admin', 'sysadmin'].includes(auth.role);
  if (!isOwner && !isStaff) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { data: diploma } = await diplomaDb()
    .select('file_path')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'generated')
    .single();

  if (!diploma) {
    const status = await getDiplomaStatus(enrollmentId);
    if (status.status === 'pending') {
      return c.json({ error: 'Diploma not yet generated', status: 'pending' }, 404);
    }
    return c.json({ error: 'Diploma not available' }, 404);
  }

  const { data: fileData } = await supabaseAdmin.storage
    .from('diplomas')
    .download(diploma.file_path);

  if (!fileData) {
    return c.json({ error: 'File not found in storage' }, 404);
  }

  const fileName = `diploma-${enrollmentId}.pdf`;
  return new Response(fileData, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
});

diplomas.post('/:enrollmentId/generate', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const { enrollmentId } = c.req.param();

  const result = await generateDiplomaForEnrollment(enrollmentId, auth.userId);

  if (result.status === 'error') {
    return c.json({ error: result.errorMessage }, 500);
  }

  return c.json(result, 201);
});

export { diplomas as diplomasRoutes };
