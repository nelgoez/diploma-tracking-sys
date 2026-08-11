# CONTEXT.md — Diploma Tracking System (DTS)

> **Last update**: 2026-08-11
> **Purpose**: Canonical context engineering reference. Explains how DTS structures information so AI agents work effectively — what lives where, when to load it, and why.
> **Audience**: Humans onboarding DTS, and AI agents that need the knowledge map.
> **Companion files**: `README.md` (human overview), `CLAUDE.md` (session rules), `DESIGN.md` (visual identity), `.context/master-implementation-plan.md` (roadmap).

---

## 1. Context Engineering Strategy

DTS applies **Context Engineering** as a first-class concern: curate what the agent sees, when it sees it, and why. Three goals drive every artifact:

| Goal                                  | Mechanism                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------- |
| **Keep main conversation lean**       | Skills load references on demand; large reads go to subagents              |
| **Route to the right artifact**       | Task → skill mapping in CLAUDE.md §4; stable file names in this CONTEXT.md |
| **Persist decisions across sessions** | `.context/` stores domain facts; CLAUDE.md stores operational rules        |

The cost of stale context is paid by every future session — keep it honest.

---

## 2. Knowledge Map — What Lives Where

```
diploma-tracking-sys/
│
├── README.md                          Project overview for humans (visitors start here)
├── CLAUDE.md                          Operational rules loaded every AI session
├── CONTEXT.md                         This file — canonical knowledge map
├── DESIGN.md                          Visual identity spec (Google Labs format)
│
├── .context/                          Domain knowledge (facts about the system)
│   ├── business/                      Business domain maps
│   │   ├── business-data-map.md       Entities, relationships, business flows, state machines
│   │   ├── business-feature-map.md    Features → Jira stories + AC summaries
│   │   └── business-api-map.md        API endpoint catalog by domain
│   ├── PRD/                           Product requirements
│   │   ├── executive-summary.md       Problem statement, solution overview, KPIs
│   │   └── mvp-scope.md               MoSCoW classification, epics, story ACs (Gherkin)
│   ├── SRS/                           Software requirements
│   │   ├── architecture-specs.md      System architecture, ADRs, C4 diagrams, data model
│   │   └── functional-specs.md        FR-* functional requirements, business rules
│   ├── master-implementation-plan.md  Phased roadmap (Phase 1-6), sprint allocation, risk register
│   └── dev-roadmap.md                 Per-sprint ticket sequence, dependency edges, current status
│
├── server/                            Bun + Hono API
│   ├── src/
│   │   ├── routes/                    Per-domain route handlers (auth, students, enrollments, etc.)
│   │   ├── middleware/                authenticate, requireRole, validateBody, auditLog
│   │   ├── providers/                 CertificateProvider, AcademicProvider adapters
│   │   ├── engine/                    Rule engine core (recursive tree evaluator)
│   │   └── services/                  Business logic layer
│   └── ...
├── client/                            React + Vite + MUI SPA
│   └── src/
│       ├── pages/                     Route pages (dashboard, admin, login)
│       ├── components/                Reusable UI primitives
│       └── theme.ts                   MUI theme (colors, typography, spacing — source of truth for DESIGN.md)
└── packages/
    └── shared/                        Shared types, Zod schemas, constants
```

---

## 3. How CONTEXT.md, CLAUDE.md, and README.md Relate

```
READERS           FILE            ROLE
──────────        ────            ────
Humans            README.md       "What is this project? How do I start?"
Humans            DESIGN.md       "What does it look like?"
AI (every sess)   CLAUDE.md       "How do I operate? What are the rules?"
AI (on demand)    CONTEXT.md      "Where is X? What file owns Y?"

                    │
                    ▼
              .context/           "What are the facts about this system?"
```

- **README.md** — first touch for humans. Overview, stack, commands, license.
- **CLAUDE.md** — loaded automatically every Claude Code/OpenCode session. Rules, skill registry, variable system, git workflow.
- **CONTEXT.md** (this file) — canonical map. Loaded when the agent needs to find something or understand the repo's information architecture.
- **.context/ files** — loaded on demand by skills when the task matches. E.g., `/sprint-development` loads `business-data-map.md` before planning a story.

---

## 4. Progressive Loading by Task

| Task                        | Load First                                                                 | Load If Needed                                    |
| --------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| **Develop a feature**       | `.context/business/business-data-map.md` + `master-implementation-plan.md` | Route files in `server/src/routes/`               |
| **Understand domain rules** | `business-data-map.md` (entities + flows + state machines)                 | `functional-specs.md` (business rule numbers)     |
| **Know the API surface**    | `.context/business/business-api-map.md`                                    | Route files in `server/src/routes/`               |
| **See the roadmap**         | `master-implementation-plan.md`                                            | `.context/dev-roadmap.md` (sprint sequence)       |
| **Design a screen**         | `DESIGN.md` (tokens, components)                                           | `client/src/theme.ts` (actual MUI config)         |
| **Wire a new integration**  | `architecture-specs.md` §3 (AD-001: Provider Abstraction)                  | `business-data-map.md` §6 (Provider Layer Design) |

---

## 5. Stable File Names — Reference With Confidence

| File                                        | Purpose                         | Generator                     |
| ------------------------------------------- | ------------------------------- | ----------------------------- |
| `CLAUDE.md`                                 | Session rules + skill registry  | `/sync-ai-memory`             |
| `CONTEXT.md`                                | This canonical map              | `/sync-ai-memory`             |
| `DESIGN.md`                                 | Visual identity spec            | `/design-system`              |
| `.context/business/business-data-map.md`    | Entities, flows, state machines | `/business-data-map`          |
| `.context/business/business-feature-map.md` | Features → stories + ACs        | `/business-feature-map`       |
| `.context/business/business-api-map.md`     | Endpoint catalog                | `/business-api-map`           |
| `.context/master-implementation-plan.md`    | Prioritized roadmap             | `/master-implementation-plan` |
| `.context/dev-roadmap.md`                   | Sprint sequence + deps          | Manual / sprint-planning      |

---

## 6. Operational Rules for DTS

### DO

1. Read `business-data-map.md` before planning any feature — cheapest way to avoid domain mistakes.
2. Treat the Provider Abstraction (AD-001) as architectural invariant — never bypass the interface.
3. Use `.context/` as the single source of domain truth. If it contradicts code, flag the drift.
4. Reference DESIGN.md tokens in all UI work — never invent colors or spacing.

### DON'T

1. Don't hardcode Moodle or Guaraní API calls outside the Provider adapter layer.
2. Don't skip the rule engine for eligibility checks — every eligibility query must go through the recursive tree evaluator.
3. Don't create new `.context/` artifacts without updating this CONTEXT.md's knowledge map.

---

> **You are here**: DTS Context Engineering canonical map — how the repo structures information for AI-driven development.
> **Next**: `CLAUDE.md` for operational rules. `.context/business/business-data-map.md` for domain entities and flows.
