// Hook para gerenciar negociações/deals
import { useState, useCallback } from 'react';
import { Deal, DealStatus, DealEvent, EventType } from '../types';
import { useAuthFetch } from './useAuthFetch';

interface UseDealsReturn {
    deals: Deal[];
    events: DealEvent[];
    setDeals: (deals: Deal[]) => void;
    setEvents: (events: DealEvent[]) => void;
    addDeal: (dealData: Omit<Deal, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'>) => { success: boolean; deal?: Deal; error?: string };
    moveDeal: (dealId: string, stageId: string) => Promise<void>;
    updateDealStatus: (dealId: string, status: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage', value: number }) => void;
    updateDealResponsavel: (dealId: string, newResponsavelId: string) => void;
    addEvent: (dealId: string, type: EventType, description: string) => void;
    loadDealsForCompany: (empresaId: string) => Promise<void>;
}

export const useDeals = (): UseDealsReturn => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [events, setEvents] = useState<DealEvent[]>([]);
    const authFetch = useAuthFetch();

    const addDeal = useCallback((dealData: Omit<Deal, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'>) => {
        return { success: false, error: "Use addLead para criar negociações" };
    }, []);

    const moveDeal = useCallback(async (dealId: string, stageId: string) => {
        if (!authFetch) return;
        
        await authFetch('/negociacao/updateetapa', {
            method: 'POST',
            body: JSON.stringify({ negociacaoId: dealId, etapaId: stageId })
        });
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d));
    }, [authFetch]);

    const updateDealStatus = useCallback((dealId: string, status: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage', value: number }) => {
        const deal = deals.find(d => d.id === dealId);
        if (deal) {
            const updatedDeal = { ...deal, status };
            setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d));
            
            // Adicionar evento de status change
            const event: DealEvent = {
                id: Math.random().toString(36),
                deal_id: dealId,
                type: EventType.STATUS,
                description: `Status alterado para ${status}${reason ? ': ' + reason : ''}`,
                criado_em: new Date().toISOString(),
                criado_por: ''
            };
            setEvents(prev => [...prev, event]);
        }
    }, [deals]);

    const updateDealResponsavel = useCallback((dealId: string, newResponsavelId: string) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, responsavel_id: newResponsavelId } : d));
    }, []);

    const addEvent = useCallback((dealId: string, type: EventType, description: string) => {
        const event: DealEvent = {
            id: Math.random().toString(36),
            deal_id: dealId,
            type,
            description,
            criado_em: new Date().toISOString(),
            criado_por: ''
        };
        setEvents(prev => [...prev, event]);
    }, []);

    const loadDealsForCompany = useCallback(async (empresaId: string) => {
        if (!authFetch) return;
        
        try {
            const res = await authFetch('/negociacao');
            if (res?.ok) {
                const data = await res.json();
                const mappedDeals = data.data?.map((n: any) => ({
                    id: n._id,
                    lead_id: typeof n.cliente === 'object' ? n.cliente?._id : n.cliente,
                    companyId: typeof n.empresa === 'object' ? n.empresa?._id : n.empresa,
                    stage_id: typeof n.etapa === 'object' ? n.etapa?._id : n.etapa,
                    responsavel_id: typeof n.responsavel === 'object' ? n.responsavel?._id : n.responsavel,
                    pipeline_id: typeof n.funil === 'object' ? n.funil?._id : n.funil,
                    nome: n.nome,
                    valor_total: n.valor_total,
                    desconto: n.desconto || 0,
                    status: n.status || 'aberto',
                    criado_em: n.createdAt,
                    atualizado_em: n.updatedAt,
                    deletado: n.deletado || false
                })) || [];
                setDeals(mappedDeals);
            }
        } catch (error) {
            console.error('Erro ao carregar negociações da empresa:', error);
        }
    }, [authFetch]);

    return {
        deals,
        events,
        setDeals,
        setEvents,
        addDeal,
        moveDeal,
        updateDealStatus,
        updateDealResponsavel,
        addEvent,
        loadDealsForCompany
    };
};
