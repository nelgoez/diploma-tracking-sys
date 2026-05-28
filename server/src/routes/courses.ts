import { Hono } from 'hono';
import { supabase, supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';

const courses = new Hono();

courses.use('/*', authenticate);

courses.get('/', async (c) => {
  const trackId = c.req.query('track_id');

  let query = supabase
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

  const { data, error } = await supabase
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

export { courses as coursesRoutes };
