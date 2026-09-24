import { Router, Request } from 'express';
import { get, run } from '../database';
import { autenticar } from '../auth/autenticacion';
import { autorizar } from '../authorization/autorizar';
import { evaluarABAC } from '../authorization/abac/motor';
import { auditar } from '../services/auditoria';
import { buscarDocumento, listarDocumentos } from '../services/documentos';
import { entero, ErrorHttp, opcional, texto } from '../http';
import { Documento, Usuario } from '../types';

const router = Router();

const recurso = (req: Request) => (req.params.id ? `documento-${req.params.id}` : 'documentos');

const cargarDocumento = async (req: Request) => {
  const documento = await buscarDocumento(entero(req.params.id, 'id'));
  if (!documento) throw new ErrorHttp(404, 'Documento no encontrado.');
  return [documento];
};

const nivel = (v: unknown) => entero(v, 'nivel_confidencialidad', 1, 5);

const cargarNuevoDocumento = async (req: Request, usuario: Usuario): Promise<Documento[]> => {
  const body = req.body ?? {};
  const departamentoId = opcional(body.departamento_id, (v) => entero(v, 'departamento_id'));
  const departamento = await get<{ id: number; nombre: string }>(
    departamentoId ? 'SELECT id, nombre FROM Departamento WHERE id = ?' : 'SELECT id, nombre FROM Departamento WHERE nombre = ?',
    [departamentoId ?? usuario.departamento],
  );
  if (!departamento) throw new ErrorHttp(400, 'El departamento no existe.');

  return [{
    titulo: texto(body.titulo, 'titulo'),
    descripcion: opcional(body.descripcion, String) ?? null,
    propietario: usuario.id,
    departamento: departamento.nombre,
    departamento_id: departamento.id,
    nivel_confidencialidad: opcional(body.nivel_confidencialidad, nivel) ?? 1,
    estado: 'PENDIENTE',
    pais: (opcional(body.pais, (v) => texto(v, 'pais')) ?? usuario.pais).toUpperCase(),
  }];
};

const cargarModificacion = async (req: Request) => {
  const [actual] = await cargarDocumento(req);
  const body = req.body ?? {};
  const propuesto: Documento = {
    ...actual,
    titulo: opcional(body.titulo, (v) => texto(v, 'titulo')) ?? actual.titulo,
    descripcion: body.descripcion === undefined ? actual.descripcion : opcional(body.descripcion, String) ?? null,
    nivel_confidencialidad: opcional(body.nivel_confidencialidad, nivel) ?? actual.nivel_confidencialidad,
  };
  return [actual, propuesto];
};

router.get('/', auditar('LIST', recurso), autenticar, autorizar('consultar_documento', 'LIST'), async (_req, res) => {
  const { usuario, entorno } = res.locals;
  const visibles = [];
  for (const documento of await listarDocumentos()) {
    const { permitido } = await evaluarABAC({ usuario, documento, accion: 'READ', entorno });
    if (permitido) visibles.push(documento);
  }
  res.json(visibles);
});

router.get('/:id', auditar('READ', recurso), autenticar, autorizar('consultar_documento', 'READ', cargarDocumento), (_req, res) => {
  const [documento] = res.locals.documentos;
  res.json({ documento, evaluaciones: res.locals.evaluaciones });
});

router.post('/', auditar('CREATE', recurso), autenticar, autorizar('crear_documento', 'CREATE', cargarNuevoDocumento), async (_req, res) => {
  const [d] = res.locals.documentos as Documento[];
  const { lastID } = await run(
    'INSERT INTO Documento (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [d.titulo, d.descripcion, d.propietario, d.departamento_id, d.nivel_confidencialidad, d.estado, d.pais],
  );
  res.status(201).json({ mensaje: 'Documento creado.', documento: await buscarDocumento(lastID) });
});

router.put('/:id', auditar('UPDATE', recurso), autenticar, autorizar('modificar_documento', 'UPDATE', cargarModificacion), async (_req, res) => {
  const [, d] = res.locals.documentos as Documento[];
  await run('UPDATE Documento SET titulo = ?, descripcion = ?, nivel_confidencialidad = ? WHERE id = ?', [d.titulo, d.descripcion, d.nivel_confidencialidad, d.id]);
  res.json({ mensaje: 'Documento modificado.', documento: await buscarDocumento(d.id!) });
});

router.delete('/:id', auditar('DELETE', recurso), autenticar, autorizar('eliminar_documento', 'DELETE', cargarDocumento), async (_req, res) => {
  const [d] = res.locals.documentos as Documento[];
  await run('DELETE FROM Documento WHERE id = ?', [d.id]);
  res.json({ mensaje: 'Documento eliminado.' });
});

router.post('/:id/aprobar', auditar('APPROVE', recurso), autenticar, autorizar('aprobar_documento', 'APPROVE', cargarDocumento), async (_req, res) => {
  const [d] = res.locals.documentos as Documento[];
  if (d.estado !== 'PENDIENTE') throw new ErrorHttp(409, `Solo se pueden aprobar documentos pendientes (estado actual: ${d.estado}).`);
  await run(`UPDATE Documento SET estado = 'APROBADO' WHERE id = ?`, [d.id]);
  res.json({ mensaje: 'Documento aprobado.', documento: await buscarDocumento(d.id!) });
});

export default router;
