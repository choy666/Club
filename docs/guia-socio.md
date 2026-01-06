# 👤 Guía del Socio - AppClub

Guía completa para socios del Club. Explica cómo usar el panel personal, verificar credenciales y gestionar la información de la membresía.

---

## 🏠 Panel del Socio

### Acceso

- **URL**: `/socio`
- **Requisitos**: Rol `USER` en la base de datos
- **Autenticación**: NextAuth con credenciales personales

### Estructura del Panel

```
/socio
├── Perfil Personal (datos básicos)
├── Estado Financiero (resumen de pagos)
├── Cuotas (detalle mensual)
├── Credencial Digital (QR de acceso)
└── Configuración (datos de contacto)
```

---

## 👤 Perfil Personal

### 1. Información Básica

- **Nombre completo**: Mostrado en todas las vistas
- **Documento**: Identificador único del socio
- **Email**: Para comunicaciones oficiales
- **Teléfono**: Contacto directo
- **Dirección**: Domicilio registrado
- **Fecha de nacimiento**: Para validaciones de edad

### 2. Actualizar Datos

1. **Acceso**: `/socio` → sección "Perfil" → botón "Editar"
2. **Campos modificables**:
   - Teléfono
   - Dirección
   - Notas personales
3. **Campos protegidos**:
   - Nombre y documento (requieren gestión administrativa)
   - Email (validación de identidad)

### 3. Foto de Perfil

- **Estado**: Funcionalidad en desarrollo
- **Próximamente**: Subida y recorte automático

---

## 💳 Estado Financiero

### 1. Resumen General

El panel muestra un resumen visual con:

- **Estado actual**: ACTIVE, PENDING, INACTIVE, VITALICIO
- **Cuotas pagadas**: Número y porcentaje
- **Cuotas pendientes**: Próximos vencimientos
- **Cuotas vencidas**: Deuda actual si existe

### 2. Estados Posibles

| Estado      | Significado           | Qué significa para vos                  |
| ----------- | --------------------- | --------------------------------------- |
| `ACTIVE`    | Al día con pagos      | Tenés acceso completo a beneficios      |
| `PENDING`   | Esperando primer pago | Necesitás regularizar para acceso pleno |
| `INACTIVE`  | Con deuda vencida     | Acceso limitado hasta regularizar       |
| `VITALICIO` | Miembro vitalicio     | Acceso permanente sin pagos             |

### 3. Alertas Visuales

- **🟢 Verde**: Todo al día
- **🟡 Amarillo**: Próximos vencimientos (7 días)
- **🔴 Rojo**: Deuda vencida o pagos pendientes

---

## 📅 Gestión de Cuotas

### 1. Listado de Cuotas

1. **Acceso**: `/socio` → sección "Cuotas"
2. **Información por cuota**:
   - **Mes y año**: Período correspondiente
   - **Monto**: Valor a pagar
   - **Vencimiento**: Fecha límite de pago
   - **Estado**: PENDING, PAID, OVERDUE
   - **Fecha de pago**: Si ya fue abonada

### 2. Estados de Cuotas

| Estado    | Descripción       | Acciones disponibles     |
| --------- | ----------------- | ------------------------ |
| `PENDING` | Pendiente de pago | Puede pagarla            |
| `PAID`    | Ya pagada         | Solo consulta            |
| `OVERDUE` | Vencida           | Pagar urgentemente       |
| `FROZEN`  | Congelada         | Contactar administración |

### 3. Métodos de Pago

- **Efectivo**: En las oficinas del Club
- **Transferencia bancaria**: Datos en panel administrativo
- **Mercado Pago**: Link de pago (próximamente)
- **Débito automático**: En desarrollo

### 4. Proceso de Pago

1. **Seleccionar cuota**: Clic en la cuota pendiente
2. **Verificar datos**: Confirmar monto y vencimiento
3. **Realizar pago**: Según método elegido
4. **Comprobante**: Guardar número de operación
5. **Confirmación**: El sistema actualiza automáticamente

---

## 📱 Credencial Digital

### 1. ¿Qué es la Credencial Digital?

Es un código QR único que te identifica como socio activo del Club. Permite:

- **Acceso a instalaciones**: Escaneo en entradas
- **Verificación de estado**: Personal autorizada puede validar
- **Beneficios**: Descuentos y promociones asociadas

### 2. Requisitos para Obtenerla

- **Estado del socio**: `ACTIVE` o `VITALICIO`
- **Inscripción activa**: Contrato vigente
- **Al menos un pago**: Para activar la credencial

### 3. Cómo Obtener tu Credencial

1. **Acceso**: `/socio` → sección "Credencial Digital"
2. **Verificar requisitos**: El sistema indica si estás listo
3. **Generar QR**: Botón "Generar credencial"
4. **Guardar**: Captura de pantalla o descarga

### 4. Estados de la Credencial

| Estado                   | Significado                       | Qué hacer                |
| ------------------------ | --------------------------------- | ------------------------ |
| "Inscripción pendiente"  | Aún no activaste tu inscripción   | Contactar administración |
| "Esperando pago inicial" | Inscripción activa pero sin pagos | Realizar primer pago     |
| "Credencial activa"      | Todo en orden                     | QR disponible para uso   |

### 5. Uso del QR

- **Entrada al Club**: Presentar en recepción
- **Eventos**: Validación en actividades especiales
- **Descuentos**: Mostrar en comercios adheridos
- **Verificación**: Cualquier autoridad puede escanearlo

---

## 🔔 Notificaciones y Comunicaciones

### 1. Tipos de Notificaciones

- **Vencimientos**: Recordatorios de pagos pendientes
- **Pagos registrados**: Confirmación de recibos
- **Cambios de estado**: Actualizaciones de membresía
- **Comunicados**: Información general del Club

### 2. Canales de Comunicación

- **Panel del socio**: Centro de notificaciones principal
- **Email**: Comunicaciones oficiales detalladas
- **SMS**: Alertas urgentes (próximamente)
- **Push**: Notificaciones instantáneas (en desarrollo)

### 3. Configuración de Preferencias

1. **Acceso**: `/socio` → "Configuración"
2. **Opciones disponibles**:
   - Frecuencia de recordatorios
   - Canales preferidos
   - Horarios de notificación
3. **Guardar cambios**: Se aplican inmediatamente

---

## 📊 Historial y Reportes

### 1. Historial de Pagos

- **Acceso**: Desde sección "Cuotas" → "Historial"
- **Información**: Todas las transacciones realizadas
- **Filtros**: Por rango de fechas o estado
- **Exportación**: Descargar en PDF para archivos personales

### 2. Certificados

- **Constancia de socio**: Documento oficial de membresía
- **Certificado de pagos**: Historial de cuotas abonadas
- **Estado de cuenta**: Resumen financiero actual
- **Solicitud**: Generar y descargar desde el panel

### 3. Estadísticas Personales

- **Antigüedad**: Tiempo como socio del Club
- **Total abonado**: Acumulado histórico de pagos
- **Asistencia**: Eventos y actividades (en desarrollo)
- **Beneficios**: Descuentos utilizados (próximamente)

---

## 🔐 Seguridad y Privacidad

### 1. Protección de Datos

- **Encriptación**: Todas las contraseñas hasheadas
- **HTTPS**: Comunicaciones seguras
- **Privacidad**: Datos compartidos solo con autorización

### 2. Contraseña Segura

- **Requisitos**: Mínimo 8 caracteres, mayúsculas, números
- **Recuperación**: Email de restablecimiento seguro
- **Doble factor**: En implementación

### 3. Sesión Activa

- **Duración**: 24 horas de inactividad
- **Cierre manual**: Botón "Cerrar sesión"
- **Dispositivos**: Verificar sesiones activas

---

## 📱 Aplicación Móvil

### 1. Funcionalidades Disponibles

- **Acceso rápido**: Biometría y PIN
- **Notificaciones push**: Instantáneas y personalizadas
- **QR offline**: Credencial sin conexión
- **Pagos móviles**: Integración con billeteras digitales

### 2. Descarga e Instalación

- **App Store**: Buscar "AppClub Socio"
- **Google Play**: Buscar "AppClub Socio"
- **Versión web**: m.club.test (funcionalidad reducida)

### 3. Sincronización

- **Automática**: Datos se actualizan en tiempo real
- **Offline**: Funcionalidad básica sin conexión
- **Respaldo**: Información segura en la nube

---

## 🆘 Soporte y Ayuda

### 1. Problemas Comunes

| Problema          | Solución                                                    |
| ----------------- | ----------------------------------------------------------- |
| No puedo acceder  | Verificar usuario y contraseña, usar "Olvidé mi contraseña" |
| No veo mis cuotas | Refrescar la página, verificar conexión a internet          |
| El QR no funciona | Asegurar estar activo, generar nueva credencial             |
| Pago no aparece   | Esperar 5 minutos, luego contactar soporte                  |

### 2. Canales de Soporte

1. **Autogestión**: FAQ en el panel del socio
2. **Email**: soporte@club.test (respuesta 24-48hs)
3. **Teléfono**: +54 11 5555-0001 (lunes a viernes, 9-18hs)
4. **WhatsApp**: +54 11 5555-0002 (consultas rápidas)

### 3. Información para Soporte

- **Nombre completo y documento**
- **Descripción del problema**
- **Captura de pantalla del error**
- **Hora y fecha del incidente**
- **Navegador o app utilizados**

---

## 🎯 Buenas Prácticas

### 1. Mantenimiento de la Cuenta

- **Actualizar datos**: Mantener teléfono y email actuales
- **Contraseña segura**: Cambiar cada 3 meses
- **Revisar cuotas**: Mensualmente para evitar vencimientos
- **Guardar comprobantes**: Archivar todos los pagos

### 2. Uso de Beneficios

- **Presentar credencial**: Siempre que se solicite
- **Verificar descuentos**: Consultar lista de comercios adheridos
- **Participar**: Eventos exclusivos para socios
- **Invitar amigos**: Programa de referidos (próximamente)

### 3. Comunicación Efectiva

- **Leer comunicados**: Mantenerse informado
- **Responder encuestas**: Ayudar a mejorar el servicio
- **Reportar problemas**: Colaborar con la mejora continua
- **Sugerir mejoras**: Ideas para nuevos beneficios

---

## 🔮 Próximas Funcionalidades

### En Desarrollo

- **Pagos online**: Integración con tarjetas de crédito
- **Agenda de actividades**: Inscripción a eventos y talleres
- **Chat interno**: Comunicación directa con administración
- **Gamificación**: Puntos y recompensas por participación

### Mejoras Planificadas

- **Asistente virtual**: AI para consultas frecuentes
- **Integración con calendario**: Recordatorios personales
- **Mapa de instalaciones**: Ubicación y disponibilidad
- **Comunidad social**: Foro y grupos de interés

---

## 📞 Contactos Importantes

### Administración del Club

- **Email**: admin@club.test
- **Teléfono**: +54 11 5555-0000
- **Dirección**: Calle Principal 123, Ciudad
- **Horarios**: Lunes a viernes 9-18hs, sábados 9-13hs

### Servicios de Emergencia

- **Pérdida de credencial**: WhatsApp +54 11 5555-0003
- **Problemas de pago**: Email pagos@club.test
- **Incidentes técnicos**: Email soporte@club.test

### Redes Sociales

- **Facebook**: @ClubOficial
- **Instagram**: @club_socios
- **Twitter**: @ClubUpdates
- **YouTube**: Club Oficial (videos tutoriales)

---

_Esta guía se actualiza regularmente con nuevas funcionalidades. Para sugerencias o reportar errores, contactar a soporte@club.test._
