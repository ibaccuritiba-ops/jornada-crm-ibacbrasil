// Hook para gerenciar usuários
import { useState, useCallback } from 'react';
import { User, UserPermissions } from '../types';
import { encryptPassword } from '../utils/helpers';
import { useAuthFetch } from './useAuthFetch';

interface UseUsersReturn {
    users: User[];
    setUsers: (users: User[]) => void;
    addUser: (user: Omit<User, 'id' | 'criado_em' | 'permissions' | 'acesso_confirmado'>) => Promise<void>;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    changeUserPassword: (userId: string, newPass: string) => Promise<void>;
    updateUserPermissions: (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => void;
}

export const useUsers = (): UseUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const authFetch = useAuthFetch();

    const addUser = useCallback(async (user: Omit<User, 'id' | 'criado_em' | 'permissions' | 'acesso_confirmado'>) => {
        if (!authFetch) return;
        
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
        }
    }, [authFetch]);

    const updateUser = useCallback((user: User) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    }, []);

    const deleteUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    const changeUserPassword = useCallback(async (userId: string, newPass: string) => {
        if (!authFetch) return;
        
        await authFetch('/usuario/passwordupdate', {
            method: 'POST',
            body: JSON.stringify({ id: userId, newPassword: newPass })
        });
    }, [authFetch]);

    const updateUserPermissions = useCallback((userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions, acesso_confirmado } : u));
    }, []);

    return {
        users,
        setUsers,
        addUser,
        updateUser,
        deleteUser,
        changeUserPassword,
        updateUserPermissions
    };
};
