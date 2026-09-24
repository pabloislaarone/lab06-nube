import { Router } from 'express';
import { autenticar } from '../auth/autenticacion';
import { autorizar } from '../authorization/autorizar';
import { auditar, listarAuditoria } from '../services/auditoria';
import { entero, opcional } from '../http';

const router = Router();

router.get('/', auditar('VER_AUDITORIA', () => 'auditoria'), autenticar, autorizar('ver_auditoria', 'VER_AUDITORIA'), async (req, res) => {
  const limite = opcional(req.query.limite, (v) => entero(v, 'limite', 1, 1000)) ?? 200;
  res.json(await listarAuditoria(limite));
});

export default router;
