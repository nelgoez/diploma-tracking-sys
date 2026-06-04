import type { HonoVariables } from '../types/hono';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { logAudit } from '../services/audit-log';
import { createNotification } from '../services/notification.service';

const overrides = new Hono<{ Variables: HonoVariables }>();

overrides.use('/*', authenticate);

const createOverrideSchema = z.object({
  student_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  expires_at: z.string().datetime().optional(),
});

overrides.get('/', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const studentId = c.req.query('student_id');
  const status = c.req.query('status');
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('manual_overrides')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[overrides] Query error:', error.message);
      return c.json({ data: [], pagination: { page, limit, total: 0 } });
    }

    return c.json({
      data: data || [],
      pagination: { page, limit, total: count || 0 },
    });
  }
  catch (err) {
    console.error('[overrides] Unexpected error:', (err as Error).message);
    return c.json({ data: [], pagination: { page, limit, total: 0 } });
  }
});

overrides.post('/', requireRole('coordinador', 'admin', 'sysadmin'), zValidator('json', createOverrideSchema), async (c) => {
  const auth = c.get('auth');
  const { student_id, rule_id, reason, expires_at } = c.req.valid('json');

  const { data: existing } = await supabase
    .from('manual_overrides')
    .select('id')
    .eq('student_id', student_id)
    .eq('rule_id', rule_id)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    return c.json({ error: 'An active override already exists for this student and rule' }, 409);
  }

  const { data: override, error } = await supabase
    .from('manual_overrides')
    .insert({
      student_id,
      rule_id,
      reason,
      expires_at: expires_at || null,
      status: 'active',
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to create override' }, 500);
  }

  await logAudit({
    userId: auth.userId,
    action: 'override_created',
    entityType: 'manual_override',
    entityId: override.id,
    details: { student_id, rule_id, reason, expires_at: expires_at ?? null },
  });

  createNotification({
    studentId: student_id,
    type: 'override_applied',
    title: 'Excepción aplicada por coordinador',
    body: `Se aplicó una excepción a tu trayecto. Motivo: ${reason}${expires_at ? `. Vence: ${new Date(expires_at).toLocaleDateString()}` : ''}`,
    entityType: 'manual_override',
    entityId: override.id,
  }).catch(err => console.error('[overrides] Notification creation failed:', err));

  return c.json(override, 201);
});

overrides.put('/:id/revoke', requireRole('coordinador', 'admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const { id } = c.req.param();

  const { data: existing } = await supabase
    .from('manual_overrides')
    .select('status')
    .eq('id', id)
    .single();

  if (!existing) {
    return c.json({ error: 'Override not found' }, 404);
  }

  if (existing.status !== 'active') {
    return c.json({ error: `Cannot revoke override with status "${existing.status}"` }, 409);
  }

  const { data: override, error } = await supabase
    .from('manual_overrides')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Failed to revoke override' }, 500);
  }

  await logAudit({
    userId: auth.userId,
    action: 'override_revoked',
    entityType: 'manual_override',
    entityId: id,
  });

  if (override.student_id) {
    createNotification({
      studentId: override.student_id,
      type: 'override_applied',
      title: 'Excepción revocada por coordinador',
      body: 'Se revocó la excepción aplicada a tu trayecto. Esto puede afectar tu habilitación.',
      entityType: 'manual_override',
      entityId: id,
    }).catch(err => console.error('[overrides] Revoke notification failed:', err));
  }

  return c.json(override);
});

export { overrides as overridesRoutes };
