import { run } from './database';
import { hashPassword } from './auth/password';
import { Accion, Permiso } from './types';

const DEPARTAMENTOS = ['FINANZAS', 'RRHH', 'SISTEMAS'];

const PERMISOS: Record<Permiso, string> = {
  crear_documento: 'Crear documento',
  consultar_documento: 'Consultar documento',
  modificar_documento: 'Modificar documento',
  eliminar_documento: 'Eliminar documento',
  aprobar_documento: 'Aprobar documento',
  ver_auditoria: 'Ver auditoría',
  gestionar_usuarios: 'Gestionar usuarios',
  asignar_roles: 'Asignar roles',
};

const ROLES: Record<string, { descripcion: string; permisos: Permiso[] }> = {
  ADMINISTRADOR: {
    descripcion: 'Administra usuarios, roles y configuraciones',
    permisos: ['crear_documento', 'consultar_documento', 'modificar_documento', 'eliminar_documento', 'aprobar_documento', 'ver_auditoria', 'gestionar_usuarios', 'asignar_roles'],
  },
  GERENTE: {
    descripcion: 'Supervisa documentos de su área',
    permisos: ['crear_documento', 'consultar_documento', 'modificar_documento', 'eliminar_documento', 'aprobar_documento', 'ver_auditoria'],
  },
  SUPERVISOR: {
    descripcion: 'Revisa y aprueba documentos',
    permisos: ['crear_documento', 'consultar_documento', 'modificar_documento', 'aprobar_documento'],
  },
  EMPLEADO: {
    descripcion: 'Crea y consulta documentos de su área',
    permisos: ['crear_documento', 'consultar_documento', 'modificar_documento'],
  },
  AUDITOR: {
    descripcion: 'Consulta documentos y registros de auditoría',
    permisos: ['consultar_documento', 'ver_auditoria'],
  },
  INVITADO: {
    descripcion: 'Acceso temporal a determinados documentos',
    permisos: ['consultar_documento'],
  },
};

const ACCIONES_DOCUMENTO: Accion[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE'];
const ACCESO_DOCUMENTO: Accion[] = ['READ', 'UPDATE', 'DELETE', 'APPROVE'];

const POLITICAS = [
  {
    codigo: 'DEPARTAMENTO',
    nombre: 'Política 1 - Departamento',
    descripcion: 'usuario.departamento == documento.departamento',
    acciones: ACCIONES_DOCUMENTO,
    roles_exentos: ['ADMINISTRADOR', 'AUDITOR'],
  },
  {
    codigo: 'NIVEL_SEGURIDAD',
    nombre: 'Política 2 - Nivel de seguridad',
    descripcion: 'usuario.nivel_seguridad >= documento.nivel_confidencialidad',
    acciones: ACCIONES_DOCUMENTO,
  },
  {
    codigo: 'PROPIEDAD',
    nombre: 'Política 3 - Propiedad',
    descripcion: 'usuario.id == documento.propietario',
    acciones: ['UPDATE'],
    roles_exentos: ['ADMINISTRADOR', 'GERENTE'],
  },
  {
    codigo: 'HORARIO',
    nombre: 'Política 4 - Horario',
    descripcion: 'documento.nivel_confidencialidad >= 4 solo entre 08:00 y 18:00',
    acciones: ACCESO_DOCUMENTO,
    parametros: { nivel_minimo: 4, hora_inicio: '08:00', hora_fin: '18:00' },
  },
  {
    codigo: 'PAIS',
    nombre: 'Política 5 - País',
    descripcion: 'usuario.pais == documento.pais y entorno.ubicacion == documento.pais',
    acciones: ACCIONES_DOCUMENTO,
  },
  {
    codigo: 'DISPOSITIVO',
    nombre: 'Política 6 - Dispositivo',
    descripcion: 'documento.nivel_confidencialidad >= 4 requiere dispositivo CORPORATIVO',
    acciones: ACCESO_DOCUMENTO,
    parametros: { nivel_minimo: 4, dispositivos: ['CORPORATIVO'] },
  },
  {
    codigo: 'ESTADO_USUARIO',
    nombre: 'Política 7 - Estado del usuario',
    descripcion: 'usuario.estado == ACTIVO',
    acciones: ['*'],
    parametros: { estados_permitidos: ['ACTIVO'] },
  },
  {
    codigo: 'INVITADO',
    nombre: 'Política 8 - Invitados',
    descripcion: 'tipo_contrato == EXTERNO y nivel_confidencialidad <= 1 y documento.estado == PUBLICADO',
    acciones: ACCIONES_DOCUMENTO,
    roles_objetivo: ['INVITADO'],
    parametros: { tipo_contrato: 'EXTERNO', nivel_maximo: 1, estado_documento: 'PUBLICADO' },
  },
];

const USUARIOS = [
  { nombre: 'Admin', correo: 'admin@techcorp.com', rol: 'ADMINISTRADOR', departamento: 'SISTEMAS', nivel: 5, contrato: 'INTERNO', estado: 'ACTIVO' },
  { nombre: 'Carlos Ruiz', correo: 'carlos@techcorp.com', rol: 'SUPERVISOR', departamento: 'FINANZAS', nivel: 3, contrato: 'INTERNO', estado: 'ACTIVO' },
  { nombre: 'Ana Torres', correo: 'ana@techcorp.com', rol: 'EMPLEADO', departamento: 'RRHH', nivel: 2, contrato: 'INTERNO', estado: 'ACTIVO' },
  { nombre: 'Juan Invitado', correo: 'juan@externo.com', rol: 'INVITADO', departamento: 'RRHH', nivel: 1, contrato: 'EXTERNO', estado: 'ACTIVO' },
  { nombre: 'Luis Inactivo', correo: 'luis@techcorp.com', rol: 'EMPLEADO', departamento: 'FINANZAS', nivel: 2, contrato: 'INTERNO', estado: 'INACTIVO' },
  { nombre: 'Rosa Auditora', correo: 'auditor@techcorp.com', rol: 'AUDITOR', departamento: 'SISTEMAS', nivel: 5, contrato: 'INTERNO', estado: 'ACTIVO' },
  { nombre: 'Maria Gerente', correo: 'maria@techcorp.com', rol: 'GERENTE', departamento: 'FINANZAS', nivel: 5, contrato: 'INTERNO', estado: 'ACTIVO' },
  { nombre: 'Pedro Empleado', correo: 'pedro@techcorp.com', rol: 'EMPLEADO', departamento: 'FINANZAS', nivel: 2, contrato: 'INTERNO', estado: 'ACTIVO' },
];

const DOCUMENTOS = [
  { titulo: 'Presupuesto anual', descripcion: 'Presupuesto del área de finanzas', propietario: 2, departamento: 'FINANZAS', nivel: 3, estado: 'PENDIENTE' },
  { titulo: 'Manual público', descripcion: 'Manual de bienvenida para personal', propietario: 3, departamento: 'RRHH', nivel: 1, estado: 'PUBLICADO' },
  { titulo: 'Presupuesto corporativo', descripcion: 'Proyección financiera confidencial', propietario: 7, departamento: 'FINANZAS', nivel: 4, estado: 'PENDIENTE' },
  { titulo: 'Plan estratégico', descripcion: 'Plan estratégico de alta gerencia', propietario: 7, departamento: 'FINANZAS', nivel: 5, estado: 'PENDIENTE' },
  { titulo: 'Política de vacaciones', descripcion: 'Borrador de política interna', propietario: 3, departamento: 'RRHH', nivel: 2, estado: 'PENDIENTE' },
  { titulo: 'Informe trimestral', descripcion: 'Informe de gastos del trimestre', propietario: 8, departamento: 'FINANZAS', nivel: 2, estado: 'PENDIENTE' },
];

export const sembrarDatos = async () => {
  for (const nombre of DEPARTAMENTOS) {
    await run('INSERT INTO Departamento (nombre) VALUES (?)', [nombre]);
  }

  for (const [codigo, descripcion] of Object.entries(PERMISOS)) {
    await run('INSERT INTO Permiso (codigo, descripcion) VALUES (?, ?)', [codigo, descripcion]);
  }

  for (const [nombre, { descripcion, permisos }] of Object.entries(ROLES)) {
    const { lastID } = await run('INSERT INTO Rol (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
    for (const permiso of permisos) {
      await run('INSERT INTO RolPermiso (rol_id, permiso_id) SELECT ?, id FROM Permiso WHERE codigo = ?', [lastID, permiso]);
    }
  }

  for (const p of POLITICAS) {
    await run(
      'INSERT INTO Politica (codigo, nombre, descripcion, acciones, roles_objetivo, roles_exentos, parametros) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [p.codigo, p.nombre, p.descripcion, p.acciones.join(','), (p.roles_objetivo ?? []).join(','), (p.roles_exentos ?? []).join(','), JSON.stringify(p.parametros ?? {})],
    );
  }

  for (const u of USUARIOS) {
    await run(
      `INSERT INTO Usuario (nombre, correo, password_hash, rol_id, departamento_id, nivel_seguridad, pais, tipo_contrato, estado)
       VALUES (?, ?, ?, (SELECT id FROM Rol WHERE nombre = ?), (SELECT id FROM Departamento WHERE nombre = ?), ?, 'PERU', ?, ?)`,
      [u.nombre, u.correo, hashPassword('123'), u.rol, u.departamento, u.nivel, u.contrato, u.estado],
    );
  }

  for (const d of DOCUMENTOS) {
    await run(
      `INSERT INTO Documento (titulo, descripcion, propietario_id, departamento_id, nivel_confidencialidad, estado, pais)
       VALUES (?, ?, ?, (SELECT id FROM Departamento WHERE nombre = ?), ?, ?, 'PERU')`,
      [d.titulo, d.descripcion, d.propietario, d.departamento, d.nivel, d.estado],
    );
  }
};
