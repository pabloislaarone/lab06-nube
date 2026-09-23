const API_URL = '';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-device-type': 'CORPORATIVO' 
    };
};

const api = {
    async login(correo, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });
        return response.json();
    },

    async getAuditoria() {
        const response = await fetch(`${API_URL}/auditoria`, { headers: getHeaders() });
        if(!response.ok) throw await response.json();
        return response.json();
    },

    // Estos los implementaremos en el Bloque 2
    async requestDocAction(endpoint, method = 'GET') {
        const response = await fetch(`${API_URL}${endpoint}`, { 
            method: method,
            headers: getHeaders() 
        });
        const data = await response.json();
        if(!response.ok) throw data;
        return data;
    }
};