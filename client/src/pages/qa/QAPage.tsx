import {
  Api as ApiIcon,
  Key as KeyIcon,
  Language as LanguageIcon,
  Mouse as MouseIcon,
  NetworkCell as NetworkIcon,
  OpenInNew as OpenInNewIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ArchDiagram } from './ArchDiagram';
import { AuthMethods } from './AuthMethods';
import { CodeBlock } from './CodeBlock';
import { EnvSetup } from './EnvSetup';
import { qaConfig } from './qaConfig';
import { Section } from './Section';
import { Toc } from './Toc';
import { TwoWayTabs } from './TwoWayTabs';

const es = {
  subtitle: 'Todo lo que podés ejercitar contra DTS ahora mismo — UI, API REST y base Supabase. Para QA manual y testers asistidos por IA, en las tres capas: DB, API y UI.',
  credsTitle: '¿Necesitás las credenciales para hacer testing?',
  credsDesc: 'Los valores reales (demo users, strings de conexión, secretos) viven en el destino de credenciales — nunca en esta página pública.',
  credsCta: 'Abrir credenciales',
  credsGap: 'Destino de credenciales pendiente. Pedilo a tu lead.',
  credsAsk: 'Si no tenés acceso, pedilo a tu instructor o lead.',
  archTitle: 'Arquitectura + Repos',
  archDesc: 'Frontend → API → Database, con capa de MCP debajo. JWT via Supabase Auth con RBAC por rol (estudiante/coordinador/admin/sysadmin).',
  trinityTitle: 'Tres Capas del Testing + Setup de Env',
  trinityDesc: 'UI (Playwright) + API (OpenAPI / Postman) + DB (DBHub) = Testing Completo.',
  dbTitle: 'Backend testing: Database (dos caminos)',
  dbDesc: 'Inspeccioná datos directo en la base con el rol qa_inspector_ro (BYPASSRLS, solo SELECT). DBHub MCP o URI directa para VSCode.',
  apiTitle: 'Backend testing: API (dos caminos) + auth + docs',
  apiDesc: 'API REST con JWT Bearer. OpenAPI MCP para tests agénticos, Postman para suites formales. Documentación interactiva en Scalar UI.',
  uiTitle: 'Frontend testing: Playwright (scripted + agéntico)',
  uiDesc: 'Login email+password con token JWT retornable — el caso más directo para tests de API. Regresión scripteada + exploración agéntica con playwright-cli.',
  refTitle: 'Referencia rápida',
  docsCta: 'Abrir docs',
};

const demoUsers = [
  { email: 'admin@dts.unc.edu.ar', passwordHint: 'Disponible en credenciales', role: 'admin', roleColor: 'error' as const, capabilities: 'CRUD completo, gestión de usuarios, dashboard stats, control de sync' },
  { email: 'coordinador@dts.unc.edu.ar', passwordHint: 'Bajo pedido', role: 'coordinador', roleColor: 'warning' as const, capabilities: 'Inscribir estudiantes, gestionar overrides, calificar exámenes, batch operations' },
  { email: 'estudiante@dts.unc.edu.ar', passwordHint: 'Disponible en credenciales', role: 'estudiante', roleColor: 'primary' as const, capabilities: 'Ver progreso, certificados, elegibilidad, inscribirse a examen' },
];

const endpoints = [
  { method: 'GET', path: '/api/v1/health', purpose: 'Liveness probe' },
  { method: 'POST', path: '/api/v1/auth/login', purpose: 'Login email+password → JWT' },
  { method: 'POST', path: '/api/v1/auth/refresh', purpose: 'Refrescar access token' },
  { method: 'POST', path: '/api/v1/auth/logout', purpose: 'Revocar refresh token' },
  { method: 'GET', path: '/api/v1/auth/me', purpose: 'Identidad + rol del caller' },
  { method: 'GET', path: '/api/v1/students', purpose: 'Listar estudiantes (paginated)' },
  { method: 'GET', path: '/api/v1/students/:id/progress', purpose: 'Progreso del estudiante' },
  { method: 'GET', path: '/api/v1/certificates', purpose: 'Listar certificados' },
  { method: 'GET', path: '/api/v1/courses', purpose: 'Listar cursos' },
  { method: 'GET', path: '/api/v1/tracks', purpose: 'Listar tracks/diplomaturas' },
  { method: 'POST', path: '/api/v1/enrollments', purpose: 'Inscribir estudiante a examen' },
  { method: 'PUT', path: '/api/v1/enrollments/:id/grade', purpose: 'Registrar calificación' },
  { method: 'GET', path: '/api/v1/enrollments/eligibility/:studentId', purpose: 'Verificar elegibilidad' },
  { method: 'POST', path: '/api/v1/rules/evaluate', purpose: 'Evaluar reglas de prerrequisitos' },
  { method: 'GET', path: '/api/v1/admin/dashboard-stats', purpose: 'Stats del dashboard admin' },
  { method: 'POST', path: '/api/v1/integrations/sync/moodle', purpose: 'Sync batch de certificados Moodle' },
  { method: 'GET', path: '/api/v1/integrations/status', purpose: 'Health de integraciones' },
];

const playwrightFixture = `import { expect, request, test } from '@playwright/test';

// DTS usa login email+password que retorna JWT directamente.
// Flujo: login → extraer access_token → usar Bearer en requests.

type AuthFixtures = { authToken: string; authApi: Awaited<ReturnType<typeof request.newContext>> };

export const authedTest = test.extend<AuthFixtures>({
  authToken: async ({ page }, use) => {
    await page.goto('/login');
    await page.getByTestId('email-input').fill('admin@dts.unc.edu.ar');
    await page.getByTestId('password-input').fill('<ver credenciales>');
    
    const [loginRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/auth/login') && r.status() === 200),
      page.getByTestId('login-btn').click(),
    ]);
    const { access_token } = await loginRes.json();
    await use(access_token);
  },
  authApi: async ({ authToken }, use) => {
    const api = await request.newContext({
      extraHTTPHeaders: { Authorization: \`Bearer \${authToken}\` },
    });
    await use(api);
    await api.dispose();
  },
});

authedTest('el JWT del login sirve la API', async ({ authApi }) => {
  const me = await authApi.get('/api/v1/auth/me');
  expect(me.ok()).toBeTruthy();
  expect((await me.json()).auth.role).toBe('admin');
});`;

const playwrightSmoke = `import { expect, test } from '@playwright/test';

test('login UI: campos visibles y submit funcional', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByTestId('email-input')).toBeVisible();
  await expect(page.getByTestId('password-input')).toBeVisible();
  await expect(page.getByTestId('login-btn')).toBeVisible();
  
  await page.getByTestId('email-input').fill('admin@dts.unc.edu.ar');
  await page.getByTestId('password-input').fill('<ver credenciales>');
  
  const [res] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/auth/login')),
    page.getByTestId('login-btn').click(),
  ]);
  expect(res.status()).toBe(200);
  await expect(page).toHaveURL(/dashboard/);
});`;

export function QAPage() {
  return (
    <Box
      data-testid="qa-page"
      sx={{ maxWidth: 'lg', mx: 'auto', px: 3, py: 5 }}
    >
      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h3" component="h1" data-testid="qa-title" sx={{ fontWeight: 700 }}>
          Guía de Testeabilidad para QA
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 640, mx: 'auto' }}>
          {es.subtitle}
        </Typography>
      </Box>

      {/* Two-column layout */}
      <Box sx={{ display: { lg: 'grid' }, gridTemplateColumns: { lg: '16rem 1fr' }, gap: 5 }}>
        {/* Sticky TOC rail (desktop) */}
        <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
          <Toc />
        </Box>

        {/* Main content */}
        <Box sx={{ minWidth: 0 }}>
          {/* §1 Credentials CTA */}
          <Card
            id="credenciales"
            data-testid="qa-credentials-card"
            sx={{ borderLeft: '4px solid', borderColor: 'warning.main', bgcolor: 'warning.50', mb: 4 }}
          >
            <CardContent sx={{ 'p': 3, '&:last-child': { pb: 3 } }}>
              <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <KeyIcon sx={{ color: 'warning.main' }} />
                {es.credsTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {es.credsDesc}
              </Typography>
              {qaConfig.credentialsSource
                ? (
                    <Button
                      variant="contained"
                      size="large"
                      data-testid="qa-credentials-button"
                      href={qaConfig.credentialsSource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<KeyIcon />}
                      sx={{ 'bgcolor': 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
                    >
                      {es.credsCta}
                      {' '}
                      (
                      {qaConfig.credentialsSource.label}
                      )
                      <OpenInNewIcon sx={{ ml: 1, fontSize: 18 }} />
                    </Button>
                  )
                : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {es.credsGap}
                    </Typography>
                  )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                {es.credsAsk}
              </Typography>
            </CardContent>
          </Card>

          {/* §2 Architecture + Repos */}
          <Section
            id="arquitectura"
            testid="qa-architecture-card"
            icon={<NetworkIcon sx={{ color: 'text.secondary' }} />}
            title={es.archTitle}
            desc={es.archDesc}
            accent="slate"
          >
            <ArchDiagram config={qaConfig} />
          </Section>

          {/* §3 Trinity + Env */}
          <Section id="trifuerza" testid="qa-section-trinity" title={es.trinityTitle} desc={es.trinityDesc} accent="cyan">
            <Box sx={{ display: 'grid', gridTemplateColumns: { sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              {[
                { icon: <StorageIcon sx={{ fontSize: 28, color: 'success.main' }} />, label: 'DB · DBHub', desc: 'Verificá datos directo en la base: DBHub MCP (read-only) o una URI en tu cliente SQL.', link: '#db' },
                { icon: <ApiIcon sx={{ fontSize: 28, color: 'secondary.main' }} />, label: 'API · OpenAPI / Postman', desc: 'Invocá endpoints desde el agente con OpenAPI MCP, o armá suites formales con Postman.', link: '#api' },
                { icon: <MouseIcon sx={{ fontSize: 28, color: '#ec4899' }} />, label: 'UI · Playwright', desc: 'Manejá el browser: regresión scripteada + exploración agéntica con playwright-cli.', link: '#ui' },
              ].map(card => (
                <Card key={card.label} sx={{ borderLeft: '3px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ 'p': 2, '&:last-child': { pb: 2 } }}>
                    {card.icon}
                    <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                      <Link href={card.link} underline="hover" color="inherit">{card.label}</Link>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {card.desc}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
            <EnvSetup config={qaConfig} />
          </Section>

          {/* §4 DB testing */}
          <Section
            id="db"
            testid="qa-section-database"
            icon={<StorageIcon sx={{ color: 'success.main' }} />}
            title={es.dbTitle}
            desc={es.dbDesc}
            accent="emerald"
          >
            <Box
              sx={{
                borderLeft: '4px solid',
                borderColor: 'success.main',
                bgcolor: 'success.50',
                p: 2,
                borderRadius: 1,
                mb: 3,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Roles de QA (BYPASSRLS)
              </Typography>
              <Box component="ul" sx={{ 'm': 0, 'pl': 3, '& li': { fontSize: '0.8125rem', color: 'text.secondary', mb: 0.25 } }}>
                <li>
                  <code>qa_inspector_ro</code>
                  {' '}
                  — Solo lectura (SELECT en public.*). BYPASSRLS.
                </li>
                <li>
                  El rol usa el Session Pooler (puerto
                  {' '}
                  <strong>5432</strong>
                  ).
                  Host, user y password viven en las credenciales. Nunca en esta página.
                </li>
              </Box>
            </Box>
            <TwoWayTabs config={qaConfig} domain="db" />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Material secreto sigue opaco: el rol tiene REVOKE a nivel columna sobre
              {' '}
              <code>users.password_hash</code>
              . Los hashes no se ven ni con BYPASSRLS.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Sonda de aislamiento (RLS)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                RLS está activo en cada tabla. Para verificar: conectate con el rol de QA e intentá
                un
                {' '}
                <code>SELECT</code>
                {' '}
                en
                {' '}
                <code>students</code>
                {' '}
                — deberías ver todas las filas (BYPASSRLS),
                pero operaciones
                {' '}
                <code>INSERT/UPDATE/DELETE</code>
                {' '}
                están bloqueadas.
              </Typography>
            </Box>
          </Section>

          {/* §5 API testing */}
          <Section
            id="api"
            testid="qa-section-api"
            icon={<ApiIcon sx={{ color: 'secondary.main' }} />}
            title={es.apiTitle}
            desc={es.apiDesc}
            accent="violet"
          >
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Requests de auth
            </Typography>
            <AuthMethods config={qaConfig} />

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Dos caminos para testear la API
              </Typography>
              <TwoWayTabs config={qaConfig} domain="api" />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Higiene de tokens
              </Typography>
              <Typography variant="body2" color="text.secondary">
                El access token JWT expira en
                {' '}
                {qaConfig.api.tokenShape.includes('24h') ? '24h' : '15m'}
                {' '}
                (configurable vía
                {' '}
                <code>JWT_EXPIRES_IN</code>
                ).
                Usá
                {' '}
                <code>POST /auth/refresh</code>
                {' '}
                para obtener un nuevo par sin re-login.
                El refresh token dura 7 días. Si perdés ambos, volvé a loguearte.
              </Typography>
            </Box>

            {qaConfig.docs.route && (
              <Button
                variant="outlined"
                size="small"
                data-testid="qa-docs-button"
                href={qaConfig.docs.route}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 3 }}
                startIcon={<LanguageIcon />}
                endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
              >
                {es.docsCta}
                {' '}
                (Scalar UI)
              </Button>
            )}
          </Section>

          {/* §6 UI testing */}
          <Section
            id="ui"
            testid="qa-section-ui"
            icon={<MouseIcon sx={{ color: '#ec4899' }} />}
            title={es.uiTitle}
            desc={es.uiDesc}
            accent="pink"
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              (a) Regresión scripteada — bridge UI→API directo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              DTS usa login email+password que retorna JWT directamente. Caso más simple: el fixture
              de Playwright intercepta la respuesta del login y extrae el
              {' '}
              <code>access_token</code>
              .
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Fixture híbrido — login → JWT → Bearer
            </Typography>
            <CodeBlock language="typescript" code={playwrightFixture} />

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Smoke test de UI
            </Typography>
            <CodeBlock language="typescript" code={playwrightSmoke} />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                data-testid del login
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>data-testid</strong></TableCell>
                      <TableCell><strong>Propósito</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell><code>email-input</code></TableCell>
                      <TableCell>Input de email del login</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>password-input</code></TableCell>
                      <TableCell>Input de contraseña</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>login-btn</code></TableCell>
                      <TableCell>Botón "Entrar"</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              (b) Agéntico — playwright-cli
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              No usamos el MCP de Playwright: el agente maneja el browser con el binario
              {' '}
              <code>playwright-cli</code>
              .
              Es más eficiente en modo agéntico — menos tokens que el MCP, comandos directos.
            </Typography>
            <CodeBlock
              language="bash"
              code={`# 1. Instalá el CLI (una vez) + los browsers
npm i -g @playwright/cli@latest
bunx playwright install

# 2. El agente maneja el browser por comandos directos:
playwright-cli open <APP_URL>/login
playwright-cli snapshot
playwright-cli fill e5 "admin@dts.unc.edu.ar" --submit
playwright-cli click e7
playwright-cli screenshot --filename=login.png
playwright-cli close`}
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Prompts de ejemplo que un agente puede correr:
              </Typography>
              <Box component="ul" sx={{ 'm': 0, 'pl': 3, '& li': { fontSize: '0.8125rem', color: 'text.secondary', mb: 0.25 } }}>
                <li>abrí /login, logueate como admin@dts.unc.edu.ar y sacá un screenshot del dashboard</li>
                <li>listá todos los empty states del panel de estudiante</li>
                <li>reportá un bug si algún texto visible desborda su contenedor</li>
              </Box>
            </Box>

            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 1,
                bgcolor: 'action.hover',
                borderLeft: '3px solid',
                borderColor: '#ec4899',
              }}
            >
              <Typography variant="subtitle2">
                Regla de decisión
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Scripted</strong>
                {' '}
                Playwright para regresión / CI;
                <strong>agéntico</strong>
                {' '}
                (playwright-cli) para exploración, caza de bugs y onboarding.
              </Typography>
            </Box>
          </Section>

          {/* §7 Quick reference */}
          <Section id="referencia" testid="qa-section-reference" title={es.refTitle} accent="blue">
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Demo users
            </Typography>
            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Password</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Capabilities</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {demoUsers.map(u => (
                    <TableRow key={u.email}>
                      <TableCell><code>{u.email}</code></TableCell>
                      <TableCell><Chip label={u.passwordHint} size="small" variant="outlined" /></TableCell>
                      <TableCell><Chip label={u.role} color={u.roleColor} size="small" /></TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{u.capabilities}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Endpoints clave
            </Typography>
            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Método</strong></TableCell>
                    <TableCell><strong>Path</strong></TableCell>
                    <TableCell><strong>Propósito</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpoints.map(e => (
                    <TableRow key={e.path}>
                      <TableCell>
                        <Chip
                          label={e.method}
                          size="small"
                          color={e.method === 'GET' ? 'success' : e.method === 'POST' ? 'primary' : e.method === 'PUT' ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell><code>{e.path}</code></TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{e.purpose}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Troubleshooting
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Error</strong></TableCell>
                    <TableCell><strong>Causa probable</strong></TableCell>
                    <TableCell><strong>Primero a revisar</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>401 Unauthorized</TableCell>
                    <TableCell>Token JWT expirado o inválido</TableCell>
                    <TableCell>POST /auth/refresh con el refresh_token, o re-login</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>403 Forbidden</TableCell>
                    <TableCell>Rol sin permisos (ej. estudiante en ruta admin)</TableCell>
                    <TableCell>Verificar rol del usuario con GET /auth/me</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>401/403 en un MCP</TableCell>
                    <TableCell>Una var de .env no cargó</TableCell>
                    <TableCell>Salí del agente, corregí .env, reentrá</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>DBHub auth críptico</TableCell>
                    <TableCell>
                      Un slot DBHUB_* falta (sustituye literal
                      $
                      {'{VAR}'}
                      )
                    </TableCell>
                    <TableCell>
                      <code>env | grep DBHUB</code>
                      {' '}
                      antes de lanzar
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Login rate-limited</TableCell>
                    <TableCell>5 intentos fallidos en 15 minutos</TableCell>
                    <TableCell>Esperar 15 min o usar otra IP</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Section>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 6, display: 'block', textAlign: 'center' }}>
        Esta página es pública — nunca printeamos credenciales reales acá. Los valores sensibles viven en el destino de credenciales.
      </Typography>
    </Box>
  );
}
