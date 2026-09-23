import { Request, Response, NextFunction } from 'express';
import { logAudit } from '../services/audit';

export const auditInterceptor = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    const originalJson = res.json;
    
    res.json = function (body) {
      const userEmail = req.body.userContext?.correo || 'NO_AUTENTICADO';
      const resourceId = req.params.id || req.body.documentId || 'N/A';
      const statusCode = res.statusCode;
      
      let resultado = 'DENEGADO';
      let motivo = body.error || 'Acceso rechazado';

      if (statusCode >= 200 && statusCode < 300) {
        resultado = 'PERMITIDO';
        motivo = 'Autorización exitosa (RBAC + ABAC)';
      }

      // Registrar en base de datos
      logAudit(userEmail, `documento-${resourceId}`, action, resultado, motivo);

      // Continuar con el envío de la respuesta original
      return originalJson.call(this, body);
    };

    next();
  };
};