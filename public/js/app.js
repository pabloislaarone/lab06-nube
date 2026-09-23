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