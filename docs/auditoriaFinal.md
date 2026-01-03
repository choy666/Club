## 🧠 Auditoría Lógica de ClubApp

**Rol: Auditar lógicamente el sistema de gestión de socios**

---

### 🧩 PROMPT

> Tu función es **analizar, corregir y ajustar la lógica del sistema para que el flujo de la aplicación sea correcto, consistente y estable** en la aplicación descripta a continuación.
>
> Debés pensar como:
>
> - Arquitecto de software
> - Auditor financiero
> - Tester de edge cases
> - Validador de flujos temporales (meses, pagos, estados)

---

## 📌 CONTEXTO DEL SISTEMA

Sistema web de **Gestión de Socios de un Club**, con los siguientes componentes:

- Roles: **Admin** y **Socio**
- Estados del socio: `Pendiente`, `Activo`, `Inactivo`
- Entidades clave: Socio, Inscripción, Cuotas Mensuales
- Base de datos relacional (PostgreSQL)

---

## 🔁 FLUJO OBLIGATORIO DEL SOCIO

1. Admin crea socio → estado `Pendiente`
2. Socio paga **inscripción** (una sola vez)
3. Admin confirma inscripción → socio pasa a `Activo`
4. **Recién a partir del mes siguiente** se generan cuotas
5. Las cuotas se pagan solo una vez
6. El admin confirma cada pago
7. El socio puede pagar **varias cuotas juntas**
8. El sistema debe funcionar correctamente al cambiar de mes

---

## 🚨 REGLAS CRÍTICAS (NO NEGOCIABLES)

Debés verificar estrictamente que:

### 🧑‍🤝‍🧑 Socios

- ❌ No se puede inscribir dos veces al mismo socio
- ❌ No se puede crear dos socios con el mismo DNI
- ✔️ Solo se puede inscribir **1 vez** a un socio existente

### 💰 Inscripción

- ✔️ Se cobra **una sola vez**
- ❌ No se puede cobrar dos veces la inscripción
- ✔️ El mes de inscripción queda cubierto
- ✔️ El socio **NO genera cuotas** hasta estar Activo

### 📆 Cuotas

- ✔️ La **primera cuota** es el **mes siguiente** a la inscripción
- ❌ No se puede cobrar dos veces la misma cuota
- ✔️ Las cuotas no se eliminan, solo cambian de estado
- ✔️ Un socio puede pagar **múltiples cuotas en una sola acción**
- ✔️ El pago múltiple **NO debe romper el cambio de mes**
- ❌ No se deben generar cuotas duplicadas al cambiar de mes
- ❌ No se recalculan cuotas retroactivamente

### 🔄 Cambio de Mes (CRÍTICO)

- Verificá que:
  - No se dupliquen cuotas
  - No se salten meses
  - No se generen cuotas si el socio está `Inactivo`
  - No se generen cuotas antes de tiempo

---

## 🧪 TAREAS QUE DEBÉS REALIZAR

### 1️⃣ Validación Lógica

Analizá si el sistema:

- Cumple todas las reglas anteriores
- Tiene riesgos de duplicados
- Tiene errores de estado inválido

---

### 2️⃣ Simulación de Escenarios (OBLIGATORIO)

Simulá mentalmente y validá estos casos:

- Inscripción el último día del mes
- Inscripción el 31 y cambio automático de mes
- Pago de 3 cuotas juntas
- Intento de pagar una cuota ya pagada
- Intento de reinscribir un socio activo
- Cambio de estado a Inactivo con cuotas pendientes
- Cambio de mes con socio Inactivo
- Cambio de mes con socio Pendiente
- Admin confirma pagos fuera de orden cronológico

Indicá **si el sistema falla o no en cada caso**.

---

### 3️⃣ Señalización de Errores

Para cada error detectado, devolvé:

- ❌ Descripción clara del problema
- 🧠 Por qué ocurre
- 🛠️ Qué regla se está violando
- ✅ Recomendación concreta de solución (lógica, no UI)

---

### 4️⃣ Validaciones Recomendadas (Checklist)

Proponé:

- Validaciones a nivel **base de datos**
- Validaciones a nivel **lógica de negocio**
- Validaciones que **el admin NO puede romper**
- Reglas que deben ser **atómicas y transaccionales**

---

### 5️⃣ Resultado Final

Cerrá con:

- ✅ Nivel de confiabilidad del sistema (0 a 100)
- 🔥 Riesgos críticos si se lanza así
- 🧱 Qué partes están bien diseñadas
- 🧠 Qué mejoraría un arquitecto senior

---

## ⚠️ CONDICIÓN FINAL

> Si una regla **no está explícitamente protegida**, asumí que es un bug potencial y reportalo.

---

## ✨ Bonus (Opcional pero recomendado)

Si detectás que falta alguna regla importante para un sistema de cuotas mensual **real**, indicá cuál y por qué.

---

## ✅ Resultados de la auditoría (Enero 2026)

### Hallazgos y correcciones aplicadas

1. **Generación de cuotas**
   - Problema: las cuotas nacían en el mismo mes de la inscripción cuando `startDate` se armaba con diferentes zonas horarias.
   - Corrección: `buildDueSchedule` (@src/lib/enrollments/schedule.ts#1-80) ahora normaliza todas las fechas a UTC puro y garantiza que la primera cuota sea el mes siguiente sin corrimientos de día.
   - Cobertura: tests actualizados en `src/lib/enrollments/schedule.test.ts`.

2. **Validación de inscripción**
   - Problema: se podía inscribir a un socio inactivo o duplicar inscripciones.
   - Corrección: `createEnrollment` (@src/lib/enrollments/service.ts#105-200 aprox.) ahora:
     - Verifica que el socio exista y esté en estado `ACTIVE`.
     - Bloquea cualquier inscripción si ya hay una registrada.
     - Mantiene la transacción que genera cuotas iniciales con los montos de la configuración económica.

3. **Separación de suites de prueba**
   - Ajuste: `vitest.config.ts` fue limitado a `src/**` y `tests/**`, excluyendo `e2e/**`.
   - Resultado: `npm run test -- --run` ejecuta solo Vitest (21 casos verdes); el flujo end-to-end se valida aparte con `npm run test:e2e`.

4. **Política automática para socios inactivos con deuda**
   - Problema: al pasar un socio a `INACTIVE` las cuotas seguían `PENDING/OVERDUE`, permitiendo pagos manuales fuera de política.
   - Corrección: se introdujo el estado `FROZEN` en `due_status` y una política centralizada en `src/lib/enrollments/frozen-policy.ts` para congelar/descongelar cuotas según el estado del socio.
   - Bloqueo de pagos: `recordPayment` ahora rechaza cuotas `FROZEN` con `AppError 409`.
   - Cobertura: nuevas pruebas en `src/lib/enrollments/frozen-policy.test.ts` y `src/lib/enrollments/service.test.ts` validan congelamiento y bloqueo de pagos.
5. **Job mensual con auditoría**
   - Problema: la generación de cuotas dependía de acciones manuales sin trazabilidad.
   - Corrección: se creó `monthly_run_log` y el comando `npm run jobs:generate-dues [operador]` que usa `src/lib/jobs/monthly-dues.ts` para generar la próxima cuota de cada socio activo evitando duplicados.
   - Cobertura: pruebas unitarias en `src/lib/jobs/monthly-dues.test.ts` validan la lógica y el registro de auditoría.

### Escenarios críticos validados

| Escenario                                         | Resultado | Notas                                                                                                   |
| ------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| Inscripción el último día del mes                 | ✅        | Las cuotas saltan al mes siguiente sin duplicar días.                                                   |
| Inscripción el 31 con cambio automático de mes    | ✅        | Normalización UTC impide desfasajes (ej. febrero).                                                      |
| Pago de 3 cuotas juntas                           | ✅        | `payDue` mantiene operaciones atómicas y actualiza estados.                                             |
| Intento de pagar cuota ya pagada                  | ✅        | `recordPayment` valida estado `PENDING` antes de acreditar.                                             |
| Intento de reinscribir socio activo               | ✅        | Nueva validación devuelve `409` y mensaje específico.                                                   |
| Cambio de estado a Inactivo con cuotas pendientes | ✅        | `enforceFrozenDuesPolicy` congela cuotas `PENDING/OVERDUE` en `FROZEN` y bloquea pagos hasta reactivar. |
| Cambio de mes con socio Inactivo                  | ✅        | `refreshMemberFinancialStatus` no genera cuotas si el miembro no está `ACTIVE`.                         |
| Cambio de mes con socio Pendiente                 | ✅        | Sin inscripción -> no hay cuotas nuevas.                                                                |
| Admin confirma pagos fuera de orden               | ✅        | El orden no altera el recálculo; se respeta la fecha de cada cuota.                                     |

### Checklist de validaciones cubiertas

- **Base de datos**:
  - Unicidad de DNI ya definida en schema.
  - Recomendación pendiente: constraint único `enrollments.member_id`.

- **Lógica de negocio**:
  - Socio debe estar `ACTIVE` para generar cuotas.
  - Bloqueo de inscripciones duplicadas.
  - Agenda de cuotas siempre a futuro (mes siguiente).
  - Pagos múltiples soportados de forma transaccional.

- **Operación de admin**:
  - Respuestas explícitas (`AppError`) cuando se viola la regla.
  - Se documentó la separación de pruebas para evitar ejecuciones accidentales de Playwright en CI.
  - Job mensual documentado en `docs/comandos.md`, con auditoría en `monthly_run_log` y pruebas unitarias dedicadas.

### Resultado final

- **Confiabilidad estimada**: **90/100** (mejora tras congelamiento automático de cuotas para socios inactivos).
- **Riesgos pendientes**:
  1. Falta constraint único en `enrollments` por `member_id` para reforzar el bloqueo lógico.
  2. Aún falta orquestar el job mensual en infraestructura (cron/Actions) y monitorear fallas.
  3. Necesitamos registrar auditorías del congelamiento/descongelamiento para trazabilidad histórica.
- **Partes sólidas**: modelo financiero, uso de transacciones, validaciones Zod + AppError, reporting consolidado.
- **Mejoras sugeridas (arquitecto senior)**:
  - Agregar job mensual que genere cuotas futuras y registre auditoría de ejecución.
  - Definir política formal para estados `INACTIVE`/`PENDING` con cuotas abiertas.
  - Automatizar pruebas E2E en pipeline independiente (`npm run test:e2e`).

### Bonus

- **Nueva regla propuesta**: establecer un **límite máximo de meses adelantados** al registrar pagos múltiples (ej. no más de 12 meses) para evitar cashflow inválido y posibles fraudes administrativos.

---
