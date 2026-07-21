import type { MiddlewareHandler } from 'hono';
import type { HonoVariables } from '../types/hono';

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  key?: (c: Parameters<MiddlewareHandler<{ Variables: HonoVariables }>>[0]) => string
  skip?: (c: Parameters<MiddlewareHandler<{ Variables: HonoVariables }>>[0]) => boolean
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10000;

const CLEANUP_INTERVAL = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) { store.delete(key); }
  }
}, CLEANUP_INTERVAL);

const DEFAULT_KEY_FN: (c: Parameters<MiddlewareHandler<{ Variables: HonoVariables }>>[0]) => string = (ctx) => {
  const ip = ctx.req.header('x-real-ip')
    || ctx.req.header('x-forwarded-for')?.split(',').pop()?.trim()
    || 'unknown';
  return `${ip}:${ctx.req.path}`;
};

function createRateLimiter(config: RateLimitConfig): MiddlewareHandler<{ Variables: HonoVariables }> {
  return async (c, next) => {
    if (config.skip?.(c)) { return next(); }

    const getKey = config.key || DEFAULT_KEY_FN;

    const key = getKey(c);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + config.windowMs };
      store.set(key, entry);
    }

    if (store.size > MAX_STORE_SIZE) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) { store.delete(oldestKey); }
    }

    entry.count++;

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    c.header('X-RateLimit-Limit', String(config.maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetSeconds));

    if (entry.count > config.maxRequests) {
      console.warn(`[RateLimit] Blocked ${key} — ${entry.count}/${config.maxRequests} in ${config.windowMs}ms`);
      c.header('Retry-After', String(resetSeconds));
      return c.json({
        error: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
        retryAfter: resetSeconds,
      }, 429);
    }

    await next();
  };
}

const isSpecificPath = (c: Parameters<MiddlewareHandler<{ Variables: HonoVariables }>>[0]): boolean => {
  const path = c.req.path;
  return path.startsWith('/api/v1/auth/')
    || path.startsWith('/api/v1/verify/')
    || path.startsWith('/api/v1/admin/');
};

const resolveClientIp = (c: Parameters<MiddlewareHandler<{ Variables: HonoVariables }>>[0]): string => {
  return c.req.header('x-real-ip')
    || c.req.header('x-forwarded-for')?.split(',').pop()?.trim()
    || 'unknown';
};

export const rateLimitLogin = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  key: c => `login:${resolveClientIp(c)}`,
});

export const rateLimitVerify = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  key: c => `verify:${resolveClientIp(c)}`,
});

export const rateLimitAdmin = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  key: (c) => {
    const auth = c.get('auth');
    return `admin:${auth?.userId || 'unknown'}`;
  },
});

export const rateLimitGeneral = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  skip: isSpecificPath,
});
