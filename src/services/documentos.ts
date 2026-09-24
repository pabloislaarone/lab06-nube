import { all, get } from '../database';
import { Documento } from '../types';

const SELECT_DOCUMENTO = `
  SELECT doc.id, doc.titulo, doc.descripcion, doc.propietario_id AS propietario,
         dep.nombre AS departamento, doc.departamento_id, doc.nivel_confidencialidad,
         doc.estado, doc.pais, doc.fecha_creacion
  FROM Documento doc
  JOIN Departamento dep ON dep.id = doc.departamento_id
`;

export const buscarDocumento = (id: number) => get<Documento>(`${SELECT_DOCUMENTO} WHERE doc.id = ?`, [id]);

export const listarDocumentos = () => all<Documento>(`${SELECT_DOCUMENTO} ORDER BY doc.id`);
