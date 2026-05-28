import { supabase } from '../db/supabase';

type IntegrationType = 'moodle' | 'guarani';
type SyncStatus = 'success' | 'error' | 'pending';

export async function logSyncStart(
  provider: IntegrationType,
  triggeredBy: string,
): Promise<string> {
  const { data } = await supabase
    .from('integration_logs')
    .insert({
      integration_type: provider,
      operation: 'sync',
      status: 'pending',
      message: `Sync started by ${triggeredBy}`,
      details: { started_at: new Date().toISOString(), triggered_by: triggeredBy },
    })
    .select('id')
    .single();

  return data?.id || '';
}

export async function logSyncComplete(
  logId: string,
  provider: IntegrationType,
  stats: {
    studentsProcessed: number
    studentsNew: number
    studentsUpdated: number
    errorsCount: number
    durationMs: number
  },
): Promise<void> {
  await supabase
    .from('integration_logs')
    .insert({
      integration_type: provider,
      operation: 'sync',
      status: stats.errorsCount > 0 ? 'error' : 'success',
      message: `Processed ${stats.studentsProcessed} students, ${stats.errorsCount} errors`,
      details: {
        ...stats,
        completed_at: new Date().toISOString(),
      },
    });
}

export async function logPerStudent(
  provider: IntegrationType,
  studentId: string,
  status: SyncStatus,
  message?: string,
): Promise<void> {
  await supabase
    .from('integration_logs')
    .insert({
      integration_type: provider,
      operation: 'fetch',
      status,
      message: message || `Student ${studentId}: ${status}`,
      details: { student_id: studentId, logged_at: new Date().toISOString() },
    });
}
