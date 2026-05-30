import type { Json } from '../db/database.types';
import { supabaseAdmin } from '../db/supabase';

type AuditAction = 'grade_recorded' | 'override_created' | 'override_revoked' | 'rule_created' | 'rule_updated' | 'rule_deleted' | 'diploma_pushed';

interface AuditEntry {
  userId?: string
  action: AuditAction
  entityType: string
  entityId?: string
  details?: Record<string, string | number | boolean | null>
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabaseAdmin
    .from('audit_log')
    .insert({
      user_id: entry.userId ?? null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      details: (entry.details ?? {}) as unknown as Json,
    });

  if (error) {
    console.error(`[AuditLog] Failed to write ${entry.action}:`, error.message);
  }
}
