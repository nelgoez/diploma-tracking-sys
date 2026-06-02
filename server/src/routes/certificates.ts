import { Hono } from 'hono';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { moodleService } from '../services/moodle.service';

const certificates = new Hono();

certificates.use('/*', authenticate);

certificates.get('/', async (c) => {
  const studentId = c.req.query('student_id');
  const status = c.req.query('status');

  let query = supabase
    .from('certificates')
    .select(`
      *,
      student:students(id, name, email),
      course:courses(id, name, code, credits)
    `)
    .order('issue_date', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch certificates' }, 500);
  }

  return c.json(data || []);
});

certificates.get('/:id', async (c) => {
  const { id } = c.req.param();

  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      student:students(id, name, email, dni),
      course:courses(id, name, code, credits)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return c.json({ error: 'Certificate not found' }, 404);
  }

  return c.json(data);
});

certificates.post('/sync', requireRole('admin', 'sysadmin'), async (c) => {
  try {
    const result = await moodleService.syncCertificates();

    return c.json({
      success: true,
      synced: result.certificatesNew + result.certificatesUpdated,
      certificates_new: result.certificatesNew,
      certificates_updated: result.certificatesUpdated,
      affected_students: result.affectedStudentIds.length,
      errors: 0,
    });
  }
  catch (err) {
    return c.json({
      success: false,
      error: err instanceof Error ? err.message : 'Sync failed',
    }, 500);
  }
});

certificates.post('/:id/resync', requireRole('admin', 'sysadmin'), async (c) => {
  const { id } = c.req.param();

  const { data: cert, error: certErr } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .single();

  if (certErr || !cert) {
    return c.json({ error: 'Certificate not found' }, 404);
  }

  try {
    const freshCerts = await moodleService.fetchCertificates(cert.student_id);

    const match = freshCerts.find(
      fc => String(fc.courseId) === String(cert.course_id)
        || fc.externalId === cert.moodle_certificate_id,
    );

    if (!match) {
      const { error: updateErr } = await supabase
        .from('certificates')
        .update({ status: 'error', is_valid: false })
        .eq('id', id);

      if (updateErr) {
        console.error('[Certificates] Status update failed:', updateErr.message);
      }

      return c.json({
        ...cert,
        status: 'error',
        is_valid: false,
        message: 'Certificate no longer found in Moodle',
      });
    }

    const { data: updated, error: upsertErr } = await supabase
      .from('certificates')
      .upsert({
        student_id: cert.student_id,
        course_id: cert.course_id,
        moodle_certificate_id: match.externalId ?? null,
        issue_date: match.issueDate,
        status: 'approved',
        qualification: match.qualification ?? null,
        is_valid: true,
      }, {
        onConflict: 'student_id,course_id',
        ignoreDuplicates: false,
      })
      .select('*')
      .single();

    if (upsertErr) {
      console.error('[Certificates] Resync upsert failed:', upsertErr.message);
      return c.json({ error: 'Failed to update certificate' }, 500);
    }

    return c.json(updated);
  }
  catch (err) {
    return c.json({
      error: `Resync failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, 500);
  }
});

export { certificates as certificatesRoutes };
