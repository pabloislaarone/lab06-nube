import db from '../database';

export const logAudit = (usuario: string, recurso: string, accion: string, resultado: string, motivo: string) => {
  const query = `
    INSERT INTO Auditoria (usuario, recurso, accion, resultado, motivo) 
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [usuario, recurso, accion, resultado, motivo], (err) => {
    if (err) {
      console.error('Error registrando auditoría:', err.message);
    }
  });
};