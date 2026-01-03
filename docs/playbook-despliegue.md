# 🚀 Playbook de despliegue (Vercel + Drizzle/Neon)

Documento operativo para publicar `club-app` en producción usando **Vercel** (frontend/API) y **Neon + Drizzle ORM** (PostgreSQL). Incluye prerrequisitos, checklist de ejecución, validaciones posteriores y estrategia de reversión.

---

## 1. Roles y alcances

- **Responsable de release**: valida código, coordina QA, ejecuta migraciones y despliega en Vercel.
- **Soporte de datos (DBA/Backend)**: crea ramas en Neon, supervisa migraciones y prepara restauraciones en caso de rollback.
- **Observabilidad**: monitorea métricas/alertas (p. ej. Sentry, Healthchecks) durante y después del deploy.

---

## 2. Prerrequisitos técnicos

1. **Accesos**
   - Organización/proyecto en Vercel con permisos de `Deploy`.
   - Cuenta Neon con acceso a la instancia productiva y a la rama `main` (o `production`).
   - Gestión de secretos vía Vercel (`vercel env`) o dashboard.
2. **Variables de entorno mínimas**
   - `DATABASE_URL` (cadena Neon, incluye `?sslmode=require`).
   - `NEXTAUTH_SECRET` (>=32 chars, rotada regularmente).
   - `NEXTAUTH_URL` (URL pública del deploy).
   - `AUTH_ADMIN_EMAIL`, `AUTH_ADMIN_PASSWORD_HASH` (solo para bootstrap o rotación controlada).
   - `NEXT_PUBLIC_APP_URL` (misma URL pública para clientes).
   - Futuras integraciones: `SENTRY_DSN`, `LOGFLARE_API_KEY`, etc. deben agregarse aquí.
3. **Scripts locales** (ver `package.json` y `docs/comandos.md`)
   - `npm run lint`, `npm run lint:types`, `npm run test`, `npm run test:e2e`.
   - `npm run db:migrate` (Drizzle Kit), `npm run seed:admin` (si se rota el admin).
4. **CI/CD**
   - Repositorio conectado a Vercel con auto-deploy en `main`. Branches adicionales generan Deploy Previews para QA.

---

## 3. Flujo resumido de release

1. Merge de PRs a `main` una vez aprobadas (incluye migraciones).
2. `main` dispara build en Vercel → Deploy Preview final.
3. Se ejecuta checklist previa (tests + migraciones en rama de staging Neon).
4. Al aprobar, se promueve el build a producción (Vercel) y se aplican migraciones en la rama productiva de Neon.
5. Validación post-deploy y monitoreo activo.

---

## 4. Checklist previa al despliegue

| Paso                  | Detalle                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Código limpio         | `git status` sin cambios pendientes / PR aprobado.                                                         |
| QA automatizado       | `npm run lint && npm run lint:types && npm run test -- --run && npm run test:e2e`.                         |
| Migraciones revisadas | Confirmar que `drizzle/` contiene solo los cambios necesarios (sin archivos generados de más).             |
| Data-seeding          | Definir si se requiere `npm run seed:admin` u otras semillas controladas (solo en entornos seguros).       |
| Variables en Vercel   | Revisar `vercel env pull` y confirmar que producción/staging tienen los secrets actualizados.              |
| Backups Neon          | Crear **branch** o **snapshot** antes de aplicar migraciones (`neonctl branches create release-YYYYMMDD`). |

> Si cualquier paso falla, detener el release hasta resolver.

---

## 5. Procedimiento de despliegue

1. **Preparar migraciones**
   - En local o runner CI: `npm run db:migrate` contra la rama _staging_ de Neon.
   - Validar datos clave (usuarios admin, members de QA) ejecutando queries rápidas o `psql`.
2. **Aplicar migraciones en producción**
   - Cambiar a la rama productiva de Neon (`main`/`production`).
   - `DATABASE_URL` → producción.
   - Ejecutar `npm run db:migrate` y revisar logs.
3. **Desplegar en Vercel**
   - Opción A (automático): merge a `main` → esperar build y marcarlo como `Production` desde Deployments.
   - Opción B (manual): `vercel --prod` desde local/CI con `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` configurados.
4. **Seeds opcionales**
   - Si el admin fue reseteado, correr `npm run seed:admin` con las nuevas credenciales (nunca dejar passwords por defecto tras el deploy).
5. **Comunicar release**
   - Anunciar en el canal operativo: versión, hora, cambios principales, responsables y ventana de observación.

---

## 6. Validaciones post-deploy

| Área            | Validación                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Salud general   | Ver `Deployments` en Vercel (logs sin errores), estado 200 en `/` y `/auth/signin`.                                                      |
| Autenticación   | Login de admin en `/auth/signin`, acceso a `/admin`.                                                                                     |
| Flujos críticos | Ejecutar smoke test: crear socio → inscripción → pago → revisar `/admin/reportes`.                                                       |
| Jobs/eventos    | Confirmar que React Query invalidations y recalculos (`refreshMemberFinancialStatus`) funcionan revisando logs y UI.                     |
| Observabilidad  | Chequear que Sentry/monitor elegido recibe eventos (en staging se envía un `test event`).                                                |
| Base de datos   | Consultar tabla `drizzle_migrations` para asegurarse de que las migraciones se aplicaron; revisar conteos clave (`members`, `payments`). |

Registrar resultados en el canal/documento de release. Cualquier incidente debe abrir un ticket con impacto, causa, plan de acción.

---

## 7. Estrategia de rollback

1. **Aplicación (Vercel)**
   - Desde `Deployments`, seleccionar la versión previa estable y presionar **“Promote to Production”**.
   - Confirmar que el nuevo despliegue antiguo se activa y monitorear tráfico (Vercel mantiene logs históricos).
2. **Base de datos (Neon)**
   - Si las migraciones rompieron el estado:
     1. Suspender tráfico (modo mantenimiento temporal / mensaje en app).
     2. Recrear la rama desde el snapshot previo (`neon branches restore release-YYYYMMDD`).
     3. Actualizar `DATABASE_URL` para apuntar a la rama restaurada.
     4. Documentar pérdida de datos si existió tráfico entre la migración y el rollback.
3. **Coordinación**
   - Notificar en canal operativo: motivo del rollback, punto restaurado, próximos pasos. Registrar en postmortem.

> Siempre preferir migraciones **reversibles** o `safe` (no-drop) para minimizar necesidad de restaurar snapshots.

---

## 8. Buenas prácticas adicionales

- Automatizar el checklist vía CI (GitHub Actions/CI Vercel) para asegurar que lint/tests/e2e corran antes de la promoción.
- Mantener `drizzle/` sincronizado en main; no incluir migraciones en PRs sin pruebas asociadas.
- Registrar en `docs/auditoria-seguridad.md` cada vez que se rota un secreto o se cambia la estrategia de observabilidad.
- Mantener un **Runbook de incidentes** con contactos y procedimientos (próximo documento en Sprint 6).

Con este playbook el equipo puede realizar despliegues consistentes, auditar los pasos críticos y revertir de forma segura en caso de incidentes.
