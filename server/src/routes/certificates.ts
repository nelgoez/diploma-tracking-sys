import { Hono } from 'hono';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

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
  // TODO: Implement actual Moodle sync
  // Placeholder response
  return c.json({
    success: true,
    synced: 0,
    errors: 0,
    message: 'Moodle sync placeholder - implement with actual API',
  });
});

export { certificates as certificatesRoutes };
