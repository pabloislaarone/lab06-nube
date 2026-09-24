# SecureDocs - TechCorp S.A.

Sistema de gestión de documentos y expedientes con control de acceso basado en roles (RBAC) y en atributos (ABAC).

## Tecnologías

- **Backend:** Node.js, Express 5, TypeScript
- **Base de datos:** SQLite
- **Autenticación:** JSON Web Tokens (JWT)
- **Frontend:** HTML, JavaScript, Tailwind CSS, SweetAlert2, Font Awesome
- **Pruebas:** node:test

## Requisitos

- Node.js 20 o superior
- npm
- Git

## Instalación y ejecución

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/pabloislaarone/lab06-nube.git
   cd lab06-nube
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. (Opcional) Crear el archivo `.env` a partir del ejemplo:
   ```bash
   cp .env.example .env
   ```

4. Iniciar el servidor:
   ```bash
   npm run dev
   ```
   La base de datos `securedocs.db` y los datos de prueba se crean automáticamente al primer inicio.

5. Abrir en el navegador: `http://localhost:3000`

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor en modo desarrollo |
| `npm start` | Inicia el servidor |
| `npm test` | Ejecuta los casos de prueba |
| `npm run db:reset` | Elimina la base de datos para regenerarla en el siguiente inicio |

## Documentación

- [Diagrama de arquitectura](docs/arquitectura.md)
- [Modelo de base de datos](docs/modelo-datos.md)
- [Matrices RBAC y ABAC](docs/matrices.md)
- [Casos de prueba](docs/casos-prueba.md)
- [Registro de auditoría](docs/auditoria.md)

## Cuentas de prueba

Contraseña para todas: `123`

| Correo | Rol | Departamento | Nivel | Estado |
|---|---|---|---|---|
| admin@techcorp.com | ADMINISTRADOR | SISTEMAS | 5 | ACTIVO |
| maria@techcorp.com | GERENTE | FINANZAS | 5 | ACTIVO |
| carlos@techcorp.com | SUPERVISOR | FINANZAS | 3 | ACTIVO |
| ana@techcorp.com | EMPLEADO | RRHH | 2 | ACTIVO |
| pedro@techcorp.com | EMPLEADO | FINANZAS | 2 | ACTIVO |
| auditor@techcorp.com | AUDITOR | SISTEMAS | 5 | ACTIVO |
| juan@externo.com | INVITADO | RRHH | 1 | ACTIVO |
| luis@techcorp.com | EMPLEADO | FINANZAS | 2 | INACTIVO |
