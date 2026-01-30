
export enum UserProfile {
    PROPRIETARIO = 'PROPRIETARIO',
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    FINAL_USER = 'FINAL_USER'
}

export enum PersonType {
    PF = 'PF',
    PJ = 'PJ'
}

export enum DealStatus {
    ABERTA = 'ABERTA',
    GANHA = 'GANHA',
    PERDIDA = 'PERDIDA'
}

export enum TaskType {
    LIGACAO = 'LIGACAO',
    WHATSAPP = 'WHATSAPP',
    EMAIL = 'EMAIL'
}

export enum TaskStatus {
    PENDENTE = 'PENDENTE',
    CONCLUIDA = 'CONCLUIDA'
}

export enum EventType {
    CRIACAO = 'CRIACAO',
    MUDANCA_ETAPA = 'MUDANCA_ETAPA',
    ANOTACAO = 'ANOTACAO',
    TAREFA = 'TAREFA',
    STATUS = 'STATUS',
    EXCLUSAO = 'EXCLUSAO',
    RESTAURACAO = 'RESTAURACAO',
    SYNC = 'SYNC'
}

export interface UserPermissions {
    leads: boolean;
    negociacoes: boolean;
    importacao: boolean;
    relatorios: boolean;
    produtos: boolean;
    configuracoes: boolean;
    branding: boolean;
    pipelines: boolean;
    tarefas: boolean;
}

export interface Company {
    id: string;
    nome: string;
    documento?: string;
    logo_url?: string;
    cor_primaria: string;
    cor_secundaria: string;
    cor_terciaria: string;
    ativa: boolean;
    criado_em: string;
    deletado?: boolean;
    motivo_exclusao?: string;
    data_exclusao?: string;
}

export interface User {
    id: string;
    companyId?: string;
    nome: string;
    email: string;
    senha?: string;
    role: string; // 'proprietario' | 'supervisor' | 'vendedor'
    ativo?: boolean;
    acesso_confirmado?: boolean;
    acessos?: string[]; // array de permissões
    criado_em?: string;
    atualizado_em?: string;
}

export interface Pipeline {
    id: string;
    companyId: string;
    nome: string;
    ativo: boolean;
    criado_em: string;
    deletado?: boolean;
    motivo_exclusao?: string;
    data_exclusao?: string;
}

export interface PipelineStage {
    id: string;
    pipeline_id: string;
    nome: string;
    ordem: number;
    ativo: boolean;
    deletado?: boolean;
    motivo_exclusao?: string;
    data_exclusao?: string;
}

export interface Lead {
    id: string;
    companyId: string;
    responsavel_id?: string;
    nome_completo: string;
    tipo_pessoa: PersonType;
    email: string;
    whatsapp: string;
    campanha?: string;
    classificacao: number;
    criado_em: string;
    atualizado_em: string;
    deletado?: boolean;
    exclusao_pendente?: boolean;
    motivo_exclusao?: string;
    data_exclusao?: string;
    external_source?: string;
    external_id?: string;
    tags?: string[];
    lists?: string[];
    synced_at?: string;
}

export interface Deal {
    id: string;
    companyId: string;
    lead_id: string;
    pipeline_id: string;
    stage_id: string;
    responsavel_id: string;
    status: DealStatus;
    criado_em: string;
    atualizado_em: string;
}

export interface Product {
    id: string;
    companyId: string;
    nome: string;
    valor_total: number;
    parcelas: number;
    deletado?: boolean;
    motivo_exclusao?: string;
    data_exclusao?: string;
}

export interface Notification {
    id: string;
    companyId: string;
    userId: string;
    userName: string;
    type: 'LEAD' | 'PIPELINE' | 'STAGE' | 'PRODUCT';
    targetId: string;
    targetName: string;
    justificativa: string;
    criado_em: string;
    lida: boolean;
}

export interface DealProduct {
    id: string;
    deal_id: string;
    product_id: string;
    valor: number;
    parcelas: number;
}

export interface Task {
    id: string;
    companyId: string;
    deal_id: string;
    titulo: string;
    tipo: TaskType;
    data_hora: string;
    responsavel_id: string;
    status: TaskStatus;
}

export interface DealEvent {
    id: string;
    deal_id: string;
    tipo_evento: EventType;
    descricao: string;
    criado_em: string;
    autor_id: string;
}
