import {
  Api as ApiIcon,
  BugReport as BugReportIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  Dns as DnsIcon,
  Language as LanguageIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
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

export function QAPage() {
  return (
    <Box
      data-testid="qa-page"
      sx={{
        maxWidth: 900,
        mx: 'auto',
        px: 3,
        py: 4,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Software Testability Guide for QA
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Diploma Tracking System (DTS) — Universidad Nacional de Córdoba
      </Typography>

      {/* 1. Architecture Overview */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<CloudIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon color="primary" />
            <Typography variant="h6">Architecture Overview</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" gutterBottom>
            The DTS follows a three-tier architecture deployed entirely on Vercel:
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontSize: '0.85rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`Browser (React SPA)
    │
    ▼
Vercel Edge Network
    │
    ├── /api/* ────────▶ Bun + Hono API Server (serverless function)
    │                        │
    │                        ├── JWT Auth (Supabase Auth)
    │                        ├── Rule Engine (recursive tree)
    │                        ├── Provider Abstraction (Moodle, Guaraní)
    │                        │
    │                        ▼
    │                   Supabase PostgreSQL (vbjhxlezqhkmhpuypkvf.supabase.co)
    │
    └── /* (static) ───▶ React + Vite + MUI 7 SPA`}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Both frontend and backend auto-deploy on push to main via Vercel.
            The Hono API runs as a Vercel serverless function under
            {' '}
            <code>/api/</code>
            ,
            while the React SPA is served as static assets.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 2. Demo Users & Roles */}
      <Accordion>
        <AccordionSummary expandIcon={<PeopleIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h6">Demo Users &amp; Roles</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
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
                <TableRow>
                  <TableCell>
                    <code>admin@dts.unc.edu.ar</code>
                  </TableCell>
                  <TableCell>
                    <Chip label="Available in .env" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label="admin" color="error" size="small" />
                  </TableCell>
                  <TableCell>Full CRUD, user management, dashboard stats, sync control</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <code>nahuelgomez.cti@gmail.com</code>
                  </TableCell>
                  <TableCell>
                    <Chip label="Available in .env" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label="estudiante" color="primary" size="small" />
                  </TableCell>
                  <TableCell>View progress, certificates, eligibility, register for exam</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <code>coordinador@dts.unc.edu.ar</code>
                  </TableCell>
                  <TableCell>
                    <Chip label="On request" size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label="coordinador" color="warning" size="small" />
                  </TableCell>
                  <TableCell>Enroll students, manage overrides, grade exams, batch operations</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            A
            {' '}
            <strong>sysadmin</strong>
            {' '}
            role also exists for platform-level administration.
            Passwords are stored in environment variables and never exposed in source code.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 3. API Testing */}
      <Accordion>
        <AccordionSummary expandIcon={<ApiIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ApiIcon color="primary" />
            <Typography variant="h6">API Testing</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" gutterBottom>
            The API surface is documented via OpenAPI and tested through Bun-native integration tests.
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>OpenAPI Specification</strong>
            </Typography>
            <Typography variant="body2">
              Dynamic spec generated at runtime from Hono route definitions:
              {' '}
              <Link href="/api/v1/api-spec" target="_blank" rel="noopener">
                GET /api/v1/api-spec
              </Link>
              {' '}
              (1,954-line YAML). Interactive API docs available at
              {' '}
              <Link href="/api/v1/docs" target="_blank" rel="noopener">
                Scalar API Reference UI (/api/v1/docs)
              </Link>
              .
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>API Integration Tests — 42 Bun Tests</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>
                  <strong>Smoke tests</strong>
                  {' '}
                  — Auth flow (login, refresh, logout, me)
                </li>
                <li>
                  <strong>Integration tests</strong>
                  {' '}
                  — RBAC middleware, CRUD operations across all entities
                </li>
                <li>
                  <strong>Exploratory tests</strong>
                  {' '}
                  — Sync endpoints, edge cases, error handling
                </li>
                <li>
                  <strong>Rule engine unit tests</strong>
                  {' '}
                  — 23 tests covering recursive ALL/ANY tree evaluation, overrides, deep nesting, empty rules
                </li>
              </ul>
            </Typography>
          </Box>

          <Typography variant="body2">
            Tests run on every push via
            {' '}
            <Link href="https://github.com/features/actions" target="_blank" rel="noopener">
              GitHub Actions CI
            </Link>
            {' '}
            (ci.yml workflow: typecheck → test → build).
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 4. UI / E2E Testing */}
      <Accordion>
        <AccordionSummary expandIcon={<BugReportIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon color="primary" />
            <Typography variant="h6">UI / E2E Testing (Playwright)</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" gutterBottom>
            17 end-to-end tests across 3 spec files using Playwright:
          </Typography>

          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Test File</strong></TableCell>
                  <TableCell><strong>Scope</strong></TableCell>
                  <TableCell><strong>Triggers</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><code>smoke.spec.ts</code></TableCell>
                  <TableCell>Login flow, auth token validation, protected route access</TableCell>
                  <TableCell>Push to any branch, PR</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>business-flow.spec.ts</code></TableCell>
                  <TableCell>Full navigation: login → dashboard → certificates → courses → logout</TableCell>
                  <TableCell>Weekly regression (regression.yml)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>ux-smoke.spec.ts</code></TableCell>
                  <TableCell>Routing refresh, identity verification, role-based UI checks</TableCell>
                  <TableCell>Push to any branch (ux-guard.yml)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary">
            Playwright runs in GitHub Actions CI with Chromium in headless mode.
            Test results are visible in the Actions tab of the repository.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 5. Database Testing */}
      <Accordion>
        <AccordionSummary expandIcon={<StorageIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon color="primary" />
            <Typography variant="h6">Database Testing</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" gutterBottom>
            Direct database inspection is available via the Supabase MCP (Model Context Protocol) integration.
            This allows QA to run SQL queries and inspect data without going through the API layer.
          </Typography>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            <strong>Key Tables</strong>
          </Typography>
          <Box component="ul" sx={{ columns: 2, columnGap: 4 }}>
            <li>
              <code>students</code>
              {' '}
              — Academic profiles (name, DNI, legajo, email)
            </li>
            <li>
              <code>courses</code>
              {' '}
              — Modules within tracks (name, credits, order_index)
            </li>
            <li>
              <code>certificates</code>
              {' '}
              — Proofs of course completion (synced from LMS)
            </li>
            <li>
              <code>enrollments</code>
              {' '}
              — Student ↔ Track links + exam lifecycle
            </li>
            <li>
              <code>prerequisite_rules</code>
              {' '}
              — ALL/ANY rule trees for exam eligibility
            </li>
            <li>
              <code>manual_overrides</code>
              {' '}
              — Coordinator-granted rule exceptions
            </li>
            <li>
              <code>integration_logs</code>
              {' '}
              — Audit trail for external sync operations
            </li>
            <li>
              <code>audit_log</code>
              {' '}
              — Generic admin action trail with before/after snapshots
            </li>
            <li>
              <code>users</code>
              {' '}
              — System identities (mapped to Supabase Auth)
            </li>
            <li>
              <code>tracks</code>
              {' '}
              — Diploma programs
            </li>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            RLS (Row-Level Security) policies are active on all tables.
            Use the appropriate user role when connecting via Supabase MCP.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* 6. Test Architecture */}
      <Accordion>
        <AccordionSummary expandIcon={<CodeIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="primary" />
            <Typography variant="h6">Test Architecture (KATA)</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" gutterBottom>
            The project follows the KATA (Komponent Action Test Architecture) 4-layer pattern:
          </Typography>

          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontSize: '0.85rem',
              overflowX: 'auto',
            }}
          >
            {`TestContext (environment, config, credentials)
    │
    ▼
ApiBase / UiBase (reusable API clients + page objects)
    │
    ▼
YourApi / YourPage (domain-specific wrappers)
    │
    ▼
TestFixture (test cases with assertions)`}
          </Box>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            <strong>Git Branch Strategy</strong>
          </Typography>
          <Typography variant="body2">
            Trunk-based development with short-lived feature branches.
            PRs trigger CI (typecheck + unit tests + E2E smoke). Merges to main auto-deploy to Vercel.
          </Typography>

          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            <strong>CI Pipeline Diagram</strong>
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.100',
              p: 2,
              borderRadius: 1,
              fontSize: '0.85rem',
              overflowX: 'auto',
            }}
          >
            {`Push to branch ──▶ ux-guard.yml (E2E smoke)
                         │
                         ▼
                    PR opened ──▶ pr.yml (typecheck + lint)
                         │
                         ▼
                    Merge to main ──▶ ci.yml (typecheck + test + build)
                         │               │
                         │               ▼
                         │          Vercel auto-deploy
                         │
                         ├── Daily ──▶ smoke.yml (auth + DB health)
                         │
                         └── Weekly ──▶ regression.yml (full suite)`}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 7. CI/CD Pipeline */}
      <Accordion>
        <AccordionSummary expandIcon={<DnsIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DnsIcon color="primary" />
            <Typography variant="h6">CI/CD Pipeline</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Workflow</strong></TableCell>
                  <TableCell><strong>Trigger</strong></TableCell>
                  <TableCell><strong>Scope</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><code>ci.yml</code></TableCell>
                  <TableCell>Push to main</TableCell>
                  <TableCell>Typecheck → API tests (42) → build</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>smoke.yml</code></TableCell>
                  <TableCell>Daily schedule</TableCell>
                  <TableCell>Auth health + DB connectivity smoke</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>regression.yml</code></TableCell>
                  <TableCell>Weekly schedule</TableCell>
                  <TableCell>Full test suite (API + E2E business flow)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>ux-guard.yml</code></TableCell>
                  <TableCell>Push to any branch</TableCell>
                  <TableCell>E2E smoke (ux-smoke.spec.ts)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><code>pr.yml</code></TableCell>
                  <TableCell>Pull request</TableCell>
                  <TableCell>Typecheck + lint + unit tests</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            All workflows are defined in
            {' '}
            <code>.github/workflows/</code>
            . Vercel auto-deploys the latest main on every push.
            Staging previews are generated automatically for each PR.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Additional Resources */}
      <Accordion>
        <AccordionSummary expandIcon={<LanguageIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon color="primary" />
            <Typography variant="h6">Additional Resources</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>
              <Typography variant="body2">
                <strong>API Docs (Scalar UI):</strong>
                {' '}
                <Link href="/api/v1/docs" target="_blank" rel="noopener">
                  /api/v1/docs
                </Link>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>OpenAPI Spec:</strong>
                {' '}
                <Link href="/api/v1/api-spec" target="_blank" rel="noopener">
                  GET /api/v1/api-spec
                </Link>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Supabase Project:</strong>
                {' '}
                <code>vbjhxlezqhkmhpuypkvf.supabase.co</code>
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>GitHub Actions:</strong>
                {' '}
                5 workflows in
                <code>.github/workflows/</code>
              </Typography>
            </li>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
