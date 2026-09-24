import { all, get } from '../database';
import { Usuario } from '../types';

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.correo, r.nombre AS rol, d.nombre AS departamento,
         u.nivel_seguridad, u.pais, u.tipo_contrato, u.estado
  FROM Usuario u
  JOIN Rol r ON r.id = u.rol_id
  JOIN Departamento d ON d.id = u.departamento_id
`;

export const buscarUsuarioPorId = (id: number) => get<Usuario>(`${SELECT_USUARIO} WHERE u.id = ?`, [id]);

export const buscarCredenciales = (correo: string) =>
  get<{ id: number; password_hash: string }>('SELECT id, password_hash FROM Usuario WHERE correo = ?', [correo]);

export const listarUsuarios = () => all<Usuario>(`${SELECT_USUARIO} ORDER BY u.id`);
