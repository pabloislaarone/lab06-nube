const estado = { usuario: null, permisos: [], catalogos: null, documentos: [], usuarios: [], auditoria: [], seccion: 'documentos' };

const CUENTAS_PRUEBA = [
    ['admin@techcorp.com', 'Administrador'],
    ['maria@techcorp.com', 'Gerente'],
    ['carlos@techcorp.com', 'Supervisor'],
    ['ana@techcorp.com', 'Empleado RRHH'],
    ['pedro@techcorp.com', 'Empleado Finanzas'],
    ['auditor@techcorp.com', 'Auditor'],
    ['juan@externo.com', 'Invitado'],
    ['luis@techcorp.com', 'Inactivo'],
];

const TITULOS = { documentos: 'Documentos', usuarios: 'Usuarios', auditoria: 'Auditoría', politicas: 'Matrices RBAC / ABAC' };
const ACCIONES = { READ: 'Consultar', UPDATE: 'Modificar', APPROVE: 'Aprobar', DELETE: 'Eliminar' };

const $ = (id) => document.getElementById(id);

const esc = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const tienePermiso = (permiso) => estado.permisos.includes(permiso);

const colorNivel = (nivel) => (nivel >= 4 ? 'bg-red-100 text-red-800 border-red-200' : nivel === 3 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200');

const colorResultado = { PERMITIDO: 'bg-green-100 text-green-800', DENEGADO: 'bg-red-100 text-red-800', ERROR: 'bg-gray-200 text-gray-700' };

const opciones = (lista, seleccionado, valor = (x) => x, texto = (x) => x) =>
    lista.map((x) => `<option value="${esc(valor(x))}" ${String(valor(x)) === String(seleccionado) ? 'selected' : ''}>${esc(texto(x))}</option>`).join('');

const campo = (etiqueta, control) => `<label class="block text-left text-sm mb-3"><span class="text-gray-600">${etiqueta}</span>${control}</label>`;

const INPUT = 'class="mt-1 w-full border rounded px-3 py-2 text-sm"';

const valorFormulario = (id) => Swal.getPopup().querySelector(`#${id}`).value.trim();

const renderEvaluaciones = (evaluaciones = []) => evaluaciones.length
    ? `<ul class="text-left text-sm space-y-1 mt-3">${evaluaciones.map((e) => `
        <li class="flex gap-2 ${e.cumple ? 'text-green-700' : 'text-red-600'}">
            <i class="fa-solid ${e.cumple ? 'fa-circle-check' : 'fa-circle-xmark'} mt-0.5"></i>
            <span><b>${esc(e.politica)}</b>: ${esc(e.detalle)}</span>
        </li>`).join('')}</ul>`
    : '';

const notificar = (mensaje) => Swal.fire({ toast: true, position: 'bottom-end', icon: 'success', title: mensaje, showConfirmButton: false, timer: 3000, timerProgressBar: true });

const mostrarError = (err) => {
    if (err.status === 401 && estado.usuario) {
        cerrarSesionLocal();
        return Swal.fire({ icon: 'warning', title: 'Sesión finalizada', text: err.error || 'Vuelve a iniciar sesión.' });
    }
    if (err.status === 403) {
        return Swal.fire({
            icon: 'error',
            title: 'ACCESO DENEGADO',
            html: `
                ${err.etapa ? `<span class="inline-block text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700 mb-2">Denegado por ${esc(err.etapa)}</span>` : ''}
                ${err.evaluaciones?.length ? renderEvaluaciones(err.evaluaciones) : `<p class="text-sm">${esc(err.error)}</p>`}`,
            confirmButtonColor: '#ef4444',
        });
    }
    return Swal.fire({ icon: 'warning', title: 'No se pudo completar', text: err.error || 'Servidor inalcanzable.' });
};

const intentar = async (accion) => {
    try {
        return await accion();
    } catch (err) {
        mostrarError(err instanceof TypeError ? { error: 'Servidor inalcanzable.' } : err);
    }
};

function mostrarLogin() {
    $('login-view').classList.remove('hidden');
    $('dashboard-view').classList.add('hidden');
}

function cerrarSesionLocal() {
    almacen.borrar('token');
    estado.usuario = null;
    estado.permisos = [];
    mostrarLogin();
}

async function iniciarSesion({ usuario, permisos }) {
    estado.usuario = usuario;
    estado.permisos = permisos;
    $('nav-user-name').textContent = usuario.nombre;
    $('nav-user-role').textContent = usuario.rol;
    $('nav-user-dept').textContent = usuario.departamento;
    $('nav-user-level').textContent = usuario.nivel_seguridad;

    document.querySelectorAll('.menu-item[data-permiso]').forEach((el) => el.classList.toggle('hidden', !tienePermiso(el.dataset.permiso)));
    $('btn-nuevo-doc').classList.toggle('hidden', !tienePermiso('crear_documento'));

    $('login-view').classList.add('hidden');
    $('dashboard-view').classList.remove('hidden');

    estado.catalogos = await api.catalogos();
    mostrarSeccion('documentos');
}

function mostrarSeccion(seccion) {
    estado.seccion = seccion;
    document.querySelectorAll('.seccion').forEach((el) => el.classList.add('hidden'));
    $(`sec-${seccion}`).classList.remove('hidden');
    $('section-title').textContent = TITULOS[seccion];
    document.querySelectorAll('.menu-item').forEach((el) => {
        const activo = el.dataset.seccion === seccion;
        el.classList.toggle('border-blue-500', activo);
        el.classList.toggle('bg-slate-800', activo);
        el.classList.toggle('border-transparent', !activo);
    });
    ({ documentos: cargarDocumentos, usuarios: cargarUsuarios, auditoria: cargarAuditoria, politicas: renderPoliticas })[seccion]();
}

function cargarEntorno() {
    const e = entorno.obtener();
    $('entorno-hora').value = e.hora;
    $('entorno-hora').disabled = e.horaReal;
    $('entorno-hora-real').checked = e.horaReal;
    $('entorno-ubicacion').value = e.ubicacion;
    $('entorno-dispositivo').value = e.dispositivo;
}

function guardarEntorno() {
    entorno.guardar({
        horaReal: $('entorno-hora-real').checked,
        hora: $('entorno-hora').value || ENTORNO_DEFECTO.hora,
        ubicacion: $('entorno-ubicacion').value,
        dispositivo: $('entorno-dispositivo').value,
    });
    cargarEntorno();
    if (estado.seccion === 'documentos') cargarDocumentos();
}

async function cargarDocumentos() {
    const grid = $('documentos-grid');
    const documentos = await intentar(() => api.documentos());
    if (!documentos) return;
    estado.documentos = documentos;

    grid.innerHTML = documentos.length ? '' : '<p class="text-sm text-gray-500">No hay documentos que puedas consultar con el entorno actual.</p>';
    documentos.forEach((doc) => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-semibold text-gray-800">#${doc.id} ${esc(doc.titulo)}</h3>
                <span class="text-[10px] font-bold px-2 py-1 rounded border ${colorNivel(doc.nivel_confidencialidad)}">NIVEL ${doc.nivel_confidencialidad}</span>
            </div>
            <p class="text-sm text-gray-500 mb-3">${esc(doc.descripcion)}</p>
            <div class="text-xs text-gray-500 flex justify-between">
                <span><i class="fa-solid fa-building mr-1"></i>${esc(doc.departamento)} · ${esc(doc.pais)}</span>
                <span class="font-mono">${esc(doc.estado)}</span>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-4 gap-2">
                ${[['READ', 'fa-eye', 'bg-gray-100 text-gray-700'], ['UPDATE', 'fa-pen', 'bg-gray-100 text-gray-700'], ['APPROVE', 'fa-check-double', 'bg-blue-50 text-blue-700'], ['DELETE', 'fa-trash', 'bg-red-50 text-red-700']]
                    .map(([accion, icono, color]) => `<button data-id="${doc.id}" data-accion="${accion}" title="${ACCIONES[accion]}" class="text-xs py-1.5 rounded hover:opacity-80 ${color}"><i class="fa-solid ${icono}"></i></button>`)
                    .join('')}
            </div>`;
        grid.appendChild(card);
    });
}

async function formularioDocumento(id, doc) {
    const { value } = await Swal.fire({
        title: `Modificar documento #${id}`,
        html: [
            campo('Título', `<input id="f-titulo" ${INPUT} value="${esc(doc?.titulo)}">`),
            campo('Descripción', `<textarea id="f-descripcion" ${INPUT}>${esc(doc?.descripcion)}</textarea>`),
            campo('Nivel de confidencialidad', `<select id="f-nivel" ${INPUT}>${doc ? '' : '<option value="">Sin cambio</option>'}${opciones([1, 2, 3, 4, 5], doc?.nivel_confidencialidad ?? '')}</select>`),
        ].join(''),
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        focusConfirm: false,
        preConfirm: () => {
            const cambios = {};
            const titulo = valorFormulario('f-titulo');
            const descripcion = valorFormulario('f-descripcion');
            const nivel = valorFormulario('f-nivel');
            if (titulo && titulo !== doc?.titulo) cambios.titulo = titulo;
            if (descripcion !== (doc?.descripcion ?? '')) cambios.descripcion = descripcion;
            if (nivel && Number(nivel) !== doc?.nivel_confidencialidad) cambios.nivel_confidencialidad = Number(nivel);
            return cambios;
        },
    });
    return value;
}

async function ejecutarAccion(id, accion) {
    const doc = estado.documentos.find((d) => d.id === id);

    if (accion === 'READ') {
        const datos = await intentar(() => api.documento(id));
        if (!datos) return;
        const d = datos.documento;
        return Swal.fire({
            icon: 'success',
            title: 'ACCESO AUTORIZADO',
            html: `
                <div class="text-left text-sm space-y-1">
                    <p class="text-lg font-semibold">${esc(d.titulo)}</p>
                    <p class="text-gray-600">${esc(d.descripcion)}</p>
                    <p><b>Departamento:</b> ${esc(d.departamento)} · <b>País:</b> ${esc(d.pais)}</p>
                    <p><b>Nivel:</b> ${d.nivel_confidencialidad} · <b>Estado:</b> ${esc(d.estado)} · <b>Propietario:</b> ${d.propietario}</p>
                </div>
                <p class="text-left text-xs font-semibold uppercase text-gray-500 mt-4">RBAC: permitido · ABAC:</p>
                ${renderEvaluaciones(datos.evaluaciones)}`,
        });
    }

    if (accion === 'UPDATE') {
        const cambios = await formularioDocumento(id, doc);
        if (!cambios) return;
        if (await intentar(() => api.modificarDocumento(id, cambios))) notificar('Documento modificado');
    }

    if (accion === 'APPROVE' && await intentar(() => api.aprobarDocumento(id))) notificar('Documento aprobado');

    if (accion === 'DELETE') {
        const { isConfirmed } = await Swal.fire({ icon: 'warning', title: `¿Eliminar el documento #${id}?`, showCancelButton: true, confirmButtonText: 'Eliminar', confirmButtonColor: '#ef4444' });
        if (!isConfirmed) return;
        if (await intentar(() => api.eliminarDocumento(id))) notificar('Documento eliminado');
    }

    cargarDocumentos();
}

async function nuevoDocumento() {
    const { usuario, catalogos } = estado;
    const { value } = await Swal.fire({
        title: 'Nuevo documento',
        html: [
            campo('Título', `<input id="f-titulo" ${INPUT}>`),
            campo('Descripción', `<textarea id="f-descripcion" ${INPUT}></textarea>`),
            campo('Departamento', `<select id="f-departamento" ${INPUT}>${opciones(catalogos.departamentos, usuario.departamento, (d) => d.nombre, (d) => d.nombre)}</select>`),
            campo('Nivel de confidencialidad', `<select id="f-nivel" ${INPUT}>${opciones([1, 2, 3, 4, 5], 1)}</select>`),
            campo('País', `<input id="f-pais" ${INPUT} value="${esc(usuario.pais)}">`),
        ].join(''),
        showCancelButton: true,
        confirmButtonText: 'Crear',
        focusConfirm: false,
        preConfirm: () => {
            const titulo = valorFormulario('f-titulo');
            if (!titulo) return Swal.showValidationMessage('El título es obligatorio');
            const departamento = catalogos.departamentos.find((d) => d.nombre === valorFormulario('f-departamento'));
            return {
                titulo,
                descripcion: valorFormulario('f-descripcion'),
                departamento_id: departamento.id,
                nivel_confidencialidad: Number(valorFormulario('f-nivel')),
                pais: valorFormulario('f-pais'),
            };
        },
    });
    if (value && await intentar(() => api.crearDocumento(value))) {
        notificar('Documento creado');
        cargarDocumentos();
    }
}

async function cargarUsuarios() {
    const usuarios = await intentar(() => api.usuarios());
    if (!usuarios) return;
    estado.usuarios = usuarios;
    $('usuarios-table').innerHTML = usuarios.map((u) => `
        <tr>
            <td class="px-4 py-3 font-medium">${esc(u.nombre)}</td>
            <td class="px-4 py-3 text-gray-500">${esc(u.correo)}</td>
            <td class="px-4 py-3 font-mono text-xs">${esc(u.rol)}</td>
            <td class="px-4 py-3">${esc(u.departamento)}</td>
            <td class="px-4 py-3">${u.nivel_seguridad}</td>
            <td class="px-4 py-3">${esc(u.pais)}</td>
            <td class="px-4 py-3">${esc(u.tipo_contrato)}</td>
            <td class="px-4 py-3"><span class="px-2 text-xs font-semibold rounded-full ${u.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${esc(u.estado)}</span></td>
            <td class="px-4 py-3 whitespace-nowrap text-right">
                <button data-editar="${u.id}" class="text-blue-600 hover:text-blue-800 mr-3" title="Editar"><i class="fa-solid fa-pen"></i></button>
                <button data-estado="${u.id}" class="${u.estado === 'ACTIVO' ? 'text-red-600' : 'text-green-600'} hover:opacity-70" title="${u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}">
                    <i class="fa-solid ${u.estado === 'ACTIVO' ? 'fa-user-slash' : 'fa-user-check'}"></i>
                </button>
            </td>
        </tr>`).join('');
}

async function formularioUsuario(u) {
    const { roles, departamentos } = estado.catalogos;
    const editando = Boolean(u);
    const rolActual = roles.find((r) => r.nombre === u?.rol)?.id ?? roles[roles.length - 1].id;
    const departamentoActual = departamentos.find((d) => d.nombre === u?.departamento)?.id ?? departamentos[0].id;
    const puedeAsignarRol = tienePermiso('asignar_roles');

    const { value } = await Swal.fire({
        title: editando ? `Editar ${esc(u.nombre)}` : 'Nuevo usuario',
        width: 600,
        html: `<div class="grid grid-cols-2 gap-x-4">${[
            campo('Nombre', `<input id="f-nombre" ${INPUT} value="${esc(u?.nombre)}">`),
            campo('Correo', `<input id="f-correo" type="email" ${INPUT} value="${esc(u?.correo)}">`),
            campo(editando ? 'Nueva contraseña (opcional)' : 'Contraseña', `<input id="f-password" type="password" ${INPUT}>`),
            campo('Rol', `<select id="f-rol" ${INPUT} ${puedeAsignarRol ? '' : 'disabled'}>${opciones(roles, rolActual, (r) => r.id, (r) => r.nombre)}</select>`),
            campo('Departamento', `<select id="f-departamento" ${INPUT}>${opciones(departamentos, departamentoActual, (d) => d.id, (d) => d.nombre)}</select>`),
            campo('Nivel de seguridad', `<select id="f-nivel" ${INPUT}>${opciones([1, 2, 3, 4, 5], u?.nivel_seguridad ?? 1)}</select>`),
            campo('País', `<input id="f-pais" ${INPUT} value="${esc(u?.pais ?? 'PERU')}">`),
            campo('Tipo de contrato', `<select id="f-contrato" ${INPUT}>${opciones(['INTERNO', 'EXTERNO'], u?.tipo_contrato ?? 'INTERNO')}</select>`),
            campo('Estado', `<select id="f-estado" ${INPUT}>${opciones(['ACTIVO', 'INACTIVO', 'SUSPENDIDO'], u?.estado ?? 'ACTIVO')}</select>`),
        ].join('')}</div>`,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        focusConfirm: false,
        preConfirm: () => {
            const datos = {
                nombre: valorFormulario('f-nombre'),
                correo: valorFormulario('f-correo'),
                password: valorFormulario('f-password') || undefined,
                departamento_id: Number(valorFormulario('f-departamento')),
                nivel_seguridad: Number(valorFormulario('f-nivel')),
                pais: valorFormulario('f-pais'),
                tipo_contrato: valorFormulario('f-contrato'),
                estado: valorFormulario('f-estado'),
            };
            const rol = Number(valorFormulario('f-rol'));
            if (!editando || rol !== rolActual) datos.rol_id = rol;
            if (!datos.nombre || !datos.correo || !datos.pais || (!editando && !datos.password)) {
                return Swal.showValidationMessage('Completa nombre, correo, país y contraseña');
            }
            return datos;
        },
    });
    return value;
}

async function guardarUsuario(u) {
    const datos = await formularioUsuario(u);
    if (!datos) return;
    const resultado = await intentar(() => (u ? api.modificarUsuario(u.id, datos) : api.crearUsuario(datos)));
    if (resultado) {
        notificar(resultado.mensaje);
        cargarUsuarios();
    }
}

async function alternarEstadoUsuario(u) {
    const nuevo = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    if (await intentar(() => api.modificarUsuario(u.id, { estado: nuevo }))) {
        notificar(`Usuario ${nuevo.toLowerCase()}`);
        cargarUsuarios();
    }
}

async function cargarAuditoria() {
    const registros = await intentar(() => api.auditoria());
    if (!registros) return;
    estado.auditoria = registros;
    renderAuditoria();
}

function renderAuditoria() {
    const filtro = $('filtro-resultado').value;
    $('auditoria-table').innerHTML = estado.auditoria
        .filter((r) => !filtro || r.resultado === filtro)
        .map((r) => `
            <tr>
                <td class="px-4 py-3 whitespace-nowrap text-xs text-gray-500">${esc(new Date(r.fecha).toLocaleString())}</td>
                <td class="px-4 py-3 font-medium">${esc(r.usuario)}</td>
                <td class="px-4 py-3 font-mono text-xs">${esc(r.recurso)}</td>
                <td class="px-4 py-3 font-mono text-xs">${esc(r.accion)}</td>
                <td class="px-4 py-3"><span class="px-2 text-xs font-semibold rounded-full ${colorResultado[r.resultado] ?? ''}">${esc(r.resultado)}</span></td>
                <td class="px-4 py-3 text-gray-600">${esc(r.motivo)}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-400">${esc(r.direccion_ip)}</td>
            </tr>`).join('');
}

function renderPoliticas() {
    const { roles, permisos, politicas } = estado.catalogos;
    $('matriz-rbac').innerHTML = `
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th class="px-4 py-3 text-left">Operación</th>${roles.map((r) => `<th class="px-4 py-3">${esc(r.nombre)}</th>`).join('')}</tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
            ${permisos.map((p) => `
                <tr>
                    <td class="px-4 py-2 text-left">${esc(p.descripcion)}</td>
                    ${roles.map((r) => r.permisos.includes(p.codigo)
                        ? '<td class="px-4 py-2 text-green-600"><i class="fa-solid fa-check"></i></td>'
                        : '<td class="px-4 py-2 text-red-400"><i class="fa-solid fa-xmark"></i></td>').join('')}
                </tr>`).join('')}
        </tbody>`;

    $('matriz-abac').innerHTML = politicas.map((p) => `
        <tr class="${p.activa ? '' : 'opacity-50'}">
            <td class="px-4 py-3 font-medium whitespace-nowrap">${esc(p.nombre)}</td>
            <td class="px-4 py-3 font-mono text-xs">${esc(p.descripcion)}</td>
            <td class="px-4 py-3 text-xs">${esc(p.acciones === '*' ? 'Todas' : p.acciones.replaceAll(',', ', '))}</td>
            <td class="px-4 py-3 text-xs">${esc(p.roles_objetivo || 'Todos')}</td>
            <td class="px-4 py-3 text-xs">${esc(p.roles_exentos.replaceAll(',', ', ') || '-')}</td>
            <td class="px-4 py-3 font-mono text-xs">${esc(p.parametros === '{}' ? '-' : p.parametros)}</td>
        </tr>`).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
    $('cuentas-prueba').innerHTML = CUENTAS_PRUEBA
        .map(([correo, rol]) => `<button type="button" data-correo="${correo}" class="text-left hover:text-blue-600"><b>${rol}</b><br>${correo}</button>`)
        .join('');
    $('cuentas-prueba').addEventListener('click', (e) => {
        const boton = e.target.closest('[data-correo]');
        if (!boton) return;
        $('correo').value = boton.dataset.correo;
        $('password').value = '123';
    });

    $('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const datos = await api.login($('correo').value, $('password').value);
            almacen.guardar('token', datos.token);
            await iniciarSesion(datos);
            notificar(`Bienvenido, ${datos.usuario.nombre}`);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Acceso denegado', text: err.error || 'Servidor inalcanzable.' });
        }
    });

    $('btn-logout').addEventListener('click', async () => {
        await api.logout().catch(() => {});
        cerrarSesionLocal();
    });

    $('menu').addEventListener('click', (e) => {
        const item = e.target.closest('[data-seccion]');
        if (!item) return;
        e.preventDefault();
        mostrarSeccion(item.dataset.seccion);
    });

    $('entorno-form').addEventListener('change', guardarEntorno);

    $('documentos-grid').addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (boton) ejecutarAccion(Number(boton.dataset.id), boton.dataset.accion);
    });

    $('probar-form').addEventListener('submit', (e) => {
        e.preventDefault();
        ejecutarAccion(Number($('probar-id').value), $('probar-accion').value);
    });

    $('btn-nuevo-doc').addEventListener('click', nuevoDocumento);
    $('btn-nuevo-usuario').addEventListener('click', () => guardarUsuario());

    $('usuarios-table').addEventListener('click', (e) => {
        const boton = e.target.closest('[data-editar], [data-estado]');
        const usuario = boton && estado.usuarios.find((u) => u.id === Number(boton.dataset.editar ?? boton.dataset.estado));
        if (!usuario) return;
        if (boton.dataset.editar) guardarUsuario(usuario);
        else alternarEstadoUsuario(usuario);
    });

    $('filtro-resultado').addEventListener('change', renderAuditoria);

    cargarEntorno();

    if (!almacen.leer('token')) return mostrarLogin();
    try {
        await iniciarSesion(await api.sesion());
    } catch {
        cerrarSesionLocal();
    }
});
