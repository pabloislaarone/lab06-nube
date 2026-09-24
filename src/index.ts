import { config } from './config';
import { inicializarBaseDeDatos } from './database';
import { sembrarDatos } from './seed';
import { crearApp } from './app';

inicializarBaseDeDatos(sembrarDatos)
  .then(() => {
    crearApp().listen(config.port, () => console.log(`Servidor corriendo en http://localhost:${config.port}`));
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
