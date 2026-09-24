# Matrices de control de acceso

Ambas matrices se almacenan en la base de datos (tablas `RolPermiso` y `Politica`) y también pueden verse en la aplicación en la sección **Matrices RBAC / ABAC**.

## Matriz de roles y permisos (RBAC)

| Operación | Permiso | Administrador | Gerente | Supervisor | Empleado | Auditor | Invitado |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Crear documento | `crear_documento` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Consultar documento | `consultar_documento` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Modificar documento | `modificar_documento` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Eliminar documento | `eliminar_documento` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Aprobar documento | `aprobar_documento` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Ver auditoría | `ver_auditoria` | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| Gestionar usuarios | `gestionar_usuarios` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Asignar roles | `asignar_roles` | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Matriz de políticas ABAC

| # | Política | Regla | Acciones | Aplica a | Roles exentos | Parámetros |
|---|---|---|---|---|---|---|
| 1 | Departamento | `usuario.departamento == documento.departamento` | CREATE, READ, UPDATE, DELETE, APPROVE | Todos | ADMINISTRADOR, AUDITOR | - |
| 2 | Nivel de seguridad | `usuario.nivel_seguridad >= documento.nivel_confidencialidad` | CREATE, READ, UPDATE, DELETE, APPROVE | Todos | - | - |
| 3 | Propiedad | `usuario.id == documento.propietario` | UPDATE | Todos | ADMINISTRADOR, GERENTE | - |
| 4 | Horario | Si `nivel_confidencialidad >= 4`, solo entre 08:00 y 18:00 | READ, UPDATE, DELETE, APPROVE | Todos | - | nivel_minimo 4, 08:00 a 18:00 (hora de Lima) |
| 5 | País | `usuario.pais == documento.pais` y `entorno.ubicacion == documento.pais` | CREATE, READ, UPDATE, DELETE, APPROVE | Todos | - | - |
| 6 | Dispositivo | Si `nivel_confidencialidad >= 4`, `dispositivo == CORPORATIVO` | READ, UPDATE, DELETE, APPROVE | Todos | - | nivel_minimo 4, dispositivos: CORPORATIVO |
| 7 | Estado del usuario | `usuario.estado == ACTIVO` | Todas (incluye LOGIN) | Todos | - | estados_permitidos: ACTIVO |
| 8 | Invitados | `tipo_contrato == EXTERNO` y `nivel_confidencialidad <= 1` y `documento.estado == PUBLICADO` | CREATE, READ, UPDATE, DELETE, APPROVE | INVITADO | - | tipo_contrato EXTERNO, nivel_maximo 1, estado PUBLICADO |

### Atributos evaluados

| Tipo | Atributos |
|---|---|
| Usuario | id, rol, departamento, nivel_seguridad, pais, tipo_contrato, estado |
| Recurso | propietario, departamento, nivel_confidencialidad, estado, pais |
| Entorno | hora, fecha, direccion_ip, ubicacion, dispositivo |

### Notas de diseño

- Las políticas se evalúan en un motor centralizado ([src/authorization/abac/motor.ts](../src/authorization/abac/motor.ts)). La lógica de cada regla está en [politicas.ts](../src/authorization/abac/politicas.ts) y su configuración en la tabla `Politica`. Cambiar acciones, roles exentos o parámetros, o desactivar una política, no requiere modificar código.
- Se evalúan todas las políticas aplicables y la respuesta indica cada una que no se cumplió.
- Al crear o modificar un documento también se evalúa el documento resultante, por lo que un usuario no puede crear ni reclasificar documentos por encima de su nivel ni en otro departamento.
- El motor rechaza por defecto: si una política no tiene evaluador definido o le falta el recurso, se deniega el acceso.
