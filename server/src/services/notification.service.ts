import { supabaseAdmin } from '../db/supabase';

export type NotificationType
  = | 'eligibility_change'
    | 'new_certificate'
    | 'override_applied'
    | 'override_expired'
    | 'diploma_issued'
    | 'exam_graded';

export interface CreateNotificationParams {
  studentId: string
  type: NotificationType
  title: string
  body: string
  entityType?: string
  entityId?: string
}

export interface NotificationRecord {
  id: string
  student_id: string
  type: NotificationType
  title: string
  body: string
  entity_type: string | null
  entity_id: string | null
  read: boolean
  created_at: string
  expires_at: string | null
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    unread_count: number
  }
}

// Type assertion helper until 'bun run db:types' regenerates with notifications table
function notificationsTable() {
  return supabaseAdmin.from('notifications' as never);
}

export async function createNotification(params: CreateNotificationParams): Promise<NotificationRecord | null> {
  const { data, error } = await notificationsTable()
    .insert({
      student_id: params.studentId,
      type: params.type,
      title: params.title,
      body: params.body,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
    } as never)
    .select('*')
    .single();

  if (error) {
    console.error('[NotificationService] Create failed:', error.message);
    return null;
  }

  return data as unknown as NotificationRecord;
}

export async function createNotificationsBatch(
  params: CreateNotificationParams[],
): Promise<NotificationRecord[]> {
  if (params.length === 0) { return []; }

  const { data, error } = await notificationsTable()
    .insert(params.map(p => ({
      student_id: p.studentId,
      type: p.type,
      title: p.title,
      body: p.body,
      entity_type: p.entityType ?? null,
      entity_id: p.entityId ?? null,
    })) as never)
    .select('*');

  if (error) {
    console.error('[NotificationService] Batch create failed:', error.message);
    return [];
  }

  return (data || []) as unknown as NotificationRecord[];
}

export async function upsertEligibilityNotification(
  studentId: string,
  trackName: string,
  becameEligible: boolean,
): Promise<NotificationRecord | null> {
  if (becameEligible) {
    const { data: existing } = await notificationsTable()
      .select('id')
      .eq('student_id', studentId)
      .eq('type', 'eligibility_change')
      .eq('read', false)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data, error } = await notificationsTable()
        .update({
          title: `Habilitación actualizada — ${trackName}`,
          body: `Tu habilitación para ${trackName} sigue vigente. Podés inscribirte al examen integrador.`,
          created_at: new Date().toISOString(),
        } as never)
        .eq('id', (existing as Record<string, string>).id)
        .select('*')
        .single();

      if (error) {
        console.error('[NotificationService] Upsert update failed:', error.message);
        return null;
      }
      return data as unknown as NotificationRecord;
    }
  }

  return createNotification({
    studentId,
    type: 'eligibility_change',
    title: becameEligible
      ? `¡Habilitación obtenida — ${trackName}!`
      : `Habilitación perdida — ${trackName}`,
    body: becameEligible
      ? `Cumpliste todos los requisitos para ${trackName}. Ya podés inscribirte al examen integrador.`
      : `Ya no cumplís los requisitos para ${trackName}. Revisá tus certificados pendientes.`,
  });
}

export async function getNotifications(
  studentId: string,
  options: {
    page?: number
    limit?: number
    type?: NotificationType
    unreadOnly?: boolean
  } = {},
): Promise<PaginatedResult<NotificationRecord>> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let query = notificationsTable()
    .select('*', { count: 'exact' })
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[NotificationService] Get failed:', error.message);
    return {
      data: [],
      pagination: { page, limit, total: 0, unread_count: 0 },
    };
  }

  const { count: unreadCount } = await notificationsTable()
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('read', false);

  return {
    data: (data || []) as unknown as NotificationRecord[],
    pagination: {
      page,
      limit,
      total: count || 0,
      unread_count: unreadCount || 0,
    },
  };
}

export async function markAllAsRead(studentId: string): Promise<number> {
  const { data, error } = await notificationsTable()
    .select('id')
    .eq('student_id', studentId)
    .eq('read', false);

  if (error || !data || data.length === 0) {
    return 0;
  }

  const ids = (data as Array<Record<string, string>>).map(r => r.id);
  const { error: updateError } = await notificationsTable()
    .update({ read: true } as never)
    .in('id', ids);

  if (updateError) {
    console.error('[NotificationService] Mark all read failed:', updateError.message);
    return 0;
  }

  return ids.length;
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await notificationsTable()
    .update({ read: true } as never)
    .eq('id', notificationId);

  if (error) {
    console.error('[NotificationService] Mark read failed:', error.message);
    return false;
  }

  return true;
}

export async function getUnreadCount(studentId: string): Promise<number> {
  const { count, error } = await notificationsTable()
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('read', false);

  if (error) {
    console.error('[NotificationService] Unread count failed:', error.message);
    return 0;
  }

  return count || 0;
}

export async function hasExistingUnreadNotification(
  studentId: string,
  type: NotificationType,
  entityType?: string,
  entityId?: string,
): Promise<boolean> {
  let query = notificationsTable()
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('type', type)
    .eq('read', false);

  if (entityType) { query = query.eq('entity_type', entityType); }
  if (entityId) { query = query.eq('entity_id', entityId); }

  const { count } = await query;
  return (count || 0) > 0;
}

export async function consolidateCertNotifications(
  studentId: string,
  newCertCount: number,
  courseNames: string[],
): Promise<NotificationRecord | null> {
  if (newCertCount === 0) { return null; }

  const title = newCertCount === 1
    ? `Nuevo certificado: ${courseNames[0]}`
    : `${newCertCount} nuevos certificados importados`;

  const body = newCertCount === 1
    ? `Se importó tu certificado para ${courseNames[0]} desde Moodle.`
    : `Se importaron ${newCertCount} certificados desde Moodle: ${courseNames.join(', ')}.`;

  return createNotification({
    studentId,
    type: 'new_certificate',
    title,
    body,
  });
}
