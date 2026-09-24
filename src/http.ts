import { Request, Response, NextFunction } from 'express';

export class ErrorHttp extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const rechazar = (res: Response, status: number, motivo: string, extra: object = {}) => {
  res.locals.motivo = motivo;
  return res.status(status).json({ error: motivo, ...extra });
};

export const manejarErrores = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof ErrorHttp ? err.status : err.status ?? 500;
  if (status >= 500) console.error(err);
  rechazar(res, status, status >= 500 ? 'Error interno del servidor.' : err.message);
};

export const entero = (valor: unknown, campo: string, min = 1, max = Number.MAX_SAFE_INTEGER) => {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) throw new ErrorHttp(400, `El campo ${campo} es inválido.`);
  return n;
};

export const texto = (valor: unknown, campo: string) => {
  if (typeof valor !== 'string' || !valor.trim()) throw new ErrorHttp(400, `El campo ${campo} es obligatorio.`);
  return valor.trim();
};

export const opcion = <T extends string>(valor: unknown, campo: string, opciones: readonly T[]) => {
  const v = typeof valor === 'string' ? valor.toUpperCase() : valor;
  if (!opciones.includes(v as T)) throw new ErrorHttp(400, `El campo ${campo} debe ser uno de: ${opciones.join(', ')}.`);
  return v as T;
};

export const opcional = <T>(valor: unknown, validar: (v: unknown) => T) =>
  valor === undefined || valor === null || valor === '' ? undefined : validar(valor);
