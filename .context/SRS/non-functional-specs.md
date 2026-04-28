# Non-Functional Specifications - Diploma Tracking System

> Generated from: `.prompts/fase-2-architecture/srs-non-functional-specs.md`
> Based on: MVP Scope + UNC Context

---

## 1. Performance

### NFR-PERF-001: Tiempo de Carga
**Descripción:** La aplicación debe cargar rápidamente

| Métrica | Target | Notas |
|---------|--------|-------|
| First Contentful Paint (FCP) | < 1.5s | Dashboard principal |
| Time to Interactive (TTI) | < 3s | Con datos cargados |
| Largest Contentful Paint (LCP) | < 2.5s | Imágenes/dashboards |
| Bundle size (JS inicial) | < 200KB gzipped | Código React |

**Estrategia:**
- Code splitting por ruta
- Lazy loading de componentes
- CDN para assets estáticos

---

### NFR-PERF-002: Respuesta de API
**Descripción:** Los endpoints deben responder en tiempo razonable

| Tipo de request | Target | Percentile |
|-----------------|--------|------------|
| Queries simples | < 200ms | p95 |
| Queries complejas (dashboards) | < 500ms | p95 |
| Mutations (CRUD) | < 300ms | p95 |
| Sync batch (100+ records) | < 30s | total |

**Estrategia:**
- Índices en PostgreSQL para queries frecuentes
- Caching de queries pesadas (Redis placeholder)
- Pagination obligatoria en listados

---

### NFR-PERF-003: Concurrent Users
**Descripción:** Sistema debe soportar uso concurrente

| Escenario | Target |
|-----------|--------|
| Usuarios concurrentes | 100 |
| Solicitudes por segundo | 50 |
| peak load (exámenes) | 500 users simultáneos |

**Estrategia:**
- Stateless backend (horizontal scaling)
- Connection pooling en Supabase
- Rate limiting: 100 req/min por usuario

---

## 2. Security

### NFR-SEC-001: Autenticación
**Descripción:** Sistema debe autenticarse de forma segura

| Requisito | Implementación |
|-----------|----------------|
| Protocolo | JWT (RS256) |
| Expiración token | 24 horas |
| Refresh token | 7 días |
| Contraseñas | Hash bcrypt (cost 12) |
| MFA | Placeholder (post-MVP) |

**Flujo:**
```
1. Login → Validate credentials
2. Generate JWT (access + refresh tokens)
3. Access token en Authorization header
4. Refresh cuando expire
```

---

### NFR-SEC-002: Autorización
**Descripción:** Control de acceso basado en roles (RBAC)

| Rol | Permisos |
|-----|----------|
| **estudiante** | Read: own data, own certificates. Write: own enrollments |
| **coordinador** | Read: all students. Write: rules, overrides, grades |
| **admin** | Read: all. Write: users, config |
| **sysadmin** | Read: all. Write: all, integrations |

**Implementación:**
- Middleware de verificación de rol en cada endpoint
- Row-level security en Supabase (RLS)
- Principio de mínimo privilegio

---

### NFR-SEC-003: Protección de Datos
**Descripción:** Datos sensibles deben estar protegidos

| Dato | Protección |
|------|------------|
| DNI | Encriptado en DB (AES-256 placeholder) |
| Tokens API | Variables de ambiente, nunca en código |
| Logs | Sin datos sensibles (DNI, passwords) |
| HTTPS | Obligatorio en producción |

---

### NFR-SEC-004: Inyección SQL / XSS
**Descripción:** Protección contra vectores comunes

| Vector | Mitigación |
|--------|------------|
| SQL Injection | Prepared statements (Supabase query builder) |
| XSS | React auto-escape + CSP headers |
| CSRF | Token en requests + SameSite cookies |
| Rate limiting | middleware en API gateway |

---

## 3. Reliability

### NFR-REL-001: Uptime
**Descripción:** Disponibilidad del sistema

| Target | Medida |
|--------|--------|
| **Uptime** | 99.5% mensual |
| **Max downtime** | 3.6 horas/mes |
| **MTTR** | < 30 minutos |

**Estrategia:**
- Health checks en `/api/health`
- Graceful degradation (cache en fallback)
- Monitoreo con alertas (placeholder Sentry)

---

### NFR-REL-002: Manejo de Errores
**Descripción:** El sistema debe manejar fallos gracefully

| Scenario | Comportamiento |
|----------|-----------------|
| Moodle API down | Mostrar cache + banner "Datos pueden no estar actualizados" |
| Guaraní API down | Continuar operación local, queue para sync posterior |
| DB connection lost | Retry 3 veces con exponential backoff, luego error 503 |
| Rate limit excedido | Retornar 429 con Retry-After header |

**Logging:**
- Todos los errores: nivel, mensaje, stack trace, user_id, timestamp
- Errores externos: request/response completos (sin credenciales)

---

## 4. Scalability

### NFR-SCA-001: Crecimiento de Datos
**Descripción:** Sistema debe escalar con más estudiantes

| Datos | MVP Target | Scale Target |
|-------|-----------|--------------|
| Estudiantes | 500 | 10,000 |
| Cursos | 20 | 100 |
| Certificados | 2,500 | 50,000 |
| Logs (1 año) | 100MB | 2GB |

**Estrategia:**
- Índices apropiados en tablas
- Partitioning de logs por mes
- Archive de datos antiguos (> 2 años)

---

### NFR-SCA-002: Arquitectura de Escalamiento
**Descripción:** Capacidad de escalar horizontalmente

**Componentes:**
```
Frontend (Vercel/CDN) → Backend (Bun/Hono) → Supabase (PostgreSQL)
                              ↓
                    Integrations (Moodle, Guaraní)
```

**Estrategia:**
- Backend stateless (puede escalar en múltiples instancias)
- Supabase handles connection pooling automáticamente
- CDN para assets estáticos

---

## 5. Accessibility

### NFR-ACC-001: WCAG 2.1 AA
**Descripción:** Interfaz accesible

| Requisito | Implementación |
|-----------|----------------|
| Contraste | Ratio mínimo 4.5:1 |
| Navegación por teclado | Tab order, focus visible |
| Screen readers | Semantic HTML, ARIA labels |
| Alt text | Imágenes con descripción |
| Form labels | Labels asociados a inputs |

**Testing:**
- axe DevTools en desarrollo
- Lighthouse accessibility score > 90

---

### NFR-ACC-002: Responsive Design
**Descripción:** Funcional en múltiples dispositivos

| Dispositivo | Breakpoint | Target |
|-------------|------------|--------|
| Mobile | < 768px | Usable, core features |
| Tablet | 768-1024px | Full experience |
| Desktop | > 1024px | Full experience |

---

## 6. Maintainability

### NFR-MNT-001: Code Quality
**Descripción:** Código mantenible y testeable

| Métrica | Target |
|---------|--------|
| TypeScript strict mode | 100% |
| Test coverage | > 80% services, rule engine |
| Linting | 0 errors, 0 warnings |
| Cyclomatic complexity | < 10 por función |

**Tools:**
- ESLint + Prettier (pre-commit hooks)
- Jest para tests
- SonarQube (placeholder)

---

### NFR-MNT-002: Documentation
**Descripción:** Documentación actualizada

| Documento | Frecuencia update |
|-----------|-------------------|
| README | Por release |
| API docs (OpenAPI) | Con cada cambio de API |
| Architecture diagrams | Con cambios mayores |
| Code comments | JSDoc en funciones públicas |

---

## 7. Compatibility

### NFR-COM-001: Browsers
**Descripción:** Compatibilidad con navegadores

| Browser | Versión mínima |
|---------|---------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

### NFR-COM-002: API Compatibility
**Descripción:** Backward compatibility en APIs

| Estrategia | Aplicación |
|-----------|------------|
| Versioning | `/api/v1/` → `/api/v2/` si breaking changes |
| Deprecation | Headers `Deprecation` + Sunset |
| Client SDK | Generado de OpenAPI spec |

---

## 8. Data Management

### NFR-DATA-001: Data Retention
**Descripción:** Políticas de retención de datos

| Tipo de dato | Retención |
|--------------|-----------|
| Logs de aplicación | 1 año |
| Audits logs | 3 años |
| Certificados | Permanente |
| Datos personales | Según ley argentina (Habeas Data) |

---

### NFR-DATA-002: Backup & Recovery
**Descripción:** Recuperación ante desastres

| Aspecto | Implementación |
|---------|----------------|
| Backups automáticos | Supabase (diario) |
| Point-in-time recovery | Supabase (hasta 7 días) |
| Backup de configuraciones | Git repository |
| RTO (Recovery Time Objective) | < 4 horas |
| RPO (Recovery Point Objective) | < 1 hora |

---

## Summary

| Category | Key NFRs |
|----------|----------|
| **Performance** | Load < 3s, API < 200ms, 100 concurrent users |
| **Security** | JWT auth, RBAC, encrypted sensitive data |
| **Reliability** | 99.5% uptime, graceful error handling |
| **Scalability** | Support 10K students, horizontal scaling |
| **Accessibility** | WCAG 2.1 AA, responsive design |
| **Maintainability** | TypeScript strict, 80% test coverage |