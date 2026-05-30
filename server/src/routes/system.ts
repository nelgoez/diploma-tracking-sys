import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

const system = new Hono<{ Variables: HonoVariables }>();

system.use('/*', authenticate);
system.use('/*', requireRole('sysadmin'));

system.get('/diagnostics', async (c) => {
  const tables = ['students', 'tracks', 'courses', 'certificates', 'enrollments', 'prerequisite_rules', 'manual_overrides', 'integration_logs', 'audit_log'];

  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count, error } = await supabaseAdmin
      .from(table as never)
      .select('*', { count: 'exact', head: true });
    counts[table] = error ? -1 : (count ?? 0);
  }

  const { data: lastMoodleSync } = await supabaseAdmin
    .from('integration_logs')
    .select('created_at')
    .eq('integration_type', 'moodle')
    .eq('operation', 'sync')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastGuaraniSync } = await supabaseAdmin
    .from('integration_logs')
    .select('created_at')
    .eq('integration_type', 'guarani')
    .eq('operation', 'sync')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: recentErrors } = await supabaseAdmin
    .from('integration_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'error')
    .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());

  return c.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mock_mode: process.env.MOCK_MODE === 'true',
    db: { status: 'connected', tables: counts },
    integrations: {
      moodle: { last_sync: lastMoodleSync?.created_at ?? null },
      guarani: { last_sync: lastGuaraniSync?.created_at ?? null },
      recent_errors_7d: recentErrors ?? 0,
    },
  });
});

system.get('/audit-log', async (c) => {
  const limit = Math.min(Number(c.req.query('limit')) || 50, 200);
  const entityType = c.req.query('entity_type');
  const action = c.req.query('action');

  // eslint-disable-next-line ts/no-explicit-any
  let query: any = supabaseAdmin
    .from('audit_log')
    .select(`
      *,
      user:user_id (
        id, name, email, role
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityType) { query = query.eq('entity_type', entityType); }
  if (action) { query = query.eq('action', action); }

  const { data, error } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch audit log' }, 500);
  }

  return c.json(data || []);
});

system.get('/db-health', async (c) => {
  const start = Date.now();

  const { error } = await supabaseAdmin
    .from('students')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  return c.json({
    status: error ? 'error' : 'healthy',
    latency_ms: Date.now() - start,
    error: error ? error.message : null,
  });
});

export { system as systemRoutes };
