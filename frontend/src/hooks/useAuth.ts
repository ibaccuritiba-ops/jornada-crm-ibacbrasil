// Hook de autenticação - Login, logout, validação de token
import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { API_URL } from '../env';
import { encryptPassword } from '../utils/helpers';

interface UseAuthReturn {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    login: (email: string, pass: string) => Promise<{success: boolean; error?: string}>;
    logout: () => void;
    resetPassword: (email: string, newPass: string) => { success: boolean; message: string };
}

export const useAuth = (): UseAuthReturn => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('crm_current_user');
        return saved ? JSON.parse(saved) : null;
    });

    const login = useCallback(async (email: string, pass: string): Promise<{success: boolean; error?: string}> => {
        try {
            const encryptedPass = encryptPassword(pass);

            const res = await fetch(`${API_URL}/usuario/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: encryptedPass })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);

                const empresaId = typeof data.user.empresa === 'object' ? data.user.empresa?._id : data.user.empresa;
                const userData = { ...data.user, id: data.user._id, companyId: empresaId };
                setCurrentUser(userData);
                localStorage.setItem('crm_current_user', JSON.stringify(userData));
                
                return { success: true };
            } else {
                const errorData = await res.json().catch(() => ({}));
                const errorMessage = errorData.message || 'Email ou senha inválidos';
                return { success: false, error: errorMessage };
            }
        } catch (e) {
            console.error(e);
            return { success: false, error: 'Erro ao fazer login' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('crm_current_user');
        setCurrentUser(null);
    }, []);

    const resetPassword = (email: string, newPass: string) => {
        // TODO: Implementar reset de senha
        return { success: true, message: 'Password reset sent to email' };
    };

    // Validar token ao montar
    useEffect(() => {
        const validateToken = async () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('crm_current_user');
            
            if (savedToken && savedUser) {
                try {
                    const headers = {
                        'Content-Type': 'application/json',
                        'Authorization': savedToken
                    };
                    
                    const response = await fetch(`${API_URL}/usuario`, { headers });
                    
                    if (response.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('crm_current_user');
                        setCurrentUser(null);
                    }
                } catch (error) {
                    // Manter sessão mesmo com erro de rede
                    console.error('Token validation error:', error);
                }
            }
        };

        validateToken();
    }, []);

    return {
        currentUser,
        setCurrentUser,
        login,
        logout,
        resetPassword
    };
};
