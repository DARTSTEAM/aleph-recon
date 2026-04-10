# 🗺️ Aleph Recon — Feature Roadmap

> Features identificadas para reducir la intervención humana y ampliar el alcance de la plataforma.
> Basado en el proceso as-is documentado en la reunión del 31/03/2026.

---

## Estado actual (v1 — Demo)

Lo que ya está implementado en la versión inicial:

- ✅ Reconciliación automática (IMS Billing File vs Salesforce Export) por `IO Header / PPO ID`
- ✅ Detección de diferencias con categorización (`Budget`, `Tax`, `Commission`, `Delivery`)
- ✅ Umbral de tolerancia inteligente (diferencias ≤ ARS 1 se ignoran como ruido de redondeo)
- ✅ Agregación multi-fila: un mismo IO puede tener múltiples líneas en el Billing File (Promoted Ads + Takeover)
- ✅ Envío de emails individuales y en lote a managers comerciales
- ✅ Tracking de estado en tiempo real: `Error → Fixing → Matched` (Firestore)
- ✅ Filtros por status + ordenamiento por columna
- ✅ Export CSV del resultado de reconciliación
- ✅ i18n ES/EN

---

## 🤖 Nivel 1 — Automatización de ingesta de datos

> Objetivo: eliminar los uploads manuales de archivos.

| Feature | Descripción | Impacto | Complejidad |
|---|---|---|---|
| **Salesforce API Integration** | Conectar directamente a la SF REST API para pull automático del reporte mensual. Elimina el export manual. | 🔴 Alto | 🟡 Media |
| **Email parsing del Billing File** | Aleph recibe el IMS Billing File por email cada mes. Un parser de adjuntos (Gmail API / Mailgun) detectaría el .xlsx automáticamente y lo cargaría solo. | 🔴 Alto | 🟡 Media |
| **Google Drive / SharePoint sync** | Si el equipo trabaja el Reconc file en Google Drive, conectar directo al folder para detectar actualizaciones sin intervención. | 🟡 Medio | 🟢 Baja |
| **Twitter/X Ads API** | La Twitter Ads API expone datos de spend por IO. Podría complementar el Billing File oficial para validación cruzada. | 🟡 Medio | 🔴 Alta |
| **Reconciliación programada** | Cron job mensual que corre la reconciliación automáticamente el día X del mes (ej: el 5, cuando suele llegar el Billing File de IMS). | 🔴 Alto | 🟢 Baja |

---

## 📬 Nivel 2 — Automatización del workflow de notificaciones

> Objetivo: eliminar los clics manuales de follow-up.

| Feature | Descripción | Impacto | Complejidad |
|---|---|---|---|
| **Auto-notify al detectar errores** | Al cargar nuevos archivos y detectar diferencias, enviar emails de follow-up automáticamente. Toggle configurable por equipo/región. | 🔴 Alto | 🟢 Baja |
| **Escalation automática (7 días)** | Si un error no pasa a "Fixing" en 7 días, escalar al director regional. *(Toggle ya existe en la UI, falta el cron job backend.)* | 🔴 Alto | 🟡 Media |
| **Reminder automático (3 días)** | Re-notificar al manager cada 3 días mientras el status sea "Error". *(Toggle ya existe en la UI, falta el backend.)* | 🟡 Medio | 🟡 Media |
| **Weekly summary por región** | Email automático los lunes con el resumen de errores abiertos, dirigido al jefe regional correspondiente. | 🟡 Medio | 🟡 Media |
| **Confirmación de resolución** | Cuando el run siguiente muestra que el IO quedó Matched, notificar automáticamente al manager que el issue está cerrado. | 🟢 Bajo | 🟢 Baja |

---

## 💬 Nivel 3 — Colaboración y trazabilidad interna

> Objetivo: reemplazar el ida-y-vuelta por email con colaboración dentro de la plataforma.

| Feature | Descripción | Impacto | Complejidad |
|---|---|---|---|
| **Comentarios por IO** | Campo de texto libre por IO donde el manager puede dejar una nota ("esto se corrige el próximo mes — cambio de presupuesto"). Histórico visible para todo el equipo. | 🔴 Alto | 🟢 Baja |
| **Audit log por IO** | Log cronológico por IO: cuándo se detectó, quién mandó el follow-up, cuándo respondió, cuándo se resolvió. | 🔴 Alto | 🟡 Media |
| **Reply automático desde email** | El manager responde el email de follow-up y ese reply se captura y aparece como comentario en la plataforma (via Gmail webhook / Mailgun inbound). | 🟡 Medio | 🔴 Alta |
| **Directorio de managers** | Base de datos de managers con nombre, email real y región. Elimina la heurística `nombre.apellido@alephholding.com`. | 🔴 Alto | 🟢 Baja |

---

## 🌐 Nivel 4 — Escala y multi-mercado

> Objetivo: soportar los 90 países y múltiples plataformas.

| Feature | Descripción | Impacto | Complejidad |
|---|---|---|---|
| **Multi-plataforma (Meta, TikTok, Snapchat)** | Soporte para Billing Files de otras plataformas. Cada una tiene su propio formato de columnas. Meta debería ser la siguiente. | 🔴 Alto | 🔴 Alta |
| **Multi-región en un run** | Cargar archivos de LATAM + ME + África + APAC juntos y reconciliar todo en una sola corrida, con filtros por región en la tabla. | 🔴 Alto | 🟡 Media |
| **Consolidación automática por región** | Hoy una persona consolida manualmente archivos de 90 países. El sistema podría hacerlo dado un naming convention estandarizado. | 🟡 Medio | 🔴 Alta |
| **Tipo de cambio automático (FX)** | Integrar API de FX (Open Exchange Rates, Fixer.io) para convertir todas las diferencias a USD de forma automática. | 🟡 Medio | 🟢 Baja |
| **Roles y acceso por región** | Vista por gerente regional que muestre solo sus cuentas y errores. Acceso limitado: no ve otras regiones. | 🟡 Medio | 🟡 Media |

---

## 🎯 Priorización sugerida

```
Sprint 1 — Producción lista para Aleph
  → Directorio de managers (emails reales, no heurística)
  → Comentarios por IO (reemplaza el reply por email)
  → Audit log básico por IO

Sprint 2 — Reducir carga humana
  → Email parsing del IMS Billing File (auto-upload del adjunto mensual)
  → Auto-notify al cargar archivos (sin botón manual de Follow-up)
  → Escalation + reminder automáticos (cron job en Cloud Run)

Sprint 3 — Escalar
  → Salesforce API integration (elimina el export manual)
  → Multi-plataforma: Meta Billing File
  → Multi-región: LATAM + ME + APAC en un run
```

---

## 📝 Notas adicionales

- **Modificar Salesforce desde la plataforma:** fuera del alcance. Las correcciones las hacen los managers directamente en SF. La plataforma notifica, rastrea y confirma — no edita.
- **Carga humana residual mínima:** aún con Nivel 1 completo, siempre habrá validación humana de los errores reales. El objetivo es que esa validación tome minutos, no horas.
- **El Billing File tiene prioridad absoluta** sobre el Delivery Report de SF. Este principio debe mantenerse en cualquier integración futura.
