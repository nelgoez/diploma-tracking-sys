# Executive Summary - Diploma Tracking System

> Generated from: `.prompts/fase-2-architecture/prd-executive-summary.md`
> Based on: Spanish Requirements + Business Model Canvas

---

## 1. Problem Statement

Las instituciones académicas enfrentan desafíos significativos en la gestión del progreso estudiantil en diplomaturas modulares. El seguimiento de cursos completados en Moodle, la validación de prerrequisitos para exámenes integradores, y la sincronización con Guaraní se realizan de forma fragmentada o manual, generando:

- **Errores** en validación de requisitos académicos
- **Demoras** en emisión de certificados parciales y diplomas
- **Falta de visibilidad** del progreso para estudiantes y coordinadores
- **Duplicación de esfuerzos** administrativos entre sistemas

Este problema afecta a miles de estudiantes que necesitan una forma clara y automatizada de completar su trayectoria formativa.

---

## 2. Solution Overview

**Diploma Tracking System** es una plataforma web que unifica la gestión de trayectos formativos modulares, automatiza reglas de habilitación, y se integra con Moodle y Guaraní para consolidar el avance académico.

### Features Core del MVP

1. **Gestión de Certificados Moodle**
   - Visualización de certificados emitidos
   - Sincronización automática con progreso del estudiante

2. **Panel de Seguimiento Estudiantil**
   - Dashboard individual con progreso visual
   - Cursos completados, créditos acumulados, certificados pendientes

3. **Motor de Reglas de Habilitación**
   - Configuración de prerrequisitos por curso
   - Validación automática de equivalencias
   - Habilitación manual por administrador (excepciones)

4. **Gestión de Inscripción y Evaluación Final**
   - Inscripción a examen integrador
   - Registro de calificaciones
   - Emisión de diploma final

5. **Integración con Guaraní**
   - Sincronización de datos de estudiantes
   - Actualización de estado académico
   - Historial de certificaciones

6. **Panel Administrativo (Backoffice)**
   - Gestión de estudiantes y cursos
   - Configuración de reglas
   - Reportes y métricas

---

## 3. Success Metrics

### Métricas de Adopción

| KPI | Target | Measurement |
|-----|--------|-------------|
| Estudiantes activos mensual | 80% de inscritos | MAU / Total_inscritos |
| Tiempo hasta completar inscripción | < 5 minutos | Tiempo promedio desde login hasta inscripción confirmada |
| Uso del dashboard de progreso | > 70% semanal | Estudiantes que acceden al dashboard 1+ vez/semana |

### Métricas de Engagement

| KPI | Target | Measurement |
|-----|--------|-------------|
| Tasa de completitud de diplomatura | > 85% | Completados / Inscritos |
| Tiempo promedio hasta diploma | < 6 meses | Desde inscripción hasta diploma |
| Satisfacción del usuario | NPS > 40 | Encuesta post-diploma |

### Métricas de Negocio

| KPI | Target | Measurement |
|-----|--------|-------------|
| Reducción de errores administrativos | < 5% rechazos por requisitos | Errores_actual vs Errores_pre-implementación |
| Tiempo de procesamiento de certificados | < 24 horas | Desde solicitud hasta emisión |

---

## 4. Target Users

### Persona 1: María - Estudiante de Diplomatura

| Attribute | Description |
|-----------|-------------|
| **Edad** | 25-45 años |
| **Perfil** | Profesional trabajando, estudia para ups-killing |
| **Pain Point** | No sabe qué cursos necesita completar ni cuándo puede inscribirse al examen final |
| **Goals** | Ver progreso claro, recibir notificaciones de próximos pasos, obtener certificados rápidamente |
| **Tech Comfort** | Medio-alto, usa Moodle para cursos pero quiere todo en un solo lugar |

### Persona 2: Carlos - Coordinador Académico

| Attribute | Description |
|-----------|-------------|
| **Edad** | 35-55 años |
| **Perfil** | Staff administrativo, define reglas de diplomatura |
| **Pain Point** | Configurar reglas manualmente, responder muchas consultas de estudiantes sobre requisitos |
| **Goals** | Configurar reglas una vez, ver dashboard con métricas, aprobar excepciones fácilmente |
| **Tech Comfort** | Básico-medio, prefiere interfaces claras sobre técnicas |

### Persona 3: Ana - Administradora del Sistema

| Attribute | Description |
|-----------|-------------|
| **Edad** | 30-50 años |
| **Perfil** | IT/TI de la institución, mantiene integraciones |
| **Pain Point** | Mantener sincronización Moodle + Guaraní, resolver problemas de datos |
| **Goals** | Monitorear integraciones, resolver issues rápidamente, configurar sin código |
| **Tech Comfort** | Alto, entiende APIs y bases de datos |

---

## Notes

- **Tech Stack confirmado:** React + Vite + MUI (frontend), Bun + Hono + Supabase (backend)
- **MVP Scope:** Una diplomatura piloto, integraciones Moodle + Guaraní placeholder
- **Idioma:** Español default, Inglés como opción (i18n)