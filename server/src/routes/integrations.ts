import { Hono } from 'hono';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { guaraniService } from '../services/guarani.service';
import { logSyncComplete, logSyncStart } from '../services/integration-logs';
import { moodleService } from '../services/moodle.service';

const integrations = new Hono();

integrations.use('/*', authenticate);

integrations.get('/status', requireRole('admin', 'sysadmin'), async (c) => {
  const moodleHealth = await moodleService.healthCheck();
  const guaraniHealth = await guaraniService.healthCheck();

  const { data: moodleLogs } = await supabase
    .from('integration_logs')
    .select('*')
    .eq('integration_type', 'moodle')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: guaraniLogs } = await supabase
    .from('integration_logs')
    .select('*')
    .eq('integration_type', 'guarani')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return c.json({
    demo: process.env.MOCK_MODE === 'true',
    moodle: {
      status: moodleHealth.status,
      last_sync: moodleLogs?.created_at || null,
      latency_ms: moodleHealth.latencyMs,
      message: moodleHealth.message,
    },
    guarani: {
      status: guaraniHealth.status,
      last_sync: guaraniLogs?.created_at || null,
      latency_ms: guaraniHealth.latencyMs,
      message: guaraniHealth.message,
    },
  });
});

integrations.post('/sync/moodle', requireRole('admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const startedAt = Date.now();
  const logId = await logSyncStart('moodle', auth?.userId || 'system');

  try {
    const certificates = await moodleService.syncCertificates();
    await logSyncComplete(logId, 'moodle', {
      studentsProcessed: certificates.length,
      studentsNew: 0,
      studentsUpdated: certificates.length,
      errorsCount: 0,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: true,
      message: `Synced ${certificates.length} certificates`,
      count: certificates.length,
    });
  }
  catch (err) {
    await logSyncComplete(logId, 'moodle', {
      studentsProcessed: 0,
      studentsNew: 0,
      studentsUpdated: 0,
      errorsCount: 1,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: false,
      error: err instanceof Error ? err.message : 'Sync failed',
    }, 500);
  }
});

integrations.post('/sync/guarani', requireRole('admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const startedAt = Date.now();
  const logId = await logSyncStart('guarani', auth?.userId || 'system');

  try {
    const students = await guaraniService.syncStudents();
    await logSyncComplete(logId, 'guarani', {
      studentsProcessed: students.length,
      studentsNew: 0,
      studentsUpdated: students.length,
      errorsCount: 0,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: true,
      message: `Synced ${students.length} students`,
      count: students.length,
    });
  }
  catch (err) {
    await logSyncComplete(logId, 'guarani', {
      studentsProcessed: 0,
      studentsNew: 0,
      studentsUpdated: 0,
      errorsCount: 1,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: false,
      error: err instanceof Error ? err.message : 'Sync failed',
    }, 500);
  }
});

integrations.post('/push/guarani/diploma', requireRole('admin', 'sysadmin'), async (c) => {
  const body = await c.req.json();
  const studentId = body.student_id as string;
  const trackId = body.track_id as string;
  const grade = Number(body.grade);
  const courseName = (body.course_name as string) || 'Módulo Integrador';

  if (!studentId || !trackId || !Number.isFinite(grade)) {
    return c.json({ error: 'student_id, track_id, and grade are required' }, 400);
  }

  const result = await guaraniService.pushDiploma(studentId, {
    trackId,
    grade,
    courseName,
  });

  return c.json(result, 201);
});

integrations.get('/logs', requireRole('admin', 'sysadmin'), async (c) => {
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const integrationType = c.req.query('type');
  const status = c.req.query('status');

  let query = supabase
    .from('integration_logs')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (integrationType) {
    query = query.eq('integration_type', integrationType);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  });
});

export { integrations as integrationsRoutes };
