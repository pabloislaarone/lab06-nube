import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../database';

const router = Router();
const SECRET_KEY = 'clave_secreta_securedocs_2026'; 

router.post('/login', (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Faltan credenciales.' });
  }

  const query = `
    SELECT u.*, r.nombre as rol_nombre, d.nombre as departamento_nombre 
    FROM Usuario u
    LEFT JOIN Rol r ON u.rol_id = r.id
    LEFT JOIN Departamento d ON u.departamento_id = d.id
    WHERE u.correo = ? AND u.password = ?
  `;

  db.get(query, [correo, password], (err, row: any) => {
    if (err) {
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }

    if (!row) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (row.estado !== 'ACTIVO') {
      return res.status(403).json({ error: 'Usuario inactivo o suspendido.' }); // Política 7 de ABAC parcial
    }

    const payload = {
      id: row.id,
      nombre: row.nombre,
      correo: row.correo,
      rol: row.rol_nombre,
      departamento: row.departamento_nombre,
      nivel_seguridad: row.nivel_seguridad,
      pais: row.pais,
      tipo_contrato: row.tipo_contrato,
      estado: row.estado
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });

    res.json({ 
      mensaje: 'Autenticación exitosa', 
      token,
      usuario: payload
    });
  });
});

export default router;