import { Accion, Documento, Entorno, Usuario } from '../../types';

export interface Contexto {
  usuario: Usuario;
  documento?: Documento;
  accion: Accion;
  entorno: Entorno;
}

export interface Resultado {
  cumple: boolean;
  detalle: string;
}

type Parametros = Record<string, any>;

interface Evaluador {
  requiereDocumento: boolean;
  evaluar: (ctx: Required<Contexto>, p: Parametros) => Resultado;
}

const comparar = (cumple: boolean, izquierda: unknown, operador: string, negado: string, derecha: unknown): Resultado => ({
  cumple,
  detalle: `${izquierda} ${cumple ? operador : negado} ${derecha}`,
});

export const EVALUADORES: Record<string, Evaluador> = {
  DEPARTAMENTO: {
    requiereDocumento: true,
    evaluar: ({ usuario, documento }) =>
      comparar(usuario.departamento === documento.departamento, usuario.departamento, '==', '!=', documento.departamento),
  },

  NIVEL_SEGURIDAD: {
    requiereDocumento: true,
    evaluar: ({ usuario, documento }) =>
      comparar(usuario.nivel_seguridad >= documento.nivel_confidencialidad, usuario.nivel_seguridad, '>=', '<', documento.nivel_confidencialidad),
  },

  PROPIEDAD: {
    requiereDocumento: true,
    evaluar: ({ usuario, documento }) =>
      comparar(usuario.id === documento.propietario, `usuario ${usuario.id}`, '==', '!=', `propietario ${documento.propietario}`),
  },

  HORARIO: {
    requiereDocumento: true,
    evaluar: ({ documento, entorno }, p) => {
      if (documento.nivel_confidencialidad < p.nivel_minimo) {
        return { cumple: true, detalle: `nivel ${documento.nivel_confidencialidad} sin restricción horaria` };
      }
      const cumple = entorno.hora >= p.hora_inicio && entorno.hora <= p.hora_fin;
      return { cumple, detalle: `${entorno.hora} ${cumple ? 'dentro' : 'fuera'} de ${p.hora_inicio}-${p.hora_fin}` };
    },
  },

  PAIS: {
    requiereDocumento: true,
    evaluar: ({ usuario, documento, entorno }) => {
      const cumple = usuario.pais === documento.pais && entorno.ubicacion === documento.pais;
      return { cumple, detalle: `usuario ${usuario.pais}, ubicación ${entorno.ubicacion}, documento ${documento.pais}` };
    },
  },

  DISPOSITIVO: {
    requiereDocumento: true,
    evaluar: ({ documento, entorno }, p) => {
      if (documento.nivel_confidencialidad < p.nivel_minimo) {
        return { cumple: true, detalle: `nivel ${documento.nivel_confidencialidad} sin restricción de dispositivo` };
      }
      const cumple = p.dispositivos.includes(entorno.dispositivo);
      return { cumple, detalle: `dispositivo ${entorno.dispositivo}${cumple ? '' : `, se requiere ${p.dispositivos.join('/')}`}` };
    },
  },

  ESTADO_USUARIO: {
    requiereDocumento: false,
    evaluar: ({ usuario }, p) => ({
      cumple: p.estados_permitidos.includes(usuario.estado),
      detalle: `estado ${usuario.estado}`,
    }),
  },

  INVITADO: {
    requiereDocumento: true,
    evaluar: ({ usuario, documento }, p) => {
      const fallos = [
        usuario.tipo_contrato !== p.tipo_contrato && `contrato ${usuario.tipo_contrato} != ${p.tipo_contrato}`,
        documento.nivel_confidencialidad > p.nivel_maximo && `nivel ${documento.nivel_confidencialidad} > ${p.nivel_maximo}`,
        documento.estado !== p.estado_documento && `estado ${documento.estado} != ${p.estado_documento}`,
      ].filter(Boolean);
      return { cumple: fallos.length === 0, detalle: fallos.length ? fallos.join(', ') : 'externo, nivel y estado válidos' };
    },
  },
};
