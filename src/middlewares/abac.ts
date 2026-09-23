import { Request, Response, NextFunction } from 'express';
import db from '../database';

const evalStatePolicy = (user: any): boolean => {
  return user.estado === 'ACTIVO';
};

const evalGuestPolicy = (user: any, document: any): boolean => {
  if (user.rol === 'INVITADO') {
    return (
      user.tipo_contrato === 'EXTERNO' &&
      document.nivel_confidencialidad <= 1 &&
      document.estado === 'PUBLICADO'
    );
  }
  return true; 
};

export const evaluateABAC = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.body.userContext;
    const documentId = req.params.id || req.body.documentId;
    
    // Atributos de entorno enviados en el header o body (simulados por el cliente)
    const contextDevice = req.headers['x-device-type'] || 'PERSONAL';
    // Se extrae la hora actual del servidor en formato HH:MM
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    if (!user) return res.status(403).json({ error: 'Usuario no identificado para ABAC.' });

    // Política 7: Estado del usuario
    if (!evalStatePolicy(user)) {
      return res.status(403).json({ error: 'Denegado por ABAC: Usuario inactivo.' });
    }

    // Si la acción es creación (no hay documento previo), solo validamos estado
    if (action === 'CREATE') return next();

    // Consultar el documento objetivo para evaluar el resto de políticas
    const query = `
      SELECT d.*, de.nombre as departamento_nombre 
      FROM Documento d
      LEFT JOIN Departamento de ON d.departamento_id = de.id
      WHERE d.id = ?
    `;

    db.get(query, [documentId], (err, doc: any) => {
      if (err) return res.status(500).json({ error: 'Error interno en ABAC.' });
      if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

      // Política 8: Invitados
      if (!evalGuestPolicy(user, doc)) {
        return res.status(403).json({ error: 'Denegado por ABAC: Restricciones de invitado no cumplidas.' });
      }

      // Política 1: Departamento (Solo lectura/consulta, exceptuando admins)
      if (action === 'READ' && user.rol !== 'ADMINISTRADOR') {
        if (user.departamento !== doc.departamento_nombre) {
          return res.status(403).json({ error: 'Denegado por ABAC: El documento pertenece a otro departamento.' });
        }
      }

      // Política 2: Nivel de seguridad
      if (user.nivel_seguridad < doc.nivel_confidencialidad) {
        return res.status(403).json({ error: 'Denegado por ABAC: Nivel de seguridad insuficiente.' });
      }

      // Política 3: Propiedad (Modificación)
      if (action === 'UPDATE' && !['ADMINISTRADOR', 'GERENTE'].includes(user.rol)) {
        if (user.id !== doc.propietario_id) {
          return res.status(403).json({ error: 'Denegado por ABAC: Solo el propietario puede modificar este documento.' });
        }
      }

      // Política 4: Horario (08:00 - 18:00 para doc >= 4)
      if (doc.nivel_confidencialidad >= 4) {
        if (currentTime < '08:00' || currentTime > '18:00') {
          return res.status(403).json({ error: 'Denegado por ABAC: Acceso fuera de horario permitido para documentos confidenciales.' });
        }
      }

      // Política 5: País
      if (user.pais !== doc.pais) {
         return res.status(403).json({ error: 'Denegado por ABAC: Restricción geográfica (País).' });
      }

      // Política 6: Dispositivo
      if (doc.nivel_confidencialidad >= 4 && contextDevice !== 'CORPORATIVO') {
        return res.status(403).json({ error: 'Denegado por ABAC: Requiere dispositivo corporativo.' });
      }

      // Inyectar documento verificado para uso posterior en los endpoints
      req.body.verifiedDocument = doc;
      next();
    });
  };
};