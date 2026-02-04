import { useMemo } from 'react';
import { createAuthFetch } from '../utils/helpers';

/**
 * Hook que fornece authFetch memoizado
 * Evita ter que passar authFetch como parâmetro em todas as funções
 */
export const useAuthFetch = () => {
    const token = localStorage.getItem('token');
    const authFetch = useMemo(() => createAuthFetch(token), [token]);
    return authFetch;
};
