---

# 📌 Documento Base – Sistema de Gestión de Socios

**Entidad:** *Club*
Gestión integral de socios, pagos, cuotas e inscripciones con control administrativo y acceso individual del socio.
---

## 1️⃣ Objetivo General (sin cambios)

Desarrollar una aplicación web que permita a la entidad _Club_:

- Administrar socios.
- Gestionar inscripciones y cuotas mensuales.
- Controlar estados (activo / inactivo / pendiente).
- Visualizar deudas y pagos.
- Obtener reportes financieros y de crecimiento.

El sistema debe ser claro, escalable, mantenible y seguro.

---

## 2️⃣ Stack Tecnológico Oficial (ACTUALIZADO)

Este stack **queda fijado como base del proyecto**.
| Capa | Herramienta |
| ----------------- | ---------------------------------------------------------------- |
| Base de datos | **Neon (PostgreSQL)** |
| Hosting / Backend | **Vercel + Next.js 15.5 (App Router)** |
| Repositorio | **GitHub** |
| Autenticación | **NextAuth.js 5.0 + credenciales creadas por el administrador** |
| Frontend | **Next.js 15.5 + Tailwind CSS 4.1** |

---

## 🛠️ Tecnologías Utilizadas

### 🎨 Frontend

| Tecnología                    | Uso                                            |
| ----------------------------- | ---------------------------------------------- |
| **Next.js 15.5 (App Router)** | Framework principal (SSR, RSC, Server Actions) |
| **TypeScript**                | Tipado estático y seguridad en desarrollo      |
| **Tailwind CSS 4.1**          | Sistema de estilos utilitarios                 |
| **Framer Motion 12.23**       | Animaciones UI/UX                              |
| **React Hook Form 7.65**      | Manejo de formularios reutilizables            |
| **Zustand 5.0**               | Estado global (auth, UI, filtros)              |
| **React Query 5.90**          | Estado del servidor, cache y sincronización    |

✔️ Ideal para formularios compartidos (crear / editar socio)
✔️ Optimizado para panel administrativo y panel de socio

---

### ⚙️ Backend

| Tecnología                 | Uso                                 |
| -------------------------- | ----------------------------------- |
| **Next.js API Routes**     | API REST interna                    |
| **NextAuth.js 5.0 (beta)** | Autenticación y control de sesiones |
| **Drizzle ORM 0.44**       | ORM tipado para PostgreSQL          |
| **Neon**                   | PostgreSQL serverless               |

📌 **Decisión clave:**
El backend vive dentro de Next.js → menos latencia, misma base de código, más control.

---

### 🧰 Herramientas de Desarrollo

| Herramienta     | Función                     |
| --------------- | --------------------------- |
| **ESLint**      | Linting y calidad de código |
| **Prettier**    | Formateo consistente        |
| **Drizzle Kit** | Migraciones y esquema de BD |

---

## 3️⃣ Arquitectura General (alineada al stack)

```
Next.js App Router
│
├── app/
│   ├── (auth)        → login
│   ├── admin/        → panel admin
│   ├── socio/        → panel usuario
│
├── api/
│   ├── auth/         → NextAuth
│   ├── socios/       → CRUD socios
│   ├── pagos/        → inscripción / cuotas
│   ├── reportes/     → métricas
│
├── db/
│   ├── schema.ts     → Drizzle schema
│   ├── migrations/
│
├── store/            → Zustand
├── hooks/            → React Query
├── components/       → UI reutilizable
```

---

## 4️⃣ Autenticación y Roles (alineado a NextAuth v5)

### Roles definidos

- `ADMIN`
- `USER`

### Reglas

- Solo ADMIN accede a `/admin`
- USER solo accede a `/socio`
- Middleware protege rutas
- Sesión validada en backend (no solo frontend)

📌 Usuarios **NO se registran solos**
📌 Credenciales creadas por el admin

#### ⚙️ Bootstrap del primer administrador

1. Al acceder por primera vez a `/auth/signin`, el sistema verifica si existe un usuario con rol `ADMIN`.
2. Si no hay uno creado, se muestra un formulario especial para registrar **el único admin inicial** con correo + contraseña definidos allí mismo. La contraseña se hashea y se guarda directamente en la tabla `users`.
3. Una vez creado, la vista vuelve al formulario de login y solo se podrá acceder con esas credenciales (o las que luego actualice el propio admin).
4. El endpoint `POST /api/admin/status` bloquea la creación de un segundo administrador inicial y devuelve `409` si ya existe uno.
5. Para entornos donde se requiera seed manual, continúa disponible `npm run seed:admin`, pero ya no es obligatorio para el primer arranque.

---

## 5️⃣ Formularios (decisión técnica importante)

- **React Hook Form**
- Validación centralizada
- **Formulario único reutilizado** para:
  - Crear socio
  - Editar socio

✔️ Evita duplicación
✔️ Evita inconsistencias
✔️ Facilita mantenimiento

---

## 6️⃣ Estado Global y Datos

### 🧠 Zustand

- Usuario logueado
- Rol
- Estado UI (modales, filtros)

### 🌐 React Query

- Socios
- Pagos
- Reportes
- Cache + refetch automático

📌 **Regla:**
Nunca guardar datos del servidor en Zustand.

---

## 7️⃣ Base de Datos (Neon + Drizzle)

- PostgreSQL
- Tipado fuerte
- Migraciones versionadas
- Entidades clave:
  - Socios
  - Usuarios
  - Inscripciones
  - Cuotas
  - Pagos
  - Configuración económica

(El modelo lo armamos como siguiente paso)

---

## 8️⃣ Coherencia con Reglas del Negocio (confirmado)

Todo lo definido previamente sigue vigente:

✔️ Estados del socio
✔️ Inscripción + cuotas
✔️ Deudas por mes
✔️ Reportes financieros
✔️ Gráficos de crecimiento

Este stack **soporta todo eso sin parches**.

---

## 9️⃣ Recomendaciones Técnicas Clave

### 🔐 Seguridad

- Hash de contraseñas
- Roles verificados en API
- Session-based auth (NextAuth)

### 📈 Escalabilidad

- Server Actions a futuro
- Pagos online integrables
- Exportación de reportes

### 🧼 Calidad

- ESLint + Prettier obligatorios
- Tipos compartidos frontend/backend
- Migraciones versionadas

---

## 10️⃣ Estado del Proyecto

🟢 **Fase actual:** Sprint 1 – Infraestructura completado (stack listo, auth y middleware funcionando).

🔜 **Siguientes pasos recomendados**

1. Sprint 2: CRUD de socios (APIs, formularios y paneles iniciales).
2. Sprint 3: Inscripciones y cuotas (flujo alta + generación automática).
3. Sprint 4: Pagos y estados (conciliación + deudas).
4. Sprint 5: Reportes y métricas (consultas agregadas + visualizaciones).

---

## 1️⃣1️⃣ Plan de implementación (ejecutable)

### 🗺️ Visión general

El objetivo es levantar el proyecto en iteraciones cortas, respetando el stack oficial (Next.js 15.5, Neon, Drizzle, NextAuth v5, React Query, Zustand) y las reglas de negocio ya validadas (CRUD de socios, inscripciones, cuotas, pagos y reportes). @README.md#23-188

### 🧭 Cronograma sugerido (6 sprints)

| Sprint                                      | Objetivo principal                                                                                  | Entregables clave                                                                                                 | Dependencias |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------ |
| 0. Preparación (½ semana)                   | Repositorio listo y toolchain configurado                                                           | Repo Next.js base, ESLint/Prettier, CI mínimo                                                                     | —            |
| 1. Infraestructura (1 semana)               | Conexión Neon + Drizzle + NextAuth                                                                  | Drizzle config + migraciones iniciales (usuarios, socios), credenciales admin + middleware de roles               | Sprint 0     |
| 2. CRUD de Socios (1 semana)                | Panel `/admin` con listado + formulario reutilizable (React Hook Form) y API `/api/socios` completa | Componentes de tabla, formulario compartido crear/editar, hooks React Query y tests básicos                       | Sprint 1     |
| 3. Inscripciones y cuotas (1 semana)        | Flujo de alta de socio → inscripción → generación automática de cuotas en BD                        | Endpoints `/api/pagos` (inscripción/cuotas), tablas inscripciones/cuotas configuradas, lógica de negocio validada | Sprint 2     |
| 4. Pagos y estados (1 semana)               | Gestión de pagos, actualización de estados activo/inactivo/pendiente y vistas de deudas             | Entidad pagos, cálculo de deudas, actualización de estado de socio, vistas admin/socio sincronizadas              | Sprint 3     |
| 5. Reportes y métricas (1 semana)           | Panel de reportes financieros y de crecimiento con cache y gráficos                                 | Endpoint `/api/reportes`, hooks cacheados, visualizaciones, pruebas de performance                                | Sprint 4     |
| 6. Endurecimiento y despliegue (½-1 semana) | QA completo, documentación y despliegue en Vercel                                                   | Tests e2e críticos, monitoreo, checklist de seguridad, playbook de despliegue                                     | Sprints 0-5  |

#### Cobertura frontend + backend

El plan aborda ambos frentes en cada sprint:

- **Frontend:** construcción de vistas `/admin` y `/socio`, formularios con React Hook Form, estado de UI vía Zustand y consumo optimizado con React Query (ver Sprints 2-5).
- **Backend:** APIs REST en Next.js, modelos Drizzle, lógica de pagos/estados y reportes agregados (Sprints 2-5) más endurecimiento final (Sprint 6).

Si se detecta un deliverable crítico sin contraparte (por ejemplo, un API sin UI o viceversa) se deberá ajustar en la planificación de cada sprint.

### 📋 Checklist por sprint

**Sprint 0 – Preparación**

1. Crear repositorio GitHub y proyecto Vercel.
2. Inicializar Next.js 15.5 (App Router) con Tailwind 4.1. @README.md#29-50
3. Configurar ESLint + Prettier + Husky (pre-commit) y pipelines básicos.
4. Definir variables de entorno (Neon URL, NEXTAUTH_SECRET, etc.) sin hardcodear valores.

**Sprint 1 – Infraestructura**

1. Provisionar base Neon y conectar Drizzle ORM (schema inicial: usuarios, socios). @README.md#59-173
2. Configurar NextAuth v5 con credenciales administradas manualmente y roles ADMIN/USER. @README.md#108-122
3. Implementar middleware de protección de rutas y validaciones de sesión en API routes. @README.md#115-118
4. Montar store Zustand (auth + UI) y skeleton de hooks React Query (sin data). @README.md#140-158

**Sprint 2 – CRUD de Socios**

1. Implementar APIs `/api/socios` (POST/GET/PUT/DELETE) con validaciones y Drizzle. @README.md#90-93
2. Construir formulario único con React Hook Form para crear/editar socios, validación centralizada. @README.md#125-136
3. Crear vistas `/admin` (tabla + filtros) y `/socio` (datos personales) con React Query sincronizando cache. @README.md#84-103
4. Añadir pruebas unitarias/contract de endpoints.

**Sprint 3 – Inscripciones y cuotas**

1. Modelar entidades inscripciones, cuotas y configuración económica en Drizzle. @README.md#165-174
2. Desarrollar endpoints `/api/pagos` para inscribir socio y generar cuotas automáticas. @README.md#91-93
3. Automatizar lógica negocio inscripción→cuotas y registrar estados iniciales.
4. Exponer UI para iniciar inscripción y monitorear cuotas pendientes.

**Sprint 4 – Pagos y estados**

1. Crear entidad pagos y lógica de conciliación que actualiza estado del socio (activo/inactivo/pendiente). @README.md#15-16 @README.md#182-188
2. Implementar cálculo de deudas mensuales y visualización en panel admin/socio. @README.md#12-17
3. Añadir notificaciones/alertas UI (Zustand) según estado de deuda.
4. Tests de regresión sobre transiciones de estado.

**Sprint 5 – Reportes y métricas**

1. Implementar `/api/reportes` con queries agregadas (finanzas + crecimiento). @README.md#15-17 @README.md#91-93
2. Construir hooks React Query con cache y refetch automático para reportes. @README.md#148-158
3. Diseñar vista de gráficos (Framer Motion + componentes visuales) en panel admin.
4. Documentar endpoints y contratos, preparar dataset mock para demos.

**Sprint 6 – Endurecimiento y despliegue**

1. Auditar seguridad (hash de contraseñas, variables env, roles). @README.md#192-205
2. Ejecutar pruebas e2e (Playwright o Cypress) sobre los 6 flujos críticos.
3. Preparar manual de despliegue Vercel + migraciones Drizzle Kit.
4. Publicar documentación final (README actualizado, diagramas, checklists).

### ✅ Definición de terminado (DoD) global

- Todas las entidades y APIs descritas en la arquitectura están implementadas y cubiertas por migraciones. @README.md#79-188
- Paneles `/admin` y `/socio` funcionan con control de roles y datos sincronizados vía React Query. @README.md#84-158
- Lógica de inscripción, cuotas y pagos actualiza estados y genera reportes coherentes. @README.md#165-188
- Suite de pruebas (unitarias + e2e mínimos) pasa en CI y existe playbook de despliegue.

---

### 🟢 Estado Sprint 0 – Preparación (actualizado)

Entregables completados en `club-app/`:

1. **Proyecto Next.js 16 + TS + Tailwind 4** generado con estructura `src/` y App Router.
2. **Toolchain**: ESLint 9, Prettier, Husky + lint-staged, scripts de chequeo (`lint:types`, `format`) y hook `pre-commit` ejecutando lint + tipos.
3. **Dependencias clave** instaladas: NextAuth v5 beta, Drizzle ORM, adaptador Neon, Zod, bcryptjs, Zustand y React Query (alineado a @README.md#23-188).
4. **Infraestructura base**:
   - `.env.example` documentando variables críticas (DATABASE_URL, AUTH_SECRET, etc.) sin valores reales.
   - `drizzle.config.ts` apuntando a `src/db/schema.ts` y validando `DATABASE_URL`.
   - `src/lib/env.ts` con validación Zod de parámetros de entorno.
   - Carpetas `src/db`, `src/store`, `src/hooks`, `src/components` y provider de React Query listo para montarse en el layout.

✅ Con esto se cumple el checklist del Sprint 0 y se deja el terreno listo para iniciar el Sprint 1 (infraestructura Neon + NextAuth + middleware de roles).

---

### 🟢 Estado Sprint 1 – Infraestructura (actualizado)

Entregables completados en `club-app/`:

1. **Conexión Neon/Drizzle**: schema base (`src/db/schema.ts`) y cliente (`src/db/client.ts`) funcionando contra la base de Neon, más migración inicial generada con Drizzle Kit.
2. **Gestión de entornos**: `.env.example` documenta todas las variables y `.env.local` aloja credenciales reales; `src/lib/env.ts` valida cada clave (URLs, secretos, credenciales admin) con Zod.
3. **Autenticación NextAuth v5**: configuración central en `src/auth.ts`, ruta `/api/auth/[...nextauth]`, provider de credenciales, roles persistidos en JWT y helper de contraseñas (`src/lib/password.ts`).
4. **Seed administrador**: script `npm run seed:admin` (`scripts/seed-admin.ts`) crea/actualiza el usuario ADMIN usando `AUTH_ADMIN_EMAIL` + password/hash definidos en entorno.
5. **Middleware + stores**: guardias de rol en `src/middleware.ts`, stores `useAuthStore` y `useUiStore`, y `AppProviders` (Session + React Query + sincronización con Zustand) montados en `app/layout.tsx`.

Con esto queda listo el esqueleto de infraestructura para avanzar al Sprint 2 (CRUD de socios).

---

### 🟢 Estado Sprint 2 – CRUD de Socios (nuevo)

Entregables completados en `club-app/`:

1. **APIs `/api/socios`**: endpoints protegidos para listado paginado, creación, edición, eliminación y obtención de perfil (`/api/socios`, `/api/socios/[memberId]`, `/api/socios/me`) con validaciones Zod y servicios Drizzle (`src/lib/members/*`).
2. **Hooks y stores frontend**: React Query hooks (`src/hooks/use-members.ts`), cliente API (`src/lib/api-client.ts`) y store Zustand para filtros de tabla (`src/store/members-filters-store.ts`).
3. **Panel `/admin`**: vista con tabla, filtros, paginación, modales y formularios RHF reutilizables para crear/editar socios (`src/app/admin/page.tsx` + componentes en `src/components/members/`).
4. **Portal `/socio`**: pantalla que consume `useMemberProfile` para mostrar datos personales y estado actualizado (`src/app/socio/page.tsx`).
5. **Identidad visual aplicada**: layout global y landing `/` utilizan la paleta y tipografías documentadas en `docs/identidadVisual.md`, asegurando coherencia con la marca del club.

Próximos pasos del Sprint 2: añadir pruebas unitarias/contract para servicios y endpoints, y documentar los contratos de API en detalle.

---

### 🎨 Identidad Visual

La guía completa de colores, tipografías y lineamientos UI se encuentra en [`docs/identidadVisual.md`](docs/identidadVisual.md). Todas las vistas (landing, `/admin`, `/socio`) siguen esta referencia: paleta dark institucional (negro, gris carbón, acentos rojo), tipografías **Inter** + **Space Grotesk** y componentes “glass” descritos en el documento.

---

### 🟢 Estado Sprint 1 – Infraestructura (actualizado)

Entregables completados en `club-app/`:

1. **Conexión Neon/Drizzle**: schema base (`src/db/schema.ts`) y cliente (`src/db/client.ts`) funcionando contra la base de Neon, más migración inicial generada con Drizzle Kit.
2. **Gestión de entornos**: `.env.example` documenta todas las variables y `.env.local` aloja credenciales reales; `src/lib/env.ts` valida cada clave (URLs, secretos, credenciales admin) con Zod.
3. **Autenticación NextAuth v5**: configuración central en `src/auth.ts`, ruta `/api/auth/[...nextauth]`, provider de credenciales, roles persistidos en JWT y helper de contraseñas (`src/lib/password.ts`).
4. **Seed administrador**: script `npm run seed:admin` (`scripts/seed-admin.ts`) crea/actualiza el usuario ADMIN usando `AUTH_ADMIN_EMAIL` + password/hash definidos en entorno.
5. **Middleware + stores**: guardias de rol en `src/middleware.ts`, stores `useAuthStore` y `useUiStore`, y `AppProviders` (Session + React Query + sincronización con Zustand) montados en `app/layout.tsx`.

Con esto queda listo el esqueleto de infraestructura para avanzar al Sprint 2 (CRUD de socios).
