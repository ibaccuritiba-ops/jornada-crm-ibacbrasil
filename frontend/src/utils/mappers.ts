// Utilitários de mapeamento de dados MongoDB → Frontend

import { PipelineStage } from '../types';

export const mapMongoToFront = (data: any) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => ({ ...item, id: item._id }));
    return { ...data, id: data._id };
};

// Função para mapear funis com campos padrão
export const mapFunilToFront = (data: any): any[] => {
    if (Array.isArray(data)) {
        return data.map(funil => {
            const empresaId = typeof funil.empresa === 'object' ? funil.empresa?._id : funil.empresa;
            return {
                id: funil._id,
                nome: funil.nome,
                companyId: empresaId,
                criado_em: funil.createdAt,
                atualizado_em: funil.updatedAt
            };
        });
    }
    const empresaId = typeof data.empresa === 'object' ? data.empresa?._id : data.empresa;
    return [{ 
        id: data._id, 
        nome: data.nome,
        companyId: empresaId,
        criado_em: data.createdAt,
        atualizado_em: data.updatedAt
    }];
};

// Função para mapear etapas com campos padrão
export const mapEtapaToFront = (data: any): PipelineStage[] => {
    if (!data) return [];
    
    const mapSingle = (etapa: any): PipelineStage => {
        return {
            id: etapa._id,
            nome: etapa.nome,
            ordem: etapa.ordem || 0,
            pipeline_id: typeof etapa.funil === 'object' ? etapa.funil?._id : etapa.funil,
            ativo: etapa.ativo !== false,
            deletado: etapa.deletado || false
        };
    };
    
    if (Array.isArray(data)) return data.map(mapSingle);
    return [mapSingle(data)];
};
