// Hook para gerenciar pipelines e etapas
import { useState, useCallback } from 'react';
import { Pipeline, PipelineStage } from '../types';
import { mapFunilToFront, mapEtapaToFront } from '../utils/mappers';
import { useAuthFetch } from './useAuthFetch';

interface UsePipelinesReturn {
    pipelines: Pipeline[];
    stages: PipelineStage[];
    activePipelineId: string | null;
    setPipelines: (pipelines: Pipeline[]) => void;
    setStages: (stages: PipelineStage[]) => void;
    setActivePipelineId: (id: string) => void;
    addPipeline: (nome: string, empresaId?: string) => Promise<void>;
    updatePipeline: (id: string, nome: string) => Promise<void>;
    deletePipeline: (id: string, justification?: string) => Promise<void>;
    loadPipelinesForCompany: (empresaId: string) => Promise<void>;
    loadStagesForPipeline: (pipelineId: string) => Promise<void>;
    addStage: (pipelineId: string, nome: string) => Promise<void>;
    updateStage: (id: string, nome: string) => Promise<void>;
    deleteStage: (id: string, justification?: string) => void;
    reorderStages: (newStages: PipelineStage[]) => Promise<void>;
}

export const usePipelines = (): UsePipelinesReturn => {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
    const authFetch = useAuthFetch();

    const addPipeline = useCallback(async (nome: string, empresaId?: string) => {
        if (!authFetch) return;
        
        const res = await authFetch('/funil', {
            method: 'POST',
            body: JSON.stringify({ nome, empresa: empresaId })
        });

        if (res?.ok) {
            const data = await res.json();
            const newFunil = { 
                id: data.data._id,
                nome: data.data.nome,
                companyId: data.data.empresa,
                criado_em: data.data.createdAt,
                atualizado_em: data.data.updatedAt
            };
            setPipelines(prev => [...prev, newFunil]);
        }
    }, [authFetch]);

    const updatePipeline = useCallback(async (id: string, nome: string) => {
        if (!authFetch) return;
        
        await authFetch('/funil/update', {
            method: 'POST',
            body: JSON.stringify({ id, nome })
        });
        setPipelines(prev => prev.map(p => p.id === id ? { ...p, nome } : p));
    }, [authFetch]);

    const deletePipeline = useCallback(async (id: string, justification?: string) => {
        if (!authFetch) return;
        
        await authFetch(`/funil/delete/${id}`, { method: 'DELETE' });
        setPipelines(prev => prev.filter(p => p.id !== id));
    }, [authFetch]);

    const loadPipelinesForCompany = useCallback(async (empresaId: string) => {
        if (!authFetch) return;
        
        try {
            const res = await authFetch(`/funil/${empresaId}`);
            if (res?.ok) {
                const data = await res.json();
                const mappedFunis = mapFunilToFront(data.data);
                setPipelines(mappedFunis);
            }
        } catch (error) {
            console.error('Erro ao carregar funis da empresa:', error);
        }
    }, [authFetch]);

    const loadStagesForPipeline = useCallback(async (pipelineId: string) => {
        if (!authFetch) return;
        
        try {
            const res = await authFetch(`/etapa/${pipelineId}`);
            if (res?.ok) {
                const data = await res.json();
                const mappedStages = mapEtapaToFront(data.data);
                setStages(mappedStages);
            }
        } catch (error) {
            console.error('Erro ao carregar etapas do funil:', error);
        }
    }, [authFetch]);

    const addStage = useCallback(async (pipelineId: string, nome: string) => {
        if (!authFetch) return;
        
        const res = await authFetch('/etapa', {
            method: 'POST',
            body: JSON.stringify({ funil: pipelineId, nome })
        });

        if (res?.ok) {
            const data = await res.json();
            const newStage = mapEtapaToFront(data.data);
            setStages(prev => [...prev, ...newStage]);
        }
    }, [authFetch]);

    const updateStage = useCallback(async (id: string, nome: string) => {
        if (!authFetch) return;
        
        await authFetch('/etapa/updatename', {
            method: 'POST',
            body: JSON.stringify({ id, nome })
        });
        setStages(prev => prev.map(s => s.id === id ? { ...s, nome } : s));
    }, [authFetch]);

    const deleteStage = useCallback((id: string, justification?: string) => {
        setStages(prev => prev.filter(s => s.id !== id));
    }, []);

    const reorderStages = useCallback(async (newStages: PipelineStage[]) => {
        if (!authFetch) return;
        
        for (let i = 0; i < newStages.length; i++) {
            await authFetch('/etapa/update', {
                method: 'POST',
                body: JSON.stringify({ id: newStages[i].id, ordem: i })
            });
        }
        setStages(newStages);
    }, [authFetch]);

    return {
        pipelines,
        stages,
        activePipelineId,
        setPipelines,
        setStages,
        setActivePipelineId,
        addPipeline,
        updatePipeline,
        deletePipeline,
        loadPipelinesForCompany,
        loadStagesForPipeline,
        addStage,
        updateStage,
        deleteStage,
        reorderStages
    };
};
