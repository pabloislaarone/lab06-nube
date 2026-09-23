document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Evento de Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const correo = document.getElementById('correo').value;
        const password = document.getElementById('password').value;

        try {
            const data = await api.login(correo, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.usuario));
                Swal.fire({ icon: 'success', title: 'Bienvenido', text: data.mensaje, timer: 1500, showConfirmButton: false });
                checkAuth(); // Refrescar vista
            } else {
                Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: data.error });
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión con el servidor.' });
        }
    });
});

// Comprobar si hay sesión activa
function checkAuth() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
        const user = JSON.parse(userStr);
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        
        // Poblar datos del perfil sidebar
        document.getElementById('nav-user-name').textContent = user.nombre;
        document.getElementById('nav-user-role').textContent = user.rol;
        document.getElementById('nav-user-dept').textContent = user.departamento;
        document.getElementById('nav-user-level').textContent = user.nivel_seguridad;

        // Ocultar/Mostrar menús según Rol (RBAC visual)
        if (['ADMINISTRADOR', 'GERENTE', 'AUDITOR'].includes(user.rol)) {
            document.getElementById('menu-auditoria').classList.remove('hidden');
        }

        // Mostrar sección inicial
        showSection('documentos');
    } else {
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('dashboard-view').classList.add('hidden');
    }
}

// Navegación del Dashboard
function showSection(sectionId) {
    // Ocultar todas
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    // Mostrar la solicitada
    document.getElementById(`sec-${sectionId}`).classList.remove('hidden');

    // Cambiar Título
    document.getElementById('section-title').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    // Si entra a auditoría, cargar datos. La carga de documentos la haremos en el Bloque 2
    if(sectionId === 'auditoria') loadAuditoria();
}

// Cargar tabla de Auditoría
async function loadAuditoria() {
    try {
        const data = await api.getAuditoria();
        const tbody = document.getElementById('auditoria-table');
        tbody.innerHTML = '';
        
        data.forEach(reg => {
            const tr = document.createElement('tr');
            // Estilos condicionales para la etiqueta de resultado
            const badgeColor = reg.resultado === 'PERMITIDO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">${new Date(reg.fecha).toLocaleString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${reg.usuario}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span class="font-mono bg-gray-100 px-2 py-1 rounded border">${reg.accion} - ${reg.recurso}</span></td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeColor}">
                        ${reg.resultado}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${reg.motivo}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error RBAC', text: err.error || 'No tienes permisos para ver esto.' });
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
}

const simulatedDocs = [
    { id: 1, titulo: "Presupuesto", depto: "FINANZAS", nivel: 3, estado: "PENDIENTE", icon: "fa-file-invoice-dollar" },
    { id: 2, titulo: "Manual Público", depto: "RRHH", nivel: 1, estado: "PUBLICADO", icon: "fa-book" },
    { id: 3, titulo: "Alta Gerencia", depto: "FINANZAS", nivel: 4, estado: "PENDIENTE", icon: "fa-file-signature" }
];

// Cargar las tarjetas de documentos al entrar a la sección
function renderDocumentos() {
    const grid = document.getElementById('documentos-grid');
    grid.innerHTML = '';

    simulatedDocs.forEach(doc => {
        // Tarjeta Tailwind
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden";
        
        // Etiqueta de confidencialidad (Colores)
        let badgeColor = "bg-green-100 text-green-800 border-green-200";
        if(doc.nivel >= 3) badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
        if(doc.nivel === 4) badgeColor = "bg-red-100 text-red-800 border-red-200";

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <i class="fa-solid ${doc.icon} text-lg"></i>
                </div>
                <span class="text-[10px] font-bold px-2 py-1 rounded border uppercase ${badgeColor}">
                    Lvl ${doc.nivel}
                </span>
            </div>
            <h3 class="text-md font-semibold text-gray-800 truncate" title="${doc.titulo}">ID ${doc.id}: ${doc.titulo}</h3>
            <div class="text-xs text-gray-500 mt-1 flex justify-between">
                <span><i class="fa-solid fa-building mr-1"></i>${doc.depto}</span>
                <span class="font-mono">${doc.estado}</span>
            </div>
            
            <div class="mt-5 pt-4 border-t border-gray-100 flex grid grid-cols-4 gap-2">
                <button onclick="attemptAction(${doc.id}, 'READ')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded" title="Consultar">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button onclick="attemptAction(${doc.id}, 'UPDATE')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded" title="Modificar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button onclick="attemptAction(${doc.id}, 'APPROVE')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 rounded" title="Aprobar">
                    <i class="fa-solid fa-check-double"></i>
                </button>
                <button onclick="attemptAction(${doc.id}, 'DELETE')" class="text-xs bg-red-50 hover:bg-red-100 text-red-700 py-1.5 rounded" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Funciones de accion
async function attemptAction(id, actionType) {
    let endpoint = `/documentos/${id}`;
    let method = 'GET';
    let bodyData = null;

    if (actionType === 'UPDATE') {
        method = 'PUT';
        bodyData = { titulo: "Documento Modificado", descripcion: "Test", nivel_confidencialidad: 2 };
    } else if (actionType === 'DELETE') {
        method = 'DELETE';
    } else if (actionType === 'APPROVE') {
        method = 'POST';
        endpoint = `/documentos/${id}/aprobar`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: getHeaders(),
            body: bodyData ? JSON.stringify(bodyData) : null
        });
        
        const data = await response.json();

        if (response.ok) {
            let msg = data.mensaje || "Operación permitida";
            if (actionType === 'READ') msg = `Lectura exitosa: ${data.titulo}`;
            Swal.fire({ icon: 'success', title: 'Permitido (RBAC+ABAC)', text: msg });
        } else {
            Swal.fire({ icon: 'error', title: 'Denegado', text: data.error });
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error de Red', text: 'No se pudo contactar al servidor.' });
    }
}

// Inyectar la renderizacion en la funcion showSection
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection(sectionId);
    if(sectionId === 'documentos') renderDocumentos();
};