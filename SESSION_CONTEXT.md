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

### ✅ Completed (Phases 1-3)

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

**MCP Configuration (`/.mcp.json`)**
```
└── All 15 MCPs configured in project-specific .mcp.json:
    - supabase ✅ (token + project URL configured)
    - sql/dbhub ✅ (password configured in dbhub.toml)
    - vercel, context7, shadcn, devtools, playwright ✅ (no creds needed)
    - openapi ✅ (staging URL configured)
    - tavily, postman, sentry, notion, atlassian, nanobanana, slack ⏳ (placeholders - need API keys)
```

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
    - ⏳ **PENDING:** Ejecutar `/supabase/migrations/001_initial_schema.sql` en Supabase SQL Editor
    - ✅ MCP `supabase` configurado con Access Token
    - ✅ MCP `sql` (dbhub) configurado con password

2. **MCP Configuration** ✅ All 15 MCPs configured in `.mcp.json`
     - ✅ supabase (token + project URL), sql (dbhub.toml), vercel, context7, shadcn, devtools, playwright
     - ✅ openapi (staging URL configured)
     - ⏳ Pending: tavily, postman, sentry, notion, atlassian, nanobanana, slack (need API keys)

3. **Moodle Integration** (Placeholder)
    - Configurar `MOODLE_API_URL` y `MOODLE_API_TOKEN` cuando esté disponible
    - Implementar sync real en `/server/src/services/moodle.service.ts`

4. **Guaraní Integration** (Placeholder)
    - Configurar `GUARANI_API_URL` y `GUARANI_API_TOKEN` cuando esté disponible
    - Implementar sync real en `/server/src/services/guarani.service.ts`

### Fase 4 - Specification (PBI)

Siguiente paso según el workflow 14-fase:
- Crear epics en Jira (usar MCP)
- Generar `/.context/PBI/epic-tree.md`
- Documentar stories con acceptance criteria

### Fase 7 - Implementation (Features)

Prioridad según MVP scope:
1. Auth real con Supabase Auth
2. Dashboard de progreso funcional
3. Motor de reglas de prerrequisitos
4. Inscripción a examen integrador
5. Sync Moodle (implementación real)
6. Sync Guaraní (implementación real)

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
2. **Supabase MCP:** ✅ Configurado con Access Token
3. **Placeholders:** Moodle/Guaraní son placeholders - implementar cuando estén disponibles
4. **No commitear:** No hacer commit de archivos `.env`
5. **Auth real:** Implementar login con Supabase Auth cuando esté configurado
6. **MCPs:** All 15 MCPs configured in `.mcp.json` - remaining need API keys (Jira, Tavily, Postman, etc.)

---

## Contact / Configuration Needed

- [x] Supabase project URL + keys ✅ Configured (vbjhxlezqhkmhpuypkvf.supabase.co)
- [x] UNC account for Supabase ✅ Configured
- [ ] **PENDING:** Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
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
- ✅ Created `dbhub.toml` with Supabase connection (password: `entroPIA01!`)
- ✅ Configured Supabase MCP with Access Token + Project URL in `.mcp.json`
- ✅ Configured OpenAPI MCP with staging URL
- ⏳ **PENDING:** Run `001_initial_schema.sql` in Supabase SQL Editor
- Result: MCP infrastructure ready, Supabase configured, `.mcp.json` created, ready for Fase 4

---

**Last Updated:** 2026-04-29
**Version:** 0.3.0 (.mcp.json configured + Supabase ready)