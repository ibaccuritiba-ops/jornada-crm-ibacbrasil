// Hook para gerenciar empresas
import { useState, useCallback } from 'react';
import { Company } from '../types';
import { useAuthFetch } from './useAuthFetch';

interface UseCompaniesReturn {
    companies: Company[];
    setCompanies: (companies: Company[]) => void;
    addCompany: (company: Omit<Company, 'id' | 'criado_em'>, adminData?: { email: string, senha: string, nome: string }) => Promise<void>;
    updateCompany: (company: Company) => Promise<void>;
    deleteCompany: (id: string, reason: string) => Promise<void>;
}

export const useCompanies = (): UseCompaniesReturn => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const authFetch = useAuthFetch();

    const addCompany = useCallback(async (companyData: Omit<Company, 'id' | 'criado_em'>, adminData?: { email: string, senha: string, nome: string }) => {
        if (!authFetch) return;
        
        const res = await authFetch('/empresa', {
            method: 'POST',
            body: JSON.stringify(companyData)
        });

        if (res?.ok && adminData) {
            const companyRes = await res.json();
            const novaEmpresa = { ...companyData, id: companyRes.data._id };
            setCompanies(prev => [...prev, novaEmpresa]);
        }
    }, [authFetch]);

    const updateCompany = useCallback(async (company: Company) => {
        if (!authFetch) return;
        
        const res = await authFetch('/empresa/edit', {
            method: 'POST',
            body: JSON.stringify(company)
        });
        
        if (res?.ok) {
            const data = await res.json();
            if (data?.data) {
                const updatedCompany: Company = {
                    id: data.data._id,
                    nome: data.data.nome,
                    logo_url: data.data.logo_url,
                    cor_principal: data.data.cor_principal,
                    cor_destaque: data.data.cor_destaque,
                    deletado: data.data.excluido
                };
                setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
            }
        }
    }, [authFetch]);

    const deleteCompany = useCallback(async (id: string, reason: string) => {
        if (!authFetch) return;
        
        await authFetch(`/empresa/delete/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ motivo: reason })
        });
        setCompanies(prev => prev.filter(c => c.id !== id));
    }, [authFetch]);

    return {
        companies,
        setCompanies,
        addCompany,
        updateCompany,
        deleteCompany
    };
};
