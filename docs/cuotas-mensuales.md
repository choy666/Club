# Job mensual de cuotas y cobros adelantados

## 1. Flujo general

1. **Alta de inscripción**
   - El admin elige la fecha de inicio (`startDate`), la cantidad de cuotas a generar (1-24) y cuántas se cobran en el momento.
   - `createEnrollment` crea la inscripción (status `ACTIVE`), genera las cuotas a partir del mes siguiente y marca las primeras `monthsPaid` como pagadas mediante `recordPayment` con método `INITIAL_CHARGE`.
   - Cada cuota cubre el período `[dueDate, dueDate + 1 mes)` y debe pagarse antes del `dueDate`.
2. **Cobros manuales posteriores**
   - Se registran mediante `/api/cuotas` + `recordPayment`, igual que antes.
3. **Job mensual (`generateMonthlyDues`)**
   - Ejecutar `npm run jobs:generate-dues [operador]` al inicio de cada mes.
   - Recorre inscripciones con socio `ACTIVE`, identifica la última cuota (`dueDate`) y crea solo la siguiente si no existe.
   - Inserta registro en `monthly_run_log` con cantidad generada y notas.

## 2. Casos a tener en cuenta

| Caso                                   | Comportamiento                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Inscripción nueva con 1 cuota generada | Cuota `#1` se crea inmediatamente, cubre el mes siguiente. Si `monthsPaid > 0`, ya aparece como `PAID` con recibo.                |
| Cobro de 3 meses adelantados           | Configurar `monthsToGenerate >= 3` y `monthsPaid = 3`. Las cuotas 1-3 quedan en `PAID`; el job mensual retomará desde la cuota 4. |
| Socio inactivo o congelado             | No se generan cuotas mientras la inscripción esté pausada o el socio no esté `ACTIVE`.                                            |
| Cambio de monto mensual                | Se debe editar la inscripción (o crear una nueva). Las cuotas ya generadas mantienen el monto original.                           |

## 3. Ejecución operativa

1. **Manual / CLI**

   ```bash
   npm run jobs:generate-dues operador=cron
   ```

   - El segundo argumento es opcional; por defecto queda `manual`.

2. **Automatizada (cron serverless)**
   - Programar un cron (GitHub Actions, Vercel Cron, servicio externo) que ejecute el script el primer día de cada mes.
   - Verificar logs (`monthly_run_log`) y métricas (cuotas generadas, operator).
3. **Alertas recomendadas**
   - Si `createdDues = 0` durante varios meses seguidos, revisar que existan socios activos y que no se estén generando cuotas por adelantado únicamente.

## 4. Soporte y troubleshooting

- **No se generó la cuota del mes**: revisar si la inscripción tenía cuotas creadas por adelantado (con dueDate >= mes actual). El job no duplicará la cuota si ya existe.
- **El socio quiere pagar varios meses después del alta**: usar `monthsToGenerate` y `monthsPaid` solo para el alta. Luego, registrar pagos desde `/admin/cuotas` seleccionando las cuotas pendientes que correspondan.
- **Cambio de fechas**: las cuotas se basan en `startDate`. Si se requiere cambiar el ciclo, cancelar la inscripción y crear una nueva con la fecha deseada.

## 5. Referencias

- Código: `src/lib/enrollments/service.ts`, `src/lib/jobs/monthly-dues.ts`, `src/lib/enrollments/schedule.ts`.
- Formularios: `src/components/enrollments/enrollment-form.tsx`.
- API: `POST /api/inscripciones`, `POST /api/cuotas`, script `scripts/generate-monthly-dues.ts`.
- Documentación general: `README.md` sección 14.
