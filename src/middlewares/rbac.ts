import { Request, Response, NextFunction } from 'express';

// Matriz de permisos RBAC según el documento
const rbacMatrix: Record<string, string[]> = {
  'ADMINISTRADOR': ['crear_documento', 'consultar_documento', 'modificar_documento', 'eliminar_documento', 'aprobar_documento', 'ver_auditoria', 'gestionar_usuarios', 'asignar_roles'],
  'GERENTE': ['crear_documento', 'consultar_documento', 'modificar_documento', 'eliminar_documento', 'aprobar_documento', 'ver_auditoria'],
  'SUPERVISOR': ['crear_documento', 'consultar_documento', 'modificar_documento', 'aprobar_documento'],
  'EMPLEADO': ['crear_documento', 'consultar_documento', 'modificar_documento'],
  'AUDITOR': ['consultar_documento', 'ver_auditoria'],
  'INVITADO': ['consultar_documento']
};

export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.body.userContext?.rol;

    if (!userRole) {
      return res.status(403).json({ error: 'Denegado por RBAC: Rol no identificado en la solicitud.' });
    }

    const allowedPermissions = rbacMatrix[userRole] || [];

    if (!allowedPermissions.includes(requiredPermission)) {
      return res.status(403).json({ 
        error: `Denegado por RBAC: El rol ${userRole} no tiene permiso para la operación '${requiredPermission}'.` 
      });
    }

    next();
  };
};