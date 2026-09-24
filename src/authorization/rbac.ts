import { all } from '../database';
import { Permiso } from '../types';

export const permisosDeRol = async (rol: string) => {
  const filas = await all<{ codigo: Permiso }>(
    `SELECT p.codigo FROM RolPermiso rp
     JOIN Rol r ON r.id = rp.rol_id
     JOIN Permiso p ON p.id = rp.permiso_id
     WHERE r.nombre = ?`,
    [rol],
  );
  return filas.map((f) => f.codigo);
};

export const evaluarRBAC = async (rol: string, requeridos: Permiso[]) => {
  const concedidos = await permisosDeRol(rol);
  const faltantes = requeridos.filter((p) => !concedidos.includes(p));
  return {
    permitido: faltantes.length === 0,
    motivo: faltantes.length
      ? `El rol ${rol} no tiene el permiso ${faltantes.join(', ')}.`
      : `El rol ${rol} tiene el permiso ${requeridos.join(', ')}.`,
  };
};
