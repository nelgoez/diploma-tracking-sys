# User Personas - Diploma Tracking System (UNC)

> Generated from: `.prompts/fase-2-architecture/prd-user-personas.md`
> Based on: Spanish Requirements + Executive Summary

---

## Persona 1: Lucía - Estudiante de Diplomatura

### Demographics

| Field | Value |
|-------|-------|
| **Nombre** | Lucía Martínez |
| **Edad** | 32 años |
| **Ocupación** | Analista de Sistemas en empresa privada |
| **Ubicación** | Córdoba Capital, Argentina |
| **Educación** | Licenciada en Sistemas (UNC), actualmente cursando Diplomatura en Data Analytics |

### Background

Lucía trabaja tiempo completo y estudia para actualizarse. Tiene tiempo limitado y necesita optimizar cada hora que dedica a su formación. Ya usa Moodle para los cursos y Guaraní para ver sus notas, pero le resulta tedioso consultar ambos sistemas y no tiene claro qué le falta para completar la diplomatura.

### Pain Points

1. **Falta de visibilidad** - No sabe exactamente qué cursos necesita completar ni en qué orden
2. **Trámites manuales** - Debe consultar con el coordinador para saber si cumple requisitos
3. **Sin notificaciones** - No sabe cuándo se emite un certificado o cuándo puede inscribirse al examen
4. **Experiencia fragmentada** - Moodle (cursos) + Guaraní (notas) = dos lugares para consultar

### Goals

- Ver todo su progreso en un solo lugar (dashboard unificado)
- Recibir notificaciones cuando complete un curso o cuando algo cambie
- Saber al instante si ya puede inscribirse al examen integrador
- Obtener sus certificados parciales y diploma final rápidamente

### Frustrations

- "Me da lata tener que entrar a dos sistemas diferentes"
- "No sé si me falta algo o ya puedo dar el examen final"
- "Cuando me dan un certificado, me enteré semanas después"

### Tech Comfort

**Medio-Alto**
- Usa herramientas digitales diariamente (Slack, Teams, Google Workspace)
- Le comfortable con apps móviles y web
- Espera experiencias modernas tipo Netflix/LinkedIn

### Quote

> "Quiero poder ver en mi celular cuánto me falta para terminar la diplomatura, igual que veo mi progreso en Duolingo."

---

## Persona 2: Marcos - Coordinador Académico de Diplomatura

### Demographics

| Field | Value |
|-------|-------|
| **Nombre** | Marcos Rodríguez |
| **Edad** | 48 años |
| **Ocupación** | Profesor Titular, Coordinador de Diplomatura en Data Science |
| **Ubicación** | Ciudad Universitaria, Córdoba |
| **Educación** | Doctor en Ciencias de la Computación (UNC) |

### Background

Marcos es profesor desde 20 años y desde hace 5 coordina la diplomatura de Data Science. Define qué cursos se necesitan, approves estudiantes, y valida quién puede dar el examen final. Actualmente hace todo esto con planillas Excel y consultas por email.

### Pain Points

1. **Configuración manual de reglas** - Cada cuatrimestre ajusta prerrequisitos en Excel
2. **Consultas repetitivas** - Responde 20+ emails/semana de "¿ya puedo anotarme al examen?"
3. **Sin métricas** - No sabe cuántos estudiantes están en riesgo de abandonar
4. **Excepciones manuales** - Debe aprobar manualmente equivalencias por experiencia laboral

### Goals

- Definir reglas de prerrequisitos una vez y que el sistema las aplique automáticamente
- Ver un dashboard con cuántos estudiantes cumplen requisitos vs. no
- Aprobar excepciones de equivalencia con un click y motivo documentado
- Generar reportes para la secretaría académica

### Frustrations

- "Pierdo horas actualizando planillas de Excel"
- "Mis estudiantes me escriben preguntando cosas que el sistema debería responder solo"
- "No tengo idea cuántos están cursando vs. cuántos abandonaron"

### Tech Comfort

**Básico-Medio**
- Usa email, Word, Excel con confianza
- Le cuesta adoptar nuevas herramientas
- Necesita interfaces claras y sin jerga técnica

### Quote

> "Solo quiero que el sistema me diga quién está habilitado y quién no, sin tener que hacer cuentas yo."

---

## Persona 3: Ana - Administradora de Sistemas (TI UNC)

### Demographics

| Field | Value |
|-------|-------|
| **Nombre** | Ana Martínez |
| **Edad** | 38 años |
| **Ocupación** | Analista de Sistemas, Dirección de Tecnologías de Información UNC |
| **Ubicación** | Pabellón de Servicios, UNC |
| **Educación** | Ingeniera en Sistemas (UNC), MBA en Gestión de TI |

### Background

Ana es responsable de integrar sistemas en UNC. Conecta Guaraní con Moodle, configura APIs, y asegura que los datos fluyan correctamente entre facultades. Ha implementado integraciones con SIU en otras facultades y conoce las complejidades.

### Pain Points

1. **Debugging de integraciones** - Cuando algo falla, cuesta rastrear dónde está el problema
2. **Tokens y credenciales** - Gestionar múltiples credenciales de APIs (Moodle, Guaraní)
3. **Logs distribuidos** - Sin un lugar centralizado para ver qué pasó
4. **Cambios frecuentes** - Moodle y Guaraní actualizan sus APIs sin aviso

### Goals

- Dashboard de salud de integraciones (status, último sync, errores)
- Gestión centralizada de credenciales (variables de ambiente, no hardcodeado)
- Logs centralizados para troubleshooting
- Configurar integraciones nuevas sin escribir código (si es posible)

### Frustrations

- "Paso más tiempo debugging que implementando"
- "No tengo visibility de qué integrations están funcionando"
- "Cada vez que cambia una API, tengo que correr a actualizar el código"

### Tech Comfort

**Alto**
- Conoce APIs REST, bases de datos, terminal
- Cómoda con PostgreSQL y herramientas de monitoreo
- Lee logs y diagnostica problemas

### Quote

> " Dame logs claros, status de integrations, y la ability de re-trigger syncs manualmente."

---

## Summary Table

| Persona | Rol | Tech Comfort | Pain Point Principal |
|---------|-----|-------------|---------------------|
| **Lucía** | Estudiante | Medio-Alto | Falta de visibilidad del progreso |
| **Marcos** | Coordinador | Básico-Medio | Configuración manual de reglas |
| **Ana** | Admin TI | Alto | Debugging de integraciones |

---

## Notes

- **Contexto:** UNC (Universidad Nacional de Córdoba)
- **Validación:** Personas basadas en perfiles típicos UNC, validar con stakeholders reales
- **MVP:** Enfocado en Lucía (estudiante) y Marcos (coordinador) como usuarios principales