import { supabaseAdmin } from '../db/supabase';
import { createEligibilityDataAccess } from './eligibility-data-access';
import { upsertEligibilityNotification } from './notification.service';
import { evaluateTrackEligibility } from './rule-engine';

interface ExpiryRunResult {
  processed: number
  expired: number
  stillValid: number
  eligibilityReevaluated: number
  notificationsCreated: number
  errors: number
}

export async function expireOverrides(): Promise<ExpiryRunResult> {
  const now = new Date().toISOString();
  const result: ExpiryRunResult = {
    processed: 0,
    expired: 0,
    stillValid: 0,
    eligibilityReevaluated: 0,
    notificationsCreated: 0,
    errors: 0,
  };

  const { data: expired, error } = await supabaseAdmin
    .from('manual_overrides')
    .select('*')
    .eq('status', 'active')
    .lt('expires_at', now)
    .limit(100);

  if (error) {
    console.error('[OverrideScheduler] Query failed:', error.message);
    return result;
  }

  if (!expired || expired.length === 0) {
    console.log('[OverrideScheduler] No expired overrides found');
    return result;
  }

  console.log(`[OverrideScheduler] Found ${expired.length} expired overrides`);

  const dataAccess = createEligibilityDataAccess();

  for (const override of expired) {
    result.processed++;
    try {
      const { error: updateErr } = await supabaseAdmin
        .from('manual_overrides')
        .update({
          status: 'expired',
          updated_at: now,
        })
        .eq('id', override.id);

      if (updateErr) {
        console.error(`[OverrideScheduler] Failed to expire override ${override.id}:`, updateErr.message);
        result.errors++;
        continue;
      }

      result.expired++;

      await supabaseAdmin.from('audit_log').insert({
        user_id: null,
        action: 'override_expired',
        entity_type: 'manual_overrides',
        entity_id: override.id,
        details: {
          student_id: override.student_id,
          rule_id: override.rule_id,
          reason: override.reason,
          expires_at: override.expires_at,
          expired_by: 'cron_scheduler',
        },
        created_at: now,
      });

      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('student_id, track_id')
        .eq('student_id', override.student_id)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) { continue; }

      for (const enrollment of enrollments) {
        result.eligibilityReevaluated++;
        try {
          const eligibility = await evaluateTrackEligibility({
            studentId: enrollment.student_id,
            trackId: enrollment.track_id,
            ...dataAccess,
          });

          if (!eligibility.eligible) {
            const { data: track } = await supabaseAdmin
              .from('tracks')
              .select('name')
              .eq('id', enrollment.track_id)
              .single();

            await upsertEligibilityNotification(
              enrollment.student_id,
              track?.name || enrollment.track_id,
              false,
            );
            result.notificationsCreated++;
          }
        }
        catch (err) {
          console.error(
            `[OverrideScheduler] Eligibility eval failed for student ${enrollment.student_id}:`,
            (err as Error).message,
          );
          result.errors++;
        }
      }
    }
    catch (err) {
      console.error(`[OverrideScheduler] Failed to process override ${override.id}:`, (err as Error).message);
      result.errors++;
    }
  }

  console.log(
    `[OverrideScheduler] Complete: ${result.processed} processed, ${result.expired} expired, ${result.notificationsCreated} notifications`,
  );

  return result;
}
