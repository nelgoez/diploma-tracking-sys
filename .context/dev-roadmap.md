# Development Roadmap — Diploma Tracking System (DTS)

> **Document**: Sprint Execution Plan · Dependencies + Status
> **Project**: Diploma Tracking System — Universidad Nacional de Córdoba
> **Version**: 1.0 · **Status**: Final
> **Language**: English

---

## Dependency Graph

```
DTS-AUTH-1 ──► DTS-AUTH-2 ──► DTS-AUTH-3 ──► DTS-CORE-1 ──► DTS-CORE-2 ──► DTS-RULE-1 ──► DTS-RULE-2 ──► DTS-EXAM-2 ──► DTS-EXAM-3 ──► DTS-EXAM-4
                │                              │               │               │                              │
                ▼                              ▼               ▼               ▼                              ▼
           DTS-INT-3                     DTS-CORE-3 ────► DTS-CORE-4   DTS-RULE-4                    DTS-RULE-3 ──► DTS-OVERRIDE-1
                                              │               │
                                              ▼               ▼
                                         DTS-CORE-5    DTS-CORE-6
                                              │
                                              ▼
                                         DTS-EXAM-1 ──► DTS-EXAM-2
                                                              │
                                                              ▼
                                                         DTS-EXAM-3 ──► DTS-EXAM-5
                                                              │
                                                              ▼
                                                         DTS-EXAM-4

DTS-INT-1 ──► DTS-INT-2 ──► DTS-SYNC-1 ──► DTS-SYNC-2
                │               │               │
                │               ▼               ▼
                │          DTS-SYNC-4      DTS-ADMIN-1
                │                              │
                └────────── DTS-INT-5 ────────►│ (Phase 6)

DTS-SYNC-1 ──► DTS-NOTIF-2
DTS-RULE-2 ──► DTS-NOTIF-1 ──► DTS-NOTIF-3
```

---

## Sprint Allocation

### Sprint 1: Foundation (Phase 1) — 21 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-AUTH-1 | Supabase project setup + DB schema migration | None | ✅ Done |
| DTS-AUTH-2 | JWT authentication (login + refresh + logout) | DTS-AUTH-1 | ✅ Done |
| DTS-AUTH-3 | RBAC middleware (authenticate + requireRole) | DTS-AUTH-2 | ✅ Done |
| DTS-AUTH-4 | User CRUD + role management | DTS-AUTH-1 | ✅ Done |
| DTS-INT-1 | Provider abstraction interfaces + registry | None | ✅ Done |
| DTS-INT-2 | Moodle provider (mock + health check) | DTS-INT-1 | ✅ Done |
| DTS-INT-3 | Integration logs table + logging middleware | DTS-AUTH-1 | ✅ Done |

### Sprint 2: Core Domain (Phase 2 Start) — 15 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-CORE-1 | Tracks CRUD (list, create, get, update) | DTS-AUTH-3 | ✅ Done |
| DTS-CORE-2 | Courses CRUD (list, create, get) | DTS-CORE-1 | ✅ Done |
| DTS-CORE-3 | Students CRUD (list, get, search) | DTS-AUTH-3 | ✅ Done |
| DTS-CORE-4 | Enrollment (single student to track) | DTS-CORE-1, DTS-CORE-3 | ✅ Done |

### Sprint 3: Core Finish + Rules Start (Phase 2 End + Phase 3 Start) — 13 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-CORE-5 | Certificate list + get by ID | DTS-CORE-2, DTS-CORE-3 | ✅ Done |
| DTS-CORE-6 | Batch enrollment from CSV | DTS-CORE-4 | ✅ Done |
| DTS-RULE-1 | Prerequisite rules CRUD (create, list, update, delete) | DTS-CORE-2 | ✅ Done |

### Sprint 4: Rule Engine (Phase 3 End) — 15 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-RULE-2 | Rule engine evaluator (recursive tree) | DTS-RULE-1 | ✅ Done |
| DTS-RULE-3 | Manual override CRUD | DTS-RULE-2, DTS-CORE-3 | ✅ Done |
| DTS-RULE-4 | View rule tree (read) | DTS-RULE-1 | ✅ Done |

### Sprint 5: Exam Lifecycle (Phase 4 Start) — 15 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-EXAM-1 | Student progress API | DTS-CORE-2, DTS-CORE-3, DTS-CORE-5 | ✅ Done |
| DTS-EXAM-2 | Eligibility check on dashboard | DTS-RULE-2, DTS-EXAM-1 | ✅ Done |
| DTS-EXAM-3 | Exam enrollment (inscribir a examen) | DTS-EXAM-2 | ✅ Done |

### Sprint 6: Exam Finish + Admin Start (Phase 4 End + Phase 5 Start) — 16 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-EXAM-4 | Grade recording (+ auto-status transition) | DTS-EXAM-3 | ✅ Done |
| DTS-EXAM-5 | Exam history view | DTS-EXAM-3 | ✅ Done |
| DTS-ADMIN-1 | Admin dashboard stats | DTS-CORE-1, DTS-CORE-3, DTS-CORE-5 | ✅ Done |
| DTS-ADMIN-2 | Admin student list + detail (full profile) | DTS-CORE-3 | ✅ Done |
| DTS-ADMIN-3 | Admin tracks + courses management | DTS-CORE-1, DTS-CORE-2 | ✅ Done |

### Sprint 7: Integration Sync (Phase 5 Middle) — 14 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-SYNC-1 | Moodle batch certificate sync | DTS-INT-2, DTS-INT-3, DTS-CORE-3 | ✅ Done |
| DTS-SYNC-2 | Individual certificate re-sync | DTS-SYNC-1 | ✅ Done |
| DTS-SYNC-3 | Integration status + logs viewer | DTS-INT-3 | ✅ Done |

### Sprint 8: Resilience + Notifications (Phase 5 End + Phase 6 Start) — 16 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-SYNC-4 | Resilient adapter (retry + timeout) | DTS-SYNC-1 | ✅ Done |
| DTS-NOTIF-1 | Eligibility change notification | Phase 3 + Phase 4 | ⬜ Not started |
| DTS-NOTIF-2 | New certificate notification | DTS-SYNC-1 | ⬜ Not started |
| DTS-NOTIF-3 | Notification table + API | DTS-NOTIF-1 | ⬜ Not started |

### Sprint 9+: Should Have Backlog (Phase 6 End) — 16 SP

| Story ID | Story | Deps | Status |
|---|---|---|---|
| DTS-OVERRIDE-1 | Override expiry scheduler (cron) | DTS-RULE-3 | ⬜ Not started |
| DTS-INT-5 | Guaraní student sync | DTS-INT-1, DTS-CORE-3 | ⬜ Not started |
| DTS-EXTRAS-1 | Coordinator dashboard with filters | Phase 4 | ⬜ Not started |

---

## Summary

| Sprint | Phase | Stories | Status |
|---|---|---|---|
| Sprint 1 | Phase 1: Foundation | 7 | ✅ Complete |
| Sprint 2 | Phase 2: Core (start) | 4 | ✅ Complete |
| Sprint 3 | Phase 2: Core (end) + Phase 3: Rules (start) | 3 | ✅ Complete |
| Sprint 4 | Phase 3: Rules (end) | 3 | ✅ Complete |
| Sprint 5 | Phase 4: Exam (start) | 3 | ✅ Complete |
| Sprint 6 | Phase 4: Exam (end) + Phase 5: Admin (start) | 5 | ✅ Complete |
| Sprint 7 | Phase 5: Sync | 3 | ✅ Complete |
| Sprint 8 | Phase 5: Resilience + Phase 6: Notifications (start) | 4 | 🟡 In progress (SYNC-4 ✅, NOTIF 1-3 ⬜) |
| Sprint 9+ | Phase 6: Should Have backlog | 3 | ⬜ Not started |

**Total Must Have complete**: 108/108 SP (Phases 1-5)
**Should Have remaining**: 8/30 SP (Notifications + Polish — Phase 6)
**MVP Must Have status**: Done
**MVP Should Have status**: Incomplete (Phase 6 pending)

---

## Risk Watchlist

| Risk | Watch For | Mitigation Ready |
|---|---|---|
| Moodle API behavior changes | Integration logs showing new error patterns | Provider abstraction limits blast radius |
| Rule engine edge cases | Bug reports on eligibility results | ≥95% branch coverage in tests |
| Sync performance at scale | Duration > 2 min for 500 students | Batch size tuning, async with progress polling |

---

> *Generated from `master-implementation-plan.md`. Refresh when story status changes or sprints are replanned.*
