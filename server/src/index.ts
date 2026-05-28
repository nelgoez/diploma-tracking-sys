import { apiReference } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { prettyJSON } from 'hono/pretty-json';
import { errorHandler, notFoundHandler } from './middleware/error';
import { providerRegistry } from './providers';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { certificatesRoutes } from './routes/certificates';
import { coursesRoutes } from './routes/courses';
import { enrollmentsRoutes } from './routes/enrollments';
import { integrationsRoutes } from './routes/integrations';
import { overridesRoutes } from './routes/overrides';
import { rulesRoutes } from './routes/rules';
import { studentsRoutes } from './routes/students';
import { guaraniService } from './services/guarani.service';
import { moodleService } from './services/moodle.service';

providerRegistry.registerCertificateProvider('moodle', moodleService);
providerRegistry.registerAcademicProvider('guarani', guaraniService);

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.get('/health', c => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get(
  '/docs',
  apiReference({
    theme: 'purple',
    spec: {
      url: '/api-spec',
    },
  }),
);

app.get('/api-spec', async (c) => {
  const specPath = process.env.API_SPEC_PATH || '../../.context/SRS/api-contracts.yaml';

  try {
    const file = Bun.file(specPath);
    const exists = await file.exists();

    if (!exists) {
      return c.json({
        openapi: '3.0.0',
        info: { title: 'Diploma Tracking System API', version: '0.1.0' },
        paths: {},
      });
    }

    const content = await file.text();
    return new Response(content, {
      headers: { 'Content-Type': 'text/yaml' },
    });
  }
  catch {
    return c.json({ error: 'Failed to load API spec' }, 500);
  }
});

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/students', studentsRoutes);
app.route('/api/v1/courses', coursesRoutes);
app.route('/api/v1/certificates', certificatesRoutes);
app.route('/api/v1/enrollments', enrollmentsRoutes);
app.route('/api/v1/rules', rulesRoutes);
app.route('/api/v1/overrides', overridesRoutes);
app.route('/api/v1/integrations', integrationsRoutes);
app.route('/api/v1/admin', adminRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);

const port = Number.parseInt(process.env.PORT || '3000');

console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
