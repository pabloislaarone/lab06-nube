import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { rechazar } from '../http';
import { buscarUsuarioPorId } from '../services/usuarios';

const tokensRevocados = new Map<string, number>();

const limpiarRevocados = () => {
  const ahora = Date.now() / 1000;
  for (const [jti, exp] of tokensRevocados) if (exp < ahora) tokensRevocados.delete(jti);
};

export const firmarToken = (usuarioId: number) =>
  jwt.sign({ sub: String(usuarioId), jti: randomUUID() }, config.jwtSecret, { expiresIn: config.jwtExpiracion });

export const revocarToken = (payload: JwtPayload) => {
  limpiarRevocados();
  if (payload.jti && payload.exp) tokensRevocados.set(payload.jti, payload.exp);
};

export const autenticar = async (req: Request, res: Response, next: NextFunction) => {
  const [tipo, token] = (req.get('authorization') ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) return rechazar(res, 401, 'Token de acceso no proporcionado.');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return rechazar(res, 401, 'Token de acceso inválido o expirado.');
  }

  if (payload.jti && tokensRevocados.has(payload.jti)) return rechazar(res, 401, 'La sesión fue cerrada.');

  const usuario = await buscarUsuarioPorId(Number(payload.sub));
  if (!usuario) return rechazar(res, 401, 'Usuario no encontrado.');

  res.locals.usuario = usuario;
  res.locals.token = payload;
  next();
};
