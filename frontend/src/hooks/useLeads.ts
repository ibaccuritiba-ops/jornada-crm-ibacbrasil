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
    updateLeadClassificacao: (leadId: string, classificacao: number) => Promise<void>;
    batchUpdateLeadResponsavel: (leadIds: string[], responsavelId: string) => void;
    importLeads: (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string, companyId?: string }) => Promise<{ imported: number; failed: { row: number; reason: string }[] }>;
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
                    classificacao: leadData.classificacao || 3,
                    responsavel_id: leadData.responsavel || leadData.responsavel_id || data.data.responsavel || '',
                    companyId: data.data.empresa,
                    criado_em: data.data.createdAt,
                    atualizado_em: data.data.updatedAt,
                    deletado: false
                };
                setLeads(prev => [...prev, newLead]);
                return { success: true, lead: newLead };
            }

            const errorData = await res?.json().catch(() => ({}));
            return { 
                success: false, 
                error: errorData?.message || 'Falha ao criar lead',
                status: res?.status
            };
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

    const updateLeadClassificacao = useCallback(async (leadId: string, classificacao: number) => {
        if (!authFetch) return;
        
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        
        await authFetch('/cliente/edit', {
            method: 'POST',
            body: JSON.stringify({ id: leadId, classificacao })
        });
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, classificacao } : l));
    }, [authFetch, leads]);

    const batchUpdateLeadResponsavel = useCallback((leadIds: string[], responsavelId: string) => {
        setLeads(prev => prev.map(l => leadIds.includes(l.id) ? { ...l, responsavel_id: responsavelId } : l));
    }, []);

    const importLeads = useCallback(async (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string, companyId?: string }) => {
        if (!authFetch) return { imported: 0, failed: [], success: true };

        const failed: { row: number; reason: string }[] = [];
        const successfulLeads: Lead[] = [];

        // Para modo distribute, preparar lista de usuários para rodízio
        let allocationIndex = 0;
        let availableUsers: string[] = [];
        
        if (allocation.mode === 'distribute' && allocation.companyId) {
            // Esta lista será preenchida depois, por enquanto vamos usar um índice
            // O backend deve retornar os usuários da empresa
            availableUsers = [];
        }

        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            try {
                // Validar campos obrigatórios
                if (!item.nome_completo || !item.nome_completo.trim()) {
                    failed.push({ row: index + 1, reason: 'Nome vazio' });
                    continue;
                }
                if (!item.email || !item.email.trim()) {
                    failed.push({ row: index + 1, reason: 'Email vazio' });
                    continue;
                }

                // Validar email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(item.email)) {
                    failed.push({ row: index + 1, reason: 'Email inválido' });
                    continue;
                }

                // Determinar responsável baseado na alocação
                let responsavel_id = '';
                if (allocation.mode === 'specific' && allocation.userId) {
                    responsavel_id = allocation.userId;
                } else if (allocation.mode === 'distribute') {
                    // Rodízio cíclico será feito no backend, vamos informar o companyId
                    responsavel_id = 'distribute';
                }

                // Preparar payload para o backend
                const leadPayload = {
                    nome: item.nome_completo.trim(),
                    email: item.email.trim(),
                    whatsapp: item.whatsapp?.trim() || '',
                    tipo_pessoa: item.tipo_pessoa || 'PF',
                    campanha: item.campanha || '',
                    empresa: allocation.companyId,
                    responsavel: responsavel_id // 'distribute' ou userId específico
                };

                // Enviar para o backend
                try {
                    const res = await authFetch('/cliente', {
                        method: 'POST',
                        body: JSON.stringify(leadPayload)
                    });

                    if (res?.ok) {
                        const responseData = await res.json();
                        const newLead: Lead = {
                            id: responseData.data._id,
                            nome_completo: item.nome_completo.trim(),
                            email: item.email.trim(),
                            whatsapp: item.whatsapp?.trim() || '',
                            tipo_pessoa: item.tipo_pessoa || 'PF',
                            campanha: item.campanha || '',
                            classificacao: 3,
                            responsavel_id: responseData.data.responsavel || '',
                            companyId: allocation.companyId || responseData.data.empresa,
                            criado_em: responseData.data.createdAt,
                            atualizado_em: responseData.data.updatedAt,
                            deletado: false
                        };
                        successfulLeads.push(newLead);
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        const errorMsg = errorData?.message || `Status ${res?.status}`;
                        console.error(`[importLeads] Erro na linha ${index + 1}:`, errorMsg, { leadPayload, response: errorData });
                        
                        // Se for erro 409 (duplicado), retornar imediatamente
                        if (res?.status === 409) {
                            return { 
                                imported: successfulLeads.length, 
                                failed: failed,
                                success: false,
                                error: errorMsg,
                                status: 409
                            };
                        }
                        
                        failed.push({ row: index + 1, reason: errorMsg });
                    }
                } catch (apiError) {
                    failed.push({ row: index + 1, reason: 'Erro de conexão com servidor' });
                }
            } catch (error) {
                failed.push({ row: index + 1, reason: 'Erro ao processar linha' });
            }
        }

        // Adicionar os leads bem-sucedidos ao estado
        setLeads(prev => [...prev, ...successfulLeads]);

        return {
            imported: successfulLeads.length,
            failed: failed,
            success: true
        };
    }, [authFetch]);

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
