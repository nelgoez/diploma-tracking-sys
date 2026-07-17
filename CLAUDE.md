# DTS — Diploma Tracking System

> **Diploma Tracking System** for Universidad Nacional de Córdoba.
> Supabase + Hono (server) + React/Vite (client) + Vercel (deploy).
> Two repos: `agentic-diplo-track-sys` (agentic hub) and `diploma-tracking-sys` (app).

---

## Quick Start

```bash
# Context load order (read these at session start):
# 1. .env                        → env vars (gitignored, real values on disk)
# 2. server/.env + client/.env   → per-scope env vars
# 3. server/src/routes/          → API endpoint inventory
# 4. client/src/                 → Frontend components & pages

# Common commands (run from repo root or respective scope):
cd server  && bun run dev        # Dev server on :3000
cd client  && bun run dev        # Dev client on :5173
bun run lint                      # Lint all (server + client)
bun run lint:fix                  # Auto-fix lint
bun run format                    # Format with Prettier
bun run typecheck                 # TypeScript check both scopes
bun run test                      # Run tests (server)
cd client  && bun run test:e2e   # Playwright E2E
```

**Key URLs:**

| Environment | API | Client | Supabase Studio |
|---|---|---|---|
| Local | `http://localhost:3000/api/v1` | `http://localhost:5173` | `https://supabase.com/dashboard/project/vbjhxlezqhkmhpuypkvf` |
| Staging | `https://server-git-staging-nelgoezs-projects.vercel.app/api/v1` | `https://nelgoez-diploma-tracking-sys.vercel.app` | — |
| Production | `https://server-git-main-nelgoezs-projects.vercel.app/api/v1` | `https://diplomatrackingsystem.qzz.io` | — |

---

## Critical Rules

> Override defaults. Must always be in context.

1. **Credentials**: ALWAYS from `.env`. NEVER hardcode. NEVER commit.
2. **Plan before code**: Produce a plan before writing code or tests.
3. **No AI attribution**: Never "Generated with Claude Code", "Co-Authored-By: Claude" in commits.
4. **Confirm before push to main**: Never push to `main` without explicit user confirmation.
5. **Git History**:
   - NEVER rewrite pushed history (`rebase`, `amend`)
   - NEVER force push
   - ALWAYS add forward
6. **Quality Gate**: tests → types → lint in order. Never skip.
7. **Read before edit**: Always read a file before editing. Preserve formatting.
8. **SPA & API on different hosts**: Use correct base URLs (client on :5173, server on :3000).

---

## Project Variables

| Variable | Description | Value |
|---|---|---|
| `{{PROJECT_NAME}}` | Project name | DTS — Diploma Tracking System |
| `{{BACKEND_STACK}}` | Backend stack | Hono + Bun + TypeScript |
| `{{FRONTEND_STACK}}` | Frontend stack | React + Vite + MUI |
| `{{DB_TYPE}}` | Database | PostgreSQL (Supabase) |
| `{{SPA_URL_LOCAL}}` | Frontend local | `http://localhost:5173` |
| `{{SPA_URL_STAGING}}` | Frontend staging | `https://nelgoez-diploma-tracking-sys.vercel.app` |
| `{{SPA_URL_PROD}}` | Frontend prod | `https://diplomatrackingsystem.qzz.io` |
| `{{API_URL_LOCAL}}` | API local | `http://localhost:3000/api/v1` |
| `{{API_URL_STAGING}}` | API staging | `https://server-git-staging-nelgoezs-projects.vercel.app/api/v1` |
| `{{API_URL_PROD}}` | API prod | `https://server-git-main-nelgoezs-projects.vercel.app/api/v1` |
| `{{ISSUE_TRACKER}}` | Issue tracker | Jira |
| `{{PROJECT_KEY}}` | Jira project key | DTS |
| `{{JIRA_URL}}` | Jira URL | `https://diplo-track-sys.atlassian.net` |
| `{{WEBAPP_DOMAIN}}` | Production domain | `diplomatrackingsystem.qzz.io` |

---

## Tool Resolution

> When prompts use `[TAG_TOOL]` pseudocode, the AI resolves to the actual tool using this table.
> **Priority rule**: CLI tools first (fewer tokens, faster execution), MCP as fallback.
> Skills are self-documenting — the AI reads the skill file to learn exact syntax.

### Resolution Table

| Tag                    | Domain             | Primary Tool            | Fallback               | Skill/Reference                  |
| ---------------------- | ------------------ | ----------------------- | ---------------------- | -------------------------------- |
| `[TMS_TOOL]`           | Test Management    | `/xray-cli` skill       | MCP Atlassian          | `.claude/skills/xray-cli/`       |
| `[ISSUE_TRACKER_TOOL]` | Issue Tracking     | Atlassian CLI (`acli`)  | MCP Atlassian          | MCP tool list                    |
| `[AUTOMATION_TOOL]`    | Browser Automation | `/playwright-cli` skill | MCP Playwright         | `.claude/skills/playwright-cli/` |
| `[DB_TOOL]`            | Database           | DBHub MCP               | Supabase MCP / raw SQL | MCP tool list                    |
| `[API_TOOL]`           | API Exploration    | OpenAPI MCP             | Postman / curl         | MCP tool list                    |

### How It Works

1. Prompts describe WHAT to do using `[TAG_TOOL]` pseudocode
2. The AI reads this table to determine WHICH tool to use
3. The AI reads the skill/MCP documentation to learn HOW to execute
4. If the primary tool is unavailable, try the fallback
5. If all tools are unavailable, inform the user

### Pseudocode Syntax

```
[TAG_TOOL] Action:
  - parameter: value
  - parameter: {per convention name}
  - parameter: {{PROJECT_VARIABLE}}
```

**Value types in pseudocode:**

| Type                 | Syntax               | Example                             | When to use                       |
| -------------------- | -------------------- | ----------------------------------- | --------------------------------- |
| Fixed/domain         | Literal value        | `type: Manual`                      | Domain concepts that never change |
| Convention reference | `{per <convention>}` | `title: {per TC naming convention}` | Forces AI to consult guidelines   |
| Project variable     | `{{VARIABLE}}`       | `project: {{PROJECT_KEY}}`          | Configured once per project       |
| Context-derived      | `{from <source>}`    | `steps: {from test analysis}`       | Derived during session            |

### Convention References

| Convention                  | Guideline Location                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------- |
| TC naming convention        | `.context/guidelines/TAE/test-design-principles.md`                                 |
| TC specification convention | `.context/guidelines/TAE/test-design-principles.md`                                 |
| Labeling convention         | `.prompts/fase-11-test-documentation/test-documentation.md` section Labels          |
| Bug naming convention       | `.prompts/fase-10-exploratory-testing/bug-report.md` section Summary format         |
| Execution naming convention | `.prompts/fase-11-test-documentation/test-documentation.md` section Test Executions |

---

## Project Identity

> Replace placeholders with your project details.

| Aspect             | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| **Name**           | [Your Project Name]                                       |
| **Type**           | [e.g., B2B Web Platform, E-commerce, SaaS]                |
| **Stack**          | [e.g., React + TypeScript (FE), Node.js (BE), PostgreSQL] |
| **Target Repo**    | [Path to application repository]                          |
| **Starter Repo**   | [Path to this project-starter repository]                 |
| **Test Framework** | Playwright + KATA + Allure                                |

**TL;DR Flow:**

```
[User Action] → [System Process] → [Outcome]
```

---

## Environment URLs

> Replace with your project URLs. Keep the same structure so tooling and context files can reference it.

| Environment    | Frontend                      | Backend (API)                     |
| -------------- | ----------------------------- | --------------------------------- |
| **Local**      | `http://localhost:3000`       | `http://localhost:3000/api`       |
| **Staging**    | `https://staging.example.com` | `https://staging.example.com/api` |
| **Production** | `https://example.com`         | `https://example.com/api`         |

> If the Frontend and Backend are on **different hosts**, document it here and make sure API tests target the API host directly.

---

## QA Workflow by Work Type

| Work Type            | Workflow                   | Entry Point                                          |
| -------------------- | -------------------------- | ---------------------------------------------------- |
| **User Story (Dev)** | Full 14-fase workflow      | `.prompts/us-dev-workflow.md`                        |
| **User Story (QA)**  | QA 3-fase workflow (10-12) | `.prompts/us-qa-workflow.md`                         |
| **Bug**              | Triage → Fix → Document    | `.prompts/fase-7-implementation/bug-fix-workflow.md` |
| **Bug (QA)**         | Triage → Verify → Report   | `.prompts/fase-10-exploratory-testing/bug-report.md` |

---

## Dev + QA Planning Scopes

### Development Planning

| Scope                     | Prompt                                           | When to Use                             |
| ------------------------- | ------------------------------------------------ | --------------------------------------- |
| **Feature-level** (Macro) | `fase-6-planning/feature-implementation-plan.md` | Plan entire feature/epic implementation |
| **Story-level** (Micro)   | `fase-6-planning/story-implementation-plan.md`   | Plan specific user story implementation |

### Test Planning

| Scope                      | Prompt                                              | When to Use                    |
| -------------------------- | --------------------------------------------------- | ------------------------------ |
| **Feature-driven** (Macro) | `fase-5-shift-left-testing/feature-test-plan.md`    | Test plan for entire epic      |
| **Story-driven** (Micro)   | `fase-5-shift-left-testing/acceptance-test-plan.md` | Acceptance test plan per story |

### Test Automation Planning

| Scope                | Prompt                                                    | When to Use                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------ |
| **E2E Test**         | `fase-12-test-automation/e2e/e2e-plan.md`                 | Plan E2E test automation             |
| **Integration Test** | `fase-12-test-automation/integration/integration-plan.md` | Plan API integration test            |
| **Regression**       | `fase-12-test-automation/regression/`                     | Adding regression test after bug fix |

---

## Fundamental Rules (Always in Memory)

### TypeScript Patterns

| Pattern        | Rule                                                                      |
| -------------- | ------------------------------------------------------------------------- |
| **Parameters** | Max 2 positional. 3+ → use object parameter                               |
| **Utilities**  | Only agnostic utilities go to `tests/utils/`                              |
| **Locators**   | Inline in ATCs. Extract only if used 2+ times                             |
| **Imports**    | Always use aliases (`@api/`, `@schemas/`, `@utils/`). No relative imports |
| **Types**      | Define interfaces at top of file, after imports                           |
| **Errors**     | Public methods: fail fast. Utilities: silent fail (return null)           |

**DRY - Context Matters:**

- `api/schemas/` = OpenAPI type facades (`@schemas/{domain}.types`)
- `tests/utils/` = Agnostic utilities only (works for API + UI)
- `UiBase` = All Playwright/Page helpers
- `ApiBase` = All HTTP helpers
- `TestContext` = Shared across both (config, faker)

→ **Full details**: `.context/guidelines/TAE/typescript-patterns.md`

### KATA Architecture

```
TestContext (Layer 1) - Config, Faker, utilities
    ↓ extends
ApiBase / UiBase (Layer 2) - HTTP / Playwright helpers
    ↓ extends
YourApi / YourPage (Layer 3) - ATCs live here
    ↓ used by
TestFixture (Layer 4) - Dependency injection
    ↓ used by
Test Files - Orchestrate ATCs
```

**ATC Rules:**

- ATC = Complete test case (mini-flow), NOT single interaction
- ATCs are atomic: don't call other ATCs
- Use Steps module for reusable ATC chains
- Fixed assertions inside ATC, test-level assertions in test file
- Equivalence Partitioning: same output = one parameterized ATC

**Fixture Selection:**

| Test Type | Fixture    | Browser?  |
| --------- | ---------- | --------- |
| API only  | `{ api }`  | No (lazy) |
| UI only   | `{ ui }`   | Yes       |
| Hybrid    | `{ test }` | Yes       |

→ **Full details**: `.context/guidelines/TAE/kata-architecture.md`

---

## Git Workflow

### Branch Strategy

| Branch      | Role                                                               |
| ----------- | ------------------------------------------------------------------ |
| `main`      | Production. PRs merged from `staging` or `feature/*` after review. |
| `staging`   | Integration branch for AI commits and pre-release validation.      |
| `feature/*` | Task-specific branches for new work. Use `feature/TICKET-ID-desc`. |
| `fix/*`     | Bug-fix branches. Use `fix/TICKET-ID-desc`.                        |

### Commit Rules

- **Semantic prefixes**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- **One commit = one responsibility**
- **Clear messages**: Someone should understand the change without reading the diff
- **NO AI attribution**: Never include "Generated with Claude Code", "Co-Authored-By: Claude", or similar lines. Commits must look human-authored.
- **Confirm before push to main**: Always ask user confirmation before pushing to `main`.

### Example Flow

```bash
# General work (no ticket)
git add <files>
git commit -m "docs: update context files"
# → Ask: "Confirm push to main?"
git push origin main

# Ticket-based work
git checkout -b feature/UPEX-123-add-login-tests
git add <files>
git commit -m "test: add login API tests"
git push -u origin feature/UPEX-123-add-login-tests
gh pr create --base staging
```

→ **Full details**: `.prompts/git-flow.md`

---

## Orchestration Mode (Subagent Strategy)

**Core Principle**: Main conversation = command center. Subagents = executors.

**Use subagents for**: Reading/writing multiple files, MCP operations, research across repos, git operations, verification (tests/types/lint), multi-file edits.

**Do NOT use subagents for**: Quick lookups, memory reads/writes, task tracking, asking the user, planning.

**Briefing format** — every dispatch must include:

1. **Goal**: One-sentence description
2. **Context docs**: Which files to read first
3. **Skills to load**: Which skills the subagent needs (e.g., `/playwright-cli`)
4. **Exact instructions**: Step-by-step, not vague goals
5. **Report format**: What to return (files changed, tests passed/failed, blockers)
6. **Rules**: Relevant Critical Rules to follow

### Execution Patterns

| Pattern        | When              | Example                                         |
| -------------- | ----------------- | ----------------------------------------------- |
| **Parallel**   | Independent tasks | Read 3 context files simultaneously             |
| **Sequential** | Dependent tasks   | Plan → Code → Test                              |
| **Background** | Long-running      | Test suite execution while planning next ticket |
| **Single**     | Simple task       | One file edit with verification                 |

**Error protocol**: On subagent error — STOP, report to user with full context, do NOT fix without approval, present options (retry/skip/abort).

**Planning**: Present plan → wait for approval → track progress → report results.

---

## Usage Modes & Entry Points

| Mode                 | Entry Point                                                            | When to Use                               |
| -------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| **Sprint Testing**   | `@.prompts/orchestrators/sprint-testing-agent.md`                      | Multiple tickets in a sprint              |
| **User Story (QA)**  | `@.prompts/us-qa-workflow.md`                                          | Single story, full QA cycle (Fases 10-12) |
| **User Story (Dev)** | `@.prompts/us-dev-workflow.md`                                         | Single story, full Dev cycle (Fases 6-9)  |
| **Bug**              | `@.prompts/bug-qa-workflow.md`                                         | Bug triage, verification, and reporting   |
| **Automation**       | `@.prompts/orchestrators/test-automation-agent.md`                     | Automate existing specs                   |
| **Regression**       | `@.prompts/fase-12-test-automation/regression/regression-execution.md` | Post-release validation                   |

---

## Context System (3-Level Hierarchy)

### Level 1: Project-Wide (loaded at session start)

```
.context/business-data-map.md      → System flows and entities
.context/api-architecture.md       → API endpoints reference
.context/project-dev-guide.md      → How to develop features
.context/project-test-guide.md     → What to test and why
```

### Level 2: Module-Level (shared across tickets in a module)

```
.context/PBI/{module}/
  module-context.md                → Module overview and shared context
  test-specs/
    ROADMAP.md                     → All tickets and their automation status
    PROGRESS.md                    → Current progress tracker
    SESSION-PROMPT.md              → @-loadable session resume prompt
```

### Level 3: Ticket-Level (per ticket)

```
.context/PBI/{module}/test-specs/{PREFIX}-T{id}-{name}/
  spec.md                         → Test specification
  implementation-plan.md           → Automation plan
  atc/*.md                         → Individual ATC designs
```

### Context Loading by Task

| Task                    | Load These Files                                                              |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Develop a Feature**   | `project-dev-guide.md` + `guidelines/DEV/spec-driven-development.md`          |
| **Write E2E Test**      | `kata-ai-index.md` + `e2e-testing-patterns.md`                                |
| **Write API Test**      | `kata-ai-index.md` + `api-testing-patterns.md`                                |
| **Write Unit Test**     | `guidelines/DEV/code-standards.md`                                            |
| **Exploratory Testing** | `project-test-guide.md` + `CLAUDE.md section Tool Resolution`                 |
| **Understand System**   | `business-data-map.md` + `PRD/user-journeys.md`                               |
| **Use MCP Tools**       | `CLAUDE.md section Tool Resolution`                                           |
| **TMS Operations**      | `guidelines/QA/jira-test-management.md` + `guidelines/TAE/tms-integration.md` |
| **Code Review**         | `.prompts/fase-8-code-review/review-pr.md`                                    |
| **Plan Implementation** | `.prompts/fase-6-planning/story-implementation-plan.md`                       |
| **Shift-Left Testing**  | `.prompts/fase-5-shift-left-testing/acceptance-test-plan.md`                  |

**Living Code Examples:**

- API Component: `tests/components/api/` (any `*Api.ts`)
- UI Component: `tests/components/ui/` (any `*Page.ts`)
- Test File: `tests/e2e/` or `tests/integration/`

---

## MCPs Available

| MCP            | When to Use                                |
| -------------- | ------------------------------------------ |
| **Playwright** | E2E testing, UI automation, screenshots    |
| **OpenAPI**    | API endpoint exploration, contract testing |
| **DBHub**      | Database queries, data validation          |
| **Atlassian**  | Jira/Xray test management                  |
| **Context7**   | Official library documentation             |
| **Tavily**     | Web search, troubleshooting                |

**Decision Rule:**

- Context7 for "how to use X" (official docs)
- Tavily for "how to solve X" (community solutions)

---

## AI Behavior During Sessions

**Workflow**: Plan first (wait for approval) → delegate to subagents → use skills → track progress → report results → verify quality.

### Explanations and Confirmations

When working on a User Story, feature, or bug:

1. **Explain the story**: Once you understand the ticket, explain briefly:
   - What the feature is about
   - How it works (in simple terms)
   - What we'll be doing (developing, testing, or both)

2. **Wait for confirmation**: After important explanations, WAIT for the user to respond before continuing. This allows the user to:
   - Read and understand
   - Ask questions if needed
   - Confirm whether to proceed

3. **Explain defects**: When you find a bug or unexpected behavior:
   - Describe what you observed
   - Explain why it's a problem
   - Suggest the impact (severity, affected users, business risk)

4. **Language**: Default to **English**. If the user writes in another language, mirror that language for user-facing communication. Documentation and code are always written in English.

### Environment Selection

- Ask the user which environment they're working on (e.g., "local or staging?") when it's ambiguous.
- Default to **staging** unless the user specifies otherwise.
- Use the environment URLs from the "Environment URLs" table above and credentials from `.env`.

### Context Efficiency

Main conversation stays lean (no large file reads). Subagents do heavy reading. Load only what the current step needs.

---

## Local Context (PBI)

For every ticket being worked on, maintain local documentation under `.context/PBI/`:

```
.context/PBI/{module-name}/
  module-context.md                → Module overview and shared context
  test-specs/
    ROADMAP.md                     → All tickets and their automation status
    PROGRESS.md                    → Current progress tracker
    SESSION-PROMPT.md              → @-loadable session resume prompt
    {TICKET-ID}-{brief-title}/
      context.md                   → Main file: ACs, data, session notes, open questions
      test-analysis.md             → Test plan / Acceptance Test Plan (ATP) mirror
      test-report.md               → Test report / Acceptance Test Report (ATR) mirror
      evidence/                    → Screenshots, traces, logs (gitignored)
```

**Variables:**

- `{module-name}`: kebab-case of the module or epic (e.g., `user-management`)
- `{TICKET-ID}`: TMS ticket identifier (e.g., `UPEX-277`)
- `{brief-title}`: AI-generated summary of the ticket title, max ~5 words, kebab-case (e.g., `empty-states`)

**Entry point**: `@.prompts/session-start.md` — fetches ticket, explains story, loads context, explores code, creates PBI folder.

**Resume a session**: `@.context/PBI/{module}/test-specs/SESSION-PROMPT.md` — @-loadable, restores full context without copy-paste.

---

## CLI Tools

| Script             | Usage                              | Documentation                 |
| ------------------ | ---------------------------------- | ----------------------------- |
| `bun xray`         | TMS sync (import/export/sync)      | `cli/xray/` (self-documented) |
| `bun run api:sync` | Sync OpenAPI spec + generate types | `cli/sync-openapi.ts`         |
| `bun run up`       | Update template from upstream      | `cli/update-template.js`      |
| `bun run lint`     | Lint codebase with ESLint          | `eslint.config.js`            |
| `bun run format`   | Format with Prettier               | `.prettierrc`                 |

**Run `bun <script> --help`** for usage details.

---

## Skills (Claude Code)

> Pre-built skills available in `.claude/skills/`. These are loaded automatically by Claude Code.

| Skill                     | Trigger                  | Description                                                                                                     |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **playwright-cli**        | `/playwright-cli`        | Browser automation: screenshots, tracing, video recording, session management, request mocking, test generation |
| **xray-cli**              | `/xray-cli`              | Xray Cloud test management: create tests, manage executions, import results, backup/restore                     |
| **frontend-design**       | `/frontend-design`       | Create distinctive, production-grade frontend interfaces with high design quality                               |
| **next-best-practices**   | `/next-best-practices`   | Next.js best practices: file conventions, RSC boundaries, data patterns, metadata, error handling               |
| **next-cache-components** | `/next-cache-components` | Next.js Cache Components: PPR, use cache directive, cacheLife, cacheTag, updateTag                              |
| **next-upgrade**          | `/next-upgrade`          | Upgrade Next.js to latest version following official migration guides and codemods                              |

**Note:** Skills are committed to the repo so anyone who clones the project gets them out of the box. User-specific settings (`.claude/settings.local.json`) are gitignored.

---

## Test Project Structure

```
tests/
├── components/
│   ├── TestContext.ts        # Layer 1: Config + Faker
│   ├── TestFixture.ts        # Layer 4: Unified fixture
│   ├── api/
│   │   ├── ApiBase.ts        # Layer 2: HTTP client
│   │   └── [YourApi.ts]      # Layer 3: Domain components
│   ├── ui/
│   │   ├── UiBase.ts         # Layer 2: Page base
│   │   └── [YourPage.ts]     # Layer 3: Domain components
│   └── steps/                # Reusable step chains (preconditions)
├── e2e/                      # E2E tests
├── integration/              # API tests
└── data/fixtures/            # Test data JSON
```

---

## Critical Test Priorities

> Update with your project's priorities.

| Priority | Flow     | Business Impact  | Status |
| -------- | -------- | ---------------- | ------ |
| Critical | [Flow 1] | [Why it matters] | [ ]    |
| Critical | [Flow 2] | [Why it matters] | [ ]    |
| High     | [Flow 3] | [Why it matters] | [ ]    |

---

## Discovery Progress

> Track which discovery prompts have been completed.

| Phase                  | Status         | Output Files                                                                       |
| ---------------------- | -------------- | ---------------------------------------------------------------------------------- |
| Fase 1: Constitution   | [Pending/Done] | `idea/*`                                                                           |
| Fase 2: Architecture   | [Pending/Done] | `PRD/*`, `SRS/*`                                                                   |
| Fase 3: Infrastructure | [Pending/Done] | `SRS/infrastructure.md`                                                            |
| Context Generators     | [Pending/Done] | `business-data-map`, `api-architecture`, `project-dev-guide`, `project-test-guide` |

---

## Access Configuration

### Configured

- [ ] Playwright MCP (browser automation)
- [ ] Database MCP (data validation)
- [ ] Atlassian MCP (Jira/Xray integration)
- [ ] OpenAPI MCP (API exploration)
- [ ] Context7 MCP (library documentation)
- [ ] Bun runtime installed
- [ ] Playwright browsers installed
- [ ] GitHub Actions workflows
- [ ] ESLint + Prettier configured
- [ ] Husky pre-commit hooks

### Pending / Manual Steps

- [ ] Populate `.env` with staging/production URLs
- [ ] Populate `.env` with test user credentials (`LOCAL_*`, `STAGING_*`)
- [ ] Configure TMS credentials (Xray Cloud: `XRAY_CLIENT_ID`, `XRAY_CLIENT_SECRET`)
- [ ] Run `bun run env:validate` to check configuration
- [ ] Restart Claude Code after any MCP credential change (configs are cached)

---

## Testing Decisions

| Aspect        | Decision                   | Rationale         |
| ------------- | -------------------------- | ----------------- |
| **Priority**  | [API first / E2E first]    | [Reason]          |
| **Browsers**  | [Chromium / multi-browser] | [Reason]          |
| **Test Data** | [Faker / fixtures / both]  | [Reason]          |
| **Isolation** | Each test independent      | Standard practice |

---

## Quick Reference

**Pre-flight checklist:**

- [ ] Plan presented and approved before coding
- [ ] KATA architecture followed (layers, ATCs, fixtures)
- [ ] Aliases used for imports (`@api/`, `@schemas/`, `@utils/`)
- [ ] Credentials from `.env`, never hardcoded
- [ ] Tests run and pass
- [ ] No AI attribution in commits
- [ ] Context loaded progressively (not all at once)

See "Quick Start" above for common commands.

---

## Known Issues & Blockers

| Issue | Severity | Status |
|---|---|---|
| `prod-validate.yml` hardcoded creds | HIGH | FIXED (moved to GH secrets) |
| `JWT_SECRET` placeholder in `.env` | HIGH | FIXED (generated real secret) |
| `GUARANI_API_TOKEN` placeholder | MEDIUM | Open (needs real token) |
| `SUPABASE_ACCESS_TOKEN` in `.env` | MEDIUM | FIXED (synced from opencode.json) |
| Node.js 20 deprecation in CI actions | LOW | Open (upgrade actions/checkout to v5) |

---

## Next Actions

1. **[HIGH] Phase 6 Backlog**
   - [x] Notifications: mark-all-as-read endpoint + client button
   - [x] Notifications: snackbar toast on bulk action
   - [ ] Override expiry cron: verify deployment
   - [ ] Guaraní sync: fill real API token
   - [ ] Coordinator dashboard: add filters

2. **[MED] Env & CI**
   - [x] JWT_SECRET generated
   - [x] CRON_SECRET added to root .env
   - [x] `prod-validate.yml` creds → GH secrets
   - [ ] Upgrade `actions/checkout@v4` → `v5`, `actions/cache@v4` → `v5`
   - [ ] staging → main PR

3. **[LOW] Polish**
   - [ ] Notification toast/snackbar on server-pushed events
   - [ ] Coordinator dashboard filters (track, eligibility, date range)
   - [ ] Guaraní real API integration

---

**Last Updated**: 2026-07-17
**Session Count**: [N]
