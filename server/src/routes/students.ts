import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

const students = new Hono<{ Variables: HonoVariables }>();

students.use('/*', authenticate);

students.get('/', requireRole('admin', 'sysadmin', 'coordinador'), async (c) => {
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const search = c.req.query('search') || '';
  const status = c.req.query('status');

  let query = supabaseAdmin
    .from('students')
    .select('*', { count: 'exact' })
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
    console.error('[students] Error fetching:', error);
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

students.get('/:id', async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();

  if (auth.role === 'estudiante') {
    const { data: ownStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', auth.email)
      .single();
    if (!ownStudent || ownStudent.id !== id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return c.json({ error: 'Student not found' }, 404);
  }

  return c.json(data);
});

students.get('/:id/progress', async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();

  if (auth.role === 'estudiante') {
    const { data: ownStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', auth.email)
      .single();
    if (!ownStudent || ownStudent.id !== id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (!student) {
    return c.json({ error: 'Student not found' }, 404);
  }

  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id,
      status,
      track_id,
      qualification,
      course:courses(id, name, code, credits, order_index)
    `)
    .eq('student_id', id);

  const { data: certificates } = await supabaseAdmin
    .from('certificates')
    .select('course_id')
    .eq('student_id', id)
    .eq('status', 'approved')
    .eq('is_valid', true);

  const approvedCourseIds = new Set((certificates || []).map(c => c.course_id));

  const modules = (enrollments || []).map((enr) => {
    const course = enr.course as unknown as { id: string, name: string, credits: number } | undefined;
    const completed = approvedCourseIds.has(course?.id || '');
    let status: 'completed' | 'in_progress' | 'pending' | 'error' = 'pending';
    if (completed) { status = 'completed'; }
    else if (enr.status === 'in_progress') { status = 'in_progress'; }
    else if (enr.status === 'completed') { status = 'completed'; }

    return {
      courseId: course?.id,
      courseName: course?.name || '',
      credits: course?.credits || 0,
      status,
      qualification: enr.qualification || null,
    };
  });

  const completedModules = modules.filter(m => m.status === 'completed').length;
  const totalModules = modules.length;

  const totalCredits = modules.reduce((sum, m) => sum + m.credits, 0);
  const accumulatedCredits = modules
    .filter(m => m.status === 'completed')
    .reduce((sum, m) => sum + m.credits, 0);

  const incompleteModules = modules.filter(m => m.status !== 'completed');
  const nextSteps = incompleteModules.length > 0
    ? incompleteModules.map(m => m.courseName)
    : [];

  return c.json({
    studentId: id,
    totalModules,
    completedModules,
    totalCredits,
    accumulatedCredits,
    progressPercentage: totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0,
    status: totalModules > 0 && completedModules === totalModules ? 'completed' : 'in_progress',
    modules,
    nextSteps: nextSteps.slice(0, 5),
  });
});

students.get('/:id/certificates', async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();

  if (auth.role === 'estudiante') {
    const { data: ownStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', auth.email)
      .single();
    if (!ownStudent || ownStudent.id !== id) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }

  const { data, error } = await supabaseAdmin
    .from('certificates')
    .select(`
      *,
      course:courses(id, name, code, credits)
    `)
    .eq('student_id', id)
    .order('issue_date', { ascending: false });

  if (error) {
    return c.json({ error: 'Failed to fetch certificates' }, 500);
  }

  return c.json(data || []);
});

export { students as studentsRoutes };
