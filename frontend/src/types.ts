
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
    ABERTA = 'aberta',
    GANHA = 'ganha',
    PERDIDA = 'perdida'
}

export enum TaskType {
    LIGACAO = 'ligacao',
    WHATSAPP = 'whatsapp',
    EMAIL = 'email'
}

export enum TaskStatus {
    PENDENTE = 'pendente',
    CONCLUIDA = 'concluida'
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
    cnpj?: string;
    logo_url?: string;
    cor_principal: string;
    cor_destaque: string;
    ativa: boolean;
}

export interface User {
    id: string;
    companyId?: string;
    nome: string;
    email: string;
    senha?: string;
    role: string;
    ativo?: boolean;
    acesso_confirmado?: boolean;
    acessos?: string[];
    permissions?: UserPermissions;
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
    nome: string;
    valor_total: number;
    desconto: number;
    status: DealStatus;
    criado_em: string;
    atualizado_em: string;
    deletado?: boolean;
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
    status: TaskStatus;
}

export interface DealEvent {
    id: string;
    deal_id: string;
    type?: EventType;
    tipo_evento?: EventType;
    description?: string;
    descricao?: string;
    criado_em: string;
    autor_id?: string;
    criado_por?: string;
}

// Context Type
export interface CRMContextType {
    companies: Company[];
    users: User[];
    leads: Lead[];
    pipelines: Pipeline[];
    stages: PipelineStage[];
    deals: Deal[];
    events: DealEvent[];
    tasks: Task[];
    products: Product[];
    dealProducts: DealProduct[];
    notifications: Notification[];
    currentUser: User | null;
    currentCompany: Company | null;
    activePipelineId: string | null;
    isLoading?: boolean;

    setActivePipelineId: (id: string) => void;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    addCompany: (company: Omit<Company, 'id'>, adminData?: { email: string; senha: string; nome: string }) => Promise<void>;
    updateCompany: (company: Company) => Promise<void>;
    deleteCompany: (id: string, reason: string) => Promise<void>;
    addLead: (lead: Omit<Lead, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'> & { funilId?: string; etapaId?: string; produto?: string }) => Promise<{ success: boolean; error?: string; lead?: Lead }>;
    updateLead: (lead: Lead) => Promise<void>;
    deleteLead: (leadId: string, reason: string) => Promise<void>;
    restoreLead: (leadId: string) => void;
    batchUpdateLeadResponsavel: (leadIds: string[], responsavelId: string) => void;
    importLeads: (data: any[], allocation: { mode: 'specific' | 'distribute'; userId?: string }) => { imported: number; failed: { row: number; reason: string }[] };
    syncLeadsFromFluent: (config: { tags?: string[]; lists?: string[] }) => { imported: number; updated: number };
    updateLeadClassificacao: (leadId: string, classificacao: number) => Promise<void>;
    addPipeline: (nome: string, empresaId?: string) => Promise<void>;
    loadPipelinesForCompany: (empresaId: string) => Promise<void>;
    loadStagesForPipeline: (pipelineId: string) => Promise<void>;
    loadTasksForCompany: (empresaId: string) => Promise<void>;
    updatePipeline: (id: string, nome: string) => Promise<void>;
    deletePipeline: (id: string, justification?: string) => Promise<void>;
    addDeal: (dealData: Omit<Deal, 'id' | 'criado_em' | 'atualizado_em'>) => Promise<{ success: boolean; deal?: Deal; error?: string }>;
    moveDeal: (dealId: string, stageId: string) => Promise<void>;
    updateDealStatus: (dealId: string, status: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage'; value: number }) => void;
    updateDealResponsavel: (dealId: string, newResponsavelId: string) => void;
    addEvent: (dealId: string, type: EventType, description: string) => void;
    loadDealsForCompany: (empresaId: string) => Promise<void>;
    addDealProduct: (dealId: string, productId: string) => void;
    deleteDealProduct: (dealProductId: string) => void;
    addTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => void;
    updateTaskStatus: (taskId: string, status: TaskStatus) => void;
    deleteTask: (taskId: string) => void;
    addUser: (user: Omit<User, 'id' | 'criado_em' | 'permissions' | 'acesso_confirmado'>) => Promise<void>;
    deleteUser: (userId: string) => void;
    changeUserPassword: (userId: string, newPass: string) => Promise<void>;
    resetPassword: (email: string, newPass: string) => { success: boolean; message: string };
    updateUser: (user: User) => void;
    updateUserPermissions: (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => void;
    addStage: (pipelineId: string, nome: string) => Promise<void>;
    deleteStage: (id: string, justification?: string) => void;
    updateStage: (id: string, nome: string) => Promise<void>;
    reorderStages: (newStages: PipelineStage[]) => Promise<void>;
    addProduct: (product: Omit<Product, 'id' | 'companyId'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string, justification?: string) => void;
    approveNotification: (id: string) => void;
    rejectNotification: (id: string) => void;
}
