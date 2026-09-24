import { Request, Response, NextFunction } from 'express';
import { rechazar } from '../http';
import { Accion, Documento, Permiso, Usuario } from '../types';
import { evaluarRBAC } from './rbac';
import { evaluarABAC, Evaluacion } from './abac/motor';
import { obtenerEntorno } from './entorno';

type PermisosRequeridos = Permiso | Permiso[] | ((req: Request) => Permiso[]);
type CargadorRecursos = (req: Request, usuario: Usuario) => Promise<Documento[]>;

export const autorizar = (requeridos: PermisosRequeridos, accion: Accion, cargar?: CargadorRecursos) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const usuario: Usuario = res.locals.usuario;
    const permisos = typeof requeridos === 'function' ? requeridos(req) : [requeridos].flat();

    const rbac = await evaluarRBAC(usuario.rol, permisos);
    if (!rbac.permitido) return rechazar(res, 403, `Denegado por RBAC: ${rbac.motivo}`, { etapa: 'RBAC' });

    const entorno = obtenerEntorno(req);
    const documentos = cargar ? await cargar(req, usuario) : [];
    const objetivos = documentos.length ? documentos : [undefined];
    let evaluaciones: Evaluacion[] = [];

    for (const documento of objetivos) {
      const abac = await evaluarABAC({ usuario, documento, accion, entorno });
      if (!abac.permitido) {
        return rechazar(res, 403, `Denegado por ABAC: ${abac.motivo}`, { etapa: 'ABAC', evaluaciones: abac.evaluaciones });
      }
      evaluaciones = evaluaciones.length ? evaluaciones : abac.evaluaciones;
    }

    res.locals.entorno = entorno;
    res.locals.documentos = documentos;
    res.locals.evaluaciones = evaluaciones;
    res.locals.motivo = `Autorizado: RBAC (${rbac.motivo}) + ABAC (cumple las políticas aplicables).`;
    next();
  };
