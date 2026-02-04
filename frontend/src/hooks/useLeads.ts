// Hook para gerenciar leads/clientes
import { useState, useCallback } from 'react';
import { Lead } from '../types';
import { useAuthFetch } from './useAuthFetch';

interface UseLeadsReturn {
    leads: Lead[];
    setLeads: (leads: Lead[]) => void;
    addLead: (lead: Omit<Lead, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'> & { funilId?: string, etapaId?: string, produto?: string }) => Promise<{ success: boolean; error?: string; lead?: Lead }>;
    updateLead: (lead: Lead) => Promise<void>;
    deleteLead: (leadId: string, reason: string) => Promise<void>;
    restoreLead: (leadId: string) => void;
    permanentlyDeleteLead: (leadId: string) => Promise<void>;
    updateLeadClassificacao: (leadId: string, classificacao: number) => void;
    batchUpdateLeadResponsavel: (leadIds: string[], responsavelId: string) => void;
    importLeads: (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string }) => { imported: number; failed: { row: number; reason: string }[] };
}

export const useLeads = (): UseLeadsReturn => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const authFetch = useAuthFetch();

    const addLead = useCallback(async (lead: Omit<Lead, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'> & { funilId?: string, etapaId?: string, produto?: string, nome?: string, responsavel?: string } | any) => {
        if (!authFetch) return { success: false, error: 'No auth' };
        
        try {
            const res = await authFetch('/cliente', {
                method: 'POST',
                body: JSON.stringify(lead)
            });

            if (res?.ok) {
                const data = await res.json();
                const leadData = lead as any;
                const newLead: Lead = {
                    id: data.data._id,
                    nome_completo: leadData.nome || data.data.nome || '',
                    email: leadData.email || data.data.email || '',
                    whatsapp: leadData.whatsapp || data.data.whatsapp || '',
                    tipo_pessoa: leadData.tipo_pessoa || 'PF',
                    campanha: leadData.campanha || '',
                    classificacao: leadData.classificacao || 1,
                    responsavel_id: leadData.responsavel || leadData.responsavel_id || data.data.responsavel || '',
                    companyId: data.data.empresa,
                    criado_em: data.data.createdAt,
                    atualizado_em: data.data.updatedAt,
                    deletado: false
                };
                setLeads(prev => [...prev, newLead]);
                return { success: true, lead: newLead };
            }
            return { success: false, error: 'Failed to create lead' };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }, [authFetch]);

    const updateLead = useCallback(async (lead: Lead) => {
        if (!authFetch) return;
        
        await authFetch('/cliente/update', {
            method: 'POST',
            body: JSON.stringify(lead)
        });
        setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    }, [authFetch]);

    const deleteLead = useCallback(async (leadId: string, reason: string) => {
        if (!authFetch) return;
        
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        
        await authFetch('/cliente/edit', {
            method: 'POST',
            body: JSON.stringify({ id: leadId, excluido: true })
        });
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deletado: true } : l));
    }, [authFetch, leads]);

    const restoreLead = useCallback(async (leadId: string) => {
        if (!authFetch) return;
        
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        
        await authFetch('/cliente/edit', {
            method: 'POST',
            body: JSON.stringify({ id: leadId, excluido: false })
        });
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deletado: false } : l));
    }, [authFetch, leads]);

    const permanentlyDeleteLead = useCallback(async (leadId: string) => {
        if (!authFetch) return;
        
        await authFetch(`/cliente/delete/${leadId}`, {
            method: 'DELETE'
        });
        setLeads(prev => prev.filter(l => l.id !== leadId));
    }, [authFetch]);

    const updateLeadClassificacao = useCallback((leadId: string, classificacao: number) => {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, classificacao } : l));
    }, []);

    const batchUpdateLeadResponsavel = useCallback((leadIds: string[], responsavelId: string) => {
        setLeads(prev => prev.map(l => leadIds.includes(l.id) ? { ...l, responsavel_id: responsavelId } : l));
    }, []);

    const importLeads = useCallback((data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string }) => {
        // TODO: Implementar importação em lote
        return { imported: 0, failed: [] };
    }, []);

    return {
        leads,
        setLeads,
        addLead,
        updateLead,
        deleteLead,
        restoreLead,
        permanentlyDeleteLead,
        updateLeadClassificacao,
        batchUpdateLeadResponsavel,
        importLeads
    };
};
