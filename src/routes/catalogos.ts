import { Router } from 'express';
import { all } from '../database';
import { autenticar } from '../auth/autenticacion';

const router = Router();

router.get('/', autenticar, async (_req, res) => {
  const [roles, departamentos, permisos, politicas] = await Promise.all([
    all<{ id: number; nombre: string; descripcion: string; permisos: string | null }>(
      `SELECT r.id, r.nombre, r.descripcion, GROUP_CONCAT(p.codigo) AS permisos
       FROM Rol r
       LEFT JOIN RolPermiso rp ON rp.rol_id = r.id
       LEFT JOIN Permiso p ON p.id = rp.permiso_id
       GROUP BY r.id ORDER BY r.id`,
    ),
    all('SELECT id, nombre FROM Departamento ORDER BY id'),
    all('SELECT id, codigo, descripcion FROM Permiso ORDER BY id'),
    all('SELECT codigo, nombre, descripcion, acciones, roles_objetivo, roles_exentos, parametros, activa FROM Politica ORDER BY id'),
  ]);

  res.json({
    roles: roles.map((r) => ({ ...r, permisos: r.permisos ? r.permisos.split(',') : [] })),
    departamentos,
    permisos,
    politicas,
  });
});

export default router;
