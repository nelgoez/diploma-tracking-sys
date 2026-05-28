import type { MiddlewareHandler } from 'hono';
import type { HonoVariables } from '../types/hono';
import { jwtVerify } from 'jose';

export interface AuthContext {
  userId: string
  email: string
  role: 'estudiante' | 'coordinador' | 'admin' | 'sysadmin'
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'placeholder-secret-key-minimum-32-characters';
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  sub: string
  email: string
  role: AuthContext['role']
  type?: string
  iat?: number
  exp?: number
}

export const authenticate: MiddlewareHandler<{ Variables: HonoVariables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
    });

    const jwt = payload as unknown as JwtPayload;

    if (jwt.type && jwt.type !== 'access') {
      return c.json({ error: 'Invalid token type' }, 401);
    }

    c.set('auth', {
      userId: jwt.sub,
      email: jwt.email,
      role: jwt.role,
    } as AuthContext);

    await next();
  }
  catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

export const requireRole = (...roles: AuthContext['role'][]): MiddlewareHandler<{ Variables: HonoVariables }> => {
  return async (c, next) => {
    const auth = c.get('auth');

    if (!auth) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!roles.includes(auth.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
};
