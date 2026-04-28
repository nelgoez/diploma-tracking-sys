# Functional Specifications - Diploma Tracking System

> Generated from: `.prompts/fase-2-architecture/srs-functional-specs.md`
> Based on: Spanish Requirements (6 módulos) + MVP Scope

---

## 1. Overview

Este documento especifica los requisitos funcionales del Diploma Tracking System para UNC, mapeados a las 6 épicas del MVP.

---

## 2. Module: Gestión de Certificados Moodle

### FR-CERT-001: Sincronización de Certificados
**Descripción:** El sistema debe sincronizar certificados emitidos por Moodle

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | batch |
| **Frecuencia** | On-demand + scheduled (cada 6 horas) |

**Reglas de negocio:**
- Solo se sincronizan certificados de estudiantes registrados en el sistema
- Certificados duplicados se identifican por (student_id, course_id, date)
- Estados válidos: `pending`, `synced`, `error`

**Validación:**
- El certificado debe existir en Moodle API
- El estudiante debe estar registrado en el sistema

---

### FR-CERT-002: Visualización de Certificados
**Descripción:** Los estudiantes pueden ver sus certificados en el dashboard

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | query |

**Casos de uso:**
- UC-CERT-001: Ver lista de certificados propios
- UC-CERT-002: Ver detalle de certificado (fecha, curso, calificación, PDF link)
- UC-CERT-003: Filtrar certificados por estado
- UC-CERT-004: Buscar certificado por nombre de curso

**Mapeo a UX:**
- Ver lista: `GET /api/certificates?student_id={id}`
- Ver detalle: `GET /api/certificates/{id}`
- Filtros: `?status=approved&from=2024-01-01`

---

### FR-CERT-003: Notificaciones de Certificados
**Descripción:** El sistema debe notificar cuando se emite un nuevo certificado

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | event |

**Implementación:**
- Detección: Nuevo certificado en sync vs. historial del estudiante
- Canal: Email (placeholder) + badge en dashboard
- Template: "Felicidades! Has completado [nombre_curso]"

---

## 3. Module: Panel de Seguimiento Estudiantil

### FR-TRACK-001: Dashboard de Progreso
**Descripción:** Cada estudiante ve su progreso personal

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | query |

**Métricas mostradas:**
- Cursos completados / Total (ej: "3/5")
- Créditos acumulados / Requeridos (ej: "12/20")
- Porcentaje de avance (ej: "60%")
- Estado actual: `on_track`, `at_risk`, `completed`

**Cálculo:**
```
progreso = (cursos_aprobados / cursos_totales) * 100
```

**Clasificación de estado:**
| Progreso | Estado |
|----------|--------|
| 0-40% | at_risk |
| 41-99% | on_track |
| 100% | completed |

---

### FR-TRACK-002: Estado de Habilitación
**Descripción:** Mostrar claramente si el estudiante está habilitado para el examen final

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | calculation |

**Estados:**
| Estado | Condición | Color UI |
|--------|-----------|----------|
| HABILITADO (Automático) | Cumple todos los prerrequisitos | Verde |
| HABILITADO (Manual) | Override por coordinator | Verde + badge |
| INHABILITADO | No cumple prerrequisitos | Rojo |
| INHABILITADO (Manual) | Revocado por coordinator | Rojo + badge |

**Cálculo:**
```
habilitado = 
  IF manual_override = true THEN manual_status
  ELSE all_prerequisites_passed(courses, student_id)
```

---

### FR-TRACK-003: Lista de Próximos Pasos
**Descripción:** Mostrar qué cursos necesita completar el estudiante

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | query |

**Lógica:**
- Filtrar cursos de la diplomatura donde el estudiante NO tiene certificado
- Ordenar por: prerrequisitos cumplidos primero (cursos disponibles)
- Mostrar prerrequisitos pendientes si aplica

---

## 4. Module: Motor de Reglas de Habilitación

### FR-RULE-001: Definición de Prerrequisitos
**Descripción:** Los coordinadores pueden definir qué cursos son prerrequisito de otros

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | configuration |

**Estructura de regla:**
```typescript
interface PrerequisiteRule {
  id: string;
  target_course_id: string;
  source_course_ids: string[]; // cursos que deben estar aprobados
  condition: "ALL" | "ANY"; // ALL: todos, ANY: al menos uno
  is_active: boolean;
  created_by: string;
  created_at: string;
}
```

**Validaciones:**
- No permitir dependencias circulares (A→B→C→A)
- No permitir auto-prerrequisito (A→A)
- warn si cambio afecta estudiantes existentes

---

### FR-RULE-002: Evaluación de Prerrequisitos
**Descripción:** El motor evalúa automáticamente si un estudiante cumple prerrequisitos

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | calculation |

**Algoritmo:**
```
evaluatePrerequisites(student_id, target_course_id):
  rules = getActiveRules(target_course_id)
  FOR each rule IN rules:
    certificates = getStudentCertificates(student_id)
    passed_ids = certificates.filter(c => c.status == 'approved').map(c => c.course_id)
    
    IF rule.condition == "ALL":
      IF NOT all(rule.source_course_ids IN passed_ids):
        RETURN { eligible: false, reason: "Faltan prerrequisitos" }
    ELSE IF rule.condition == "ANY":
      IF NOT any(rule.source_course_ids IN passed_ids):
        RETURN { eligible: false, reason: "Requiere al menos 1 prerrequisito" }
  
  RETURN { eligible: true }
```

---

### FR-RULE-003: Override Manual
**Descripción:** Coordinadores pueden habilitar/deshabilitar estudiantes manualmente

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | mutation |

**Datos requeridos:**
- student_id
- course_id (opcional, null = toda la diplomatura)
- action: `enable` | `disable`
- reason: string (requerido)
- created_by: string

**Logging:**
- Registrar en `manual_overrides` con timestamp y usuario
- Mostrar en historial del estudiante

---

## 5. Module: Inscripción y Evaluación Final

### FR-ENROLL-001: Detección de Habilitación
**Descripción:** Sistema detecta automáticamente cuándo un estudiante puede inscribirse

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | event |

**Trigger:**
- Después de sync de certificado Moodle
- Después de override manual
- On-demand (API call)

**Acción:**
- Actualizar estado `eligibility_status` del estudiante
- Enviar notificación si cambió a `eligible`

---

### FR-ENROLL-002: Formulario de Inscripción
**Descripción:** Estudiantes habilitados pueden inscribirse al examen

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | mutation |

**Formulario campos:**
| Campo | Tipo | Validación |
|-------|------|------------|
| student_id | auto | De sesión |
| exam_date | select | Debe estar en fechas disponibles |
| observations | textarea | Opcional, max 500 chars |

**Validación:**
- Verificar que estudiante esté habilitado
- Verificar que no esté ya inscrito
- Verificar fecha disponible

---

### FR-ENROLL-003: Registro de Calificación
**Descripción:** Coordinadores registran la calificación del examen final

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | mutation |

**Campos:**
| Campo | Tipo | Validación |
|-------|------|------------|
| enrollment_id | auto | Relacionado |
| qualification | number | 0-10 (aprobación: ≥6) |
| status | enum | `approved`, `disapproved`, `absent` |
| exam_date | date | Fecha del examen |
| observations | text | Opcional |
| registered_by | auto | Usuario actual |

---

### FR-ENROLl-004: Emisión de Diploma
**Descripción:** Generar diploma final (PDF) cuando se aprueba el examen

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | generation |

**Trigger:**
- Calificación registrada como `approved`

**Contenido del diploma:**
- Nombre del estudiante
- Nombre de la diplomatura
- Fecha de emisión
- FIRMA placeholder
- QR code de verificación (placeholder)

---

## 6. Module: Integración con Guaraní

### FR-GUARANI-001: Sync de Estudiantes
**Descripción:** Sincronizar estudiantes desde Guaraní

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | integration |

**Endpoint Guaraní (placeholder):**
```
GET /api/guarani/students
Response: [{ id, nombre, email, dni, carrera }]
```

**Mapeo:**
| Guaraní Field | Sistema Field |
|---------------|---------------|
| id | guarani_id |
| nombre | name |
| email | email |
| dni | dni |
| carrera | track_id (por diploma) |

**Conflict resolution:**
- Si existe por `guarani_id`: update
- Si no existe: create con `status: pending`
- Si existe localmente sin `guarani_id`: no modificar

---

### FR-GUARANI-002: Actualización de Estado Académico
**Descripción:** Enviar actualizaciones a Guaraní cuando cambia el estado

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | integration |

**Eventos a sync:**
- Diploma emitido → Guaraní
- Estado de avance actualizado

**Placeholder endpoint:**
```
POST /api/guarani/sync
Body: { student_id, event, data }
```

---

### FR-GUARANI-003: Dashboard de Integración
**Descripción:** Mostrar estado de sync con Guaraní

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | query |

**Métricas:**
- Último sync (timestamp)
- Estudiantes synced / total
- Errores en último sync
- Status: `ok`, `warning`, `error`

---

## 7. Module: Panel Administrativo

### FR-ADMIN-001: Gestión de Estudiantes
**Descripción:** Administradores pueden ver y gestionar estudiantes

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Must Have |
| **Tipo** | query + mutation |

**Funcionalidades:**
- Listado con paginación (20/page default)
- Filtros: estado, track, fecha de registro
- Búsqueda: nombre, DNI, email
- Ver detalle: progreso completo
- Acciones: ver, editar (limitado), invalidar

---

### FR-ADMIN-002: Dashboard de Métricas
**Descripción:** Resumen visual de métricas de la diplomatura

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | query |

**Métricas:**
| Métrica | Descripción |
|---------|-------------|
| total_students | Total registrados |
| active_students | Accedieron en últimos 30 días |
| completion_rate | % que completaron / total |
| avg_progress | Promedio de progreso |
| at_risk_students | Con estado at_risk |
| pending_enrollments | Inscripciones pendientes de approval |

---

### FR-ADMIN-003: Configuración de Diplomatura
**Descripción:** Coordinadores pueden configurar parámetros de la diplomatura

| Atributo | Valor |
|----------|-------|
| **Prioridad** | Should Have |
| **Tipo** | configuration |

**Configurables:**
- Nombre y descripción de la diplomatura
- Cursos incluidos (orden)
- Créditos requeridos
- Fechas de exámenes
- Habilitación de overrides

---

## 8. User Roles & Permissions

| Rol | Permisos |
|-----|----------|
| **estudiante** | Ver propio dashboard, certificados, inscribirse |
| **coordinador** | estudiante + configurar reglas, overrides, registro calificaciones |
| **admin** | coordinador + gestión de usuarios, configuración de sistema |
| **sysadmin** | admin + integraciones, logs, configuración técnica |

---

## 9. Notas de Implementación

- **Todas las APIs requieren autenticación JWT**
- **Moodle API:** Placeholder inicial (no implementación real)
- **Guaraní API:** Placeholder inicial (no implementación real)
- **Base de datos:** Supabase (PostgreSQL)
- **Idioma:** i18n con español default e inglés opción