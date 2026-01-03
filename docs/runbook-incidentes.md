# 📟 Runbook de incidentes y observabilidad

Guía operativa para detectar, escalar y resolver incidentes en ClubApp.

## 1. Fuentes de verdad

| Sistema            | Ubicación                              | Uso                                                 |
| ------------------ | -------------------------------------- | --------------------------------------------------- |
| Logs estructurados | Vercel / consola (`LOG_LEVEL`)         | Errores de API, warnings de validación.             |
| Health check       | `GET /api/health`                      | Verifica conexión a Neon. Devuelve `ok`/`degraded`. |
| Metricado          | `/admin/reportes` + KPIs cacheados     | Validar ingresos, churn, salud de cartera.          |
| Sentry             | Proyecto `club-app` (DSN configurable) | Captura errores server/client con stacktrace.       |

## 2. Proceso ante un incidente

1. **Detección**: alerta (Sentry) o reporte operativo.
2. **Clasificación**:
   - S1: caída total, pagos imposibles, health check 503.
   - S2: feature crítica degradada (inscripciones/pagos manuales fallan parcialmente).
   - S3: bugs menores o visuales sin impacto financiero.
3. **Respuesta**:
   - Verificar `/api/health`.
   - Revisar logs recientes (`LOG_LEVEL=debug` en staging, `info`/`warn` en prod).
   - Consultar Sentry (buscar por release y tag `environment`).
4. **Acciones**:
   - Si es base de datos: revisar Neon dashboard / snapshot.
   - Si es autenticación: verificar rate limiting, revisar `/api/admin/status` y `/api/auth` en logs.
   - Si es pagos: ejecutar pruebas E2E (`npm run test:e2e`) tras corregir.
5. **Comunicación**: actualizar ticket con hora, hipótesis y ETA. On-call decide si activar rollback según playbook.
6. **Cierre**: adjuntar links (Sentry issue, commit, despliegue). Registrar learnings en retro.

## 3. Observabilidad y rate limits

- **Sentry**: definir `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`. Sampleo 20% en producción, 100% en dev.
- **Rate limiting**:
  - `/api/admin/status`: 20 req/min por IP.
  - `/api/auth` (NextAuth credentials): 10 req/min por IP.
  - Al superar, respuesta 429 con `Retry-After`.

## 4. Runbooks específicos

| Escenario                 | Pasos                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Health check `degraded`   | Revisar Neon, ejecutar `npm run db:migrate` si quedó a medias, verificar variables `DATABASE_URL`.                                 |
| Pico de intentos de login | Confirmar ataque/brute force → subir `AUTH_RATE_LIMIT` solo temporalmente, monitorear Sentry (`auth-rate-limit`).                  |
| Reportes inconsistentes   | Limpiar cache (`clearReportCache()` en shell temporal), revisar seeds y datos con `drizzle` console, correr pruebas contractuales. |
| Playwright rojo           | Chequear credenciales `E2E_*`, ejecutar `npm run test:e2e -- --debug` para reproducir y subir artefactos.                          |

## 5. Checklist post-incidente

- [ ] Incidente etiquetado con severidad y timestamps.
- [ ] Health check confirmado en verde.
- [ ] KPIs principales revisados (`Ingresos cobrados`, `Salud de cartera`).
- [ ] Logs/Sentry sin errores repetitivos por 30 min.
- [ ] Documentación actualizada si hubo cambios estructurales.
