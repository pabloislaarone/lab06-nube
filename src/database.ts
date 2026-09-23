import sqlite3 from 'sqlite3';
import path from 'path';

// Archivo de base de datos en la raíz del proyecto
const dbPath = path.resolve(__dirname, '../securedocs.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

export const initDB = () => {
  db.serialize(() => {
    // 1. Departamento
    db.run(`CREATE TABLE IF NOT EXISTS Departamento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )`);

    // 2. Rol
    db.run(`CREATE TABLE IF NOT EXISTS Rol (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )`);

    // 3. Permiso
    db.run(`CREATE TABLE IF NOT EXISTS Permiso (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT
    )`);

    // 4. RolPermiso (Relación)
    db.run(`CREATE TABLE IF NOT EXISTS RolPermiso (
      rol_id INTEGER,
      permiso_id INTEGER,
      PRIMARY KEY (rol_id, permiso_id),
      FOREIGN KEY (rol_id) REFERENCES Rol(id),
      FOREIGN KEY (permiso_id) REFERENCES Permiso(id)
    )`);

    // 5. Usuario
    db.run(`CREATE TABLE IF NOT EXISTS Usuario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rol_id INTEGER,
      departamento_id INTEGER,
      nivel_seguridad INTEGER DEFAULT 1,
      pais TEXT,
      tipo_contrato TEXT,
      estado TEXT DEFAULT 'ACTIVO',
      FOREIGN KEY (rol_id) REFERENCES Rol(id),
      FOREIGN KEY (departamento_id) REFERENCES Departamento(id)
    )`);

    // 6. Documento
    db.run(`CREATE TABLE IF NOT EXISTS Documento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      propietario_id INTEGER,
      departamento_id INTEGER,
      nivel_confidencialidad INTEGER DEFAULT 1,
      estado TEXT DEFAULT 'PENDIENTE',
      pais TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (propietario_id) REFERENCES Usuario(id),
      FOREIGN KEY (departamento_id) REFERENCES Departamento(id)
    )`);

    // 7. Politica
    db.run(`CREATE TABLE IF NOT EXISTS Politica (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT
    )`);

    // 8. Auditoria
    db.run(`CREATE TABLE IF NOT EXISTS Auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT,
      recurso TEXT,
      accion TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      resultado TEXT,
      motivo TEXT
    )`);

    // --- Insertar datos semilla (Seeders para las Pruebas) ---
    db.get("SELECT COUNT(*) AS count FROM Usuario", [], (err, row: any) => {
      if (err) {
        console.error("Error consultando usuarios:", err);
        return;
      }
      
      if (row.count === 0) {
        // Departamentos
        db.run(`INSERT INTO Departamento (nombre) VALUES ('FINANZAS'), ('RRHH'), ('SISTEMAS')`);
        
        // Roles (RBAC)
        db.run(`INSERT INTO Rol (nombre) VALUES ('ADMINISTRADOR'), ('GERENTE'), ('SUPERVISOR'), ('EMPLEADO'), ('AUDITOR'), ('INVITADO')`);
        
        // Usuarios
        // 1. Admin (Sistemas)
        db.run(`INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) VALUES ('Admin', 'admin@techcorp.com', '123', 1, 3, 5, 'PERU', 'INTERNO', 'ACTIVO')`);
        
        // 2. Supervisor Finanzas (Nivel 3)
        db.run(`INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) VALUES ('Carlos Supervisor', 'carlos@techcorp.com', '123', 3, 1, 3, 'PERU', 'INTERNO', 'ACTIVO')`);
        
        // 3. Empleado RRHH (Nivel 2)
        db.run(`INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) VALUES ('Ana Empleada', 'ana@techcorp.com', '123', 4, 2, 2, 'PERU', 'INTERNO', 'ACTIVO')`);
        
        // 4. Invitado (Nivel 1, Externo)
        db.run(`INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) VALUES ('Juan Invitado', 'juan@externo.com', '123', 6, 2, 1, 'PERU', 'EXTERNO', 'ACTIVO')`);

        // 5. Usuario Inactivo
        db.run(`INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) VALUES ('Luis Despedido', 'luis@techcorp.com', '123', 4, 1, 2, 'PERU', 'INTERNO', 'INACTIVO')`);

        // Documentos de Prueba
        // Doc 1: Presupuesto Finanzas (Nivel 3)
        db.run(`INSERT INTO Documento (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais) VALUES ('Presupuesto', 'Data', 1, 1, 3, 'PENDIENTE', 'PERU')`);
        
        // Doc 2: Manual Publicado (Nivel 1)
        db.run(`INSERT INTO Documento (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais) VALUES ('Manual Publico', 'Data', 1, 2, 1, 'PUBLICADO', 'PERU')`);

        // Doc 3: Confidencial Nivel 4 (Solo visible de 8am a 6pm)
        db.run(`INSERT INTO Documento (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais) VALUES ('Alta gerencia', 'Data', 1, 1, 4, 'PENDIENTE', 'PERU')`);

        console.log('Datos de prueba para escenarios generados.');
      }
    });

    console.log('Tablas del modelo de datos inicializadas.');
  });
};

export default db;