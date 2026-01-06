# 📋 Guía de Administración - AppClub

Guía completa para administradores del Club. Cubre todas las funcionalidades disponibles en el panel administrativo, flujos operativos y mejores prácticas.

---

## 🏠 Panel Administrativo

### Acceso

- **URL**: `/admin`
- **Requisitos**: Rol `ADMIN` en la base de datos
- **Autenticación**: NextAuth con credenciales configuradas

### Estructura del Panel

```
/admin
├── Dashboard (vista principal)
├── Socios (CRUD completo)
├── Inscripciones (gestión de contratos)
├── Cuotas (control de pagos)
└── Reportes (métricas financieras)
```

---

## 👥 Gestión de Socios

### 1. Crear Nuevo Socio

1. **Acceso**: `/admin` → botón "+ Nuevo socio"
2. **Formulario requerido**:
   - **Datos personales**: Nombre completo, Email, Documento
   - **Contacto**: Teléfono, Dirección
   - **Información adicional**: Fecha de nacimiento, Notas internas
3. **Validaciones automáticas**:
   - Email único (formato válido)
   - Documento único (sin duplicados)
   - Campos obligatorios marcados con `*`

### 2. Editar Socio Existente

1. **Acceso**: Tabla de socios → clic en el socio → botón "Editar"
2. **Campos editables**: Todos excepto email y documento (para mantener integridad)
3. **Impacto**: Los cambios se reflejan inmediatamente en todo el sistema

### 3. Eliminar Socio

1. **Requisito**: Socio no debe tener inscripciones activas
2. **Proceso**:
   - Intentar eliminar → sistema valida restricciones
   - Si tiene inscripciones: mostrar error explicativo
   - Si está libre: confirmar eliminación
3. **Consecuencias**:
   - Todos los datos del socio se eliminan en cascada
   - No se puede deshacer esta acción

### 4. Estados de Socio

| Estado      | Significado                           | Cuándo cambia                      |
| ----------- | ------------------------------------- | ---------------------------------- |
| `PENDING`   | Recién creado, sin inscripción activa | Al crear o al eliminar inscripción |
| `ACTIVE`    | Al día con pagos                      | Tras registrar pagos suficientes   |
| `INACTIVE`  | Con deuda vencida                     | Cuando cuotas están OVERDUE        |
| `VITALICIO` | Miembro vitalicio                     | Tras 360 pagos (30 años)           |

---

## 📝 Gestión de Inscripciones

### 1. Crear Inscripción

1. **Requisitos**: Socio debe estar en estado `PENDING`
2. **Acceso**: `/admin/inscripciones` → "+ Nueva inscripción"
3. **Parámetros**:
   - **Socio**: Selector de socios pendientes
   - **Fecha de inicio**: Calendario (por defecto hoy)
   - **Plan**: Nombre del plan (ej: "Plan Standard")
   - **Monto mensual**: Valor de la cuota (autocompletado de config económica)
   - **Meses a generar**: Cantidad de cuotas futuras (default: 360)
   - **Meses pagados**: Cuotas ya abonadas (para inscripciones parciales)
4. **Resultado**:
   - Socio cambia a estado `ACTIVE`
   - Se generan cuotas automáticamente según configuración

### 2. Ver Detalles de Inscripción

1. **Acceso**: Tabla de inscripciones → clic en fila
2. **Información mostrada**:
   - Datos del socio y fechas clave
   - Resumen financiero (pagadas/pendientes/vencidas)
   - Tabla completa de cuotas con filtros

### 3. Eliminar Inscripción

1. **Requisito**: No debe tener cuotas pagadas
2. **Proceso**:
   - Intentar eliminar → sistema valida `hasPaidDues`
   - Si tiene pagos: error 409 explicativo
   - Si está libre: confirmar y eliminar
3. **Consecuencias**:
   - Todas las cuotas se eliminan
   - Socio vuelve a estado `PENDING`
   - Permite crear nueva inscripción

---

## 💳 Gestión de Cuotas y Pagos

### 1. Ver Cuotas

1. **Acceso**: `/admin/cuotas` o desde inscripción específica
2. **Filtros disponibles**:
   - **Estado**: PENDING, PAID, OVERDUE, FROZEN
   - **Socio**: Búsqueda por nombre o documento
   - **Fechas**: Rango de vencimiento
   - **Inscripción**: ID específico
3. **Columnas informativas**:
   - Vencimiento, monto, estado actual
   - Socio asociado y plan
   - Acciones rápidas (pagar, ver detalles)

### 2. Registrar Pago Manual

1. **Acceso**: Desde tabla de cuotas → botón "Pagar"
2. **Modal de pago**:
   - **Importe**: Autocompletado del monto de la cuota
   - **Método**: Efectivo, Transferencia, Mercado Pago
   - **Referencia**: Número de comprobante (opcional)
   - **Notas**: Detalles adicionales (opcional)
   - **Fecha de pago**: Calendario (por defecto hoy)
3. **Proceso backend**:
   - Valida que la cuota no esté ya pagada
   - Registra pago en tabla `payments`
   - Actualiza estado de cuota a `PAID`
   - Recalcula estado financiero del socio
   - Invalida cachés relevantes

### 3. Pagos Múltiples

1. **Acceso**: Desde inscripción → botón "Pagar cuotas"
2. **Funcionalidad**:
   - Seleccionar múltiples cuotas pendientes
   - Resumen dinámico de total a pagar
   - Mismo método y referencia para todas
   - Proceso batch optimizado

### 4. Estados de Cuotas

| Estado    | Significado                   | Comportamiento                   |
| --------- | ----------------------------- | -------------------------------- |
| `PENDING` | Pendiente de pago             | Disponible para pago             |
| `PAID`    | Pagada y conciliada           | No permite más pagos             |
| `OVERDUE` | Vencida (pasó fecha + gracia) | Afecta estado del socio          |
| `FROZEN`  | Congelada (socio inactivo)    | No permite pagos hasta reactivar |

---

## 📊 Reportes Financieros

### 1. Acceso a Reportes

- **URL**: `/admin/reportes`
- **Requisitos**: Rol `ADMIN`

### 2. Filtros Disponibles

- **Rango de fechas**: Desde/Hasta (formato ISO)
- **Granularidad**: Diario, Mensual, Anual
- **Planes**: Filtrar por plan específico o todos

### 3. Métricas Principales

- **Ingresos cobrados**: Total de pagos registrados en el período
- **Crecimiento neto**: Nuevos socios - bajas
- **Salud de cartera**: Distribución porcentual de estados de cuotas
- **Tendencias**: Gráficos de evolución temporal

### 4. Exportación

- **Formato**: CSV con todos los datos filtrados
- **Uso**: Análisis externos, presentaciones, auditorías

---

## ⚙️ Configuración Económica

### 1. Parámetros Configurables

- **Moneda**: Código ISO (default: ARS)
- **Monto mensual default**: Para nuevas inscripciones
- **Día de vencimiento**: Día del mes para nuevas cuotas
- **Período de gracia**: Días antes de marcar como OVERDUE
- **Porcentaje de mora**: Recargo por pago fuera de término

### 2. Acceso a Configuración

- **Ubicación**: Variables de entorno o tabla `economic_configs`
- **Impacto**: Afecta todas las inscripciones nuevas

---

## 🔐 Seguridad y Buenas Prácticas

### 1. Control de Acceso

- **Sesiones**: NextAuth maneja expiración automática
- **Roles**: Middleware valida `role === "ADMIN"` para rutas protegidas
- **Endpoints**: Todas las APIs validan sesión activa

### 2. Validaciones Automáticas

- **Formularios**: React Hook Form + Zod para validación cliente/servidor
- **Constraints**: Base de datos previene duplicados y inconsistencias
- **Errores**: Mensajes claros con códigos HTTP estándar

### 3. Auditoría

- **Logs**: Todas las acciones administrativas se registran
- **Trazabilidad**: IDs de socio, inscripción, cuota en cada operación
- **Historial**: Cambios de estado y fechas de modificación

---

## 🚨 Manejo de Incidentes

### 1. Errores Comunes

| Situación                                    | Solución                                        |
| -------------------------------------------- | ----------------------------------------------- |
| "Solo se pueden inscribir socios pendientes" | Verificar estado actual del socio en tabla      |
| Cuota no encontrada                          | Refrescar la vista o verificar ID correcto      |
| Error de pago duplicado                      | Sistema previene pagos múltiples de misma cuota |

### 2. Procedimientos de Recuperación

1. **Refrescar datos**: Botón "Actualizar" en las tablas
2. **Verificar logs**: Consola del navegador y logs del servidor
3. **Validar estado**: Usar endpoint `/api/debug/member-status`
4. **Contactar soporte**: Con IDs específicos y capturas

### 3. Scripts de Mantenimiento

```bash
# Generar cuotas mensuales
npm run jobs:generate-dues admin

# Limpiar inscripciones (solo desarrollo)
npm run reset:enrollments

# Verificar duplicados
npx tsx scripts/check-enrollment-duplicates.ts
```

---

## 📱 Credencial Digital

### 1. Requisitos para Socio

- **Estado**: `ACTIVE` o `VITALICIO`
- **Pagos**: Al menos una cuota registrada
- **Inscripción**: Vigente y activa

### 2. Generación Automática

- **Endpoint**: `GET /api/socios/me/credential`
- **Contenido**: QR con datos verificables
- **Acceso**: Desde panel del socio (`/socio`)

### 3. Verificación Admin

- **Endpoint**: `GET /api/socios/{memberId}/credential`
- **Uso**: Auditoría y soporte

---

## 🎯 Checklist Operativo Diario

### ✅ Mañana

- [ ] Verificar estado del servidor
- [ ] Revisar logs de errores nocturnos
- [ ] Confirmar ejecución del job mensual (si corresponde)

### ✅ Durante el día

- [ ] Procesar altas de socios pendientes
- [ ] Registrar pagos recibidos
- [ ] Monitorear estados financieros

### ✅ Fin del día

- [ ] Generar reporte de ingresos del día
- [ ] Verificar consistencia de datos
- [ ] Documentar incidencias si las hubo

---

## 📞 Soporte y Contacto

### Canales de Escalamiento

1. **Soporte N1**: `soporte@club.test` - dudas operativas
2. **Operaciones**: `ops@club.test` - incidencias técnicas
3. **Emergencia**: `+54 11 5555-0000` - caídas totales

### Información para Tickets

- **IDs involucrados**: Socio, inscripción, cuota, pago
- **Timestamps**: Fecha/hora exacta del incidente
- **Capturas**: Pantallazos del error
- **Pasos**: Qué se estaba haciendo cuando ocurrió

---

## 🔮 Próximas Mejoras

### Funcionalidades en Desarrollo

- **Notificaciones automáticas**: Email/SMS para vencimientos
- **Portal de autoservicio**: Socios gestionan propios datos
- **Integración bancaria**: Débitos automáticos
- **Métricas avanzadas**: Análisis predictivo de cartera

### Mejoras Técnicas

- **Rate limiting**: Protección contra abusos
- **Monitoreo avanzado**: Sentry + alertas automáticas
- **Backup automático**: Exportaciones programadas

---

_Esta guía se mantiene actualizada con cada cambio funcional. Para sugerencias o correcciones, contactar al equipo de desarrollo._
