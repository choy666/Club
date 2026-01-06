# 🔐 Auditoría de seguridad y monitoreo — Sprint 6

## Resumen ejecutivo

- **Credenciales y secretos**: el proyecto ya centraliza variables sensibles vía `src/lib/env.ts`, con validación Zod completa. Se agregó `.env.example` actualizado y documentación sobre `E2E_*` necesarios para las pruebas.
- **Hashing de contraseñas**: se utiliza `bcryptjs` con `saltRounds = 12` tanto en el seed como en `NextAuth`. No se detectaron contraseñas en texto plano persistidas.
- **Roles y permisos**: middleware (`src/proxy.ts`) y helpers (`requireAdminSession`, `requireMemberSession`) restringen el acceso a rutas protegidas. Implementada auditoría básica de acciones administrativas.
- **Monitoreo y logging**: integración con Sentry configurada para errores y métricas básicas. Logger estructurado implementado con niveles por entorno.

## 1. Credenciales y configuración

| Elemento                                                                  | Estado actual                                 | Riesgo                                | Acción recomendada                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `src/lib/env.ts` valida `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_ADMIN_*` | ✅ Validación con Zod y carga de `.env.local` | Bajo                                  | Mantener y extender a nuevas vars (p. ej. `SENTRY_DSN`, `E2E_*`).   |
| Seeds (`npm run seed:admin`) exigen `AUTH_ADMIN_EMAIL` + password/hash    | ✅ Garantiza ADMIN inicial                    | Medio si se deja password por defecto | Rotar credenciales tras uso y documentar procedimiento de rotación. |
| Variables `E2E_ADMIN_EMAIL/PASSWORD/BASE_URL`                             | ✅ Documentadas en `.env.example` y auditoría | Bajo                                  | Mantener actualizadas con cada cambio en credenciales de prueba.    |
| Integración Sentry configurada                                            | ✅ Captura de errores y métricas básicas      | Bajo                                  | Extender a alertas automáticas y dashboards personalizados.         |

## 2. Hashing y manejo de contraseñas

- `hashPassword` usa `bcryptjs` con _saltRounds_ = **12** y `verifyPassword` compara hashes (`src/lib/password.ts`).
- `NextAuth` (`src/auth.ts`) verifica mediante `verifyPassword` y nunca expone hashes.
- El endpoint `/api/admin/status` y el script `seed-admin` siempre hashean antes de persistir.

**Recomendaciones**

1. Mantener `saltRounds >= 12`; documentar cómo modificarlo si sube la carga.
2. Registrar en un runbook cómo rotar `NEXTAUTH_SECRET` y credenciales de ADMIN.

## 3. Roles y permisos

- Middleware (`src/proxy.ts`) limita `/admin` a `role === "ADMIN"` y `/socio` a `USER/ADMIN`.
- Helpers `requireSession`, `requireAdminSession`, `requireMemberSession` se usan en endpoints sensibles (`/api/reportes`, `/api/socios`, `/api/inscripciones`, etc.).
- `NextAuth` propaga el rol en el JWT y en la sesión.

**Brechas y mejoras**

1. **Auditoría de acciones**: ✅ Implementado logging básico de acciones administrativas. → Mejorar con detalles específicos y timestamps.
2. **Expiración de sesiones**: NextAuth usa estrategia JWT sin rotación explícita. → Configurar expiraciones/callbacks o migrar a sesiones base de datos para poder invalidar.
3. **Rate limiting**: endpoints como `/api/admin/status` y `/api/auth/signin` no tienen límites. → Implementar un middleware simple (p. ej. Upstash Ratelimit) o soluciones de plataforma (Vercel Edge).

## 4. Monitoreo, logging y alertas

| Aspecto                 | Situación                           | Riesgo                            | Acción                                           |
| ----------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------------ |
| Logging de servidor     | ✅ Logger estructurado implementado | Bajo: fácil investigar incidentes | Mantener niveles por entorno y redacción de PII. |
| Errores y métricas      | ✅ Sentry integrado y configurado   | Medio: captura básica             | Extender dashboards y alertas automáticas.       |
| Salud de jobs/processes | ✅ Health checks configurados       | Bajo                              | Monitorear ejecución de jobs mensuales.          |
| Alertas financieras     | ⚠️ Alertas básicas implementadas    | Bajo                              | Añadir monitoreo proactivo sobre KPI críticos.   |

## Checklist de acciones priorizadas

| #   | Área           | Acción                                                           | Responsable | ETA   | Estado        |
| --- | -------------- | ---------------------------------------------------------------- | ----------- | ----- | ------------- |
| 1   | Configuración  | ✅ `.env.example` actualizado con `E2E_*`, `SENTRY_DSN`          | Plataforma  | 06/01 | ✅ Completado |
| 2   | Logging        | ✅ Logger estructurado implementado con niveles por entorno      | Backend     | 10/01 | ✅ Completado |
| 3   | Observabilidad | ✅ Sentry integrado (frontend + API) con DSN configurable        | Backend     | 10/01 | ✅ Completado |
| 4   | Auditoría      | ✅ Logs de acciones admin implementados (creación socio/pago)    | Backend     | 15/01 | ✅ Completado |
| 5   | Seguridad      | ✅ Rotación de ADMIN + `NEXTAUTH_SECRET` documentada             | Plataforma  | 15/01 | ✅ Completado |
| 6   | Rate limiting  | Implementar rate limit en `/api/auth` y endpoints admin críticos | Backend     | 20/01 | ⏳ Pendiente  |

> Este documento debe revisarse en cada sprint de endurecimiento y actualizar el estado de las acciones priorizadas.
