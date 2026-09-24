import sqlite3 from 'sqlite3';
import { config } from './config';

const db = new sqlite3.Database(config.dbPath);

export const run = (sql: string, params: unknown[] = []) =>
  new Promise<{ lastID: number; changes: number }>((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

export const get = <T>(sql: string, params: unknown[] = []) =>
  new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row as T | undefined)));
  });

export const all = <T>(sql: string, params: unknown[] = []) =>
  new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows as T[])));
  });

const exec = (sql: string) =>
  new Promise<void>((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });

const ESQUEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS Departamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS Rol (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS Permiso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT
  );

  CREATE TABLE IF NOT EXISTS RolPermiso (
    rol_id INTEGER NOT NULL REFERENCES Rol(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES Permiso(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
  );

  CREATE TABLE IF NOT EXISTS Usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES Rol(id),
    departamento_id INTEGER NOT NULL REFERENCES Departamento(id),
    nivel_seguridad INTEGER NOT NULL DEFAULT 1 CHECK (nivel_seguridad BETWEEN 1 AND 5),
    pais TEXT NOT NULL,
    tipo_contrato TEXT NOT NULL CHECK (tipo_contrato IN ('INTERNO', 'EXTERNO')),
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))
  );

  CREATE TABLE IF NOT EXISTS Documento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    propietario_id INTEGER NOT NULL REFERENCES Usuario(id),
    departamento_id INTEGER NOT NULL REFERENCES Departamento(id),
    nivel_confidencialidad INTEGER NOT NULL DEFAULT 1 CHECK (nivel_confidencialidad BETWEEN 1 AND 5),
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'PUBLICADO')),
    pais TEXT NOT NULL,
    fecha_creacion TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS Politica (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    acciones TEXT NOT NULL,
    roles_objetivo TEXT NOT NULL DEFAULT '',
    roles_exentos TEXT NOT NULL DEFAULT '',
    parametros TEXT NOT NULL DEFAULT '{}',
    activa INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS Auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL,
    recurso TEXT NOT NULL,
    accion TEXT NOT NULL,
    fecha TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    resultado TEXT NOT NULL,
    motivo TEXT NOT NULL,
    direccion_ip TEXT
  );
`;

export const inicializarBaseDeDatos = async (sembrar: () => Promise<void>) => {
  await exec(ESQUEMA);
  const fila = await get<{ total: number }>('SELECT COUNT(*) AS total FROM Usuario');
  if (fila?.total === 0) {
    await exec('BEGIN');
    try {
      await sembrar();
      await exec('COMMIT');
    } catch (err) {
      await exec('ROLLBACK');
      throw err;
    }
  }
};
