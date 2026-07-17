import type { HonoVariables } from '../types/hono';
import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../services/notification.service';

const notifications = new Hono<{ Variables: HonoVariables }>();

notifications.use('/*', authenticate);

notifications.get('/', async (c) => {
  const auth = c.get('auth');
  const studentId = c.req.query('student_id') || auth.userId;
  const page = Number.parseInt(c.req.query('page') || '1');
  const limit = Number.parseInt(c.req.query('limit') || '20');
  const type = c.req.query('type');
  const unreadOnly = c.req.query('unread') === 'true';

  const result = await getNotifications(studentId, {
    page,
    limit,
    type: type as never,
    unreadOnly,
  });

  return c.json(result);
});

notifications.get('/unread-count', async (c) => {
  const auth = c.get('auth');
  const studentId = c.req.query('student_id') || auth.userId;

  const count = await getUnreadCount(studentId);

  return c.json({ count });
});

notifications.put('/read-all', async (c) => {
  const auth = c.get('auth');
  const studentId = c.req.query('student_id') || auth.userId;

  const count = await markAllAsRead(studentId);
  return c.json({ success: true, count });
});

notifications.put('/:id/read', async (c) => {
  const { id } = c.req.param();

  const ok = await markAsRead(id);

  if (!ok) {
    return c.json({ error: 'Notification not found' }, 404);
  }

  return c.json({ success: true });
});

export { notifications as notificationsRoutes };
