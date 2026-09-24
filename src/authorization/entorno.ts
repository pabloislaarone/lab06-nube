import { Request } from 'express';
import { config } from '../config';
import { Entorno } from '../types';

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

const formatear = (fecha: Date, opciones: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: config.zonaHoraria, ...opciones }).format(fecha);

export const obtenerEntorno = (req: Request): Entorno => {
  const ahora = new Date();
  const horaSimulada = req.get('x-hora');
  return {
    hora: config.simularEntorno && horaSimulada && HORA_VALIDA.test(horaSimulada)
      ? horaSimulada
      : formatear(ahora, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    fecha: formatear(ahora, { year: 'numeric', month: '2-digit', day: '2-digit' }),
    direccion_ip: req.ip ?? '',
    ubicacion: (req.get('x-ubicacion') ?? 'DESCONOCIDA').toUpperCase(),
    dispositivo: (req.get('x-dispositivo') ?? 'PERSONAL').toUpperCase(),
  };
};
