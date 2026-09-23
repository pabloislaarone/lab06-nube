import { Router } from 'express';
import db from '../database';
import { verifyToken } from '../middlewares/jwt';
import { requirePermission } from '../middlewares/rbac';
import { auditInterceptor } from '../middlewares/auditInterceptor';

const router = Router();

// GET /usuarios (Listar todos)
router.get('/', verifyToken, auditInterceptor('READ_USERS'), requirePermission('gestionar_usuarios'), (req, res) => {
  db.all(`SELECT id, nombre, correo, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado FROM Usuario`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error consultando usuarios.' });
    res.json(rows);
  });
});

// POST /usuarios (Registrar usuario)
router.post('/', verifyToken, auditInterceptor('CREATE_USER'), requirePermission('gestionar_usuarios'), (req, res) => {
  const { nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado } = req.body;
  const query = `INSERT INTO Usuario (nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [nombre, correo, password, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado || 'ACTIVO'], function(err) {
    if (err) return res.status(500).json({ error: 'Error al registrar usuario.' });
    res.status(201).json({ mensaje: 'Usuario creado', id: this.lastID });
  });
});

// PUT /usuarios/:id (Modificar usuario, roles, departamento o activar/desactivar)
router.put('/:id', verifyToken, auditInterceptor('UPDATE_USER'), requirePermission('gestionar_usuarios'), (req, res) => {
  const { nombre, rol_id, departamento_id, nivel_seguridad, estado } = req.body;
  const query = `UPDATE Usuario SET nombre = ?, rol_id = ?, departamento_id = ?, nivel_seguridad = ?, estado = ? WHERE id = ?`;
  
  db.run(query, [nombre, rol_id, departamento_id, nivel_seguridad, estado, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar usuario.' });
    res.json({ mensaje: 'Usuario actualizado con éxito.' });
  });
});

export default router;