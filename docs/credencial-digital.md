# Credencial digital AppClub (enero 2026)

Documenta cómo se genera, consulta y utiliza la credencial digital minimalista para socios activos al día.

---

## 1. Objetivo y alcance

- **Propósito:** facilitar controles de acceso presenciales (torniquetes, recepción) y ofrecer al socio un comprobante rápido de vigencia.
- La credencial se habilita cuando existe una inscripción `ACTIVE` y al menos una cuota registrada como `PAID`.
- Cualquier cambio en el estado financiero (pagos, congelamiento, cancelación) se reflejará al volver a consultar la API.

---

## 2. API y servicios

| Endpoint                                | Rol requerido | Descripción                                                    |
| --------------------------------------- | ------------- | -------------------------------------------------------------- |
| `GET /api/socios/me/credential`         | USER          | Devuelve la credencial del socio autenticado.                  |
| `GET /api/socios/{memberId}/credential` | ADMIN         | Devuelve la credencial del socio indicado (auditoría/soporte). |

- Ambos endpoints llaman a `getMemberCredential(memberId)`.
- El servicio consulta al socio, su inscripción más reciente y refresca su estado financiero (`refreshMemberFinancialStatus`).
- Si se cumplen los requisitos, se construye `credential.code`, `credential.issuedAt` y `credential.qrPayload`.
- `qrPayload` es un JSON Base64URL con firma determinística (`SHA-256` sobre `memberId`, `enrollmentId`, `updatedAt`). No contiene secretos.

---

## 3. Hooks y componentes frontend

- `useMyCredential` y `useMemberCredential` (React Query) exponen el DTO al cliente.
- `MemberCredentialCard` renderiza estado, datos de socio/inscripción, código y QR (usa `qrcode` + `next/image`).
- Integramos la card en `/socio` (visión del socio) y `/admin/inscripciones` (modal con detalle).
- Acciones disponibles: refrescar credencial, copiar código, visualizar QR y requisitos cuando aún no está lista.

---

## 4. Estados visibles y mensajes

| Estado en UI           | Condición                                                                      |
| ---------------------- | ------------------------------------------------------------------------------ |
| Inscripción pendiente  | No existe inscripción o está en `PENDING`/`CANCELLED`.                         |
| Esperando pago inicial | Inscripción en `ACTIVE`, pero sin cuotas pagadas.                              |
| Credencial activa      | Inscripción `ACTIVE` + al menos una cuota `PAID` + status financiero `ACTIVE`. |

Los textos están en `MemberCredentialCard`. Se anima a comunicar al socio que regularice pagos si el QR no aparece.

---

## 5. Consideraciones operativas

1. **Unicidad:** la tabla `enrollments` mantiene un índice único por socio; evitar altas manuales duplicadas.
2. **Pagos:** registrar siempre vía `/api/pagos` o scripts oficiales (`scripts/generate-monthly-dues.ts`, `scripts/check-enrollment-duplicates.ts`).
3. **Config económica:** la fila `economic_configs.slug = "default"` debe tener montos válidos; en caso contrario la inscripción falla y la credencial nunca se habilita.
4. **Congelamientos:** si un socio pasa a `INACTIVE` por política de congelamiento, la credencial deja de estar disponible automáticamente.
5. **Seguridad:** no se exponen tokens ni secretos; lo único escaneable es un identificador firmado que puede validarse contra la API.

---

## 6. Próximos pasos sugeridos

- Endpoint de validación portátil (`POST /api/credential/validate`) para permitir verificadores externos.
- Revocación inmediata cuando se detectan accesos indebidos (flag en DB + invalidación de hash).
- Historial de regeneraciones (auditoría) en una tabla `credential_audit`.
- Integración opcional con passbook / wallet en dispositivos móviles.
