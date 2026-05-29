import type { HonoVariables } from '../types/hono';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase';
import { authenticate, requireRole } from '../middleware/auth';

const tracks = new Hono<{ Variables: HonoVariables }>();

tracks.use('/*', authenticate);

const createTrackSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  credits_required: z.number().optional(),
});

const updateTrackSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  credits_required: z.number().optional(),
});

tracks.get('/', async (c) => {
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  const isActive = c.req.query('is_active');

  let query = supabaseAdmin
    .from('tracks')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (isActive !== undefined && isActive !== '') {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data, error, count } = await query;

  if (error) {
    return c.json({ error: 'Failed to fetch tracks' }, 500);
  }

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

tracks.get('/:id', async (c) => {
  const { id } = c.req.param();

  const { data, error: fetchError } = await supabaseAdmin
    .from('tracks')
    .select(`
      *,
      courses(count)
    `)
    .eq('id', id)
    .single();

  if (fetchError || !data) {
    return c.json({ error: 'Track not found' }, 404);
  }

  return c.json(data);
});

tracks.post('/', requireRole('admin', 'sysadmin'), zValidator('json', createTrackSchema), async (c) => {
  const body = c.req.valid('json');

  const { data, error } = await supabaseAdmin
    .from('tracks')
    .insert({
      name: body.name,
      code: body.code,
      description: body.description ?? null,
      credits_required: body.credits_required ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'A track with this code already exists' }, 409);
    }
    return c.json({ error: 'Failed to create track' }, 500);
  }

  return c.json(data, 201);
});

tracks.patch('/:id', requireRole('admin', 'sysadmin'), zValidator('json', updateTrackSchema), async (c) => {
  const { id } = c.req.param();
  const body = c.req.valid('json');

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) { updateData.name = body.name; }
  if (body.code !== undefined) { updateData.code = body.code; }
  if (body.description !== undefined) { updateData.description = body.description; }
  if (body.is_active !== undefined) { updateData.is_active = body.is_active; }
  if (body.credits_required !== undefined) { updateData.credits_required = body.credits_required; }

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  const { data, error } = await supabaseAdmin
    .from('tracks')
    .update(updateData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'A track with this code already exists' }, 409);
    }
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Track not found' }, 404);
    }
    return c.json({ error: 'Failed to update track' }, 500);
  }

  return c.json(data);
});

export { tracks as tracksRoutes };
