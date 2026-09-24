# SecureDocs - TechCorp S.A.
Sistema de Gestión de Expedientes con Control de Acceso basado en Roles (RBAC) y Atributos (ABAC).

## Requisitos Previos
- Node.js (v18 o superior)
- NPM
- Git

## Instrucciones de Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/pabloislaarone/lab06-nube.git
    cd lan06-nube
    ```

2.  **Instalar las dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo:**
    El sistema utiliza SQLite como base de datos local y autogenerará las tablas y datos de prueba al primer inicio.
    ```bash
    npm run dev
    ```

4.  **Acceder a la aplicación:**
    Abre tu navegador web y visita: `http://localhost:3000`

## Tecnologías Utilizadas
- **Backend:** Node.js, Express, TypeScript
- **Base de Datos:** SQLite
- **Autenticación:** JSON Web Tokens (JWT)
- **Frontend:** Vanilla JS, HTML, Tailwind CSS, SweetAlert2