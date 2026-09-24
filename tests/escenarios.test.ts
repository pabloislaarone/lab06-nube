import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const directorio = mkdtempSync(path.join(tmpdir(), 'securedocs-'));
process.env.DB_PATH = path.join(directorio, 'test.db');
process.env.SIMULAR_ENTORNO = 'true';
process.on('exit', () => rmSync(directorio, { recursive: true, force: true }));

const ENTORNO_BASE = { 'x-hora': '10:30', 'x-ubicacion': 'PERU', 'x-dispositivo': 'CORPORATIVO' };

let servidor: Server;
let base: string;
const tokens: Record<string, string> = {};

const pedir = async (metodo: string, ruta: string, token?: string, body?: object, entorno: Record<string, string> = {}) => {
  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...ENTORNO_BASE,
      ...entorno,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: respuesta.status, data: await respuesta.json() };
};

const login = async (correo: string) => {
  const { status, data } = await pedir('POST', '/auth/login', undefined, { correo, password: '123' });
  assert.equal(status, 200, data.error);
  return data.token as string;
};

before(async () => {
  const { inicializarBaseDeDatos } = await import('../src/database');
  const { sembrarDatos } = await import('../src/seed');
  const { crearApp } = await import('../src/app');
  await inicializarBaseDeDatos(sembrarDatos);
  servidor = crearApp().listen(0);
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
  for (const usuario of ['admin', 'carlos', 'ana', 'auditor', 'maria', 'pedro']) {
    tokens[usuario] = await login(`${usuario}@techcorp.com`);
  }
  tokens.juan = await login('juan@externo.com');
});

after(() => {
  servidor.close();
});

test('01 Empleado consulta documento de su área: permitido', async () => {
  const { status, data } = await pedir('GET', '/documentos/2', tokens.ana);
  assert.equal(status, 200);
  assert.equal(data.documento.departamento, 'RRHH');
});

test('02 Empleado consulta documento de otra área: denegado', async () => {
  const { status, data } = await pedir('GET', '/documentos/1', tokens.ana);
  assert.equal(status, 403);
  assert.equal(data.etapa, 'ABAC');
  assert.match(data.error, /Departamento \(RRHH != FINANZAS\)/);
});

test('03 Supervisor aprueba documento de su área: permitido', async () => {
  const { status, data } = await pedir('POST', '/documentos/1/aprobar', tokens.carlos);
  assert.equal(status, 200);
  assert.equal(data.documento.estado, 'APROBADO');
});

test('04 Empleado intenta aprobar documento: denegado por RBAC', async () => {
  const { status, data } = await pedir('POST', '/documentos/5/aprobar', tokens.ana);
  assert.equal(status, 403);
  assert.equal(data.etapa, 'RBAC');
});

test('05 Usuario nivel 2 consulta documento nivel 4: denegado por ABAC', async () => {
  const { status, data } = await pedir('GET', '/documentos/3', tokens.pedro);
  assert.equal(status, 403);
  assert.equal(data.etapa, 'ABAC');
  assert.match(data.error, /Nivel de seguridad \(2 < 4\)/);
  assert.doesNotMatch(data.error, /Departamento/);
});

test('07 Auditor intenta modificar documento: denegado por RBAC', async () => {
  const { status, data } = await pedir('PUT', '/documentos/1', tokens.auditor, { titulo: 'Cambio' });
  assert.equal(status, 403);
  assert.equal(data.etapa, 'RBAC');
});

test('08 Usuario inactivo intenta acceder: denegado', async () => {
  const { status, data } = await pedir('POST', '/auth/login', undefined, { correo: 'luis@techcorp.com', password: '123' });
  assert.equal(status, 403);
  assert.match(data.error, /Estado del usuario \(estado INACTIVO\)/);
});

test('09 Documento confidencial accedido fuera de horario: denegado por ABAC', async () => {
  const { status, data } = await pedir('GET', '/documentos/3', tokens.maria, undefined, { 'x-hora': '20:00' });
  assert.equal(status, 403);
  assert.match(data.error, /Horario \(20:00 fuera de 08:00-18:00\)/);
});

test('10 Documento nivel 5 accedido desde dispositivo personal: denegado', async () => {
  const { status, data } = await pedir('GET', '/documentos/4', tokens.maria, undefined, { 'x-dispositivo': 'PERSONAL' });
  assert.equal(status, 403);
  assert.match(data.error, /Dispositivo/);
});

test('11 Invitado accede a documento público: permitido', async () => {
  const { status } = await pedir('GET', '/documentos/2', tokens.juan);
  assert.equal(status, 200);
});

test('12 Invitado accede a documento confidencial: denegado', async () => {
  const { status, data } = await pedir('GET', '/documentos/1', tokens.juan);
  assert.equal(status, 403);
  assert.match(data.error, /Invitados/);
});

test('13 Supervisor modifica documento ajeno de su área: denegado por propiedad', async () => {
  const { status, data } = await pedir('PUT', '/documentos/6', tokens.carlos, { titulo: 'Cambio' });
  assert.equal(status, 403);
  assert.match(data.error, /Propiedad/);
});

test('14 Gerente modifica documento ajeno de su área: permitido por excepción', async () => {
  const { status, data } = await pedir('PUT', '/documentos/6', tokens.maria, { titulo: 'Informe revisado' });
  assert.equal(status, 200);
  assert.equal(data.documento.titulo, 'Informe revisado');
});

test('15 Consulta desde fuera de Perú: denegado por país', async () => {
  const { status, data } = await pedir('GET', '/documentos/1', tokens.carlos, undefined, { 'x-ubicacion': 'CHILE' });
  assert.equal(status, 403);
  assert.match(data.error, /País/);
});

test('16 Empleado sube la confidencialidad de su documento por encima de su nivel: denegado', async () => {
  const { status, data } = await pedir('PUT', '/documentos/5', tokens.ana, { nivel_confidencialidad: 4 });
  assert.equal(status, 403);
  assert.match(data.error, /Nivel de seguridad \(2 < 4\)/);
});

test('17 Empleado crea documento en otro departamento: denegado', async () => {
  const { status, data } = await pedir('POST', '/documentos', tokens.ana, { titulo: 'Nuevo', departamento_id: 1 });
  assert.equal(status, 403);
  assert.match(data.error, /Departamento/);
});

test('18 Usuario desactivado con sesión abierta pierde el acceso', async () => {
  const actualizado = await pedir('PUT', '/usuarios/8', tokens.admin, { estado: 'SUSPENDIDO' });
  assert.equal(actualizado.status, 200);
  const { status, data } = await pedir('GET', '/documentos/6', tokens.pedro);
  assert.equal(status, 403);
  assert.match(data.error, /Estado del usuario/);
  await pedir('PUT', '/usuarios/8', tokens.admin, { estado: 'ACTIVO' });
});

test('19 Auditoría protegida por RBAC y sin acceso anónimo', async () => {
  assert.equal((await pedir('GET', '/auditoria')).status, 401);
  assert.equal((await pedir('GET', '/auditoria', tokens.carlos)).status, 403);
  assert.equal((await pedir('GET', '/auditoria', tokens.auditor)).status, 200);
});

test('20 Solo quien tiene asignar_roles puede cambiar el rol', async () => {
  const { status } = await pedir('PUT', '/usuarios/3', tokens.maria, { rol_id: 2 });
  assert.equal(status, 403);
});

test('06 Gerente elimina documento: permitido', async () => {
  const { status } = await pedir('DELETE', '/documentos/6', tokens.maria);
  assert.equal(status, 200);
});

test('La auditoría registra cada intento con usuario, recurso, acción, resultado y motivo', async () => {
  const { data } = await pedir('GET', '/auditoria?limite=1000', tokens.admin);
  const denegado = data.find((r: any) => r.usuario === 'ana@techcorp.com' && r.recurso === 'documento-1' && r.accion === 'READ');
  assert.equal(denegado.resultado, 'DENEGADO');
  assert.match(denegado.motivo, /Departamento/);
  assert.ok(data.some((r: any) => r.usuario === 'luis@techcorp.com' && r.accion === 'LOGIN' && r.resultado === 'DENEGADO'));
  assert.ok(data.some((r: any) => r.usuario === 'ANONIMO' && r.recurso === 'auditoria' && r.resultado === 'DENEGADO'));
});

test('El listado solo devuelve documentos que el usuario puede consultar', async () => {
  const { status, data } = await pedir('GET', '/documentos', tokens.ana);
  assert.equal(status, 200);
  assert.ok(data.every((d: any) => d.departamento === 'RRHH'));
});
