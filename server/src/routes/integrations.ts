import { Hono } from 'hono';
import { supabase } from '../db/supabase';
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
  await logSyncStart('moodle', auth?.userId || 'system');

  try {
    const certificates = await moodleService.syncCertificates();
    await logSyncComplete('', 'moodle', {
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
    await logSyncComplete('', 'moodle', {
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
  await logSyncStart('guarani', auth?.userId || 'system');

  try {
    const students = await guaraniService.syncStudents();
    await logSyncComplete('', 'guarani', {
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
    await logSyncComplete('', 'guarani', {
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

integrations.post('/sync/seed', requireRole('admin', 'sysadmin'), async (c) => {
  const auth = c.get('auth');
  const startedAt = Date.now();
  await logSyncStart('moodle', auth?.userId || 'system');

  const summary = {
    studentsProcessed: 0,
    certificatesCreated: 0,
    certificatesSkipped: 0,
    errorsCount: 0,
    errors: [] as string[],
  };

  try {
    const { data: students, error: studentsErr } = await supabase
      .from('students')
      .select('id')
      .eq('is_active', true)
      .eq('role', 'estudiante');

    if (studentsErr || !students?.length) {
      return c.json({ success: false, error: 'No active students found' }, 400);
    }

    const { data: courses, error: coursesErr } = await supabase
      .from('courses')
      .select('id, name')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (coursesErr || !courses?.length) {
      return c.json({ success: false, error: 'No active courses found' }, 400);
    }

    const coursesPerStudent = Math.min(courses.length, 4);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const assignedCourses = courses.filter((_, ci) => ci % students.length === i || ci < coursesPerStudent);

      for (const course of assignedCourses) {
        try {
          const { data: existing } = await supabase
            .from('certificates')
            .select('id')
            .eq('student_id', student.id)
            .eq('course_id', course.id)
            .maybeSingle();

          if (existing) {
            summary.certificatesSkipped++;
            continue;
          }

          const issueDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);

          const { error: insertErr } = await supabase
            .from('certificates')
            .insert({
              student_id: student.id,
              course_id: course.id,
              status: 'approved',
              qualification: Math.round((7 + Math.random() * 3) * 100) / 100,
              issue_date: issueDate,
              is_valid: true,
              moodle_certificate_id: `seed-${student.id.slice(0, 8)}-${course.id.slice(0, 8)}`,
            });

          if (insertErr) {
            summary.errorsCount++;
            summary.errors.push(`Student ${student.id} course ${course.id}: ${insertErr.message}`);
          }
          else {
            summary.certificatesCreated++;
          }
        }
        catch (err) {
          summary.errorsCount++;
          summary.errors.push(`Student ${student.id} course ${course.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      summary.studentsProcessed++;
    }

    await logSyncComplete('', 'moodle', {
      studentsProcessed: summary.studentsProcessed,
      studentsNew: summary.certificatesCreated,
      studentsUpdated: summary.certificatesSkipped,
      errorsCount: summary.errorsCount,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: summary.errorsCount === 0,
      message: `Seed sync: ${summary.certificatesCreated} created, ${summary.certificatesSkipped} skipped, ${summary.errorsCount} errors`,
      summary,
    });
  }
  catch (err) {
    await logSyncComplete('', 'moodle', {
      studentsProcessed: summary.studentsProcessed,
      studentsNew: summary.certificatesCreated,
      studentsUpdated: summary.certificatesSkipped,
      errorsCount: summary.errorsCount + 1,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: false,
      error: err instanceof Error ? err.message : 'Seed sync failed',
    }, 500);
  }
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
