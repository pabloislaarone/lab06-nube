import express from 'express';
import path from 'path';
import authRoutes from './routes/auth';
import documentoRoutes from './routes/documentos';
import usuarioRoutes from './routes/usuarios';
import auditoriaRoutes from './routes/auditoria';
import catalogoRoutes from './routes/catalogos';
import { manejarErrores } from './http';

export const crearApp = () => {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.use('/auth', authRoutes);
  app.use('/documentos', documentoRoutes);
  app.use('/usuarios', usuarioRoutes);
  app.use('/auditoria', auditoriaRoutes);
  app.use('/catalogos', catalogoRoutes);

  app.use(manejarErrores);
  return app;
};
