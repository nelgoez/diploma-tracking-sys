# Diploma Tracking System - Agent Guidelines

## Overview

This guide helps agents work effectively on the Diploma Tracking System, which tracks student progress through modular diploma courses (Moodle), manages certificates, and integrates with Guaraní for academic administration. All code remains in English with Spanish/English UI options.

## Session Context

- **Always update `SESSION_CONTEXT.md`** when the user says "it all", "call it the day", "that's it", or similar wrap-up phrases.
- Add session log entry with date, summary of work done, and current status.
- Bump version number on each update.

## Key Commands

- Install deps: `bun install`
- Dev servers: `bun run dev` (backend) & `bun run dev` (frontend - adjust per setup)
- Lint: `bun run lint`
- Format: `bun run format`
- Sync OpenAPI: `bun run api:sync`

## Project Structure (Adapted for Diploma Tracking)

```
/server
  /src
    /services - Moodle/Guaraní services, business logic
    /entities - Database entities (Student, Certificate, etc.)
    /controllers - API endpoints
    /dto - Data transfer objects
    /rules - Rule engine for habilitación/equivalencias
/client
  /src
    /components - Reusable UI components
    /pages - Student dashboard, admin panels
    /services - API service layer
    /i18n - Internationalization setup
    /locales - Translation files (es/en)
```

## Spanish/English UX Implementation

Keep all code/comments in English. Implement i18n for UI:

1. **Setup i18n** (in client):

   ```bash
   # Install dependencies
   npm install i18next react-i18next
   ```

2. **Create locale structure**:

   ```
   /locales
     /es
       translation.json
       diploma-tracking.json
     /en
       translation.json
       diploma-tracking.json
   ```

3. **Initialize i18n** (client/src/i18n.ts):

   ```typescript
   import i18n from 'i18next';
   import { initReactI18next } from 'react-i18next';

   i18n
     .use(initReactI18next)
     .init({
       resources: {
         en: {
           translation: require('./locales/en/translation.json'),
           diploma-tracking: require('./locales/en/diploma-tracking.json')
         },
         es: {
           translation: require('./locales/es/translation.json'),
           diploma-tracking: require('./locales/es/diploma-tracking.json')
         }
       },
       lng: localStorage.getItem('language') || 'es',  // Default to Spanish
       fallbackLng: 'en',
       interpolation: { escapeValue: false }
     });

   export default i18n;
   ```

4. **Language switcher component**:

   ```typescript
   // client/src/components/LanguageSwitcher.tsx
   import { useTranslation } from 'react-i18next';

   export const LanguageSwitcher = () => {
     const { i18n } = useTranslation();
     const currentLang = i18n.language;
     const toggleLanguage = () => {
       const newLang = currentLang === 'es' ? 'en' : 'es';
       i18n.changeLanguage(newLang);
       localStorage.setItem('language', newLang);
     };

     return (
       <button onClick={toggleLanguage} className="language-switcher">
         {currentLang === 'es' ? 'English' : 'Español'}
       </button>
     );
   };
   ```

5. **Usage in components**:

   ```typescript
   import { useTranslation } from 'react-i18next';

   const StudentDashboard = () => {
     const { t } = useTranslation('diploma-tracking');
     return (
       <div>
         <h1>{t('dashboard.title')}</h1>
         <p>{t('dashboard.welcome')}</p>
       </div>
     );
   };
   ```

## Functional Modules Implementation (Per Spanish Specs)

### 1. Gestión de certificados Moodle

- Extend existing `MoodleService` in `/server/src/services/moodle.service.ts`
- Add endpoints for certificate retrieval/validation
- Implement synchronization logic with student progress
- Create DTOs: `CertificateDto`, `MoodleStudentDto`

### 2. Panel de seguimiento para estudiantes

- Create `/client/src/pages/student-dashboard/`
- Show course progress, pending requirements, certificates earned
- Visual progress indicators (bars, charts)
- Integration with Moodle data via API service

### 3. Motor de reglas de habilitación

- Create `/server/src/services/rule-engine.service.ts`
- Implement prerequisite validation logic
- Handle equivalency checking between courses
- Create rule definition interface/configuration

### 4. Gestión de inscripción y evaluación final

- Enrollment services in `/server/src/services/enrollment.service.ts`
- Exam scheduling and grade management
- Certification issuance workflow
- Final exam coordination interfaces

### 5. Integración con Guaraní

- Create `GuaraníService` following Moodle service pattern
- Academic record synchronization
- Student data exchange (enrollments, grades, personal info)
- Environment variables: `GUARANI_API_URL`, auth tokens

### 6. Panel administrativo (Backoffice)

- Admin-protected routes in client
- User/role management interfaces
- Integration configuration panels (Moodle/Guaraní)
- Analytics and reporting dashboard
- Audit logging for administrative actions

## Development Workflow (Using Template Phases)

### Infrastructure Setup (Fase 3) - Do First

1. Backend setup (generates shared types):
   ```bash
   bun run cli/backend-setup.ts
   ```
2. Frontend setup (consumes generated types):
   ```bash
   bun run cli/frontend-setup.ts
   ```

### Per Feature/Module (Fases 4-14)

1. **Specification (Fase 4)**:
   - Create Jita ticket via MCP (`bun xray`)
   - Use Jira ID to create: `.context/PBI/epics/EPIC-DTS-{NUM}-{name}/`
   - Fill in: epic.md, story.md, acceptance-test-plan.md, implementation-plan.md

2. **Development (Fase 7)**:
   - Load workflow: `.prompts/us-dev-workflow.md`
   - Implement: `.prompts/fase-7-implementation/implement-story.md`
   - Add unit tests: `.prompts/fase-7-implementation/unit-testing.md`
   - Follow: `.context/guidelines/DEV/spec-driven-development.md`

3. **Testing (Fases 10-12)**:
   - Exploratory: `.prompts/fase-10-exploratory-testing/`
   - Document: `.prompts/fase-11-test-documentation/`
   - Automate API: `.prompts/fase-12-test-automation/integration/`
   - Automate E2E: `.prompts/fase-12-test-automation/e2e/`

## Critical Technical Considerations

### Type Safety

- Backend generates frontend types - never edit generated types directly
- Always use aliases: `@api/`, `@schemas/`, `@utils/`
- Define interfaces at top of files after imports

### Error Handling

- Public methods: fail fast with descriptive errors
- Utilities: silent fail (return null/log) when appropriate
- External API calls must handle network errors, timeouts, invalid responses

### External Service Integration

- Moodle: Use existing service as template, add token management
- Guaraní: Create new service with similar structure
- Implement circuit breaker pattern for resilience
- Add caching for frequent queries (student progress, course catalog)
- Log all external API calls/responses for debugging

### Database Design

Likely needed entities:

- Student (id, moodleId, guaraníId, personal info)
- Course/Module (id, name, credits, prerequisites)
- Certificate (id, studentId, courseId, dateIssued, moodleSyncId)
- Enrollment (id, studentId, courseId, status, enrollmentDate)
- Exam (id, courseId, date, grade, studentId)
- Rule (id, description, conditions, actions)

### API Development Patterns

- Use DTOs for all request/response validation
- Implement authentication middleware (JWT recommended)
- Add rate limiting for external API calls
- Use interceptors for consistent logging/error handling
- Version API endpoints if breaking changes expected

## Quality Assurance Focus

### Test Priorities

| Priority | User Journey                                                          | Business Impact       |
| -------- | --------------------------------------------------------------------- | --------------------- |
| Critical | View progress → See Moodle certificates → Get notified of pending     | Core value            |
| Critical | Complete final exam → Get diploma issued → Update Guaraní records     | Completion tracking   |
| High     | Attempt enroll without prerequisites → System blocks with explanation | Prevents errors       |
| High     | Admin views integration health → Sees sync status/error rates         | Operational oversight |

### Testing Strategy

- **Unit Tests** (Fase 7): Services, DTOs, utilities, rule engine logic
- **Integration Tests** (Fase 12): API endpoints, database operations, mocked external services
- **E2E Tests** (Fase 12): Critical paths: login → dashboard → view certificate → language switch
- **Exploratory** (Fase 10): Focus on Moodle/Guaraní edge cases, auth flows, error scenarios

## Verification Checklist

Before considering work complete:

- [ ] All user-facing strings externalized for i18n
- [ ] Language switcher functional and persists preference
- [ ] Default language is Spanish (per spec)
- [ ] No hardcoded credentials or URLs in code
- [ ] External service configs in `.env` only
- [ ] Code follows TS patterns from `.context/guidelines/TAE/typescript-patterns.md`
- [ ] Public methods have proper error handling
- [ ] Unit tests cover business logic (>80% where applicable)
- [ ] API endpoints have integration tests
- [ ] Critical user journeys have E2E tests
- [ ] Documentation updated in `.context/PBI/`
- [ ] Linting passes with no errors
- [ ] Formatting complies with Prettier rules
- [ ] OpenAPI spec synced if API changed (`bun run api:sync`)

Respond terse like smart caveman. All technical substance stay. Only fluff die.

Rules:

- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging
- Fragments OK. Short synonyms. Technical terms exact. Code unchanged.
- Pattern: [thing] [action] [reason]. [next step].
- Not: "Sure! I'd be happy to help you with that."
- Yes: "Bug in auth middleware. Fix:"

Switch level: /caveman lite|full|ultra|wenyan
Stop: "stop caveman" or "normal mode"

Auto-Clarity: drop caveman for security warnings, irreversible actions, user confused. Resume after.

Boundaries: code/commits/PRs written normal.
