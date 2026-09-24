# Casos de prueba

Los casos están automatizados en [tests/escenarios.test.ts](../tests/escenarios.test.ts). Cada ejecución levanta el servidor con una base de datos temporal y los datos de prueba iniciales.

```bash
npm test
```

Resultado de la ejecución: **22 pruebas, 22 aprobadas, 0 fallidas**.

## Datos de prueba

**Entorno base** (salvo que el caso indique otro): hora `10:30`, ubicación `PERU`, dispositivo `CORPORATIVO`.

| ID | Documento | Departamento | Nivel | Estado | Propietario |
|---|---|---|---|---|---|
| 1 | Presupuesto anual | FINANZAS | 3 | PENDIENTE | Carlos (2) |
| 2 | Manual público | RRHH | 1 | PUBLICADO | Ana (3) |
| 3 | Presupuesto corporativo | FINANZAS | 4 | PENDIENTE | María (7) |
| 4 | Plan estratégico | FINANZAS | 5 | PENDIENTE | María (7) |
| 5 | Política de vacaciones | RRHH | 2 | PENDIENTE | Ana (3) |
| 6 | Informe trimestral | FINANZAS | 2 | PENDIENTE | Pedro (8) |

Los usuarios están listados en el [README](../README.md#cuentas-de-prueba).

## Casos obligatorios

| # | Escenario | Usuario | Petición | Esperado | Obtenido |
|---|---|---|---|---|---|
| 1 | Empleado consulta documento de su área | Ana (EMPLEADO, RRHH) | `GET /documentos/2` | Permitido | ✅ 200 Permitido |
| 2 | Empleado consulta documento de otra área | Ana (EMPLEADO, RRHH) | `GET /documentos/1` | Denegado | ✅ 403 ABAC: Departamento (RRHH != FINANZAS) |
| 3 | Supervisor aprueba documento de su área | Carlos (SUPERVISOR, FINANZAS) | `POST /documentos/1/aprobar` | Permitido | ✅ 200 Estado APROBADO |
| 4 | Empleado intenta aprobar documento | Ana (EMPLEADO) | `POST /documentos/5/aprobar` | Denegado por RBAC | ✅ 403 RBAC: sin permiso aprobar_documento |
| 5 | Usuario nivel 2 consulta documento nivel 4 | Pedro (EMPLEADO, FINANZAS, nivel 2) | `GET /documentos/3` | Denegado por ABAC | ✅ 403 ABAC: Nivel de seguridad (2 < 4) |
| 6 | Gerente elimina documento | María (GERENTE, FINANZAS) | `DELETE /documentos/6` | Permitido | ✅ 200 Documento eliminado |
| 7 | Auditor intenta modificar documento | Rosa (AUDITOR) | `PUT /documentos/1` | Denegado por RBAC | ✅ 403 RBAC: sin permiso modificar_documento |
| 8 | Usuario inactivo intenta acceder | Luis (INACTIVO) | `POST /auth/login` | Denegado | ✅ 403 ABAC: Estado del usuario (INACTIVO) |
| 9 | Documento confidencial accedido fuera de horario | María (GERENTE, nivel 5), hora `20:00` | `GET /documentos/3` | Denegado por ABAC | ✅ 403 ABAC: Horario (20:00 fuera de 08:00-18:00) |
| 10 | Documento nivel 5 desde dispositivo personal | María (GERENTE, nivel 5), dispositivo `PERSONAL` | `GET /documentos/4` | Denegado | ✅ 403 ABAC: Dispositivo (se requiere CORPORATIVO) |
| 11 | Invitado accede a documento público | Juan (INVITADO, EXTERNO) | `GET /documentos/2` | Permitido | ✅ 200 Permitido |
| 12 | Invitado accede a documento confidencial | Juan (INVITADO, EXTERNO) | `GET /documentos/1` | Denegado | ✅ 403 ABAC: Invitados (nivel 3 > 1, documento no PUBLICADO) |

## Casos adicionales

| # | Escenario | Usuario | Petición | Esperado | Obtenido |
|---|---|---|---|---|---|
| 13 | Supervisor modifica documento ajeno de su área | Carlos (SUPERVISOR) | `PUT /documentos/6` | Denegado por ABAC (propiedad) | ✅ 403 ABAC: Propiedad (usuario 2 != propietario 8) |
| 14 | Gerente modifica documento ajeno de su área | María (GERENTE) | `PUT /documentos/6` | Permitido (exento de propiedad) | ✅ 200 Documento modificado |
| 15 | Consulta desde fuera de Perú | Carlos, ubicación `CHILE` | `GET /documentos/1` | Denegado por ABAC (país) | ✅ 403 ABAC: País (ubicación CHILE) |
| 16 | Empleado sube la confidencialidad de su documento por encima de su nivel | Ana (nivel 2) | `PUT /documentos/5` con nivel 4 | Denegado por ABAC | ✅ 403 ABAC: Nivel de seguridad (2 < 4) |
| 17 | Empleado crea documento en otro departamento | Ana (RRHH) | `POST /documentos` en FINANZAS | Denegado por ABAC | ✅ 403 ABAC: Departamento |
| 18 | Usuario suspendido con sesión abierta | Pedro, suspendido por el administrador | `GET /documentos/6` con su token previo | Denegado | ✅ 403 ABAC: Estado del usuario |
| 19 | Acceso a auditoría | Anónimo / Carlos / Auditor | `GET /auditoria` | 401 / 403 RBAC / Permitido | ✅ 401 / 403 / 200 |
| 20 | Cambio de rol sin permiso asignar_roles | María (GERENTE) | `PUT /usuarios/3` con `rol_id` | Denegado por RBAC | ✅ 403 RBAC |
| 21 | La auditoría registra cada intento | Administrador | `GET /auditoria` | Contiene denegaciones con motivo, logins fallidos y accesos anónimos | ✅ Registros presentes |
| 22 | El listado solo muestra documentos autorizados | Ana (RRHH) | `GET /documentos` | Solo documentos de RRHH | ✅ Solo RRHH |

## Reproducir los casos desde la aplicación

1. Iniciar sesión con el usuario del caso (contraseña `123`).
2. Configurar el entorno en la barra superior: hora (desmarcar **real** para fijarla), ubicación y dispositivo.
3. En **Documentos**, usar los botones de cada tarjeta o **Probar acceso a ID** para intentar la acción sobre cualquier documento.
4. La respuesta indica si el acceso fue autorizado o denegado, en qué etapa (RBAC o ABAC) y el resultado de cada política.
5. El intento queda registrado en **Auditoría** (visible con administrador, gerente o auditor).
