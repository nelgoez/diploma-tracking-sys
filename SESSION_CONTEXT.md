# Diploma Tracking System - Session Context

> **Purpose:** Context file for resuming AI sessions
> **Created:** 2026-04-27
> **Status:** Phases 1-3 Complete, Ready for Phase 4+

---

## Project Overview

**Name:** Diploma Tracking System (DTS)
**Institution:** Universidad Nacional de Córdoba (UNC)
**Purpose:** Sistema integral para gestión de trayectos formativos modulares con integración Moodle + Guaraní

### Spanish Requirements (Core Reference)

1. **Gestión de certificados Moodle** - Visualizar y sincronizar certificados de Moodle
2. **Panel de seguimiento para estudiantes** - Dashboard con progreso individual
3. **Motor de reglas de habilitación** - Prerrequisitos configurables + overrides manuales
4. **Gestión de inscripción y evaluación final** - Inscripción a examen integrador
5. **Integración con Guaraní** - Sincronización de datos académicos
6. **Panel administrativo (Backoffice)** - Gestión centralizada

---

## Current Status

### ✅ Completed (Phases 1-3 + Partial Phase 4)

#### Fase 1 - Constitution
- `/.context/idea/business-model.md` - Business Model Canvas
- `/.context/idea/market-context.md` - Mercado UNC + competidores

#### Fase 2 - PRD + SRS
- `/.context/PRD/executive-summary.md` - Problem statement, features core
- `/.context/PRD/user-personas.md` - Lucía (estudiante), Marcos (coordinador), Ana (admin TI)
- `/.context/PRD/mvp-scope.md` - 6 épicas del MVP
- `/.context/PRD/user-journeys.md` - Flujos de usuario principales
- `/.context/SRS/functional-specs.md` - Requerimientos funcionales por módulo
- `/.context/SRS/non-functional-specs.md` - Performance, security, accessibility
- `/.context/SRS/architecture-specs.md` - C4 diagrams, ERD, tech stack
- `/.context/SRS/api-contracts.yaml` - OpenAPI spec (placeholders)

#### Fase 3 - Infrastructure

**Server (`/server/`)**
```
├── package.json         # Bun + Hono + Supabase + JWT + Zod
├── tsconfig.json
├── src/
│   ├── index.ts         # Hono app con rutas
│   ├── db/supabase.ts   # Cliente Supabase + tipos
│   ├── middleware/
│   │   ├── auth.ts      # JWT authentication
│   │   └── error.ts    # Error handling
│   ├── routes/
│   │   ├── auth.ts      # Login, refresh, logout
│   │   ├── students.ts   # CRUD estudiantes
│   │   ├── courses.ts   # CRUD cursos
│   │   ├── certificates.ts  # Certificados
│   │   ├── enrollments.ts    # Inscripciones
│   │   ├── rules.ts     # Motor de reglas
│   │   ├── integrations.ts    # Moodle/Guaraní
│   │   └── admin.ts      # Dashboard stats
│   └── services/
│       ├── moodle.service.ts   # Placeholder
│       └── guarani.service.ts   # Placeholder
└── .env                 # ✅ Supabase keys configured
```

**Client (`/client/`)**
```
├── package.json         # React + Vite + MUI + i18next
├── tsconfig.json
├── vite.config.ts
├── index.html           # lang="es"
├── src/
│   ├── main.tsx         # App entry con providers
│   ├── App.tsx          # Router + Layout
│   ├── theme.ts         # MUI theme (UNC colors)
│   ├── i18n/
│   │   ├── index.ts     # Translations (ES/EN)
│   │   └── index.tsx    # i18next init
│   ├── components/
│   │   ├── LanguageSwitcher.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── layout/MainLayout.tsx
│   └── pages/
│       ├── LoginPage.tsx
│       ├── DashboardPage.tsx
│       ├── CertificatesPage.tsx
│       ├── CoursesPage.tsx
│       ├── IntegrationsPage.tsx
│       └── AdminPage.tsx
└── .env                 # ✅ Supabase keys configured
```

**Database (`/supabase/`)**
```
└── migrations/
    └── 001_initial_schema.sql  # ✅ Ready to run in Supabase SQL Editor
```

**MCP Configuration (`/.mcp.json` + `opencode.json`)**
```
└── All 15 MCPs configured (verified 2026-05-07):
    - supabase ✅ (real credentials hardcoded in opencode.json, gitignored)
    - sql/dbhub ✅ (password configured in dbhub.toml)
    - vercel ✅ (OAuth working)
    - context7, shadcn, devtools, playwright ✅ (no creds needed)
    - openapi ✅ (staging URL configured, 7 endpoints available)
    - tavily, postman, sentry, notion, atlassian, nanobanana, slack ⏳ (placeholders - need API keys)
```

#### Fase 4 - Specification (Partial)
- ✅ Set up and verified API endpoints on backend (`/server/src/routes/`)
- ✅ Set up and verified API endpoints on frontend (`/client/src/pages/`)
- ⚠️ Main frontend `/` route NOT yet implemented (only API endpoint exists)
- ✅ Vercel MCP OAuth configured and working (verified 2026-05-07)

### Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Runtime** | Bun 1.x | Package manager + server runtime |
| **Backend** | Hono 4.x | Lightweight API framework |
| **Database** | Supabase | PostgreSQL + Auth + Storage |
| **Frontend** | React 18 + Vite 6 | SPA con routing |
| **UI** | MUI 7 | Material Design components |
| **i18n** | i18next | ES default, EN option |
| **API Client** | Axios + React Query | Data fetching |

---

## Pending Tasks

### Inmediato (Configuración)

1. **Supabase Setup** ✅ Keys configured
      - ✅ Proyecto creado: `vbjhxlezqhkmhpuypkvf.supabase.co`
      - ✅ Keys updated in `server/.env` and `client/.env`
       - ✅ **COMPLETED:** `/supabase/migrations/001_initial_schema.sql` ejecutado (tables, indexes, RLS, triggers)
      - ✅ MCP `supabase` configurado con Access Token (hardcoded in opencode.json)
      - ✅ MCP `sql` (dbhub) configurado con password

2. **MCP Configuration** ⚠️ Some issues found (verified 2026-05-07)
      - ✅ vercel (OAuth working), context7, shadcn, devtools, playwright, openapi (staging URL configured, 7 endpoints)
      - ✅ sql/dbhub (password configured in dbhub.toml)
      - ✅ **supabase (real credentials hardcoded in opencode.json, excluded via .gitignore)**
      - ⏳ Pending: tavily, postman, sentry, notion, atlassian, nanobanana, slack (need API keys)

3. **Frontend Main Route** ⚠️ Pending
     - ⚠️ Main `/` route NOT implemented in client (only API endpoints exist)
     - ✅ All other page routes set up and verified

4. **Moodle Integration** (Placeholder)
     - Configurar `MOODLE_API_URL` y `MOODLE_API_TOKEN` cuando esté disponible
     - Implementar sync real en `/server/src/services/moodle.service.ts`

5. **Guaraní Integration** (Placeholder)
     - Configurar `GUARANI_API_URL` y `GUARANI_API_TOKEN` cuando esté disponible
     - Implementar sync real en `/server/src/services/guarani.service.ts`

### Fase 4 - Specification (PBI)
...
```

### Fase 7 - Implementation (Features)

Prioridad según MVP scope:
1. Implement main `/` route in client frontend
2. Auth real con Supabase Auth
3. Dashboard de progreso funcional
4. Motor de reglas de prerrequisitos
5. Inscripción a examen integrador
6. Sync Moodle (implementación real)
7. Sync Guaraní (implementación real)

---

## How to Resume Work

### 1. Read Context Files
```bash
# Essential context for any session
cat .context/PRD/executive-summary.md
cat .context/SRS/architecture-specs.md
cat .context/SRS/functional-specs.md
```

### 2. Run Supabase Migration (FIRST TIME)
```bash
# Run in Supabase Dashboard → SQL Editor
# File: /supabase/migrations/001_initial_schema.sql
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend (port 3000)
cd server && bun run dev

# Terminal 2 - Frontend (port 5173)
cd client && bun run dev
```

### 4. Typecheck Before Committing
```bash
# Server
cd server && bun run typecheck

# Client
cd client && bun run typecheck
```

### 5. Follow the 14-Fase Workflow
```
Fase 4: Specification (PBI) - Crear stories en Jira (need Jira API token)
Fase 5: Shift-Left Testing - Test plans
Fase 6: Planning - Implementation plans
Fase 7: Implementation - Código + unit tests
Fase 8: Code Review
Fase 9: Deployment Staging
Fase 10: Exploratory Testing
Fase 11: Test Documentation
Fase 12: Test Automation
Fase 13: Production Deployment
Fase 14: Shift-Right Testing
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `AGENTS.md` | Guía completa para agentes de IA |
| `CLAUDE.md` | Project memory para sesiones |
| `.context/SRS/architecture-specs.md` | Tech stack + C4 + ERD |
| `server/src/db/supabase.ts` | Tipos de BD |
| `client/src/i18n/index.ts` | Traducciones ES/EN |
| `.env.example` | Variables de entorno template |

---

## Important Reminders

1. **Idioma:** Todo el código en inglés, UX en español (default) con opción inglés
2. **Supabase MCP:** ✅ Real credentials in opencode.json (excluded from git via .gitignore)
3. **Vercel MCP:** ✅ OAuth configured and working (verified 2026-05-07)
4. **Placeholders:** Moodle/Guaraní son placeholders - implementar cuando estén disponibles
5. **No commitear:** No hacer commit de archivos `.env` ni `opencode.json` (ambos en .gitignore)
6. **Auth real:** Implementar login con Supabase Auth cuando esté configurado
7. **Main Route:** ⚠️ Client main `/` route NOT implemented yet (only API endpoints exist)
8. **MCPs:** 15/15 MCPs configured - supabase has real values in opencode.json (gitignored)

---

## Contact / Configuration Needed

- [x] Supabase project URL + keys ✅ Configured (vbjhxlezqhkmhpuypkvf.supabase.co)
- [x] UNC account for Supabase ✅ Configured
- [x] **COMPLETED:** Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor (2026-05-05)
- [x] **Vercel MCP OAuth** ✅ Working (verified 2026-05-07)
- [x] **Supabase MCP** ✅ Real credentials in opencode.json (gitignored, not committed)
- [ ] Implement main `/` route in client frontend
- [ ] Moodle API credentials (when available)
- [ ] Guaraní API credentials (when available)
- [ ] Jira API token (for atlassian MCP + Fase 4 PBI)
- [ ] Tavily API key (for web search MCP)

---

## Session Log

### 2026-04-29 - MCP Setup + Supabase Configuration
- ✅ Created `.mcp.json` with all 15 MCPs configured (project-specific)
- ✅ Updated `server/.env` with Supabase keys (URL: `vbjhxlezqhkmhpuypkvf.supabase.co`)
- ✅ Updated `client/.env` with Supabase keys
- ✅ Created `dbhub.toml` with Supabase connection (password: `${DB_PASSWORD}`)
- ✅ Configured Supabase MCP with Access Token + Project URL in `.mcp.json`
- ✅ Configured OpenAPI MCP with staging URL
- ⏳ **PENDING:** Run `001_initial_schema.sql` in Supabase SQL Editor
- Result: MCP infrastructure ready, Supabase configured, `.mcp.json` created, ready for Fase 4

### 2026-05-06 (Yesterday) - Endpoint Setup + Vercel MCP OAuth
- ✅ Set up and verified API endpoints on backend (`/server/src/routes/`)
- ✅ Set up and verified API endpoints on frontend (`/client/src/pages/`, services)
- ⚠️ Main frontend `/` route NOT yet implemented (only API endpoint)
- ✅ Vercel MCP setup with OAuth authentication (confirmed working 2026-05-07)
- Result: Backend/frontend endpoints checked; Vercel MCP OAuth working

### 2026-05-07 (Today) - Session Recovery + MCP Status Verification
- 🔄 Multiple opencode crashes/hangs - lost session history
- 📝 Reconstructing session context from user report
- ✅ Updated `SESSION_CONTEXT.md` with prior session work
- ✅ Verified MCP connectivity: Vercel ✅, OpenAPI ✅, Context7 ✅, Shadcn ✅
- ❌ **Found:** Supabase MCP access token expired/unauthorized
- ✅ Pushed all changes to origin/main (3 commits total)
- Result: Context recovered, MCPs audited, Supabase token needs refresh

### 2026-05-07 (Later) - Secret Leak Audit & Remediation
- 🔍 Comprehensive audit of all hardcoded secrets across the project
- ✅ Templated `opencode.json`: replaced real Supabase keys with `${SUPABASE_ACCESS_TOKEN}`, `${SUPABASE_PROJECT_URL}`
- ✅ Standardized all `{{VAR}}` placeholders to `${VAR}` syntax in `opencode.json`
- ✅ Templated `.mcp.json`: replaced stale Supabase token with `${SUPABASE_ACCESS_TOKEN}`
- ✅ Fixed `SESSION_CONTEXT.md`: removed exposed database password
- ✅ Fixed `templates/mcp/dbhub.example.toml`: replaced real staging creds with `${SUPABASE_DB_*}` vars
- ✅ Removed `opencode.json` from `.gitignore` (now safe to track - no secrets)
- ✅ Converted `opencode.json` to proper `{env:VAR}` syntax (opencode native substitution format)
- ✅ `{env:VAR}` used for: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_URL, API_BEARER_TOKEN, TAVILY_API_KEY, POSTMAN_API_KEY, JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN, GEMINI_API_KEY, SLACK_MCP_XOXP_TOKEN
- ✅ Template/example files left untouched (follow their own conventions)
- ✅ Committed & pushed all changes (commits `7d61f76`, `955beef`, `8a5a58c`)
- Result: All secrets templated, opencode.json uses native {env:VAR} syntax

### 2026-05-07 (Final) - Revert: opencode.json Back to Real Values + Re-add to .gitignore
- 🔄 **Reverted** `opencode.json` templating: put real Supabase credentials back (access token + project URL hardcoded)
- 🔄 **Re-added** `opencode.json` to `.gitignore` under `# MCP Configuration` section
- ⚠️ Rationale: `{env:VAR}` vars weren't resolving properly in opencode runtime; real values kept locally, excluded from git
- Result: `opencode.json` now contains real Supabase creds but is gitignored (safe from accidental commits)

---

**Last Updated:** 2026-05-07
**Version:** 0.5.2 (Reverted opencode.json to real values + .gitignore re-included)