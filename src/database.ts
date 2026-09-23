import sqlite3 from 'sqlite3';
import path from 'path';

// Esto creará un archivo 'securedocs.db' en la raíz de tu proyecto
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

    db.get("SELECT COUNT(*) AS count FROM Usuario", [], (err, row: any) => {
      if (err) {
        console.error("Error consultando usuarios:", err);
        return;
      }
      
      // Solo inserta si no hay usuarios en la base de datos
      if (row.count === 0) {
        // Insertar Departamento base
        db.run(`INSERT INTO Departamento (nombre) VALUES ('SISTEMAS')`);
        
        // Insertar Rol base
        db.run(`INSERT INTO Rol (nombre) VALUES ('ADMINISTRADOR')`);
        
        // Insertar Usuario Administrador
        db.run(`INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) 
                VALUES ('Admin Principal', 'admin@techcorp.com', 'admin123', 1, 1, 5, 'PERU', 'INTERNO', 'ACTIVO')`);
        
        console.log('Datos semilla (Admin) insertados correctamente.');
      }
    });

    console.log('Tablas del modelo de datos inicializadas.');
  });
};

export default db;