// Utilitários comuns

import CryptoJS from 'crypto-js';
import { SECRET, SALT, API_URL } from '../env';

export const encryptPassword = (password: string) => {
    return CryptoJS.AES.encrypt(password + SALT, SECRET).toString();
};

export const createAuthFetch = (token: string | null) => {
    return async (endpoint: string, options: RequestInit = {}) => {
        if (!token) {
            console.error('No token available for auth');
            return null;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token,
            ...((options.headers as any) || {})
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Token expirado ou inválido
                localStorage.removeItem('token');
                localStorage.removeItem('crm_current_user');
                window.location.href = '/';
                return null;
            }

            return response;
        } catch (error) {
            console.error(`Fetch error at ${endpoint}:`, error);
            return null;
        }
    };
};

/**
 * Exporta dados para CSV
 * @param data - Array de objetos para exportar
 * @param fileName - Nome do arquivo (sem extensão)
 */
export const exportToCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj =>
        Object.values(obj).map(val =>
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
    ).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
