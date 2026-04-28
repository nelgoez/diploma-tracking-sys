# Market Context - Diploma Tracking System (UNC)

> Generated from: `.prompts/fase-1-constitution/market-context.md`
> Based on: Spanish Requirements + Business Model + **UNC Context**

---

## 1. Competitive Landscape

### Contexto UNC

La **Universidad Nacional de Córdoba (UNC)** es la universidad pública más grande de Argentina (~120,000 estudiantes). Utiliza:
- **Moodle** como LMS para cursos y diplomaturas
- **Guaraní** como sistema de gestión académica (ampliamente adoptado en universidades argentinas)
- Sistemas propios para certificados y diplomas

### Competidores Directos

| Competitor | Strengths | Weaknesses/Gaps | Our Differentiation |
|------------|-----------|-----------------|---------------------|
| **Moodle nativo** | Estándar en UNC, certificados básicos | No motor de reglas de habilitación, UI anticuada | Dashboard específico para diplomaturas UNC, reglas configurables |
| **Sistema de Diplomas UNC actual** | Integrado con registro oficial | Proceso manual, sin tracking de progreso | Automatización + visibilidad del recorrido |
| **Guaraní** | Registro académico oficial | No gestión de progreso en cursos Moodle | Integración bidireccional Moodle ↔ Guaraní |

### Diferenciación Clave para UNC

1. **Motor de reglas configurable** - Coordinadores de diplomatura pueden definir prerrequisitos sin intervención de TI
2. **Vista unificada del estudiante** - Progreso desde Moodle + estado en Guaraní en un solo lugar
3. **Automatización de habilitaciones** - Validación automática reduce errores y tiempo administrativo

---

## 2. Market Opportunity

### TAM/SAM/SOM (UNC Context)

| Market | Size | Description |
|--------|------|-------------|
| **TAM** | ~120,000 estudiantes UNC | Todos los que cursan diplomaturas/certificaciones |
| **SAM** | ~5,000+ estudiantes de diplomaturas activas | Target inicial con integración Moodle + Guaraní |
| **SOM** | ~500-1,000 estudiantes en 1-3 diplomaturas piloto | MVP en facultades seleccionadas |

### Áreas de Diplomaturas en UNC

| Facultad | Potencial |
|----------|-----------|
| **Ciencias Económicas** | Muchos programas de extensión/diplomaturas |
| **Facultad de Filosofía** | Humanidades, educación continua |
| **Facultad de Derecho** | Diplomaturas especializadas |
| **Todas** | Cualquier facultad con programas modulares |

### Growth Trends (Contexto Argentino)

| Trend | Impact |
|-------|--------|
| **Digitalización UNC** | Plan de modernización, mayor adopción de Moodle |
| **Microcredenciales** | push ministerial hacia credenciales cortas |
| **Interoperabilidad SIU** | SIU-Guaraní como estándar, SIU-Moodle en crecimiento |

### Barriers to Entry (UNC Specific)

| Barrier | Mitigation |
|---------|------------|
| **Burocracia universitaria** | Proceso de aprobación interno, involucrar stakeholders temprano |
| **Integración con Guaraní UNC** | APIsdocumentadas por SIU, experiencia previa en otras universidades |
| **Resistencia al cambio** | Piloto en diplomatura pequeña, escalamiento gradual |

---

## 3. Trends & Insights

### Technological Trends

1. **APIs SIU (Sistemas Universitarios)**
   - SIU-Guaraní: API REST documentada
   - SIU-Moodle: Integración via plugins o API
   - Estándar en universidades argentinas públicas

2. **Low-code/No-code para administración**
   - Coordinadores pueden definir reglas sin desarrollo
   - Dashboards configurables por facultad

### Market Trends (Educación Superior Argentina)

1. **Educación continua en auge**
   - Diplomaturas como alternativa a posgrados costosos
   - demanda de profesionales en actividad

2. **Credencialing digital**
   - push hacia open badges
   - Verificabilidad de competencias

### User Behavior (Estudiantes UNC)

1. **Expectativa de inmediatez**
   - Generación millennial/centennial expectativas de apps modernas
   - Notificaciones proactivas valoradas

2. **Doble plataforma actual**
   - Guaraní para calificaciones oficiales
   - Moodle para contenido de cursos
   - **Gap:** Sin visibilidad unificada del progreso

---

## 4. Competitive Analysis Summary

### Our Positioning (UNC Focus)

**Focus:** Sistema especializado para diplomaturas UNC con integración SIU-Moodle + SIU-Guaraní

**Key Differentiator:**
- Motor de reglas de habilitación configurable por coordinator
- Vista unificada del recorrido formativo (Moodle → Guaraní)
- Sincronización bidireccional con sistemas SIU

**Target:**
- Facultades UNC con programas de diplomatura
- 100-2000 estudiantes por programa
- Coordinadores académicos + estudiantes

### Stakeholders UNC

| Stakeholder | Interest |
|-------------|----------|
| **SIU (Proyecto Nacional)** | Interoperabilidad, estándar reutilizable |
| **Secretaría Académica UNC** | Visibilidad institucional, reducción de costos |
| **Facultades** | Herramienta adaptados a sus diplomaturas |
| **Estudiantes** | Experiencia moderna, progreso claro |

---

## Notes

- **Contexto:** UNC (Universidad Nacional de Córdoba), Argentina
- **Integraciones:** SIU-Guaraní (gestión académica), Moodle (LMS)
- **Base de datos:** Supabase (PostgreSQL compatible con requerimientos SIU)
- *Datos de mercado son aproximaciones, validar con Secretaría Académica UNC*