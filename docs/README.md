# 📚 Índice de Documentación - AppClub

Bienvenido a la documentación centralizada de AppClub. Aquí encontrarás toda la información necesaria para administrar, usar y mantener el sistema de gestión del Club.

---

## 🎯 Guías Principales

### 👥 [Guía de Administración](./guia-administracion.md)

**Para administradores del Club**

- Panel administrativo completo
- Gestión de socios e inscripciones
- Procesamiento de pagos y cuotas
- Reportes financieros y métricas
- Seguridad y buenas prácticas

### 👤 [Guía del Socio](./guia-socio.md)

**Para socios del Club**

- Panel personal y perfil
- Estado financiero y cuotas
- Credencial digital con QR
- Notificaciones y comunicación
- Soporte y ayuda

---

## 🔧 Documentación Técnica

### 📦 [Comandos del Proyecto](./comandos.md)

**Scripts y utilidades esenciales**

- Desarrollo diario y testing
- Build y despliegue
- Jobs operativos y mantenimiento
- Base de datos y migraciones
- Seeds y utilidades

### 🔐 [Auditoría de Seguridad](./auditoria-seguridad.md)

**Seguridad y monitoreo del sistema**

- Credenciales y configuración
- Hashing y manejo de contraseñas
- Roles y permisos
- Monitoreo y alertas
- Checklist de seguridad

### 📋 [Guía de Soporte](./guia-soporte.md)

**Para equipo de soporte y operaciones**

- Equipo y puntos de contacto
- Flujos críticos y procedimientos
- Ejecución de pruebas E2E
- Monitoreo continuo
- Registro de incidentes

---

## 📄 Documentación Específica

### 💳 [Cuotas Mensuales](./cuotas-mensuales.md)

**Configuración y gestión de cuotas**

- Generación automática
- Estados y transiciones
- Configuración económica

### 🆔 [Credencial Digital](./credencial-digital.md)

**Sistema de identificación QR**

- Requisitos y generación
- Verificación y uso
- Estados y validaciones

### 🚀 [Playbook de Despliegue](./playbook-despliegue.md)

**Procedimientos de despliegue**

- Entornos y configuración
- Migraciones y seeds
- Verificación post-deploy

### 📊 [Limitaciones Admin](./limitaciones-admin-appclub.md)

**Restricciones y consideraciones**

- Límites del sistema
- Casos no soportados
- Recomendaciones de uso

### 🛠️ [Runbook de Incidentes](./runbook-incidentes.md)

**Manejo de emergencias**

- Procedimientos estándar
- Escalation y comunicación
- Recuperación post-incidente

---

## 🏗️ Arquitectura y Desarrollo

### 📋 [Auditoría Final](./auditoriaFinal.md)

**Estado completo del proyecto**

- Revisión de arquitectura
- Validación de seguridad
- Recomendaciones finales

### 🎨 [Identidad Visual](./identidadVisual.md)

**Guía de marca y diseño**

- Colores y tipografía
- Componentes visuales
- Aplicación consistente

---

## 🔄 Documentación por Sprint

### Sprint 0-2: Fundamentos

- **Infraestructura**: Neon + Drizzle + NextAuth
- **CRUD Socios**: Formularios y validaciones
- **Identidad Visual**: Diseño glass y animaciones

### Sprint 3-4: Funcionalidad Core

- **Inscripciones**: Gestión económica y cuotas
- **Pagos**: Conciliación y estados financieros
- **Reportes**: Métricas y visualizaciones

### Sprint 5-6: Endurecimiento

- **Seguridad**: Auditoría y monitoreo
- **Testing**: E2E y cobertura
- **Deploy**: Producción y mantenimiento

---

## 📥 Referencias Rápidas

### Endpoints Principales

| Ruta                 | Método   | Descripción               |
| -------------------- | -------- | ------------------------- |
| `/api/socios`        | GET/POST | Gestión de socios         |
| `/api/inscripciones` | GET/POST | Inscripciones y contratos |
| `/api/cuotas`        | GET/POST | Cuotas y pagos            |
| `/api/reportes`      | GET      | Métricas financieras      |
| `/api/auth/*`        | POST     | Autenticación             |

### Estados del Sistema

| Entidad         | Estados                              | Significado               |
| --------------- | ------------------------------------ | ------------------------- |
| **Socio**       | PENDING, ACTIVE, INACTIVE, VITALICIO | Ciclo de vida del miembro |
| **Inscripción** | PENDING, ACTIVE, CANCELLED           | Estado del contrato       |
| **Cuota**       | PENDING, PAID, OVERDUE, FROZEN       | Ciclo de pago             |

### Scripts Útiles

```bash
# Desarrollo
npm run dev          # Servidor local
npm run test         # Ejecutar tests
npm run lint         # Validar código

# Base de datos
npm run db:generate  # Crear migraciones
npm run db:migrate   # Aplicar cambios
npm run seed:admin   # Crear admin

# Operaciones
npm run jobs:generate-dues admin  # Generar cuotas
npm run reset:enrollments          # Limpiar datos
```

---

## 🆘 Soporte y Ayuda

### Canales de Contacto

- **Soporte Técnico**: `devs@club.test`
- **Operaciones**: `ops@club.test`
- **Emergencias**: `+54 11 5555-0000`

### Reporte de Issues

1. **Descripción clara**: Qué pasó y cuándo
2. **Pasos para reproducir**: Detallados y secuenciales
3. **Información técnica**: Navegador, versión, errores
4. **Impacto**: Usuarios afectados y severidad

### Contribuciones

- **Documentación**: Enviar PRs con mejoras
- **Correcciones**: Reportar errores o desactualizaciones
- **Sugerencias**: Proponer nuevas guías o secciones

---

## 📈 Estado Actual de la Documentación

| Documento              | Estado         | Última Actualización | Responsable |
| ---------------------- | -------------- | -------------------- | ----------- |
| Guía de Administración | ✅ Completa    | 06/01/2026           |
| Guía del Socio         | ✅ Completa    | 06/01/2026           |
| Comandos del Proyecto  | ✅ Actualizado | 06/01/2026           |
| Auditoría de Seguridad | ✅ Actualizada | 06/01/2026           |
| Guía de Soporte        | ✅ Completa    | 06/01/2026           |
| Índice General         | ✅ Creado      | 06/01/2026           |

---

## 🔮 Próximas Actualizaciones

### Planeado para Q1 2026

- **Guía de API**: Documentación técnica completa
- **Tutoriales en video**: Guías visuales paso a paso
- **FAQ extendido**: Preguntas frecuentes actualizadas
- **Guía de migración**: Para actualizaciones mayores

### En Progreso

- **Integración con Mercado Pago**: Documentación de pagos online
- **Móvil**: Guía específica para app móvil
- **Avanzado**: Configuración de entornos complejos

---

_Esta documentación es un proyecto vivo. Se actualiza continuamente con cada cambio funcional y mejora del sistema. Para contribuir o reportar problemas, contactar al equipo de desarrollo._

---

**Última actualización**: 6 de Enero de 2026  
**Versión**: v2.0.0  
**Mantenido por**: Equipo de Desarrollo AppClub
