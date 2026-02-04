import { useCRM } from '../store';

export const usePermissions = () => {
    const { currentUser } = useCRM();

    const hasAccess = (permission: string): boolean => {
        if (!currentUser) return false;

        // Apenas proprietário tem acesso a tudo
        if (currentUser.role === 'proprietario') {
            return true;
        }

        // Verifica se o usuário está ativo
        if (!currentUser.ativo) {
            return false;
        }

        // Superadmin e vendedores precisam das permissões específicas
        const acessos = currentUser.acessos || [];
        return acessos.includes(permission);
    };

    const canAccess = (pages: string | string[]): boolean => {
        const permissionsToCheck = Array.isArray(pages) ? pages : [pages];
        return permissionsToCheck.some(perm => hasAccess(perm));
    };

    return {
        hasAccess,
        canAccess,
        currentUserAcessos: currentUser?.acessos || []
    };
};
