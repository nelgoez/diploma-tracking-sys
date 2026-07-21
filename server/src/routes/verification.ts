import { Hono } from 'hono';
import { supabaseAdmin } from '../db/supabase';

const verification = new Hono();

const CODE_PREFIX = 'DTS';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateReferenceCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `${CODE_PREFIX}-${code}`;
}

function buildVerificationUrl(code: string): string {
  const base = process.env.VERIFICATION_BASE_URL || process.env.WEB_URL || 'https://diplomatrackingsystem.qzz.io';
  return `${base}/verify/${code}`;
}

verification.get('/generate/:enrollmentId', async (c) => {
  const auth = c.get('auth');
  if (!['admin', 'sysadmin', 'coordinador'].includes(auth.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const enrollmentId = c.req.param('enrollmentId');

  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, exam_status')
    .eq('id', enrollmentId)
    .single();

  if (!enrollment) { return c.json({ error: 'Enrollment not found' }, 404); }
  if (enrollment.exam_status !== 'aprobado') {
    return c.json({ error: 'Only approved enrollments can be verified' }, 400);
  }

  const { data: existing } = await supabaseAdmin
    .from('verification_references')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) {
    return c.json({ error: 'Active verification already exists for this enrollment' }, 409);
  }

  const referenceCode = generateReferenceCode();
  const verificationUrl = buildVerificationUrl(referenceCode);

  const { data, error } = await supabaseAdmin
    .from('verification_references')
    .insert({
      enrollment_id: enrollmentId,
      reference_code: referenceCode,
      code_hash: referenceCode,
      verification_url: verificationUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) { return c.json({ error: 'Failed to create verification reference' }, 500); }

  return c.json({
    id: data.id,
    reference_code: data.reference_code,
    verification_url: data.verification_url,
  }, 201);
});

verification.get('/verify/:referenceCode', async (c) => {
  const referenceCode = c.req.param('referenceCode');

  const { data: vref } = await supabaseAdmin
    .from('verification_references')
    .select(`
      *,
      enrollment:enrollments!inner(
        student_id,
        qualification,
        exam_status,
        completion_date,
        student:students!student_id(
          name,
          dni
        ),
        track:tracks!track_id(
          name
        )
      )
    `)
    .eq('reference_code', referenceCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!vref) {
    await supabaseAdmin.from('audit_log').insert({
      action: 'verification_failed',
      entity_type: 'verification_references',
      details: { reference_code: referenceCode },
    });
    return c.json({ valid: false, message: 'Código de verificación no válido' }, 404);
  }

  const enrollment = vref.enrollment as unknown as {
    student_id: string
    qualification: number | null
    exam_status: string
    completion_date: string
    student: { name: string, dni: string }
    track: { name: string }
  };

  await supabaseAdmin
    .from('verification_references')
    .update({ verified_count: (vref.verified_count || 0) + 1 })
    .eq('id', vref.id);

  await supabaseAdmin.from('audit_log').insert({
    action: 'verification_success',
    entity_type: 'verification_references',
    entity_id: vref.id,
    details: {
      reference_code: referenceCode,
      student_id: enrollment.student_id,
      track: enrollment.track.name,
    },
  });

  return c.json({
    valid: true,
    student: enrollment.student.name,
    document_number: enrollment.student.dni,
    track: enrollment.track.name,
    issue_date: enrollment.completion_date,
    grade: enrollment.qualification,
  });
});

verification.get('/admin/verifications', async (c) => {
  const auth = c.get('auth');
  if (!['admin', 'sysadmin'].includes(auth.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const search = c.req.query('search') || '';
  const status = c.req.query('status') || 'all';
  const fromDate = c.req.query('from');
  const toDate = c.req.query('to');

  let query = supabaseAdmin
    .from('verification_references')
    .select(`
      *,
      enrollment:enrollments(
        student_id,
        student:students(name, email),
        track:tracks(name)
      )
    `, { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (status === 'active') { query = query.eq('is_active', true); }
  else if (status === 'revoked') { query = query.eq('is_active', false); }
  if (search) { query = query.or(`reference_code.ilike.%${search}%`); }
  if (fromDate) { query = query.gte('created_at', fromDate); }
  if (toDate) { query = query.lte('created_at', toDate); }

  const { data, error, count } = await query;

  if (error) { return c.json({ error: 'Failed to fetch verifications' }, 500); }

  return c.json({
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  });
});

verification.put('/admin/verifications/:id/revoke', async (c) => {
  const auth = c.get('auth');
  if (!['admin', 'sysadmin'].includes(auth.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const id = c.req.param('id');

  const { data, error } = await supabaseAdmin
    .from('verification_references')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: auth.userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) { return c.json({ error: 'Failed to revoke verification' }, 500); }

  await supabaseAdmin.from('audit_log').insert({
    action: 'verification_revoked',
    entity_type: 'verification_references',
    entity_id: id,
    user_id: auth.userId,
  });

  return c.json(data);
});

verification.post('/admin/verifications/:id/regenerate', async (c) => {
  const auth = c.get('auth');
  if (!['admin', 'sysadmin'].includes(auth.role)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const id = c.req.param('id');

  const { data: existing } = await supabaseAdmin
    .from('verification_references')
    .select('enrollment_id')
    .eq('id', id)
    .single();

  if (!existing) { return c.json({ error: 'Verification not found' }, 404); }

  await supabaseAdmin
    .from('verification_references')
    .update({ is_active: false, revoked_at: new Date().toISOString(), revoked_by: auth.userId })
    .eq('id', id);

  const referenceCode = generateReferenceCode();
  const verificationUrl = buildVerificationUrl(referenceCode);

  const { data: newVref, error } = await supabaseAdmin
    .from('verification_references')
    .insert({
      enrollment_id: existing.enrollment_id,
      reference_code: referenceCode,
      code_hash: referenceCode,
      verification_url: verificationUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) { return c.json({ error: 'Failed to regenerate verification' }, 500); }

  await supabaseAdmin.from('audit_log').insert({
    action: 'verification_regenerated',
    entity_type: 'verification_references',
    entity_id: id,
    user_id: auth.userId,
    details: { new_id: newVref.id },
  });

  return c.json(newVref, 201);
});

export { verification as verificationRoutes };
