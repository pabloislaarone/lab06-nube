import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

export const verificarPassword = (password: string, almacenado: string) => {
  const [salt, hash] = almacenado.split(':');
  if (!salt || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const calculado = scryptSync(password, salt, esperado.length);
  return timingSafeEqual(esperado, calculado);
};
