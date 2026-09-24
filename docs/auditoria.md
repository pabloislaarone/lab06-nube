# Registro de auditoría

Cada intento de acceso genera un registro en la tabla `Auditoria`, incluidos los permitidos, los denegados por RBAC o ABAC, los intentos sin token o con token inválido y los logins fallidos.

## Campos

| Campo | Descripción |
|---|---|
| usuario | Correo de quien realizó la solicitud (`ANONIMO` si no se identificó). |
| recurso | Recurso solicitado: `documento-{id}`, `documentos`, `usuario-{id}`, `usuarios`, `auditoria`, `sesion`. |
| accion | Operación: LOGIN, LOGOUT, LIST, READ, CREATE, UPDATE, DELETE, APPROVE, LIST_USERS, CREATE_USER, UPDATE_USER, VER_AUDITORIA. |
| fecha | Fecha y hora en formato ISO 8601 (UTC). |
| resultado | `PERMITIDO`, `DENEGADO` (401/403) o `ERROR` (datos inválidos, recurso inexistente, etc.). |
| motivo | Razón de la autorización o del rechazo, con la etapa (RBAC o ABAC) y las políticas incumplidas. |
| direccion_ip | IP de origen de la petición. |

## Consulta

- **API:** `GET /auditoria?limite=200` (requiere el permiso `ver_auditoria`).
- **Aplicación:** sección **Auditoría**, con filtro por resultado.

## Ejemplo de registros

Registros generados por el sistema al ejecutar los escenarios de prueba:

```json
[
  {
    "usuario": "ana@techcorp.com",
    "recurso": "documento-1",
    "accion": "READ",
    "fecha": "2026-09-24T02:22:50.711Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 1 - Departamento (RRHH != FINANZAS); Política 2 - Nivel de seguridad (2 < 3)"
  },
  {
    "usuario": "ana@techcorp.com",
    "recurso": "documento-2",
    "accion": "READ",
    "fecha": "2026-09-24T02:22:51.527Z",
    "resultado": "PERMITIDO",
    "motivo": "Autorizado: RBAC (El rol EMPLEADO tiene el permiso consultar_documento.) + ABAC (cumple las políticas aplicables)."
  },
  {
    "usuario": "ana@techcorp.com",
    "recurso": "documento-5",
    "accion": "APPROVE",
    "fecha": "2026-09-24T02:42:33.725Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por RBAC: El rol EMPLEADO no tiene el permiso aprobar_documento."
  },
  {
    "usuario": "auditor@techcorp.com",
    "recurso": "documento-1",
    "accion": "UPDATE",
    "fecha": "2026-09-24T02:42:33.733Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por RBAC: El rol AUDITOR no tiene el permiso modificar_documento."
  },
  {
    "usuario": "pedro@techcorp.com",
    "recurso": "documento-3",
    "accion": "READ",
    "fecha": "2026-09-24T02:42:33.744Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 2 - Nivel de seguridad (2 < 4)"
  },
  {
    "usuario": "maria@techcorp.com",
    "recurso": "documento-3",
    "accion": "READ",
    "fecha": "2026-09-24T02:42:33.754Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 4 - Horario (20:00 fuera de 08:00-18:00)"
  },
  {
    "usuario": "carlos@techcorp.com",
    "recurso": "documento-1",
    "accion": "READ",
    "fecha": "2026-09-24T02:42:33.777Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 5 - País (usuario PERU, ubicación CHILE, documento PERU)"
  },
  {
    "usuario": "carlos@techcorp.com",
    "recurso": "documento-6",
    "accion": "UPDATE",
    "fecha": "2026-09-24T02:42:33.788Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 3 - Propiedad (usuario 2 != propietario 8)"
  },
  {
    "usuario": "maria@techcorp.com",
    "recurso": "documento-4",
    "accion": "READ",
    "fecha": "2026-09-24T02:22:56.211Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 6 - Dispositivo (dispositivo PERSONAL, se requiere CORPORATIVO)"
  },
  {
    "usuario": "carlos@techcorp.com",
    "recurso": "documento-1",
    "accion": "APPROVE",
    "fecha": "2026-09-24T02:42:33.801Z",
    "resultado": "PERMITIDO",
    "motivo": "Autorizado: RBAC (El rol SUPERVISOR tiene el permiso aprobar_documento.) + ABAC (cumple las políticas aplicables)."
  },
  {
    "usuario": "maria@techcorp.com",
    "recurso": "documento-6",
    "accion": "DELETE",
    "fecha": "2026-09-24T02:42:33.813Z",
    "resultado": "PERMITIDO",
    "motivo": "Autorizado: RBAC (El rol GERENTE tiene el permiso eliminar_documento.) + ABAC (cumple las políticas aplicables)."
  },
  {
    "usuario": "luis@techcorp.com",
    "recurso": "sesion",
    "accion": "LOGIN",
    "fecha": "2026-09-24T02:23:06.127Z",
    "resultado": "DENEGADO",
    "motivo": "Denegado por ABAC: Política 7 - Estado del usuario (estado INACTIVO)"
  },
  {
    "usuario": "ana@techcorp.com",
    "recurso": "sesion",
    "accion": "LOGIN",
    "fecha": "2026-09-24T02:42:33.863Z",
    "resultado": "DENEGADO",
    "motivo": "Credenciales inválidas."
  },
  {
    "usuario": "ANONIMO",
    "recurso": "auditoria",
    "accion": "VER_AUDITORIA",
    "fecha": "2026-09-24T02:42:33.820Z",
    "resultado": "DENEGADO",
    "motivo": "Token de acceso no proporcionado."
  }
]
```
