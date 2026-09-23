import { Router } from 'express';
import db from '../database';
import { verifyToken } from '../middlewares/jwt';
import { requirePermission } from '../middlewares/rbac';
import { evaluateABAC } from '../middlewares/abac';
import { auditInterceptor } from '../middlewares/auditInterceptor';

const router = Router();

// POST /documentos (Crear)
router.post('/', verifyToken, auditInterceptor('CREATE'), requirePermission('crear_documento'), evaluateABAC('CREATE'), (req, res) => {
  const { titulo, descripcion, departamento_id, nivel_confidencialidad, pais } = req.body;
  const propietario_id = req.body.userContext.id;
  
  const query = `INSERT INTO Documento (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, pais) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, pais], function(err) {
    if (err) return res.status(500).json({ error: 'Error al crear documento.' });
    res.status(201).json({ mensaje: 'Documento creado', id: this.lastID });
  });
});

// GET /documentos/:id (Consultar)
router.get('/:id', verifyToken, auditInterceptor('READ'), requirePermission('consultar_documento'), evaluateABAC('READ'), (req, res) => {
  // El documento ya fue validado y cargado por el middleware ABAC
  res.json(req.body.verifiedDocument);
});

// PUT /documentos/:id (Modificar)
router.put('/:id', verifyToken, auditInterceptor('UPDATE'), requirePermission('modificar_documento'), evaluateABAC('UPDATE'), (req, res) => {
  const { titulo, descripcion, nivel_confidencialidad } = req.body;
  const query = `UPDATE Documento SET titulo = ?, descripcion = ?, nivel_confidencialidad = ? WHERE id = ?`;
  
  db.run(query, [titulo, descripcion, nivel_confidencialidad, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al modificar documento.' });
    res.json({ mensaje: 'Documento modificado con éxito.' });
  });
});

// DELETE /documentos/:id (Eliminar)
router.delete('/:id', verifyToken, auditInterceptor('DELETE'), requirePermission('eliminar_documento'), evaluateABAC('DELETE'), (req, res) => {
  db.run(`DELETE FROM Documento WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar documento.' });
    res.json({ mensaje: 'Documento eliminado correctamente.' });
  });
});

// POST /documentos/:id/aprobar (Aprobar)
router.post('/:id/aprobar', verifyToken, auditInterceptor('APPROVE'), requirePermission('aprobar_documento'), evaluateABAC('READ'), (req, res) => {
  db.run(`UPDATE Documento SET estado = 'APROBADO' WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Error al aprobar documento.' });
    res.json({ mensaje: 'Documento aprobado exitosamente.' });
  });
});

export default router;