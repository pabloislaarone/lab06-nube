import { all } from '../../database';
import { Contexto, EVALUADORES, Resultado } from './politicas';

interface Politica {
  codigo: string;
  nombre: string;
  acciones: string;
  roles_objetivo: string;
  roles_exentos: string;
  parametros: string;
}

export interface Evaluacion extends Resultado {
  politica: string;
}

const lista = (csv: string) => csv.split(',').map((v) => v.trim()).filter(Boolean);

const aplica = (p: Politica, { accion, usuario }: Contexto) => {
  const acciones = lista(p.acciones);
  const objetivo = lista(p.roles_objetivo);
  return (
    (acciones.includes('*') || acciones.includes(accion)) &&
    (objetivo.length === 0 || objetivo.includes(usuario.rol)) &&
    !lista(p.roles_exentos).includes(usuario.rol)
  );
};

const evaluarPolitica = (p: Politica, ctx: Contexto): Evaluacion => {
  const evaluador = EVALUADORES[p.codigo];
  if (!evaluador) return { politica: p.nombre, cumple: false, detalle: 'política sin evaluador definido' };
  if (evaluador.requiereDocumento && !ctx.documento) return { politica: p.nombre, cumple: false, detalle: 'recurso no disponible' };
  return { politica: p.nombre, ...evaluador.evaluar(ctx as Required<Contexto>, JSON.parse(p.parametros)) };
};

export const evaluarABAC = async (ctx: Contexto) => {
  const politicas = await all<Politica>('SELECT * FROM Politica WHERE activa = 1 ORDER BY id');
  const evaluaciones = politicas.filter((p) => aplica(p, ctx)).map((p) => evaluarPolitica(p, ctx));
  const fallidas = evaluaciones.filter((e) => !e.cumple);
  return {
    permitido: fallidas.length === 0,
    evaluaciones,
    motivo: fallidas.length
      ? fallidas.map((f) => `${f.politica} (${f.detalle})`).join('; ')
      : 'Cumple todas las políticas aplicables.',
  };
};
