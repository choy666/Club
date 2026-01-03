# 🔐 Auditoría de seguridad y monitoreo — Sprint 6

## Resumen ejecutivo

- **Credenciales y secretos**: el proyecto ya centraliza variables sensibles vía `src/lib/env.ts`, pero falta un `.env.example` actualizado y documentación sobre `E2E_*` necesarios para las pruebas.
- **Hashing de contraseñas**: se utiliza `bcryptjs` con `saltRounds = 12` tanto en el seed como en `NextAuth`. No se detectaron contraseñas en texto plano persistidas.
- **Roles y permisos**: middleware (`src/proxy.ts`) y helpers (`requireAdminSession`, `requireMemberSession`) restringen el acceso a rutas protegidas. Falta auditoría de acciones administrativas y límites de sesión.
- **Monitoreo y logging**: hoy no existe captura centralizada (solo `console`). Se recomienda agregar un logger estructurado, métricas básicas y alertas (p. ej. Sentry + Healthchecks).

## 1. Credenciales y configuración

| Elemento                                                                  | Estado actual                                 | Riesgo                                | Acción recomendada                                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/lib/env.ts` valida `DATABASE_URL`, `NEXTAUTH_SECRET`, `AUTH_ADMIN_*` | ✅ Validación con Zod y carga de `.env.local` | Bajo                                  | Mantener y extender a nuevas vars (p. ej. `SENTRY_DSN`, `E2E_*`).                    |
| Seeds (`npm run seed:admin`) exigen `AUTH_ADMIN_EMAIL` + password/hash    | ✅ Garantiza ADMIN inicial                    | Medio si se deja password por defecto | Rotar credenciales tras uso y documentar procedimiento de rotación.                  |
| Variables `E2E_ADMIN_EMAIL/PASSWORD/BASE_URL`                             | ⚠️ Solo mencionadas en el README/Playwright   | Medio                                 | Documentar en `.env.example` y en esta auditoría para no exponerlas accidentalmente. |

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

1. **Auditoría de acciones**: no existen logs de quién crea socios, inscripciones o pagos. → Agregar hook que loguee `action`, `userId`, `payload` (sanitizado).
2. **Expiración de sesiones**: NextAuth usa estrategia JWT sin rotación explícita. → Configurar expiraciones/callbacks o migrar a sesiones base de datos para poder invalidar.
3. **Rate limiting**: endpoints como `/api/admin/status` y `/api/auth/signin` no tienen límites. → Implementar un middleware simple (p. ej. Upstash Ratelimit) o soluciones de plataforma (Vercel Edge).

## 4. Monitoreo, logging y alertas

| Aspecto                 | Situación                      | Riesgo                               | Acción                                                                                    |
| ----------------------- | ------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Logging de servidor     | Solo `console` disperso        | Medio: difícil investigar incidentes | Introducir logger estructurado (Pino/Winston) con nivel por entorno y redactación de PII. |
| Errores y métricas      | No hay captura centralizada    | Alto: errores silenciosos            | Integrar Sentry u otra APM (Next.js plugin) y habilitar source maps.                      |
| Salud de jobs/processes | Sin health checks documentados | Medio                                | Configurar ruta `/api/health` + monitor (Healthchecks.io, Vercel Checks).                 |
| Alertas financieras     | No hay alertas cuando KPI cae  | Bajo                                 | Añadir monitoreo sobre KPI críticos en Neon o dashboards externos.                        |

## Checklist de acciones priorizadas

| #   | Área           | Acción                                                           | Responsable | ETA   | Estado       |
| --- | -------------- | ---------------------------------------------------------------- | ----------- | ----- | ------------ |
| 1   | Configuración  | Publicar `.env.example` con `E2E_*`, `SENTRY_DSN`, etc.          | Plataforma  | 06/01 | ⏳ Pendiente |
| 2   | Logging        | Integrar logger estructurado + transporte a consola/Logflare     | Backend     | 10/01 | ⏳ Pendiente |
| 3   | Observabilidad | Añadir Sentry (frontend + API) con DSN configurable              | Backend     | 10/01 | ⏳ Pendiente |
| 4   | Auditoría      | Persistir logs de acciones admin (creación socio/pago)           | Backend     | 15/01 | ⏳ Pendiente |
| 5   | Seguridad      | Documentar/automatizar rotación de ADMIN + `NEXTAUTH_SECRET`     | Plataforma  | 15/01 | ⏳ Pendiente |
| 6   | Rate limiting  | Implementar rate limit en `/api/auth` y endpoints admin críticos | Backend     | 20/01 | ⏳ Pendiente |

> Este documento debe revisarse en cada sprint de endurecimiento y actualizar el estado de las acciones priorizadas.
