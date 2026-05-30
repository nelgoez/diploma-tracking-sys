import type { AuthContext, JwtPayload } from '../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import { supabase, supabaseAdmin } from '../db/supabase';
import { authenticate } from '../middleware/auth';

const auth = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) { throw new Error('JWT_SECRET environment variable is required'); }
  return new TextEncoder().encode(secret);
}

async function createAccessToken(userId: string, email: string, role: AuthContext['role']): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
  const seconds = parseExpiryToSeconds(expiresIn);

  return new SignJWT({ sub: userId, email, role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(getJwtSecret());
}

async function createRefreshToken(userId: string, email: string, role: AuthContext['role']): Promise<string> {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const seconds = parseExpiryToSeconds(expiresIn);

  return new SignJWT({ sub: userId, email, role, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(getJwtSecret());
}

function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) { return 900; } // default 15m
  const value = Number.parseInt(match[1]);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, name, email, role')
    .eq('email', email)
    .single();

  const userId = authData.user.id;
  const role = (student?.role || 'estudiante') as AuthContext['role'];

  const accessToken = await createAccessToken(userId, email, role);
  const refreshToken = await createRefreshToken(userId, email, role);

  return c.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: userId,
      email,
      name: student?.name || email,
      role,
    },
  });
});

auth.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refresh_token } = c.req.valid('json');

  try {
    const { payload } = await jwtVerify(refresh_token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    const jwt = payload as unknown as JwtPayload;

    if (jwt.type !== 'refresh') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    const accessToken = await createAccessToken(jwt.sub, jwt.email, jwt.role);
    const refreshToken = await createRefreshToken(jwt.sub, jwt.email, jwt.role);

    return c.json({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }
  catch {
    return c.json({ error: 'Invalid refresh token' }, 401);
  }
});

auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });
      const jwt = payload as unknown as JwtPayload;
      await supabaseAdmin.auth.admin.signOut(jwt.sub);
    }
    catch {
      // token already invalid, logout still succeeds
    }
  }

  return c.json({ success: true });
});

auth.get('/me', authenticate, async (c) => {
  const authUser = c.get('auth');

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('id, name, email, role, dni')
    .eq('email', authUser?.email)
    .single();

  return c.json({
    id: authUser?.userId,
    email: authUser?.email,
    name: student?.name || authUser?.email,
    role: authUser?.role,
    dni: student?.dni || null,
  });
});

export { auth as authRoutes };
