# Business Model Canvas - Diploma Tracking System

> Generated from: `.prompts/fase-1-constitution/business-model.md`
> Based on: Spanish Requirements (Spanish Instructions v1.0)

---

## 1. Customer Segments (¿Para quién creamos valor?)

| Segment | Description |
|---------|-------------|
| **Estudiantes** | Alumnos inscritos en diplomaturas modulares que necesitan trackear su progreso, obtener certificados parciales y acceder al examen integrador |
| **Administradores Académicos** | Personal de la institución que gestiona inscripciones, valida requisitos y emite certificaciones |
| **Coordinadores de Diplomatura** | Profesionales que definen reglas de habilitación, manejan equivalencias y supervisan el progreso general |
| **Sistemas Externos** | Moodle (cursos), Guaraní (registro académico) - integrados vía APIs |

---

## 2. Value Propositions (¿Qué problema resolvemos?)

| For | Value Proposition |
|-----|-------------------|
| **Estudiantes** | Visibilidad clara de su progreso, certificados automáticos, habilitación transparente para exámenes |
| **Administradores** | Herramienta unificada, reducción de trámites manuales, validación automática de requisitos |
| **Coordinadores** | Control sobre reglas de habilitación, dashboard de métricas, gestión flexible de equivalencias |
| **Institución** | Interoperabilidad con sistemas existentes (Moodle + Guaraní), trazabilidad completa |

---

## 3. Channels (¿Cómo llegamos a los clientes?)

- **Portal web** - Aplicación principal (React frontend)
- **APIs REST** - Integración con Moodle y Guaraní
- **Notificaciones** - Email/in-app para hitos de progreso
- **Dashboard Admin** - Panel de administración para gestión centralizada

---

## 4. Customer Relationships (¿Qué relación establecemos?)

| Touchpoint | Relationship Type |
|------------|-------------------|
| **Portal Estudiante** | Self-service con soporte via email |
| **Panel Admin** | Soporte directo y capacitación inicial |
| **Integraciones** | Sincronización automática (Moodle/Guaraní) |

---

## 5. Revenue Streams (¿Cómo generamos ingresos?)

*Para MVP: Cost center interno (gestión académica institucional)*
- Plataforma gratuita para estudiantes
- Licencia institucional para administración
- *Post-MVP:可能的 suscripciones premium para instituciones*

---

## 6. Key Resources (¿Qué recursos necesitamos?)

| Resource | Description |
|----------|-------------|
| **Humanos** | Developers (2-3), Product Owner, UX Designer |
| **Tecnológicos** | Supabase (DB + Auth), Bun (runtime), React (frontend) |
| **Infraestructura** | Hosting para frontend + backend,域名 |
| **Datos** | Schemas de estudiantes, cursos, certificados, reglas |

---

## 7. Key Activities (¿Qué actividades clave hacemos?)

1. **Gestión de progreso académico** - Tracking de cursos completados, certificados obtenidos
2. **Motor de reglas** - Evaluación de prerrequisitos, habilitación de exámenes
3. **Integración de sistemas** - Sincronización con Moodle y Guaraní
4. **Emisión de certificados** - Gestión de certificados parciales y diploma final
5. **Administración académica** - Panel de gestión para administradores

---

## 8. Key Partners (¿Quiénes son nuestros partners?)

| Partner | Partnership Type | Integration |
|---------|-----------------|-------------|
| **Moodle** | Sistema de gestión de aprendizaje (LMS) | API de certificados y progreso |
| **Guaraní** | Sistema de gestión académica | Sync de estudiantes, calificaciones |
| **Institución** | Cliente y fuente de requerimientos | Producto final |

---

## 9. Cost Structure (¿Cuáles son los costos principales?)

| Category | Cost Items |
|----------|-----------|
| **Desarrollo** | Salarios, herramientas, infrastructure de dev |
| **Operación** | Hosting (Vercel/Railway), Supabase (tier gratuito inicial) |
| **Mantenimiento** | Bugs, updates, features menores |

---

## Problem Statement

Las instituciones académicas que ofrecen diplomaturas modulares enfrentan desafíos significativos en la gestión del progreso estudiantil. Actualmente, el seguimiento de cursos completados en Moodle, la validación de prerrequisitos para exámenes integradores, y la sincronización con sistemas de registro académico como Guaraní se realizan de forma fragmentada o manual.

Este fragmento genera:
- Errores en la validación de requisitos
- Demoras en la emisión de certificados
- Falta de visibilidad del progreso para estudiantes
- Duplicación de esfuerzos administrativos

**El resultado esperado** es un sistema unificado que automatiza la validación de habilitaciones, consolida el avance académico de múltiples cursos, y simplifica los trámites administrativos mediante interoperabilidad directa con Moodle y Guaraní.

---

## MVP Hypothesis (3 hipótesis a validar)

| # | Hypothesis | Validation Metric |
|---|------------|-------------------|
| H1 | Los estudiantes completan más rápido el proceso de inscripción cuando tienen visibilidad en tiempo real de su progreso | % de estudiantes que completan inscripción en primer intento |
| H2 | La automatización de reglas de habilitación reduce errores administrativos | # de rechazos por requisitos no cumplidos vs. sistema anterior |
| H3 | La integración con Guaraní mejora la calidad de datos académicos | % de registros sincronizados sin intervención manual |

---

## Notes

- MVP enfocado en una sola diplomatura piloto
- Integraciones Moodle y Guaraní inicialmente via APIs REST (no webhook)
- Sin payment gateway en MVP
- Idioma: Español como default, Inglés como opción