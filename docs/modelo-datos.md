# Modelo de base de datos

Motor: SQLite. El esquema se crea en [src/database.ts](../src/database.ts) y los datos iniciales en [src/seed.ts](../src/seed.ts).

```mermaid
erDiagram
    Rol ||--o{ Usuario : "asignado a"
    Departamento ||--o{ Usuario : "pertenece"
    Rol ||--o{ RolPermiso : "tiene"
    Permiso ||--o{ RolPermiso : "otorgado en"
    Departamento ||--o{ Documento : "pertenece"
    Usuario ||--o{ Documento : "propietario"

    Rol {
        int id PK
        text nombre UK
        text descripcion
    }
    Permiso {
        int id PK
        text codigo UK
        text descripcion
    }
    RolPermiso {
        int rol_id PK,FK
        int permiso_id PK,FK
    }
    Departamento {
        int id PK
        text nombre UK
    }
    Usuario {
        int id PK
        text nombre
        text correo UK
        text password_hash
        int rol_id FK
        int departamento_id FK
        int nivel_seguridad "1 a 5"
        text pais
        text tipo_contrato "INTERNO / EXTERNO"
        text estado "ACTIVO / INACTIVO / SUSPENDIDO"
    }
    Documento {
        int id PK
        text titulo
        text descripcion
        int propietario_id FK
        int departamento_id FK
        int nivel_confidencialidad "1 a 5"
        text estado "PENDIENTE / APROBADO / PUBLICADO"
        text pais
        text fecha_creacion
    }
    Politica {
        int id PK
        text codigo UK
        text nombre
        text descripcion
        text acciones
        text roles_objetivo
        text roles_exentos
        text parametros "JSON"
        int activa
    }
    Auditoria {
        int id PK
        text usuario
        text recurso
        text accion
        text fecha
        text resultado "PERMITIDO / DENEGADO / ERROR"
        text motivo
        text direccion_ip
    }
```

## Entidades

| Entidad | Descripción |
|---|---|
| Rol | Roles del sistema: ADMINISTRADOR, GERENTE, SUPERVISOR, EMPLEADO, AUDITOR, INVITADO. |
| Permiso | Operaciones que se pueden otorgar (crear_documento, consultar_documento, etc.). |
| RolPermiso | Relación muchos a muchos entre roles y permisos. Es la matriz RBAC. |
| Departamento | FINANZAS, RRHH, SISTEMAS. |
| Usuario | Atributos del usuario para ABAC: rol, departamento, nivel de seguridad, país, tipo de contrato y estado. La contraseña se guarda con hash scrypt. |
| Documento | Atributos del recurso para ABAC: departamento, nivel de confidencialidad, estado, país y propietario. |
| Politica | Configuración de las políticas ABAC: a qué acciones aplican, a qué roles, qué roles están exentos, parámetros y si está activa. |
| Auditoria | Registro de cada intento de acceso. `usuario` guarda el correo como texto para poder registrar también intentos anónimos o con credenciales inválidas. |

## Relaciones

- `Usuario` → `Rol` (N:1)
- `Usuario` → `Departamento` (N:1)
- `Rol` ↔ `Permiso` mediante `RolPermiso` (N:M)
- `Documento` → `Departamento` (N:1)
- `Documento` → `Usuario` como propietario (N:1)
