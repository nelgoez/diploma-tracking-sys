# Business Feature Map — Diploma Tracking System (DTS)

> **Document**: System Discovery · Feature → Story Traceability
> **Project**: Diploma Tracking System — Universidad Nacional de Córdoba
> **Version**: 1.0 · **Status**: Final
> **Language**: English

---

## Core Capability → Phase → Story Map

### Capability: Authentication & RBAC (Phase 1)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-AUTH-1 | Supabase project setup + DB schema migration | Migration `001_initial_schema.sql` applied. All tables, indexes, RLS policies, triggers active. `database.types.ts` generated. |
| DTS-AUTH-2 | JWT authentication (login, refresh, logout) | POST /auth/login → access+refresh tokens. POST /auth/refresh → new pair. POST /auth/logout → revoke. Rate limit: 5 attempts/15min. |
| DTS-AUTH-3 | RBAC middleware (authenticate, requireRole) | `authenticate` validates JWT, injects auth context. `requireRole(roles[])` gates endpoints. 401/403 responses. |
| DTS-AUTH-4 | User CRUD + role management | Admin creates users with roles (estudiante/coordinador/admin/sysadmin). POST /admin/users → Supabase Auth + users table. |

### Capability: Provider Abstraction (Phase 1)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-INT-1 | Provider abstraction interfaces + registry | `CertificateProvider` interface: `fetchCertificates()`, `validateCertificate()`, `healthCheck()`. `AcademicProvider` interface. `ProviderRegistry` with config-driven resolution. `providers.yaml` config. |
| DTS-INT-2 | Moodle provider (mock + health check) | `MoodleCertificateProvider` implements `CertificateProvider`. Mock returns sample data. `healthCheck()` pings Moodle URL. Configurable URL + token. |
| DTS-INT-3 | Integration logs + logging middleware | `integration_logs` table. Helpers: `logSyncStart()`, `logSyncComplete()`, `logPerStudent()`. |

### Capability: Tracks & Courses (Phase 2)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-CORE-1 | Tracks CRUD | Admin creates tracks (name, code, description). List with pagination. Get by ID. Update name/description/status. Active/inactive toggle. |
| DTS-CORE-2 | Courses CRUD | Admin creates courses within track (name, code, order_index, credits). List by track. Get detail. Ordered by order_index. |

### Capability: Students & Enrollment (Phase 2)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-CORE-3 | Students CRUD | Admin/coordinator list students (paginated). Search by name/email/DNI. Get detail with profile. Create student record. |
| DTS-CORE-4 | Single enrollment | Coordinator enrolls existing student in track. Unique (student_id, track_id) enforced. Enrollment created with status=active. |
| DTS-CORE-5 | Certificate list + get by ID | GET /students/:id/certificates (paginated). GET /certificates/:id (detail). Shows course name, issue date, provider, status. |
| DTS-CORE-6 | Batch CSV enrollment | POST /enrollments/batch accepts CSV (email column). Creates new students, enrolls existing. Returns summary: created, enrolled, already enrolled, errors. |

### Capability: Rule Engine (Phase 3)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-RULE-1 | Prerequisite rules CRUD | Coordinator creates ALL/ANY rules referencing courses. Tree structure (parent_rule_id). Update replaces rule. Delete requires admin. |
| DTS-RULE-2 | Rule engine evaluator (recursive tree) | POST /rules/evaluate({studentId, trackId}) → EligibilityResult. ALL=all children pass, ANY=≥1 child passes. Respects overrides. <500ms. ≥95% branch coverage. |
| DTS-RULE-3 | Manual override CRUD | Coordinator creates override (student, rule, reason, optional expiry). Unique active override constraint. Immediate evaluation impact. Revoke/expire lifecycle. |
| DTS-RULE-4 | View rule tree (read) | GET /courses/:id/prerequisites → full rule tree. GET /rules?trackId=:id → all rules for track. Hierarchical display. |

### Capability: Exam Lifecycle (Phase 4)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-EXAM-1 | Student progress API | GET /students/:id/progress → TrackProgress: totalModules, completedModules, per-module status, nextSteps. |
| DTS-EXAM-2 | Eligibility check on dashboard | GET /enrollments/eligibility/:studentId → eligibility with breakdown. Real-time evaluation. |
| DTS-EXAM-3 | Exam enrollment | POST /enrollments (exam_date) → exam_status=inscripto. Re-evaluates eligibility at enrollment. Rejects if not eligible. Unique check per date. |
| DTS-EXAM-4 | Grade recording + auto-status transition | PUT /enrollments/:id/grade (1-10). Grade ≥4 → aprobado + diploma_pendiente. Grade <4 → desaprobado. Audit log. |
| DTS-EXAM-5 | Exam history view | GET /enrollments (filtered by student) → exam attempts. Sorted by date desc. Shows date, grade, result, diploma status. |

### Capability: Admin Panel (Phase 5)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-ADMIN-1 | Admin dashboard stats | GET /admin/dashboard-stats → totalStudents, activeStudents, activeTracks, totalCertificates, eligibleCount, notEligibleCount, recentSyncErrors. |
| DTS-ADMIN-2 | Admin student list + full profile | GET /admin/students (search + filters). Detail: certificates, enrollments, overrides, exam history. |
| DTS-ADMIN-3 | Admin tracks + courses management | Admin CRUD for tracks and courses. Full management via API. |

### Capability: Integration Sync (Phase 5)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-SYNC-1 | Moodle batch certificate sync | POST /integrations/sync/moodle → async batch. 50/block. UPSERTs certificates. Conflict guard (no concurrent). Returns sync ID for polling. |
| DTS-SYNC-2 | Individual certificate re-sync | POST /certificates/:id/resync → re-sync single certificate from provider. Logs to integration_logs + audit_log. |
| DTS-SYNC-3 | Integration status + logs viewer | GET /integrations/status → per-provider health. GET /integrations/logs → paginated, filterable (provider, status, date range). |
| DTS-SYNC-4 | Resilient adapter (retry + timeout) | 3 retries with exponential backoff (1s, 4s, 9s). Per-student error isolation. Timeout configurable per provider (default 10s). Degraded operation. |

### Capability: Notifications & Polish (Phase 6 — Should Have)

| Story ID | Feature | AC Summary |
|---|---|---|
| DTS-NOTIF-1 | Eligibility change notification | Not-eligible → eligible transition creates notification. Visible in dashboard. Unread badge. Mark as read. |
| DTS-NOTIF-2 | New certificate notification | Sync imports new certificate → notification (course name + date). Updates ignored. |
| DTS-NOTIF-3 | Notification table + API | `notifications` table. GET /notifications (paginated, unread first). PUT /notifications/:id/read. Unread count endpoint. |
| DTS-OVERRIDE-1 | Override expiry scheduler | Daily cron: expired overrides → status=expired → re-evaluate → notify coordinators. |
| DTS-INT-5 | Guaraní student sync | `GuaraniAcademicProvider` implements `AcademicProvider.fetchStudents()`. POST /integrations/sync/guarani → upsert by email/DNI. Same resilience as Moodle. |
| DTS-EXTRAS-1 | Coordinator dashboard with filters | Track summary, eligible/not-eligible filter, student search within track, bulk grade input. |

---

## Feature Dependency Graph

```
Authentication (Phase 1) ──┐
Provider Interfaces (P1) ──┤
                            ├── Core Domain CRUD (Phase 2) ──┐
                            │                                ├── Rule Engine (Phase 3) ──┐
                            │                                │                          ├── Exam Lifecycle (Phase 4) ──┐
                            │                                │                          │                              ├── Admin & Sync (Phase 5)
                            │                                │                          │                              │
                            │                                └── Certificates ──────────┘                              │
                            │                                                                                          │
                            └── Integration Logs ─────────────────────────────────────────────────────────────────────┘
                                                                                                                      │
                                                                                                              Notifications (Phase 6)
```

---

## Priority Classification (MoSCoW)

| Phase | Must Have | Should Have | Could Have |
|---|---|---|---|
| 1. Foundation | DTS-AUTH-1..4, DTS-INT-1..3 | — | — |
| 2. Core Domain | DTS-CORE-1..6 | — | — |
| 3. Rule Engine | DTS-RULE-1, DTS-RULE-2, DTS-RULE-4 | DTS-RULE-3 | — |
| 4. Exam | DTS-EXAM-1..4 | DTS-EXAM-5 | — |
| 5. Admin & Sync | DTS-ADMIN-1..3, DTS-SYNC-1..4 | — | — |
| 6. Notifications | — | DTS-NOTIF-1..3, DTS-OVERRIDE-1, DTS-INT-5, DTS-EXTRAS-1 | — |

---

> *Generated as part of DTS Discovery Maps. Refresh when stories are added, split, or reprioritized.*
