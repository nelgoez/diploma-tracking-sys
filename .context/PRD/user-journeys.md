# User Journeys - Diploma Tracking System (UNC)

> Generated from: `.prompts/fase-2-architecture/prd-user-journeys.md`
> Based on: Spanish Requirements + Personas + MVP Scope

---

## Journey 1: Lucía completa su diplomatura

### Flow Principal (Happy Path)

```ascii
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Login   │───▶│Dashboard│───▶│Cursos   │───▶│Certificados│───▶│Diploma  │
│         │    │         │    │         │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼
  "Bienvenid@   "Tienes 3      "Intro a     "Certificado   "Ya tienes
   Lucía"        cursos de 5"   Python       emitido"       tu diploma"
```

### Step-by-Step

| Step | Action | System Response | User Feeling |
|------|--------|-----------------|--------------|
| 1 | Lucía abre la app | Muestra login (o auto-login si remembered) | "Voy a ver cómo vengo" |
| 2 | Ve dashboard con progreso | "3/5 cursos completados, 12/20 créditos" | "Ya voy por la mitad" |
| 3 | Ve que completó "Intro a Python" | Notificación: "Tienes 1 nuevo certificado" | "¡Genial!" |
| 4 | Revisa certificados | Lista de certificados, click en detalles | "Este lo necesito para el final" |
| 5 | Ve estado habilitación | "INHABILITADO: Te faltan 2 cursos" | "Ah, ya sé qué me falta" |
| 6 | Cursa los cursos faltantes | Sistema detecta completitud | (moodle sync) |
| 7 | Ve habilitación actualizada | "HABILITADO para examen final" | "¡Puedo anotarme!" |
| 8 | Se inscribe al examen | Formulario de inscripción, confirma | "Listo, me anoté" |
| 9 | Coord. registra calificación | "Examen aprobado" | (notificación) |
| 10 | Recibe diploma | PDF del diploma final | "¡Lo logré!" |

### Edge Cases

| Case | Scenario | Handling |
|------|----------|----------|
| **EC1** | Usuario intenta inscribirse sin cumplir requisitos | Mostrar mensaje: "No cumples requisitos. Te faltan: [lista]" |
| **EC2** | Certificado Moodle no sincroniza | Botón "Reintentar sync" con mensaje de error |
| **EC3** | Estudiante abandona cursada | Dashboard muestra estado "En riesgo" si no accede en 30 días |
| **EC4** | Diploma ya emitido | No mostrar botón de inscripción, solo ver diploma |

---

## Journey 2: Marcos configura prerrequisitos

### Flow Principal (Admin Path)

```ascii
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Login   │───▶│Admin    │───▶│Config   │───▶│Reglas   │───▶│Verificar│
│ Admin   │    │Panel    │    │Diploma  │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Step-by-Step

| Step | Action | System Response | User Feeling |
|------|--------|-----------------|--------------|
| 1 | Marcos accede al panel admin | Pide credenciales (o usa SSO UNC) | "Voy a configurar esto" |
| 2 | Ve dashboard de estudiantes | "45 estudiantes, 12 habilitados, 5 en riesgo" | "Tengo overview rápido" |
| 3 | Entra a "Configurar Diplomatura" | Lista de cursos de la diplomatura | "Necesito definir prerrequisitos" |
| 4 | Selecciona "Examen Integrador" | Muestra cursos disponibles como prerrequisitos | |
| 5 | Marca "Intro a Python" y "Stats" como requeridos | Guarda configuración | "Listo, así queda" |
| 6 | Sistema valida reglas | Muestra cuántos estudiantes cumplen ahora | "12 cumplen, los demás necesitan cursos" |
| 7 | Ve estudiante con equivalencia | "María: Habilitada manualmente (equivalencia)" | "Bien, la approval quedó registrada" |

### Edge Cases

| Case | Scenario | Handling |
|------|----------|----------|
| **EC1** | Prerrequisito crea dependencia circular | Sistema advierte: "Error: dependencia circular detectada" |
| **EC2** | Cambio de reglas afecta estudiantes ya habilitados | Warning: "32 estudiantes perderían habilitación. ¿Continuar?" |
| **EC3** | Coordinador sin permisos de edición | Mensaje: "No tienes permisos. Contacta al admin" |

---

## Journey 3: Ana verifica integraciones

### Flow Principal (Admin/Sysadmin Path)

```ascii
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Login   │───▶│Integrac.│───▶│Verificar│───▶│Re-sync  │───▶│Logs     │
│ Admin   │    │Panel    │    │Status   │    │         │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Step-by-Step

| Step | Action | System Response | User Feeling |
|------|--------|-----------------|--------------|
| 1 | Ana accede a panel admin | Muestra menú de integraciones | "Voy a chequear el estado" |
| 2 | Ve dashboard de integraciones | "Moodle: ✅ OK, Guaraní: ⚠️ Error" | "Hay algo mal con Guaraní" |
| 3 | Click en Guaraní | Detalle: "Último sync: hace 2 horas, 0 estudiantes actualizados" | "Se cortó" |
| 4 | Revisa logs | Lista: "Error 401: Token expirado" | "Ah, el token venció" |
| 5 | Renueva token en .env | Admin nota: actualizar variables | (configura en UNC) |
| 6 | Click "Re-sincronizar" | Progreso: "Sincronizando... 45/120 estudiantes" | "Va caminando" |
| 7 | Sync completa | "Guaraní: ✅ OK, 120 estudiantes" | "Todo back to normal" |

### Edge Cases

| Case | Scenario | Handling |
|------|----------|----------|
| **EC1** | Moodle API no responde | Timeout 30s, retry automático 3 veces, luego error |
| **EC2** | Muchos estudiantes para sync | Batch processing, progress bar, no timeout |
| **EC3** | Credenciales incorrectas | Mensaje claro: "Error de autenticación. Verificar API_KEY en .env" |

---

## Journey 4: Estudiante con equivalencia manual

### Flow Alternativo

```ascii
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│Estudiante│───▶│Solicita │───▶│Coordinador│───▶│Habilitación│
│Sin cursos│    │Equivalencia│  │Evalúa    │    │Aprobada    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### Step-by-Step

| Step | Action | System Response | User Feeling |
|------|--------|-----------------|--------------|
| 1 | Lucía no tiene los cursos | Dashboard muestra "INHABILITADO" | "No me alcanzan los cursos" |
| 2 | Envía solicitud de equivalencia | Formulario: "Experiencia laboral en Python (5 años)" | "Espero que me lo aprueben" |
| 3 | Marcos recibe notificación | Lista de solicitudes pendientes | "Hay una nueva solicitud" |
| 4 | Revisa documentación | Archivo PDF adjunto con CV | "Tiene experiencia comprobable" |
| 5 | Aprueba equivalencia | Modal: "Aprobar con razón: 'Equivalencia por experiencia laboral'" | "Listo, queda registrado" |
| 6 | Lucía ve habilitación | Dashboard: "HABILITADO (Manual) - Equivalencia aprobada" | "¡Puedo dar el examen!" |

---

## Journey Maps Summary

| Journey | Actor | Pasos | Punto Crítico |
|---------|-------|-------|---------------|
| Completar diplomatura | Lucía (Estudiante) | 10 | Habilitación para examen |
| Configurar reglas | Marcos (Coordinador) | 7 | Definición de prerrequisitos |
| Verificar integraciones | Ana (Admin TI) | 7 | Detección de errores |
| Equivalencia manual | Lucía + Marcos | 6 | Aprobación con documentación |

---

## Notes

- **Flujos basados en:** 3 user personas (Lucía, Marcos, Ana)
- **Integraciones:** Moodle + Guaraní (asumiendo APIsdocumentadas)
- **MVP:** Solo happy paths + edge cases principales