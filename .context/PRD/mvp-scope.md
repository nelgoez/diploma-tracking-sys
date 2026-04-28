# MVP Scope - Diploma Tracking System

> Generated from: `.prompts/fase-2-architecture/prd-mvp-scope.md`
> Based on: Spanish Requirements (6 módulos) + Executive Summary

---

## 1. Vision

Sistema unificado para gestión de trayectos formativos modulares en la UNC, con integración Moodle + Guaraní.

### Propuesta de Valor

- **Para estudiantes:** Visibilidad clara de su progreso y habilitación automática para exámenes
- **Para coordinadores:** Motor de reglas configurables sin intervención de TI
- **Para administradores:** Dashboard de métricas y configuración centralizada

---

## 2. Épicas del MVP

### Épica 1: Gestión de Certificados Moodle
**Como** estudiante, **quiero** ver los certificados emitidos por Moodle en mi dashboard, **para** saber qué cursos he completado.

**Criterios de aceptación:**
- [ ] Listado de certificados sincronizados desde Moodle
- [ ] Ver detalle de cada certificado (fecha, curso, calificación)
- [ ] Notificación al recibir nuevo certificado
- [ ] Sincronización manual (botón refresh)

### Épica 2: Panel de Seguimiento Estudiantil
**Como** estudiante, **quiero** ver mi progreso en una sola pantalla, **para** saber qué me falta para completar la diplomatura.

**Criterios de aceptación:**
- [ ] Dashboard con progreso visual (cursos completados / total)
- [ ] Créditos acumulados vs. requeridos
- [ ] Lista de cursos pendientes con prerrequisitos
- [ ] Estado de habilitación para examen final

### Épica 3: Motor de Reglas de Habilitación
**Como** coordinador, **quiero** configurar reglas de prerrequisitos, **para** que el sistema valide automáticamente quién cumple requisitos.

**Criterios de aceptación:**
- [ ] Definición de prerrequisitos por curso (A requiere B y C)
- [ ] Validación automática de prerrequisitos
- [ ] Override manual para equivalencias (con razón)
- [ ] Logs de decisiones del motor

### Épica 4: Inscripción y Evaluación Final
**Como** estudiante, **quiero** inscribirme al examen integrador cuando cumpla requisitos, **para** obtener mi diploma.

**Criterios de aceptación:**
- [ ] Detección automática de habilitación
- [ ] Formulario de inscripción (cuando habilitado)
- [ ] Registro de calificación por coordinador
- [ ] Emisión de diploma final (PDF)

### Épica 5: Integración con Guaraní
**Como** administrador, **quiero** sincronizar datos con Guaraní, **para** mantener actualizada la información académica.

**Criterios de aceptación:**
- [ ] Sync de estudiantes desde Guaraní
- [ ] Actualización de estado académico
- [ ] Logs de sync (último sync, status)
- [ ] Reconexión manual en caso de error

### Épica 6: Panel Administrativo
**Como** coordinador/admin, **quiero** gestionar estudiantes y ver métricas, **para** administrar la diplomatura efectivamente.

**Criterios de aceptación:**
- [ ] Listado de estudiantes (buscar, filtrar)
- [ ] Ver detalle de estudiante (progreso completo)
- [ ] Dashboard de métricas (tasa progreso, completitud)
- [ ] Configuración básica de diplomatura

---

## 3. In Scope (MVP)

### Funcionalidades Confirmadas

| Módulo | Feature | Prioridad | Notas |
|--------|---------|----------|-------|
| **Certificados** | Listado Moodle | Must Have | Sincronización inicial |
| **Certificados** | Detalle certificado | Should Have | PDF/link |
| **Seguimiento** | Dashboard progreso | Must Have | Vista estudiante |
| **Seguimiento** | Estado habilitación | Must Have | Indicador claro |
| **Motor Reglas** | Prerrequisitos | Must Have | Configuración básica |
| **Motor Reglas** | Override manual | Should Have | Con razón |
| **Inscripción** | Inscripción examen | Must Have | Cuando habilitado |
| **Inscripción** | Diploma PDF | Should Have | post-examen |
| **Guaraní** | Sync estudiante | Must Have | Placeholder inicial |
| **Admin** | Listado filtrado | Must Have | Buscar + filtro estado |
| **Admin** | Métricas | Should Have | Dashboard básico |

### Features Excluidas (MVP)

- Chat/soporte en vivo
- Notificaciones push nativas
- Webhooks para Moodle/Guaraní
- Múltiples diplomaturas (una sola)
- Gamificación
- App móvil nativa
- Exportación avanzada (solo PDF básico)

---

## 4. Out of Scope (Post-MVP)

| Feature | Razón |
|---------|-------|
| Múltiples diplomaturas | Una piloto por vez |
| Webhooksreal-time | Polling suficiente al inicio |
| App iOS/Android | Web responsive cubre necesidad |
| Gamificación | Complejidad adicional |
| Certificados blockchain | No hay demanda aún |
| Integración con otras universidades | Post-MVP |

---

## 5. User Stories Resumen

### Como estudiante, quiero...

| Story | Feature |
|-------|---------|
| ...ver mis certificados Moodle en un solo lugar | Certificados |
| ...saber cuánto me falta para el diploma | Seguimiento |
| ...inscribirme al examen cuando cumpla requisitos | Inscripción |
| ...recibir notificación cuando complete un curso | Certificados/Seguimiento |

### Como coordinador, quiero...

| Story | Feature |
|-------|---------|
| ...configurar qué cursos son prerrequisito | Motor Reglas |
| ...aprobar equivalencias manualmente | Motor Reglas |
| ...ver cuántos estudiantes están al día | Admin |
| ...generar reporte para secretaría | Admin |

### Como administrador, quiero...

| Story | Feature |
|-------|---------|
| ...ver el estado de integraciones | Guaraní |
| ...re-sincronizar datos manualmente | Guaraní |
| ...gestionar usuarios del sistema | Admin (placeholder) |

---

## 6. Roadmap Sugerido (Post-MVP)

| Prioridad | Feature | complexity |
|----------|---------|-------------|
| **P1** | Múltiples diplomaturas | Media |
| **P1** | Webhooks | Media |
| **P2** | Notificaciones push | Alta |
| **P2** | App móvil | Alta |
| **P3** | Gamificación | Media |
| **P3** | Certificados blockchain | Alta |

---

## Notes

- **Idioma:** Español default, Inglés como opción (i18n)
- **Contexto:** UNC (Universidad Nacional de Córdoba)
- **Integraciones:** Moodle + Guaraní (placeholders initially)
- **MVP Timeline estimado:** 8-12 semanas (1 persona)