// Hook para gerenciar usuários
import { useState, useCallback } from 'react';
import { User, UserPermissions } from '../types';
import { encryptPassword } from '../utils/helpers';
import { useAuthFetch } from './useAuthFetch';

interface UseUsersReturn {
    users: User[];
    setUsers: (users: User[]) => void;
    addUser: (user: Omit<User, 'id' | 'criado_em' | 'permissions' | 'acesso_confirmado'>) => Promise<{ success: boolean; error?: string; status?: number }>;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    changeUserPassword: (userId: string, newPass: string) => Promise<void>;
    updateUserPermissions: (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => void;
    updateUserAccess: (userId: string, ativo: boolean) => Promise<void>;
}

export const useUsers = (): UseUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const authFetch = useAuthFetch();

    const addUser = useCallback(async (user: Omit<User, 'id' | 'criado_em' | 'permissions' | 'acesso_confirmado'>) => {
        if (!authFetch) return { success: false, error: 'No auth' };
        
        const userData = {
            ...user,
            senha: encryptPassword(user.senha || '')
        };

        const res = await authFetch('/usuario', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (res?.ok) {
            const data = await res.json();
            const newUser: User = {
                id: data.data._id,
                ...user,
                permissions: {
                    leads: false,
                    negociacoes: false,
                    importacao: false,
                    relatorios: false,
                    produtos: false,
                    configuracoes: false,
                    branding: false,
                    pipelines: false,
                    tarefas: false
                },
                acesso_confirmado: false,
                criado_em: data.data.createdAt
            };
            setUsers(prev => [...prev, newUser]);
            return { success: true };
        }

        const errorData = await res?.json().catch(() => ({}));
        return { 
            success: false, 
            error: errorData?.message || 'Erro ao criar usuário',
            status: res?.status
        };
    }, [authFetch]);

    const updateUser = useCallback((user: User) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }, []);

    const deleteUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    const changeUserPassword = useCallback(async (userId: string, newPass: string) => {
        if (!authFetch) return;
        
        const encryptedPass = encryptPassword(newPass);
        await authFetch('/usuario/passwordupdate', {
            method: 'POST',
            body: JSON.stringify({ id: userId, newPassword: encryptedPass })
        });
    }, [authFetch]);

    const updateUserPermissions = useCallback(async (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => {
        if (!authFetch) return;

        // Converte permissions object para acessos array
        const acessos = [];
        if (permissions.leads) acessos.push('leads');
        if (permissions.negociacoes) acessos.push('negocios');
        if (permissions.importacao) acessos.push('importacao');
        if (permissions.relatorios) acessos.push('relatorios');
        if (permissions.produtos) acessos.push('produtos');
        if (permissions.configuracoes) acessos.push('config.conta');
        if (permissions.branding) acessos.push('branding');
        if (permissions.pipelines) acessos.push('config.funil');
        if (permissions.tarefas) acessos.push('agenda');

        // Envia para o backend
        const res = await authFetch('/usuario/updatepermissions', {
            method: 'POST',
            body: JSON.stringify({ usuarioId: userId, acessos })
        });

        if (res?.ok) {
            // Atualiza estado local
            setUsers(prev => prev.map(u => u.id === userId ? { 
                ...u, 
                permissions, 
                acesso_confirmado,
                acessos 
            } : u));
        }
    }, [authFetch]);

    const updateUserAccess = useCallback(async (userId: string, ativo: boolean) => {
        if (!authFetch) return;

        const res = await authFetch('/usuario/updateaccess', {
            method: 'POST',
            body: JSON.stringify({ usuarioId: userId, ativo })
        });

        if (res?.ok) {
            // Atualiza estado local
            setUsers(prev => prev.map(u => u.id === userId ? { 
                ...u, 
                ativo,
                acesso_confirmado: ativo
            } : u));
        }
    }, [authFetch]);

    return {
        users,
        setUsers,
        addUser,
        updateUser,
        deleteUser,
        changeUserPassword,
        updateUserPermissions,
        updateUserAccess
    };
};
