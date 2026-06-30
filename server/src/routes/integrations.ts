import { Hono } from 'hono';
import { supabaseAdmin as supabase } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';
import { createEligibilityDataAccess } from '../services/eligibility-data-access';
import { guaraniService } from '../services/guarani.service';
import { logSyncComplete, logSyncStart } from '../services/integration-logs';
import { moodleService } from '../services/moodle.service';
import { consolidateCertNotifications, upsertEligibilityNotification } from '../services/notification.service';
import { evaluateTrackEligibility } from '../services/rule-engine';

const syncLocks = new Map<string, boolean>();
const syncLockTimestamps = new Map<string, number>();
const SYNC_LOCK_TTL_MS = 5 * 60 * 1000; // 5 min

function acquireLock(key: string): boolean {
  const timestamp = syncLockTimestamps.get(key);
  if (timestamp && Date.now() - timestamp > SYNC_LOCK_TTL_MS) {
    syncLocks.delete(key);
    syncLockTimestamps.delete(key);
  }
  if (syncLocks.get(key)) { return false; }
  syncLocks.set(key, true);
  syncLockTimestamps.set(key, Date.now());
  return true;
}

function releaseLock(key: string): void {
  syncLocks.delete(key);
  syncLockTimestamps.delete(key);
}

const integrations = new Hono();

integrations.use('/*', authenticate);

integrations.get('/status', requireRole('admin', 'sysadmin', 'coordinador'), async (c) => {
  const [moodleHealth, guaraniHealth] = await Promise.all([
    moodleService.healthCheck(),
    guaraniService.healthCheck(),
  ]);

  const [moodleLogs, guaraniLogs] = await Promise.all([
    supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_type', 'moodle')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data),
    supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_type', 'guarani')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data),
  ]);

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

integrations.get('/sync/moodle/status', requireRole('admin', 'sysadmin'), async (c) => {
  const moodleHealth = await moodleService.healthCheck();
  return c.json({
    sync_in_progress: syncLocks.get('moodle') ?? false,
    lock_age_ms: syncLockTimestamps.has('moodle') ? Date.now() - syncLockTimestamps.get('moodle')! : null,
    moodle: {
      status: moodleHealth.status,
      message: moodleHealth.message,
    },
  });
});

integrations.post('/sync/moodle', requireRole('admin', 'sysadmin'), async (c) => {
  const SYNC_KEY = 'moodle';

  if (!acquireLock(SYNC_KEY)) {
    const age = syncLockTimestamps.get(SYNC_KEY) ? Date.now() - syncLockTimestamps.get(SYNC_KEY)! : 0;
    return c.json({ error: 'Sync already in progress', lock_age_ms: age }, 409);
  }

  const auth = c.get('auth');
  const startedAt = Date.now();

  const moodleHealth = await moodleService.healthCheck();
  if (moodleHealth.status !== 'connected') {
    syncLocks.delete(SYNC_KEY);
    return c.json({
      error: 'Moodle no está accesible',
      detail: moodleHealth.message || 'Verificá el token y la conectividad',
      status_code: moodleHealth.status,
    }, 503);
  }

  const { count: activeStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('role', 'estudiante');

  if (!activeStudents) {
    syncLocks.delete(SYNC_KEY);
    return c.json({
      error: 'No hay estudiantes activos para sincronizar',
      detail: 'Asegurate de que existan estudiantes con role=estudiante e is_active=true',
    }, 400);
  }

  const logId = await logSyncStart('moodle', auth?.userId || 'system');

  try {
    const result = await moodleService.syncCertificates();

    let eligibilityChanges = 0;

    for (const detail of result.studentCertDetails) {
      if (detail.newCount > 0) {
        try {
          await consolidateCertNotifications(
            detail.studentId,
            detail.newCount,
            detail.newCourseNames,
          );
        }
        catch (err) {
          console.error(
            `[Integrations] Notification create failed for student ${detail.studentId}:`,
            (err as Error).message,
          );
        }
      }
    }

    if (result.affectedStudentIds.length > 0) {
      const dataAccess = createEligibilityDataAccess();

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, track_id')
        .in('student_id', result.affectedStudentIds)
        .eq('status', 'active');

      for (const enrollment of (enrollments || [])) {
        try {
          const { data: prevLog } = await supabase
            .from('integration_logs')
            .select('details')
            .eq('integration_type', 'moodle')
            .eq('operation', 'eligibility_check')
            .eq('details->>student_id', enrollment.student_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const prevDetails = prevLog?.details as Record<string, unknown> | null;
          const previouslyEligible = prevDetails?.eligible === true;

          const eligibility = await evaluateTrackEligibility({
            studentId: enrollment.student_id,
            trackId: enrollment.track_id,
            ...dataAccess,
          });

          await supabase.from('integration_logs').insert({
            integration_type: 'moodle',
            operation: 'eligibility_check',
            status: eligibility.eligible ? 'success' : 'error',
            message: eligibility.eligible
              ? `Student ${enrollment.student_id} is eligible for track ${enrollment.track_id}`
              : `Student ${enrollment.student_id} is NOT eligible for track ${enrollment.track_id}. Missing: ${eligibility.missingPrerequisites.join(', ')}`,
            details: {
              student_id: enrollment.student_id,
              track_id: enrollment.track_id,
              eligible: eligibility.eligible,
              missing_prerequisites: eligibility.missingPrerequisites,
              evaluated_at: eligibility.evaluatedAt,
            },
          });

          if (previouslyEligible !== eligibility.eligible) {
            const { data: track } = await supabase
              .from('tracks')
              .select('name')
              .eq('id', enrollment.track_id)
              .single();

            await upsertEligibilityNotification(
              enrollment.student_id,
              track?.name || enrollment.track_id,
              eligibility.eligible,
            );
          }

          eligibilityChanges++;
        }
        catch (err) {
          console.error(
            `[Integrations] Eligibility eval failed for student ${enrollment.student_id}:`,
            (err as Error).message,
          );
        }
      }
    }

    await logSyncComplete(logId, 'moodle', {
      studentsProcessed: result.affectedStudentIds.length,
      studentsNew: result.certificatesNew,
      studentsUpdated: result.certificatesUpdated,
      errorsCount: 0,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      status: 'completed',
      students_processed: result.affectedStudentIds.length,
      certificates_new: result.certificatesNew,
      certificates_updated: result.certificatesUpdated,
      errors: 0,
      eligibility_changes: eligibilityChanges,
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
      status: 'error',
      error: err instanceof Error ? err.message : 'Sync failed',
    }, 500);
  }
  finally {
    releaseLock(SYNC_KEY);
  }
});

integrations.post('/sync/guarani', requireRole('admin', 'sysadmin'), async (c) => {
  const SYNC_KEY = 'guarani';

  if (!acquireLock(SYNC_KEY)) {
    return c.json({ error: 'Sync already in progress' }, 409);
  }

  const auth = c.get('auth');
  const startedAt = Date.now();
  const logId = await logSyncStart('guarani', auth?.userId || 'system');

  try {
    const result = await guaraniService.syncStudents();
    await logSyncComplete(logId, 'guarani', {
      studentsProcessed: result.studentsProcessed,
      studentsNew: result.studentsNew,
      studentsUpdated: result.studentsUpdated,
      errorsCount: result.errors.length,
      durationMs: Date.now() - startedAt,
    });

    return c.json({
      success: true,
      message: `Synced ${result.studentsNew + result.studentsUpdated} students (${result.studentsNew} new, ${result.studentsUpdated} updated, ${result.errors.length} errors)`,
      ...result,
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
  finally {
    releaseLock(SYNC_KEY);
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

integrations.get('/logs', requireRole('admin', 'sysadmin', 'coordinador'), async (c) => {
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
