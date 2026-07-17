# DTS — Testability Credentials

> **Purpose**: Companion credentials for the [Software Testability Guide for QA](/qa).
> **DO NOT COMMIT** passwords to public repos. This artifact lives in a private Confluence / Jira space or a password manager.

## Demo Users

| Email                      | Password     | Role        | Capabilities                                                                         |
| -------------------------- | ------------ | ----------- | ------------------------------------------------------------------------------------ |
| admin@dts.unc.edu.ar       | Admin123456! | admin       | Full admin dashboard, user CRUD, track/course CRUD, Moodle sync, integration logs    |
| nahuelgomez.cti@gmail.com  | Test123456!  | estudiante  | Student dashboard, progress view, eligibility check, exam registration, certificates |
| coordinador@dts.unc.edu.ar | Demo2024!    | coordinador | Track management, enrollment, override creation, grade recording                     |
| estudiante@dts.unc.edu.ar  | Demo2024!    | estudiante  | Student dashboard, progress view, eligibility check, exam registration, certificates |

## Access Points

| Resource        | URL                                                                           |
| --------------- | ----------------------------------------------------------------------------- |
| Web App         | https://nelgoez-diploma-tracking-sys-git-main-nelgoezs-projects.vercel.app    |
| API Base        | https://server-git-main-nelgoezs-projects.vercel.app/api/v1                   |
| OpenAPI Spec    | https://server-git-main-nelgoezs-projects.vercel.app/api/v1/api-spec          |
| Scalar API Docs | https://server-git-main-nelgoezs-projects.vercel.app/api/v1/docs              |
| QA Guide        | https://nelgoez-diploma-tracking-sys-git-main-nelgoezs-projects.vercel.app/qa |

## Database (Supabase)

| Property    | Value                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project URL | https://vbjhxlezqhkmhpuypkvf.supabase.co                                                                                                                                                                                   |
| Anon Key    | (available in .env — uses Supabase MCP for agentic DB access)                                                                                                                                                              |
| Schema      | public (16 tables: students, courses, certificates, enrollments, prerequisite_rules, manual_overrides, integration_logs, audit_log, tracks, track_coordinators, users, prerequisite_sources, notifications, diploma_files) |

## API Authentication

| Method             | Bearer Token (JWT)                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| POST /auth/login   | { "email": "...", "password": "..." } → { access_token, refresh_token, user: { id, role, name } } |
| POST /auth/refresh | { "refresh_token": "..." } → { access_token, refresh_token }                                      |
| Header             | Authorization: Bearer <access_token>                                                              |

## Testing Tools

| Tool                | Command / Configuration                                  |
| ------------------- | -------------------------------------------------------- |
| Playwright E2E      | `cd client && bunx playwright test`                      |
| API Tests (Bun)     | `cd server && bun test`                                  |
| Rule Engine Tests   | `cd server && bun test src/services/rule-engine.test.ts` |
| TypeScript Check    | `tsc --noEmit` (client + server)                         |
| DB Types Generation | `cd server && bun run db:types`                          |

## CI/CD Pipelines

| Workflow       | Trigger                 | What It Tests                                     |
| -------------- | ----------------------- | ------------------------------------------------- |
| ci.yml         | Push/PR to main/staging | TypeScript, unit tests, API tests, client build   |
| smoke.yml      | Daily (Mon-Fri 6AM)     | Auth flow, RBAC, DB connectivity                  |
| regression.yml | Weekly (Mon 2AM)        | Full server test suite + Playwright E2E suite     |
| ux-guard.yml   | Push to main/staging    | Routing, identity, roles, sync, logout (10 tests) |

## Key API Endpoints

| Method | Endpoint                     | Auth           | Purpose              |
| ------ | ---------------------------- | -------------- | -------------------- |
| POST   | /auth/login                  | Public         | Login                |
| GET    | /auth/me                     | User           | Current user profile |
| GET    | /students/:id/progress       | User (own)     | Student progress     |
| GET    | /enrollments/eligibility/:id | User (own)     | Exam eligibility     |
| GET    | /admin/dashboard-stats       | Admin/SysAdmin | System-wide stats    |
| GET    | /courses                     | Any            | Course catalog       |
| POST   | /integrations/sync/moodle    | Admin/SysAdmin | Trigger Moodle sync  |
| GET    | /system/diagnostics          | SysAdmin       | System health check  |

## Architecture Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Vercel (CDN)    │────▶│  Bun + Hono API │
│  (React SPA) │     │  Static + Proxy  │     │  (server.ts)    │
└──────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Supabase      │
                                              │   PostgreSQL    │
                                              │   + JWT Auth    │
                                              └─────────────────┘
```
