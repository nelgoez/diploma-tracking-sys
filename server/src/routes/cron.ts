import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { expireOverrides } from '../services/override-scheduler';

const cron = new Hono<{ Variables: HonoVariables }>();

cron.get('/expire-overrides', async (c) => {
  const secret = c.req.header('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const result = await expireOverrides();

    return c.json({
      success: true,
      processed: result.processed,
      expired: result.expired,
      stillValid: result.stillValid,
      eligibilityReevaluated: result.eligibilityReevaluated,
      notificationsCreated: result.notificationsCreated,
      errors: result.errors,
    });
  }
  catch (err) {
    console.error('[Cron] expire-overrides failed:', (err as Error).message);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { cron as cronRoutes };
