# Business API Map — Diploma Tracking System (DTS)

> **Document**: System Discovery · API Endpoint Catalog
> **Project**: Diploma Tracking System — Universidad Nacional de Córdoba
> **Version**: 1.0 · **Status**: Final
> **Language**: English

---

## API Conventions

- **Base path**: `/api/v1`
- **Response envelope**: `{ data: T, meta?: { page, pageSize, total } }` (success) · `{ error: { code, message, details? } }` (error)
- **Auth**: Bearer JWT in `Authorization` header
- **Pagination**: `?page=1&pageSize=20` query params

---

## Domains

### Auth

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate user, return access + refresh tokens |
| POST | `/auth/refresh` | Public (valid refresh token) | Rotate refresh token, return new token pair |
| POST | `/auth/logout` | Any authenticated | Revoke active refresh token |
| GET | `/auth/me` | Any authenticated | Return current user profile + role + track assignments |

### Users

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/admin/users` | admin, sysadmin | List all users (paginated, searchable) |
| POST | `/admin/users` | admin, sysadmin | Create user in Supabase Auth + users table with role |
| GET | `/admin/users/:id` | admin, sysadmin | Get user detail |
| PUT | `/admin/users/:id` | admin, sysadmin | Update user profile or role |
| DELETE | `/admin/users/:id` | sysadmin | Soft-delete user (set is_active=false) |

### Students

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/students` | coordinador, admin | List students (paginated, search by name/email/DNI) |
| POST | `/students` | coordinador, admin | Create student record |
| GET | `/students/:id` | estudiante(own), coordinador(track), admin | Get student detail with full profile |
| PUT | `/students/:id` | admin | Update student profile |
| GET | `/students/:id/progress` | estudiante(own), coordinador(track) | Get track progress: totalModules, completedModules, per-module status, nextSteps |
| GET | `/students/:id/certificates` | estudiante(own), coordinador(track) | List student certificates (paginated) |

### Tracks

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/tracks` | Any authenticated | List tracks (paginated) |
| POST | `/tracks` | admin | Create track (name, code, description) |
| GET | `/tracks/:id` | Any authenticated | Get track detail |
| PUT | `/tracks/:id` | admin | Update track (name, description, status) |
| DELETE | `/tracks/:id` | admin | Set track inactive |
| POST | `/tracks/:id/coordinators` | admin | Assign coordinator to track |
| DELETE | `/tracks/:id/coordinators/:userId` | admin | Remove coordinator from track |

### Courses

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/tracks/:trackId/courses` | Any authenticated | List courses for a track (ordered by order_index) |
| POST | `/tracks/:trackId/courses` | admin | Create course (name, code, order_index, credits, moodle_course_id) |
| GET | `/courses/:id` | Any authenticated | Get course detail |
| PUT | `/courses/:id` | admin | Update course |
| GET | `/courses/:id/prerequisites` | Any authenticated | Get full prerequisite rule tree for a course |
| GET | `/admin/courses` | admin | List all courses across tracks (admin view) |

### Enrollments

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/enrollments` | coordinador, admin | Enroll student in track (single). Also used for exam enrollment with exam_date |
| GET | `/enrollments` | estudiante(own), coordinador(track), admin | List enrollments (filterable by student, track, status) |
| GET | `/enrollments/:id` | estudiante(own), coordinador(track), admin | Get enrollment detail |
| PUT | `/enrollments/:id` | coordinador, admin | Update enrollment (status, exam_date) |
| PUT | `/enrollments/:id/grade` | coordinador | Record exam grade (1-10). Auto-transitions exam_status |
| POST | `/enrollments/batch` | coordinador, admin | Batch enrollment from CSV (email column required) |
| GET | `/enrollments/eligibility/:studentId` | estudiante(own), coordinador(track) | Real-time eligibility check with breakdown |

### Certificates

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/certificates` | Any authenticated (scoped) | List certificates (paginated) |
| GET | `/certificates/:id` | estudiante(own), coordinador(track), admin | Get certificate detail |
| POST | `/certificates/:id/resync` | admin | Re-sync single certificate from provider |

### Rules

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/rules` | Any authenticated | List rules (filterable by trackId) |
| POST | `/rules` | coordinador, admin | Create prerequisite rule (ALL/ANY type, with sources) |
| GET | `/rules/:id` | Any authenticated | Get rule detail with tree structure |
| PUT | `/rules/:id` | coordinador, admin | Update rule (replaces sources) |
| DELETE | `/rules/:id` | admin | Delete rule |
| POST | `/rules/evaluate` | Any authenticated (scoped) | Evaluate eligibility for student+track combination |

### Overrides

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/overrides` | coordinador(track), admin | List overrides (filterable by student, rule, status) |
| POST | `/overrides` | coordinador | Create override (student, rule, reason, optional expiry) |
| GET | `/overrides/:id` | coordinador(track), admin | Get override detail |
| PUT | `/overrides/:id/revoke` | coordinador, admin | Revoke active override |
| GET | `/students/:id/overrides` | coordinador(track), admin | List overrides for a specific student |

### Integrations

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/integrations/sync/moodle` | admin | Trigger async Moodle batch certificate sync. Returns sync ID |
| POST | `/integrations/sync/guarani` | admin | Trigger async Guaraní student registry sync (Phase 6) |
| GET | `/integrations/status` | admin | Per-provider health status (connected/error, latency, last sync) |
| GET | `/integrations/logs` | admin | List integration logs (paginated, filterable by provider, status, date range) |
| GET | `/integrations/sync/:syncId` | admin | Poll batch sync status and progress |

### Admin

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/admin/dashboard-stats` | admin, sysadmin | Aggregate stats: totalStudents, activeStudents, activeTracks, totalCertificates, eligibleCount, notEligibleCount, recentSyncErrors |
| GET | `/admin/students` | admin | Student list with search + filters (admin view) |
| GET | `/admin/students/:id` | admin | Student full profile (certificates, enrollments, overrides, exam history) |

### Notifications

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/notifications` | Any authenticated | List notifications (paginated, unread first) |
| PUT | `/notifications/:id/read` | Any authenticated (own) | Mark notification as read |
| GET | `/notifications/unread-count` | Any authenticated | Get unread notification count |

### Verification (Post-MVP)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/verify/diploma/:code` | Public | Public diploma verification by code |

### Diplomas (Post-MVP)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/diplomas/:id` | estudiante(own), admin | Get diploma detail |
| GET | `/diplomas/:id/pdf` | estudiante(own), admin | Download diploma PDF |

---

## Middleware Composition Pattern

All protected endpoints follow Hono middleware chain:

```
authenticate → requireRole(roles[]) → validateBody(schema?) → handler
```

- **authenticate**: Validates JWT from Authorization header, injects `auth` context (userId, role, trackIds)
- **requireRole**: Gates endpoint to allowed roles. Returns 403 for insufficient permissions
- **validateBody**: Zod schema validation on request body (POST/PUT/PATCH only)

RLS (Row-Level Security) in Supabase enforces data access at DB level as defense-in-depth behind API middleware.

---

## Role-Based Access Summary

| Role | Scope |
|---|---|
| **estudiante** | Own data only (profile, certificates, enrollments, eligibility, notifications) |
| **coordinador** | Students in assigned tracks. CRUD on rules, overrides, enrollments, grades for own tracks |
| **admin** | All students, tracks, courses. User management. Integration triggers. Dashboard stats |
| **sysadmin** | admin permissions + system configuration, user deletion |

---

## Provider-Driven Endpoints

Endpoints that depend on configured providers (abstracted behind interfaces):

| Domain | Provider Interface | Active Provider | Config |
|---|---|---|---|
| Certificates sync | `CertificateProvider` | Moodle | `MOODLE_URL`, `MOODLE_TOKEN` |
| Student registry sync | `AcademicProvider` | Guaraní (Phase 6) | `GUARANI_URL`, `GUARANI_TOKEN` |
| Health checks | `healthCheck()` (both) | Active provider per domain | Per-provider |

Zero business logic depends on concrete provider implementations — all depend on interfaces.

---

> *Generated as part of DTS Discovery Maps. Refresh when routes are added, removed, or change auth requirements.*
