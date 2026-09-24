import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'clave_secreta_securedocs_2026',
  jwtExpiracion: '2h' as const,
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../securedocs.db'),
  zonaHoraria: process.env.ZONA_HORARIA || 'America/Lima',
  simularEntorno: process.env.SIMULAR_ENTORNO !== 'false',
};
