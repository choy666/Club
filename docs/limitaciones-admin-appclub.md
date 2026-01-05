# Limitaciones operativas de AppClub (enero 2026)

Este documento resume el alcance actual del panel administrativo de AppClub y detalla las principales limitaciones funcionales detectadas en los módulos de socios, inscripciones y cuotas.

## 1. Capas y vistas disponibles

- **/admin**: gestión de socios y panel financiero resumido para cada miembro.
- **/admin/inscripciones**: alta y edición de inscripciones mensuales, además del seguimiento de cuotas generadas.
- **/admin/reportes** y **/admin/inscripciones** son las únicas vistas adicionales enlazadas desde el dashboard. No existen submódulos para reportes avanzados ni exportaciones masivas.

## 2. Límites de paginación y volumen de datos

| Recurso                          | Formulario/Hook         | Límites actuales                                                                                                                                                         |
| -------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socios                           | `listMembersSchema`     | `page` mínimo 1 y `perPage` entre 5 y 50 (valor por defecto: 10). Intentar solicitar más de 50 registros provoca errores 422.                                            |
| Inscripciones                    | `listEnrollmentsSchema` | Igual que socios: `perPage` máximo 50 y mínimo 5.                                                                                                                        |
| Cuotas                           | `listDuesSchema`        | Misma restricción de `perPage` (5 a 50).                                                                                                                                 |
| Combo de socios en inscripciones | `useMembersOptions`     | El selector de socios para generar inscripciones sólo carga la primera página (`perPage=50`), por lo que no se pueden listar más de 50 miembros simultáneos sin filtros. |

**Impacto:** para padrón o reinscripciones masivas es necesario navegar página por página o aplicar búsquedas; no existe soporte para exportaciones ni scroll infinito.

## 3. Restricciones al crear y mantener socios

1. **Estado inicial forzado**: todo socio nuevo se crea con estado `PENDING` y sin notas, aun cuando se envíen valores diferentes. Recién luego de editarlo se puede pasarlo a `ACTIVE` o `INACTIVE`.
2. **Unicidad obligatoria**: el correo electrónico y el número de documento deben ser únicos; cualquier duplicado devuelve error 409.
3. **Campos obligatorios/longitudes**: nombre (3-120 caracteres), email (máx. 160), documento (5-40). Teléfono y dirección tienen límites de longitud y no pueden quedar con cadenas muy cortas.
4. **Contraseña**: entre 8 y 64 caracteres, siempre requerida al dar de alta desde el admin.
5. **Activación manual**: para poder inscribir a un socio se debe cambiar su estado a `ACTIVE`; no hay automatización que lo active tras validar el pago de inscripción.

## 4. Restricciones sobre inscripciones y cuotas

1. **Un solo plan por socio**: si un miembro ya tiene una inscripción activa, el sistema rechaza un nuevo alta con error 409.
2. **Socio debe estar activo**: intentar inscribir a un socio en estado `PENDING` o `INACTIVE` produce error 409.
3. **Validaciones económicas**: el monto mensual debe ser positivo y las cuotas por generar oscilan entre 1 y 24; fuera de ese rango la operación falla.
4. **Dependencia de configuración económica**: cuando no se envían montos/cuotas explícitos se usan los valores de la configuración `default`. Si esa configuración no existe o está incompleta, la inscripción falla.
5. **Pagos y cuotas congeladas**: no se pueden registrar pagos sobre cuotas con estado `FROZEN`; primero debe reactivarse el socio.
6. **Borrado condicionado**: el endpoint `DELETE /api/inscripciones/{id}` y la UI sólo permiten eliminar inscripciones que no tengan ninguna cuota pagada. Para limpiezas completas de ambientes QA/DEV se debe usar `npm run reset:enrollments`, que borra pagos, cuotas e inscripciones y restablece a los socios en estado `PENDING`.

### 4.1 Variables de entorno que alimentan la configuración económica `default`

| Variable                               | Significado                                                                                                               | Ejemplo actual |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `ECONOMIC_DEFAULT_CURRENCY_CODE`       | Código ISO de la moneda utilizada para sugerencias y formateo.                                                            | `ARS`          |
| `ECONOMIC_DEFAULT_MONTHLY_AMOUNT`      | Monto mensual sugerido cuando el admin deja el campo vacío.                                                               | `35000`        |
| `ECONOMIC_DEFAULT_MONTHS_TO_GENERATE`  | Cantidad de cuotas que se crean automáticamente si no se ingresan manualmente.                                            | `12`           |
| `ECONOMIC_DEFAULT_DUE_DAY`             | Día del mes usado como referencia de vencimiento para mostrar en el formulario.                                           | `10`           |
| `ECONOMIC_DEFAULT_LATE_FEE_PERCENTAGE` | Porcentaje de recargo pensado para morosidad (todavía no se aplica, pero queda documentado para futuros flujos).          | `0`            |
| `ECONOMIC_DEFAULT_GRACE_PERIOD_DAYS`   | Días de gracia antes de marcar una cuota como `OVERDUE`. Con valor `1`, el día posterior al vencimiento ya queda en mora. | `1`            |

**Nota:** Estas variables también se sincronizan con la tabla `economic_configs`. Si la fila `default` no existe o difiere, los formularios quedan sin sugerencias y el backend devuelve 404 al iniciar una inscripción.

## 5. Limitaciones generales del admin

- No hay soporte para filtros combinados en múltiplos campos más allá de búsqueda simple por nombre/email/documento.
- El dashboard no muestra indicadores globales (totales generales, gráficos o alertas fuera de los módulos existentes).
- No existen acciones masivas (activar varios socios, generar inscripciones en lote o exportar datos).
- Los formularios dependen de valores preconfigurados en base de datos (por ejemplo, plan económico "default"); si esa data falta, los procesos críticos se bloquean.

## 6. Recomendaciones resumidas

1. Documentar y comunicar al staff que los listados sólo admiten 50 registros por página.
2. Implementar un proceso para pasar a `ACTIVE` a los socios que deban inscribirse, evitando confusiones en el módulo de inscripciones.
3. Evaluar paginación avanzada o filtros adicionales cuando el padrón supere los 50 miembros visibles.
4. Considerar exportaciones o endpoints batch para operaciones masivas futuras.
