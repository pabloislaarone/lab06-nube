import { Request, Response, NextFunction } from 'express';
import { all, run } from '../database';

interface RegistroAuditoria {
  usuario: string;
  recurso: string;
  accion: string;
  resultado: 'PERMITIDO' | 'DENEGADO' | 'ERROR';
  motivo: string;
  direccion_ip?: string;
}

const registrar = (r: RegistroAuditoria) =>
  run(
    'INSERT INTO Auditoria (usuario, recurso, accion, resultado, motivo, direccion_ip) VALUES (?, ?, ?, ?, ?, ?)',
    [r.usuario, r.recurso, r.accion, r.resultado, r.motivo, r.direccion_ip ?? null],
  ).catch((err) => console.error('Error registrando auditoría:', err.message));

const resultadoPorEstado = (status: number): RegistroAuditoria['resultado'] => {
  if (status < 400) return 'PERMITIDO';
  if (status === 401 || status === 403) return 'DENEGADO';
  return 'ERROR';
};

export const auditar = (accion: string, recurso: (req: Request) => string) =>
  (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      registrar({
        usuario: res.locals.usuario?.correo ?? res.locals.identidad ?? 'ANONIMO',
        recurso: recurso(req),
        accion,
        resultado: resultadoPorEstado(res.statusCode),
        motivo: res.locals.motivo ?? `HTTP ${res.statusCode}`,
        direccion_ip: req.ip,
      });
    });
    next();
  };

export const listarAuditoria = (limite: number) =>
  all('SELECT * FROM Auditoria ORDER BY id DESC LIMIT ?', [limite]);
