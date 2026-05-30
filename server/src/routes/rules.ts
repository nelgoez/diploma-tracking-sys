import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../services/audit-log';
import { createEligibilityDataAccess } from '../services/eligibility-data-access';
import { evaluateTrackEligibility } from '../services/rule-engine';

const rules = new Hono<{ Variables: HonoVariables }>();

rules.use('/*', authenticate);

rules.get('/', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const trackId = c.req.query('track_id');

  let query = supabase
    .from('prerequisite_rules')
    .select(`
      *,
      target_course:courses!target_course_id(id, name, code),
      sources:prerequisite_sources(source_course_id)
    `)
    .order('order_index', { ascending: true });

  if (trackId) {
    query = query.eq('target_course_id', trackId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch rules' }, 500);
  }

  return c.json(data || []);
});

rules.post('/', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();

  const { data: rule, error: ruleError } = await supabase
    .from('prerequisite_rules')
    .insert({
      target_course_id: body.target_course_id,
      condition: body.condition || 'ALL',
      parent_rule_id: body.parent_rule_id || null,
      order_index: body.order_index ?? 0,
      is_active: true,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (ruleError) {
    return c.json({ error: 'Failed to create rule' }, 500);
  }

  if (body.source_course_ids && body.source_course_ids.length > 0) {
    const sources = body.source_course_ids.map((sourceId: string) => ({
      rule_id: rule.id,
      source_course_id: sourceId,
    }));

    const { error: sourcesError } = await supabase
      .from('prerequisite_sources')
      .insert(sources);

    if (sourcesError) {
      await supabase.from('prerequisite_rules').delete().eq('id', rule.id);
      return c.json({ error: 'Failed to create rule sources' }, 500);
    }
  }

  await logAudit({
    userId: auth.userId,
    action: 'rule_created',
    entityType: 'prerequisite_rule',
    entityId: rule.id,
    details: { condition: body.condition || 'ALL', target_course_id: body.target_course_id },
  });

  return c.json(rule, 201);
});

rules.put('/:id', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();
  const body = await c.req.json();

  const updateData: Record<string, unknown> = {};
  if (body.condition !== undefined) { updateData.condition = body.condition; }
  if (body.is_active !== undefined) { updateData.is_active = body.is_active; }
  if (body.order_index !== undefined) { updateData.order_index = body.order_index; }
  if (body.parent_rule_id !== undefined) { updateData.parent_rule_id = body.parent_rule_id; }
  if (body.target_course_id !== undefined) { updateData.target_course_id = body.target_course_id; }

  const { data: rule, error } = await supabase
    .from('prerequisite_rules')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to update rule' }, 500);
  }

  if (body.source_course_ids !== undefined) {
    await supabase.from('prerequisite_sources').delete().eq('rule_id', id);

    if (body.source_course_ids.length > 0) {
      const sources = body.source_course_ids.map((sourceId: string) => ({
        rule_id: id,
        source_course_id: sourceId,
      }));
      await supabase.from('prerequisite_sources').insert(sources);
    }
  }

  await logAudit({
    userId: auth.userId,
    action: 'rule_updated',
    entityType: 'prerequisite_rule',
    entityId: id,
    details: { condition: body.condition, is_active: body.is_active, target_course_id: body.target_course_id },
  });

  return c.json(rule);
});

rules.delete('/:id', requireRole('admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();

  await supabase.from('prerequisite_sources').delete().eq('rule_id', id);

  const { error } = await supabase
    .from('prerequisite_rules')
    .delete()
    .eq('id', id);

  if (error) {
    return c.json({ error: 'Failed to delete rule' }, 500);
  }

  await logAudit({
    userId: auth.userId,
    action: 'rule_deleted',
    entityType: 'prerequisite_rule',
    entityId: id,
  });

  return c.json({ success: true });
});

rules.post('/evaluate', async (c) => {
  const body = await c.req.json();
  const { student_id, track_id } = body;

  if (!student_id || !track_id) {
    return c.json({ error: 'student_id and track_id are required' }, 400);
  }

  const result = await evaluateTrackEligibility({
    studentId: student_id,
    trackId: track_id,
    ...createEligibilityDataAccess(),
  });

  return c.json(result);
});

export { rules as rulesRoutes };
