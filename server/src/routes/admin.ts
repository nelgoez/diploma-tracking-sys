import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

const admin = new Hono();

admin.use('/*', authenticate);
admin.use('/*', requireRole('admin', 'sysadmin'));

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['estudiante', 'coordinador', 'admin', 'sysadmin']).default('estudiante'),
  dni: z.string().optional(),
});

admin.post('/users', zValidator('json', createUserSchema), async (c) => {
  const { email, password, name, role, dni } = c.req.valid('json');

  const { data: existing } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return c.json({ error: 'Email already in use' }, 409);
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (authError || !authUser.user) {
    return c.json({ error: authError?.message || 'Failed to create user' }, 500);
  }

  const { data: student, error: studentError } = await supabaseAdmin
    .from('students')
    .insert({
      id: authUser.user.id,
      email,
      name,
      role,
      dni: dni || null,
      is_active: true,
    })
    .select()
    .single();

  if (studentError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return c.json({ error: 'Failed to create student record' }, 500);
  }

  return c.json(student, 201);
});

admin.get('/dashboard-stats', async (c) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalStudents },
    { count: activeStudents },
    { count: activeTracks },
    { count: totalCertificates },
    { data: eligibleData },
    { count: totalEnrollments },
    { count: completedCount },
    { count: pendingEnrollments },
    { count: recentSyncErrors },
  ] = await Promise.all([
    supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('tracks').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('certificates').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('certificates').select('student_id').eq('status', 'approved'),
    supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('integration_logs').select('*', { count: 'exact', head: true }).eq('status', 'error').gt('created_at', sevenDaysAgo),
  ]);

  const eligibleCount = new Set((eligibleData || []).map((s: { student_id: string }) => s.student_id)).size;
  const completionRate = totalEnrollments
    ? Math.round(((completedCount || 0) / totalEnrollments) * 1000) / 10
    : 0;

  return c.json({
    total_students: totalStudents || 0,
    active_students: activeStudents || 0,
    active_tracks: activeTracks || 0,
    total_certificates: totalCertificates || 0,
    eligible_count: eligibleCount,
    not_eligible_count: (activeStudents || 0) - eligibleCount,
    recent_sync_errors: recentSyncErrors || 0,
    completion_rate: completionRate,
    pending_enrollments: pendingEnrollments || 0,
  });
});

admin.get('/students', async (c) => {
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const search = c.req.query('search') || '';
  const status = c.req.query('status');

  let query = supabaseAdmin
    .from('students')
    .select(`
      *,
      certificates:certificates(count),
      enrollments:enrollments(count)
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,dni.ilike.%${search}%`);
  }

  if (status) {
    query = query.eq('is_active', status === 'active');
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch students' }, 500);
  }

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
});

admin.get('/courses', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('courses')
    .select(`
      *,
      track:tracks(id, name),
      certificates:certificates(count),
      enrollments:enrollments(count)
    `)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }

  return c.json(data || []);
});

admin.get('/tracks', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('tracks')
    .select(`
      *,
      courses:courses(count)
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return c.json({ error: 'Failed to fetch tracks' }, 500);
  }

  return c.json(data || []);
});

export { admin as adminRoutes };
