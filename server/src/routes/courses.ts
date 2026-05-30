import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { supabase, supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

const courses = new Hono();

courses.use('/*', authenticate);

courses.get('/', async (c) => {
  const trackId = c.req.query('track_id');

  let query = supabaseAdmin
    .from('courses')
    .select(`
      *,
      track:tracks(id, name, code)
    `)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (trackId) {
    query = query.eq('track_id', trackId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch courses' }, 500);
  }

  return c.json(data || []);
});

courses.get('/:id', async (c) => {
  const { id } = c.req.param();

  const { data, error } = await supabaseAdmin
    .from('courses')
    .select(`
      *,
      track:tracks(id, name, code)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return c.json({ error: 'Course not found' }, 404);
  }

  return c.json(data);
});

courses.get('/:id/prerequisites', async (c) => {
  const { id } = c.req.param();

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (!course) {
    return c.json({ error: 'Course not found' }, 404);
  }

  const { data: allRules } = await supabaseAdmin
    .from('prerequisite_rules')
    .select(`
      *,
      sources:prerequisite_sources(source_course_id)
    `)
    .eq('target_course_id', id)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  const rules = allRules || [];

  const allSourceIds = rules.flatMap(r =>
    (r.sources as { source_course_id: string }[] || []).map(s => s.source_course_id),
  );

  let sourceCourses: Record<string, unknown>[] = [];
  if (allSourceIds.length > 0) {
    const { data: courses } = await supabaseAdmin
      .from('courses')
      .select('id, name, code, credits')
      .in('id', allSourceIds);
    sourceCourses = courses || [];
  }

  function buildRuleTree(ruleList: typeof rules, parentId: string | null): unknown[] {
    return ruleList
      .filter(r => (r.parent_rule_id ?? null) === parentId)
      .map(rule => ({
        ...rule,
        children: buildRuleTree(ruleList, rule.id),
      }));
  }

  const ruleTree = buildRuleTree(rules, null);

  return c.json({
    course,
    rules: ruleTree,
    prerequisites: sourceCourses,
  });
});

const createCourseSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  track_id: z.string().uuid(),
  credits: z.number().int().min(0).optional().default(0),
  moodle_course_id: z.number().int().positive().optional(),
  is_integrator_exam: z.boolean().optional().default(false),
});

const updateCourseSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  credits: z.number().int().min(0).optional(),
  moodle_course_id: z.number().int().positive().optional(),
  order_index: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  is_integrator_exam: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

courses.post('/', requireRole('admin', 'sysadmin'), zValidator('json', createCourseSchema), async (c) => {
  const body = c.req.valid('json');

  const { data: track } = await supabaseAdmin
    .from('tracks')
    .select('id')
    .eq('id', body.track_id)
    .single();

  if (!track) {
    return c.json({ error: 'Track not found' }, 404);
  }

  const { data: maxOrder } = await supabaseAdmin
    .from('courses')
    .select('order_index')
    .eq('track_id', body.track_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  const orderIndex = (maxOrder?.order_index ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      name: body.name,
      code: body.code,
      track_id: body.track_id,
      credits: body.credits,
      moodle_course_id: body.moodle_course_id !== undefined ? String(body.moodle_course_id) : undefined,
      is_integrator_exam: body.is_integrator_exam,
      order_index: orderIndex,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'A course with this code already exists in this track' }, 409);
    }
    return c.json({ error: 'Failed to create course' }, 500);
  }

  return c.json(data, 201);
});

courses.patch('/:id', requireRole('admin', 'sysadmin'), zValidator('json', updateCourseSchema), async (c) => {
  const { id } = c.req.param();
  const body = c.req.valid('json');

  const { data: existing } = await supabaseAdmin
    .from('courses')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) {
    return c.json({ error: 'Course not found' }, 404);
  }

  const { moodle_course_id, ...restBody } = body;
  const updateData = {
    ...restBody,
    ...(moodle_course_id !== undefined && { moodle_course_id: String(moodle_course_id) }),
  };

  const { data, error } = await supabaseAdmin
    .from('courses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'A course with this code already exists in this track' }, 409);
    }
    return c.json({ error: 'Failed to update course' }, 500);
  }

  return c.json(data);
});

export { courses as coursesRoutes };
