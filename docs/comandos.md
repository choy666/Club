# 📦 Comandos clave del proyecto `club-app`

Listado rápido de scripts y utilidades más usados. Ejecutar siempre desde la raíz del repo (`club-app/`).

## 👩‍💻 Desarrollo diario

| Comando                                          | Descripción                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `npm run dev`                                    | Levanta Next.js en modo desarrollo (App Router + React Query providers).                            |
| `npm run lint`                                   | Ejecuta ESLint 9 con la configuración del proyecto.                                                 |
| `npm run format`                                 | Verifica formato con Prettier 3 (no corrige).                                                       |
| `npm run lint:types`                             | Corre `tsc --noEmit` para validar tipos sin construir.                                              |
| `npm run test`                                   | Ejecuta Vitest (unit & contract tests).                                                             |
| `npm run test -- --run`                          | Ejecuta todos los tests una sola vez sin modo watch.                                                |
| `npm run test -- --watch`                        | Ejecuta Vitest en modo watch para pruebas interactivas.                                             |
| `npm run test -- --coverage`                     | Genera reporte de cobertura de código.                                                              |
| `npx tsx scripts/check-enrollment-duplicates.ts` | Verifica que no existan inscripciones duplicadas por socio antes de configurar el constraint único. |

## 🚀 Build y despliegue

| Comando         | Descripción                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `npm run build` | Genera build de producción con Next.js 16 (usa Turbopack).              |
| `npm run start` | Sirve la build previa (`npm run build`). Ideal para QA antes de deploy. |

## 🔭 Observabilidad y mantenimiento

| Comando                               | Descripción                                                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`                         | Instala/actualiza dependencias locales (ejecutar tras `git pull`, especialmente cuando se agregan librerías como `@sentry/nextjs`).                                                          |
| `npx @sentry/wizard@latest -i nextjs` | Ejecuta el asistente oficial de Sentry para Next.js. Configura subida de source maps en deploy y valida que las claves `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` estén presentes sin hardcodeos. |
| `npm run test:e2e`                    | Corre Playwright con el flujo crítico (login admin + reportes). Ideal para validar antes/después de un incidente.                                                                            |

## 🕒 Jobs operativos

| Comando                                 | Descripción                                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run jobs:generate-dues [operador]` | Ejecuta el job mensual que genera la próxima cuota de cada socio activo. El parámetro `operador` es opcional y se registra en `monthly_run_log` para auditoría. |
| `npm run reset:enrollments`             | Limpia todas las inscripciones/cuotas/pagos y devuelve a los socios a estado `PENDING`. Úsalo sólo en QA/DEV antes de recrear el padrón.                        |
| `npm run cleanup:dues`                  | Elimina cuotas huérfanas y inconsistentes. Script de mantenimiento para mantener integridad de datos.                                                           |
| `npm run fix:member-ids`                | Corrige inconsistencias entre member_id de cuotas e inscripciones.                                                                                              |
| `npm run diagnose:dues`                 | Diagnóstico completo de errores en cuotas. Genera reporte detallado de problemas encontrados.                                                                   |

## 🗄️ Base de datos y migraciones

> Requiere `DATABASE_URL` configurada (`.env.local`).

| Comando                              | Descripción                                                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:generate`                | Crea migraciones Drizzle a partir de los cambios en `src/db/schema.ts`.                                                                |
| `npm run db:migrate`                 | Aplica migraciones pendientes en el entorno actual.                                                                                    |
| `npm run db:push`                    | Sincroniza el schema actual directamente (modo "push"). Úsalo sólo en dev/local.                                                       |
| `npm run db:push` + constraint único | Después de verificar duplicados, asegura que la tabla `enrollments` queda protegida por lógica y constraint `UNIQUE(member_id)` en DB. |

## 🔐 Seeds y utilidades

| Comando                     | Descripción                                                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run seed:admin`        | Ejecuta `scripts/seed-admin.ts` para crear/actualizar el usuario ADMIN definido en variables de entorno.               |
| `npm run reset:enrollments` | Ejecuta `scripts/delete-all-enrollments.ts` (sin transacciones). Útil para reiniciar el entorno antes de correr seeds. |

## ✅ Buenas prácticas

1. **Antes de comitear**: `npm run lint && npm run lint:types && npm run test`.
2. **Previo a desplegar**: `npm run build` para asegurar que Next.js y TypeScript compilan sin errores.
3. **Migraciones**: generar (`db:generate`), revisar el SQL y recién ahí migrar (`db:migrate`).
4. **Secrets**: nunca hardcodear credenciales; usar `.env.local` y revisar que `.env.example` esté actualizado.
