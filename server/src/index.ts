import { join } from 'node:path';
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
import { coordinatorRoutes } from './routes/coordinator';
import { coursesRoutes } from './routes/courses';
import { cronRoutes } from './routes/cron';
import { enrollmentsRoutes } from './routes/enrollments';
import { integrationsRoutes } from './routes/integrations';
import { notificationsRoutes } from './routes/notifications';
import { overridesRoutes } from './routes/overrides';
import { rulesRoutes } from './routes/rules';
import { studentsRoutes } from './routes/students';
import { systemRoutes } from './routes/system';
import { tracksRoutes } from './routes/tracks';
import { guaraniService } from './services/guarani.service';
import { moodleService } from './services/moodle.service';

providerRegistry.registerCertificateProvider('moodle', moodleService);
providerRegistry.registerAcademicProvider('guarani', guaraniService);

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin) => {
    const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
    if (!origin) { return origins[0]; }
    if (origin.endsWith('.vercel.app') || origin.endsWith('.qzz.io') || origins.includes(origin)) { return origin; }
    return origins[0];
  },
  credentials: true,
}));

app.get('/health', c => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/', (c) => {
  const isDemo = process.env.MOCK_MODE === 'true';
  const now = new Date().toISOString();
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DTS — Diploma Tracking System</title>
<style>
* { margin:0;padding:0;box-sizing:border-box }
body { font-family:system-ui,sans-serif;background:#0f0f23;color:#e0e0e0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px }
.card { background:#1a1a2e;border-radius:16px;padding:48px;max-width:560px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid #2a2a4a }
h1 { font-size:28px;color:#7c3aed;margin-bottom:8px }
.badge { display:inline-block;background:#7c3aed22;color:#a78bfa;padding:4px 12px;border-radius:20px;font-size:12px;margin-bottom:20px }
p { color:#94a3b8;line-height:1.7;margin-bottom:12px }
.grid { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px }
.item { background:#16162a;padding:16px;border-radius:10px;border:1px solid #2a2a4a }
.item h3 { font-size:13px;color:#a78bfa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px }
.item .value { font-size:22px;font-weight:700;color:#e0e0e0 }
.links { margin-top:24px;display:flex;gap:12px;flex-wrap:wrap }
.links a { background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;transition:background .2s }
.links a:hover { background:#6d28d9 }
.links a.alt { background:#2a2a4a;color:#a78bfa }
.links a.alt:hover { background:#333 }
.foot { margin-top:24px;font-size:11px;color:#555;text-align:center }
</style>
</head>
<body>
<div class="card">
<h1>🎓 Diploma Tracking System</h1>
<div class="badge">${isDemo ? 'Modo Demo — Mock' : 'Producción'}</div>
<p>Sistema de seguimiento de diplomaturas con integración Moodle y SIU Guaraní. Motor de reglas de equivalencias, panel de progreso estudiantil, y gestión de exámenes integradores.</p>
${isDemo ? '<p style="color:#fbbf24">⚠️ <strong>Modo demo:</strong> integraciones con Moodle y Guaraní funcionan con datos simulados. Solicitar credenciales reales a la DTI para activar producción.</p>' : ''}
<div class="grid">
<div class="item"><h3>API</h3><div class="value">v1</div></div>
<div class="item"><h3>Endpoints</h3><div class="value">45</div></div>
<div class="item"><h3>Tests</h3><div class="value">65 ✓</div></div>
<div class="item"><h3>Docs</h3><div class="value">Scalar</div></div>
</div>
<div class="links">
<a href="/health">Health Check</a>
<a href="/docs">API Docs</a>
<a class="alt" href="/api/v1/admin/dashboard-stats">Dashboard</a>
<a class="alt" href="/api/v1/integrations/status">Integrations</a>
</div>
<div class="foot">Servicios Universitarios · ${now}</div>
</div>
</body>
</html>`);
});

let cachedApiSpec: string | null = null;
let apiSpecLoaded = false;

async function loadApiSpec(): Promise<string | null> {
  if (apiSpecLoaded) { return cachedApiSpec; }
  apiSpecLoaded = true;

  const envPath = process.env.API_SPEC_PATH;
  const candidates = envPath
    ? [envPath]
    : [
        join(import.meta.dir, 'api-contracts.yaml'),
        join(import.meta.dir, '..', '.context', 'SRS', 'api-contracts.yaml'),
        '.context/SRS/api-contracts.yaml',
      ];

  for (const p of candidates) {
    const f = Bun.file(p);
    if (await f.exists()) {
      cachedApiSpec = await f.text();
      console.log(`[api-spec] Loaded from ${p} (${cachedApiSpec.length} bytes)`);
      return cachedApiSpec;
    }
  }

  console.warn(`[api-spec] Not found in: ${candidates.join(', ')}`);
  return null;
}

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
  const spec = await loadApiSpec();

  if (!spec) {
    return c.json({
      openapi: '3.0.3',
      info: { title: 'Diploma Tracking System API', version: '0.1.0' },
      paths: {},
    });
  }

  return new Response(spec, {
    headers: { 'Content-Type': 'text/yaml' },
  });
});

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/students', studentsRoutes);
app.route('/api/v1/tracks', tracksRoutes);
app.route('/api/v1/courses', coursesRoutes);
app.route('/api/v1/certificates', certificatesRoutes);
app.route('/api/v1/coordinator', coordinatorRoutes);
app.route('/api/v1/enrollments', enrollmentsRoutes);
app.route('/api/v1/rules', rulesRoutes);
app.route('/api/v1/overrides', overridesRoutes);
app.route('/api/v1/integrations', integrationsRoutes);
app.route('/api/v1/notifications', notificationsRoutes);
app.route('/api/v1/cron', cronRoutes);
app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/system', systemRoutes);

app.onError(errorHandler);
app.notFound(notFoundHandler);

const port = Number.parseInt(process.env.PORT || '3000');

console.log(`🚀 Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
