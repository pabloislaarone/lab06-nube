import { Router, Request } from 'express';
import { run } from '../database';
import { autenticar } from '../auth/autenticacion';
import { hashPassword } from '../auth/password';
import { autorizar } from '../authorization/autorizar';
import { auditar } from '../services/auditoria';
import { buscarUsuarioPorId, listarUsuarios } from '../services/usuarios';
import { entero, ErrorHttp, opcion, opcional, texto } from '../http';
import { ESTADOS_USUARIO, Permiso, TIPOS_CONTRATO } from '../types';

const router = Router();

const recurso = (req: Request) => (req.params.id ? `usuario-${req.params.id}` : 'usuarios');

const permisosEdicion = (req: Request): Permiso[] =>
  req.body?.rol_id !== undefined ? ['gestionar_usuarios', 'asignar_roles'] : ['gestionar_usuarios'];

const errorSql = (err: Error): never => {
  if (err.message.includes('UNIQUE')) throw new ErrorHttp(409, 'El correo ya está registrado.');
  if (err.message.includes('FOREIGN KEY')) throw new ErrorHttp(400, 'El rol o el departamento no existe.');
  throw err;
};

const camposUsuario = (body: any) => ({
  nombre: opcional(body.nombre, (v) => texto(v, 'nombre')),
  correo: opcional(body.correo, (v) => texto(v, 'correo').toLowerCase()),
  password_hash: opcional(body.password, (v) => hashPassword(texto(v, 'password'))),
  rol_id: opcional(body.rol_id, (v) => entero(v, 'rol_id')),
  departamento_id: opcional(body.departamento_id, (v) => entero(v, 'departamento_id')),
  nivel_seguridad: opcional(body.nivel_seguridad, (v) => entero(v, 'nivel_seguridad', 1, 5)),
  pais: opcional(body.pais, (v) => texto(v, 'pais').toUpperCase()),
  tipo_contrato: opcional(body.tipo_contrato, (v) => opcion(v, 'tipo_contrato', TIPOS_CONTRATO)),
  estado: opcional(body.estado, (v) => opcion(v, 'estado', ESTADOS_USUARIO)),
});

router.get('/', auditar('LIST_USERS', recurso), autenticar, autorizar('gestionar_usuarios', 'GESTIONAR_USUARIOS'), async (_req, res) => {
  res.json(await listarUsuarios());
});

router.post('/', auditar('CREATE_USER', recurso), autenticar, autorizar(['gestionar_usuarios', 'asignar_roles'], 'GESTIONAR_USUARIOS'), async (req, res) => {
  const campos = camposUsuario(req.body ?? {});
  const obligatorios = ['nombre', 'correo', 'password_hash', 'rol_id', 'departamento_id', 'pais', 'tipo_contrato'] as const;
  for (const campo of obligatorios) {
    if (campos[campo] === undefined) throw new ErrorHttp(400, `El campo ${campo === 'password_hash' ? 'password' : campo} es obligatorio.`);
  }

  const { lastID } = await run(
    `INSERT INTO Usuario (nombre, correo, password_hash, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [campos.nombre, campos.correo, campos.password_hash, campos.rol_id, campos.departamento_id, campos.nivel_seguridad ?? 1, campos.pais, campos.tipo_contrato, campos.estado ?? 'ACTIVO'],
  ).catch(errorSql);

  res.status(201).json({ mensaje: 'Usuario creado.', usuario: await buscarUsuarioPorId(lastID) });
});

router.put('/:id', auditar('UPDATE_USER', recurso), autenticar, autorizar(permisosEdicion, 'GESTIONAR_USUARIOS'), async (req, res) => {
  const id = entero(req.params.id, 'id');
  const cambios = Object.entries(camposUsuario(req.body ?? {})).filter(([, v]) => v !== undefined);
  if (!cambios.length) throw new ErrorHttp(400, 'No se enviaron campos para actualizar.');

  const { changes } = await run(
    `UPDATE Usuario SET ${cambios.map(([campo]) => `${campo} = ?`).join(', ')} WHERE id = ?`,
    [...cambios.map(([, v]) => v), id],
  ).catch(errorSql);
  if (!changes) throw new ErrorHttp(404, 'Usuario no encontrado.');

  res.json({ mensaje: 'Usuario actualizado.', usuario: await buscarUsuarioPorId(id) });
});

export default router;
