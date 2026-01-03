# 🛠️ Guía de soporte y operación

Documento para el equipo de soporte/operaciones del Club. Resume flujos críticos, canales de escalamiento e instrucciones para ejecutar las pruebas E2E con Playwright.

---

## 1. Equipo y puntos de contacto

| Rol                     | Responsabilidad                                       | Contacto          |
| ----------------------- | ----------------------------------------------------- | ----------------- |
| Soporte de primer nivel | Recepción de tickets, guiar a administradores         | soporte@club.test |
| Operaciones (N2)        | Diagnóstico técnico, ejecución de scripts/migraciones | ops@club.test     |
| Ingeniería / Plataforma | Cambios en código, CI/CD, Vercel/Neon                 | devs@club.test    |
| On-call emergencia      | Incidentes productivos fuera de horario               | +54 11 5555-0000  |

**Escalamiento:**

1. Soporte documenta ticket (impacto, timestamps, usuario afectado, capturas/logs).
2. Si hay bloqueo operativo (>15 min) elevar a Operaciones.
3. Incidentes críticos (caída total, pagos fallando, corrupción de datos) → contactar On-call inmediatamente + abrir incidente en el canal `#ops-incidentes`.

---

## 2. Flujos críticos

### 2.1 Alta de socio + inscripción

1. **Crear socio**: ingresar a `/admin` → botón “+ Nuevo socio” → completar formulario (datos personales, notas internas). Verificar mensaje de éxito.
2. **Confirmar estado**: la tabla debe mostrar al socio en `PENDING`.
3. **Crear inscripción**: ir a `/admin/inscripciones` → “+ Nueva inscripción”. Seleccionar socio recién creado, plan, monto y meses. Guardar.
4. **Generación de cuotas**: validar en la tabla de cuotas que existan `PENDING` con importe correcto. Si no aparecen, refrescar React Query (botón “Actualizar”) o revisar logs (`/api/inscripciones`).
5. **Checklist**: anotar ID de socio y enrollment en el ticket para trazabilidad.

### 2.2 Registro de pagos y conciliación

1. Abrir `/admin/inscripciones` → seleccionar inscripción → pestaña “Cuotas”.
2. Filtrar por “Pendientes” y ubicar la cuota correspondiente.
3. Presionar “Pago manual”, ingresar importe, método, referencia y fecha (`paidAt`). Confirmar.
4. El sistema ejecuta `recordPayment`, marca la cuota como `PAID` y recalcula el estado financiero.
5. Validar en la tarjeta del socio (panel `/admin`) que el estado cambie a `ACTIVE` o `PENDING` según corresponda.
6. Registrar en el ticket: ID de cuota, método y referencia para auditoría.

> Si el pago impacta pero la UI no refleja el cambio, forzar invalidación con el botón “Actualizar” y revisar `/api/pagos` en los logs (Next.js). Incidentar si persiste.

### 2.3 Reportes y KPIs

1. Ingresar a `/admin/reportes` (requiere rol ADMIN).
2. Ajustar filtros: fecha desde/hasta (ISO), granularidad y plan opcional.
3. Presionar “Aplicar filtros” y verificar que el gráfico cargue sin errores.
4. KPIs a revisar tras incidencias financieras:
   - **Ingresos cobrados**: debe reflejar pagos recientes.
   - **Crecimiento neto**: comparar con ticket para detectar anomalías en altas/bajas.
   - **Salud de cartera**: radial chart debe mostrar porcentaje coherente de Pagadas/Pendientes/Morosidad.
5. Exportar captura o valores numéricos y adjuntar al ticket.

---

## 3. Ejecución y monitoreo de pruebas E2E (Playwright)

### 3.1 Prerrequisitos

- Node 20+, dependencias instaladas (`npm install`).
- Variables de entorno:
  - `E2E_BASE_URL` (ej: `http://127.0.0.1:3000` o URL de preview).
  - `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (credenciales ADMIN válidas).
- Servidor dev/preview corriendo (`npm run dev`) o entorno remoto accesible.

### 3.2 Comandos

1. **Global setup + suite completa**

   ```bash
   E2E_BASE_URL=... \
   E2E_ADMIN_EMAIL=... \
   E2E_ADMIN_PASSWORD=... \
   npm run test:e2e
   ```

   - El script ejecuta `playwright.config.ts` con `globalSetup` (`e2e/support/global-setup.ts`) que inicia sesión y guarda estado en `e2e/.auth/admin.json`.

2. **Ver reporter HTML**
   - Tras la corrida se genera `playwright-report/index.html`. Abrirlo con `npx playwright show-report` para inspeccionar pasos, capturas y trazas.
3. **Logs y trazas**
   - Artefactos en `e2e/.playwright/` (ignorados en git). Copiarlos al ticket si se necesita analizar fallas.

### 3.3 Interpretación

- El spec `e2e/critical-flow.spec.ts` cubre: creación de socio ⇒ inscripción ⇒ pago manual ⇒ validación de KPI “Ingresos cobrados”.
- Si falla el login en `global-setup`, revisar que el usuario ADMIN exista (`npm run seed:admin`) y que las variables `E2E_*` estén definidas.
- Cualquier rojo en Playwright bloquea el deploy (ver Playbook). Documentar causa raíz antes de reintentar.

---

## 4. Monitoreo continuo

- **KPIs financieros**: revisar panel de reportes a diario y tras cada deploy.
- **Alertas técnicas**: integrar Sentry/otro APM (ver `docs/auditoria-seguridad.md`). Mientras tanto, monitorear logs de Vercel.
- **Health checks**: confirmar que `/` y `/auth/signin` respondan 200 después de tareas de mantenimiento.

---

## 5. Registro de incidentes

1. Crear ticket en la herramienta interna con:
   - Fecha/hora, descripción, pasos para reproducir.
   - IDs involucrados (socio, inscripción, cuota, pago).
   - Capturas del panel y, si aplica, reporte E2E adjunto.
2. Etiquetar la severidad:
   - **S1**: indisponibilidad o pagos bloqueados.
   - **S2**: datos inconsistentes que impiden tareas administrativas.
   - **S3**: errores cosméticos o solicitudes de mejora.
3. Actualizar el ticket tras cada acción (p. ej. reintentar pago, ejecutar migración, rollback).
4. Cerrar solo cuando el usuario confirme que el flujo volvió a la normalidad y se hayan corrido las pruebas E2E pertinentes.

---

Mantener esta guía junto al _Playbook de despliegue_ y la _Auditoría de seguridad_ para tener trazabilidad completa del sprint de endurecimiento.
