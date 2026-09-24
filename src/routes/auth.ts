import { Router } from 'express';
import { autenticar, firmarToken, revocarToken } from '../auth/autenticacion';
import { verificarPassword } from '../auth/password';
import { evaluarABAC } from '../authorization/abac/motor';
import { obtenerEntorno } from '../authorization/entorno';
import { permisosDeRol } from '../authorization/rbac';
import { auditar } from '../services/auditoria';
import { buscarCredenciales, buscarUsuarioPorId } from '../services/usuarios';
import { rechazar, texto } from '../http';

const router = Router();

router.post('/login', auditar('LOGIN', () => 'sesion'), async (req, res) => {
  const correo = texto(req.body?.correo, 'correo').toLowerCase();
  const password = texto(req.body?.password, 'password');
  res.locals.identidad = correo;

  const credenciales = await buscarCredenciales(correo);
  const usuario = credenciales && verificarPassword(password, credenciales.password_hash)
    ? await buscarUsuarioPorId(credenciales.id)
    : undefined;
  if (!usuario) return rechazar(res, 401, 'Credenciales inválidas.');

  const abac = await evaluarABAC({ usuario, accion: 'LOGIN', entorno: obtenerEntorno(req) });
  if (!abac.permitido) return rechazar(res, 403, `Denegado por ABAC: ${abac.motivo}`, { etapa: 'ABAC' });

  res.locals.usuario = usuario;
  res.locals.motivo = 'Autenticación exitosa.';
  res.json({ mensaje: 'Autenticación exitosa.', token: firmarToken(usuario.id), usuario, permisos: await permisosDeRol(usuario.rol) });
});

router.post('/logout', auditar('LOGOUT', () => 'sesion'), autenticar, (_req, res) => {
  revocarToken(res.locals.token);
  res.locals.motivo = 'Sesión cerrada.';
  res.json({ mensaje: 'Sesión cerrada.' });
});

router.get('/me', autenticar, async (_req, res) => {
  const { usuario } = res.locals;
  res.json({ usuario, permisos: await permisosDeRol(usuario.rol) });
});

export default router;
