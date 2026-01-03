---
# 📌 Club App – Sistema de Gestión de Socios

Sistema integral para administrar socios, inscripciones, cuotas y pagos del Club. Permite operar desde un panel administrativo y una vista individual para cada socio, manteniendo trazabilidad financiera en tiempo real.
---

## 1. Panorama general

- Altas/ediciones de socios con formularios reutilizables.
- Inscripciones y generación automática de cuotas según configuraciones económicas.
- Registro de pagos (manuales o automáticos) con recalculo inmediato del estado del socio (`ACTIVE`, `PENDING`, `INACTIVE`).
- Reportes financieros y roadmap hacia métricas avanzadas.
- Identidad visual consistente + página showcase pública para stakeholders.

---

## 2. Stack oficial (ya implementado)

| Capa / dominio           | Herramientas principales                                                            | Notas relevantes                                                                |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Frontend                 | Next.js **16.1** (App Router), React 19, TypeScript 5, Tailwind 4, Framer Motion 12 | Componentes “glass”, animaciones ligeras, formularios con React Hook Form 7.69. |
| Estado de cliente        | Zustand 5 (auth/UI), React Query 5.90 (datos del servidor)                          | Nunca se cachea en Zustand información proveniente de APIs.                     |
| Backend / API            | Next.js API Routes, NextAuth 5 beta, Drizzle ORM 0.45                               | Backend convive en el mismo repo (menos latencia, misma base de código).        |
| Base de datos / Infra    | Neon (PostgreSQL serverless), Drizzle Kit, migraciones versionadas                  | Seeds QA y scripts `drizzle/000x_*.sql`.                                        |
| Tooling / Dev Experience | ESLint 9, Prettier 3, Vitest 4, Husky + lint-staged, tsx, scripts npm documentados  | Ver `docs/comandos.md` para la lista completa de scripts y buenas prácticas.    |

---

## 3. Arquitectura lógica

```
src/
├── app/
│   ├── (auth)           → flujo NextAuth
│   ├── admin/           → panel administrativo
│   ├── socio/           → vista del socio
│   ├── showcase/        → página pública
│   └── api/             → rutas REST (socios, inscripciones, cuotas, pagos, status, auth)
├── db/                  → esquema y cliente Drizzle
├── lib/                 → servicios de dominio, validaciones, helpers
├── hooks/               → React Query y lógica compartida
├── store/               → Zustand (auth, filtros, UI)
├── components/          → UI reutilizable (glass, tablas, formularios)
└── providers/           → AppProviders (Session + React Query + Zustand sync)
```

---

## 4. Autenticación, roles y formularios

- Roles definidos: `ADMIN` (panel `/admin`) y `USER` (panel `/socio`).
- Middleware y helpers (`requireAdminSession`, `requireUserSession`) protegen rutas y APIs.
- Bootstrap del primer admin: formulario especial en `/auth/signin` crea al único `ADMIN` inicial (hash bcrypt). Sigue disponible `npm run seed:admin`.
- Formularios administrados con **React Hook Form + Zod**, maximizando reutilización (e.g. formulario único crear/editar socio, modales de inscripción y pagos manuales).

---

## 5. Estado del cliente y principios de datos

| Herramienta | Responsabilidad                                                                | Reglas clave                                                    |
| ----------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Zustand     | Estado efímero de UI (modales, filtros, flags), info básica de sesión          | Sin datos persistentes de negocio.                              |
| React Query | Cache de datos de socios, inscripciones, cuotas, pagos y snapshots financieros | Invalidate centralizada (`DUES_KEY`, snapshots de socio, etc.). |

Todos los formularios y vistas consultan a React Query y disparan invalidaciones tras cada mutación (pagos, creación de inscripciones, etc.).

---

## 6. Modelo de datos y reglas financieras

Entidades principales (todas versionadas en Drizzle + migraciones):

- `users`, `members` (perfiles y estado general).
- `economic_configs` (valores default, tolerancias, moneda).
- `enrollments`, `dues` (inscripciones y cuotas generadas automáticamente).
- `payments` (auditoría de pagos, método, referencia y notas).
- `monthly_run_log` (auditoría del job que genera cuotas mensuales).

Reglas destacadas:

1. Cuotas `PENDING` con `dueDate` < `hoy - gracePeriodDays` pasan a `OVERDUE`.
2. `refreshMemberFinancialStatus` determina el estado del socio en función de cuotas `OVERDUE` y `PENDING`.
3. `recordPayment` marca la cuota, inserta fila en `payments` y refresca el snapshot antes de responder.
4. Endpoints `/api/socios/{memberId}/status` y `/api/socios/me/status` recalculan siempre antes de responder.
5. Constraint `enrollments_member_id_idx` garantiza una inscripción por socio y está documentado junto con el script de verificación previa de duplicados.
6. El job `npm run jobs:generate-dues [operador]` genera la próxima cuota de cada socio activo y deja trazabilidad en `monthly_run_log` (cantidad creada, operador y notas).

---

## 7. Buenas prácticas (seguridad, escalabilidad, calidad)

- Hash de contraseñas (`bcryptjs`) y roles verificados siempre en backend.
- Todas las credenciales en `.env` validadas vía `src/lib/env.ts` (Zod). Sin hardcode de secrets (ver `docs/comandos.md` + `.env.example`).
- ESLint 9 + Prettier 3 obligatorios (`npm run lint && npm run lint:types && npm run test` antes de cualquier commit).
- React Query + Suspense listos para escalar a Server Actions y métricas agregadas.
- Tests contractuales con Vitest cubren `/api/inscripciones`, `/api/cuotas`, `/api/pagos`, `/api/socios/[memberId]/status` y helpers (`src/lib/enrollments/schedule.test.ts`).
- Playwright se ejecuta localmente con `npm run test:e2e` y en CI mediante `.github/workflows/e2e.yml`, que sube trazas y screenshots como artefactos para debugging rápido.

---

## 8. Roadmap por sprints

| Sprint                     | Objetivo                                                             | Entregables claves                                                                     | Estado         |
| -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- |
| 0. Preparación             | Repositorio, toolchain, variables de entorno                         | Next.js + Tailwind inicial, ESLint/Prettier/Husky, `.env.example`, `drizzle.config.ts` | ✅             |
| 1. Infraestructura         | Neon + Drizzle + NextAuth                                            | Schema base, seed admin, middleware de roles, stores iniciales                         | ✅             |
| 2. CRUD de Socios          | API `/api/socios`, panel `/admin`, vista `/socio`                    | Formularios RHF, tablas, hooks React Query, identidad visual aplicada                  | ✅             |
| 3. Inscripciones y cuotas  | Modelado económico, generación automática, UI `/admin/inscripciones` | Servicios `createEnrollment`, `payDue`, seeds QA, tests contractuales                  | ✅             |
| 4. Pagos y estados         | Conciliación, snapshots financieros, alertas                         | Entidad `payments`, hooks `useRecordPayment`, modal de pago manual, docs de errores    | ✅ (DoD abajo) |
| 5. Reportes y métricas     | Endpoint `/api/reportes`, visualizaciones, cache                     | 🔜 (depende de consolidar sprint 4 en producción)                                      |
| 6. Endurecimiento / Deploy | QA completo, e2e, monitoreo, playbook Vercel                         | 🔜                                                                                     |

### Trabajo pendiente para que AppClub quede completo

1. **Sprint 5 – Reportes y métricas**
   - Implementar `/api/reportes` con queries agregadas (finanzas + crecimiento).
   - Diseñar vista de gráficos y KPIs en `/admin`, con animaciones y temática glass.
   - Preparar hooks React Query cacheados e invalidaciones específicas.
2. **Sprint 6 – Endurecimiento y despliegue**
   - Ejecutar pruebas e2e (Playwright/Cypress) de punta a punta y asegurar CI verde.
   - Auditoría de seguridad (hash de contraseñas, roles, variables de entorno) y monitoreo básico.
   - Playbook de despliegue Vercel + estrategia de migraciones Drizzle/Neon.
   - Documentación final para soporte/operaciones y checklist de retroalimentación.

Completar estos dos sprints deja la aplicación lista para uso productivo con reportes ejecutivos y procesos de QA/despliegue formalizados.

---

## 9. Estado resumido por sprint

- **Sprint 0 – Preparación:** proyecto Next.js 16 + Tailwind 4, toolchain completa, `.env` documentado y validaciones Zod.
- **Sprint 1 – Infraestructura:** conexiones Neon/Drizzle, NextAuth v5, seed admin, middleware de roles, stores + AppProviders listos.
- **Sprint 2 – CRUD de Socios:** APIs protegidas, hooks `use-members`, tablas y formularios RHF, vista `/socio`, identidad visual aplicada.
- **Sprint 3 – Inscripciones / cuotas:** tablas y servicios económicos, UI `/admin/inscripciones`, seeds QA, tabla de contratos y pruebas contractuales (`src/app/api/*/route.test.ts`).
- **Sprint 4 – Pagos / estados:** ver backlog y checklist completos más abajo (implementado y documentado).

Cada sprint se valida con migraciones en Neon y seeds específicos para QA (`drizzle/0003_qas_seed.sql`).

---

## 10. Sprint 4 – Pagos y estados (backlog + DoD)

### Backlog corto

1. Registrar y conciliar pagos con la tabla `payments`.
2. Alertas visuales coordinadas en `/admin` y `/socio` (componentes `MemberFinancialAlert`, `MemberProfileCard`).
3. Servicio que recalcula estados tras cada pago (`refreshMemberFinancialStatus`) y respeta `gracePeriodDays`.
4. Documentación + pruebas contractuales (`/api/pagos`, `/api/socios/{id}/status`).

Dependencias: QA del Sprint 3 completo + migraciones sincronizadas en Neon.

### Reglas de transición financiera

| Contexto                               | Acción                                                                    | Resultado                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Cuotas `PENDING` vencidas + tolerancia | Reetiquetar a `OVERDUE` antes de recalcular                               | Morosidad real con margen configurable                                                 |
| `refreshMemberFinancialStatus`         | Cuenta `OVERDUE`/`PENDING` y define estado final                          | `INACTIVE` si `OVERDUE > 0`; `PENDING` si sólo hay deuda pendiente; `ACTIVE` sin deuda |
| Registro de pago                       | `recordPayment` actualiza cuota, inserta en `payments`, refresca snapshot | Cambio inmediato luego de `POST /api/pagos`                                            |
| Endpoints de snapshot                  | `/api/socios/{memberId}/status` (admin) y `/api/socios/me/status` (socio) | Siempre devuelven el estado recalculado                                                |
| UI                                     | Alertas y cards usan la misma paleta rojo/ámbar/verde                     | Coherencia en `/admin` y `/socio`                                                      |

### Checklist DoD (cumplido)

- [x] Migración `payments` enlazada con `members` + `dues`.
- [x] Servicios `recordPayment`, `refreshMemberFinancialStatus`, `getMemberFinancialSnapshot`.
- [x] Endpoints `POST /api/pagos`, `GET /api/socios/{memberId}/status`, `GET /api/socios/me/status`.
- [x] Hooks `useRecordPayment`, `useMemberFinancialSnapshot`, invalidaciones (`DUES_KEY`, snapshot).
- [x] Modal de pago manual en `DueTable` (método, referencia, notas, fecha).
- [x] Alertas visuales en admin/socio.
- [x] Documentación de errores específicos de `/api/pagos`.
- [x] Pruebas contractuales de pagos y snapshots.

### Errores esperados `/api/pagos`

| Escenario                     | Código | Respuesta                                                   |
| ----------------------------- | ------ | ----------------------------------------------------------- |
| Payload inválido (UUID/monto) | 422    | `{"error":"ValidationError","details":[...]}`               |
| Cuota inexistente             | 404    | `{"error":"Cuota no encontrada.","status":404}`             |
| Cuota ya pagada               | 409    | `{"error":"Cuota ya registrada como pagada.","status":409}` |
| Sin sesión ADMIN              | 401    | `{"error":"Unauthorized"}`                                  |

### Flujo resumido de pagos y conciliación

1. Admin abre modal “Pago manual” desde `DueTable`.
2. Completa importe/método/referencia/notas/`paidAt`.
3. `useRecordPayment` ejecuta `POST /api/pagos`.
4. `recordPayment` marca cuota, inserta `payment`, recalcula estado.
5. React Query invalida `DUES_KEY` y snapshots del socio.
6. UI refresca alertas y el modal informa éxito (o error contextual).

---

## 11. Contratos Sprint 3 (referencia rápida)

| Endpoint             | Método | Auth  | Entrada                                                                    | Respuesta               | Errores                      |
| -------------------- | ------ | ----- | -------------------------------------------------------------------------- | ----------------------- | ---------------------------- |
| `/api/inscripciones` | GET    | ADMIN | `page`, `perPage`, `memberId?`, `status?`, `search?`                       | `200 { data, meta }`    | `401`, `422`                 |
| `/api/inscripciones` | POST   | ADMIN | `CreateEnrollmentInput`                                                    | `201 { data }`          | `404` socio, `422` payload   |
| `/api/cuotas`        | GET    | ADMIN | `page`, `perPage`, `status?`, `memberId?`, `enrollmentId?`, `from?`, `to?` | `200 { data, meta }`    | `401`, `422`                 |
| `/api/cuotas`        | POST   | ADMIN | `{ dueId, paidAt? }`                                                       | `200 { data }` (`PAID`) | `404` cuota, `409` duplicado |

Ejemplos JSON de errores comunes están en este README y en `docs/comandos.md`. DTOs: `src/types/enrollment.ts`. Validaciones: `src/lib/validations/enrollments.ts`.

---

## 12. Documentación y assets complementarios

- [`docs/comandos.md`](docs/comandos.md): scripts npm claves (desarrollo, migraciones, seeds, tests).
- [`docs/identidadVisual.md`](docs/identidadVisual.md): paleta institucional, tipografías (Inter + Space Grotesk), componentes “glass”.
- [`docs/implementShowcase.md`](docs/implementShowcase.md): lineamientos para la página pública `/showcase`.
- Seeds QA: `drizzle/0003_qas_seed.sql` (config económica `default`, usuario QA, inscripción con cuotas en distintos estados).
- Pruebas: `npm run test -- --run` (modo CI), `--watch`, `--coverage`.

Con estas referencias el equipo puede continuar con Sprint 5 (reportes) y el endurecimiento final manteniendo coherencia visual, técnica y operativa.

---
