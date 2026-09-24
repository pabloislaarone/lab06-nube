export const ESTADOS_USUARIO = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'] as const;
export const TIPOS_CONTRATO = ['INTERNO', 'EXTERNO'] as const;
export const ESTADOS_DOCUMENTO = ['PENDIENTE', 'APROBADO', 'PUBLICADO'] as const;

export type Permiso =
  | 'crear_documento'
  | 'consultar_documento'
  | 'modificar_documento'
  | 'eliminar_documento'
  | 'aprobar_documento'
  | 'ver_auditoria'
  | 'gestionar_usuarios'
  | 'asignar_roles';

export type Accion =
  | 'LOGIN'
  | 'LIST'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'GESTIONAR_USUARIOS'
  | 'VER_AUDITORIA';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  departamento: string;
  nivel_seguridad: number;
  pais: string;
  tipo_contrato: string;
  estado: string;
}

export interface Documento {
  id?: number;
  titulo: string;
  descripcion: string | null;
  propietario: number;
  departamento: string;
  departamento_id: number;
  nivel_confidencialidad: number;
  estado: string;
  pais: string;
  fecha_creacion?: string;
}

export interface Entorno {
  hora: string;
  fecha: string;
  direccion_ip: string;
  ubicacion: string;
  dispositivo: string;
}
