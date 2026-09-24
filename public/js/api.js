const almacen = {
    leer(clave, defecto = null) {
        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? defecto : JSON.parse(valor);
        } catch {
            return defecto;
        }
    },
    guardar(clave, valor) {
        try { localStorage.setItem(clave, JSON.stringify(valor)); } catch {}
    },
    borrar(...claves) {
        try { claves.forEach((c) => localStorage.removeItem(c)); } catch {}
    },
};

const ENTORNO_DEFECTO = { horaReal: true, hora: '10:30', ubicacion: 'PERU', dispositivo: 'CORPORATIVO' };

const entorno = {
    obtener: () => ({ ...ENTORNO_DEFECTO, ...almacen.leer('entorno', {}) }),
    guardar: (valor) => almacen.guardar('entorno', valor),
    cabeceras() {
        const e = this.obtener();
        return {
            'x-ubicacion': e.ubicacion,
            'x-dispositivo': e.dispositivo,
            ...(e.horaReal ? {} : { 'x-hora': e.hora }),
        };
    },
};

const api = {
    async solicitar(ruta, { metodo = 'GET', body } = {}) {
        const token = almacen.leer('token');
        const respuesta = await fetch(ruta, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                ...entorno.cabeceras(),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw { status: respuesta.status, ...datos };
        return datos;
    },

    login: (correo, password) => api.solicitar('/auth/login', { metodo: 'POST', body: { correo, password } }),
    logout: () => api.solicitar('/auth/logout', { metodo: 'POST' }),
    sesion: () => api.solicitar('/auth/me'),
    catalogos: () => api.solicitar('/catalogos'),

    documentos: () => api.solicitar('/documentos'),
    documento: (id) => api.solicitar(`/documentos/${id}`),
    crearDocumento: (datos) => api.solicitar('/documentos', { metodo: 'POST', body: datos }),
    modificarDocumento: (id, datos) => api.solicitar(`/documentos/${id}`, { metodo: 'PUT', body: datos }),
    eliminarDocumento: (id) => api.solicitar(`/documentos/${id}`, { metodo: 'DELETE' }),
    aprobarDocumento: (id) => api.solicitar(`/documentos/${id}/aprobar`, { metodo: 'POST' }),

    usuarios: () => api.solicitar('/usuarios'),
    crearUsuario: (datos) => api.solicitar('/usuarios', { metodo: 'POST', body: datos }),
    modificarUsuario: (id, datos) => api.solicitar(`/usuarios/${id}`, { metodo: 'PUT', body: datos }),

    auditoria: () => api.solicitar('/auditoria?limite=500'),
};
