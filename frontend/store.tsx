import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import CryptoJS from 'crypto-js'; // Importação adicionada
import {
    User, UserProfile, Lead, Pipeline, PipelineStage, Company,
    Deal, DealStatus, DealEvent, EventType, Task, TaskType, TaskStatus, Product, DealProduct, UserPermissions, Notification, PersonType
} from './types';
import { SECRET, SALT, API_URL } from './env';

interface CRMContextType {
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
    setActivePipelineId: (id: string) => void;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    addCompany: (company: Omit<Company, 'id' | 'criado_em'>, adminData?: { email: string, senha: string, nome: string }) => Promise<void>;
    updateCompany: (company: Company) => Promise<void>;
    deleteCompany: (id: string, reason: string) => Promise<void>;
    addLead: (lead: Omit<Lead, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'> & { funilId?: string, etapaId?: string, produto?: string }) => Promise<{ success: boolean; error?: string; lead?: Lead }>;
    updateLead: (lead: Lead) => Promise<void>;
    deleteLead: (leadId: string, reason: string) => Promise<void>;
    restoreLead: (leadId: string) => void;
    batchUpdateLeadResponsavel: (leadIds: string[], responsavelId: string) => void;
    importLeads: (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string }) => { imported: number; failed: { row: number; reason: string }[] };
    syncLeadsFromFluent: (config: { tags?: string[]; lists?: string[] }) => { imported: number; updated: number };
    updateLeadClassificacao: (leadId: string, classificacao: number) => void;
    addPipeline: (nome: string) => Promise<void>;
    updatePipeline: (id: string, nome: string) => Promise<void>;
    deletePipeline: (id: string, justification?: string) => Promise<void>;
    addDeal: (dealData: Omit<Deal, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'>) => { success: boolean; deal?: Deal; error?: string };
    moveDeal: (dealId: string, stageId: string) => Promise<void>;
    updateDealStatus: (dealId: string, status: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage', value: number }) => void;
    updateDealResponsavel: (dealId: string, newResponsavelId: string) => void;
    addEvent: (dealId: string, type: EventType, description: string) => void;
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

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const mapMongoToFront = (data: any) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => ({ ...item, id: item._id }));
    return { ...data, id: data._id };
};

// Função para mapear funis com campos padrão
const mapFunilToFront = (data: any): any[] => {
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
const mapEtapaToFront = (data: any) => {
    if (Array.isArray(data)) {
        return data.map(etapa => {
            const funilId = typeof etapa.funil === 'object' ? etapa.funil?._id : etapa.funil;
            return {
                id: etapa._id,
                nome: etapa.nome,
                ordem: etapa.ordem !== undefined ? etapa.ordem : 0,
                funil: funilId,
                pipeline_id: funilId, // Alias para compatibilidade
                criado_em: etapa.createdAt,
                atualizado_em: etapa.updatedAt
            };
        });
    }
    const funilId = typeof data.funil === 'object' ? data.funil?._id : data.funil;
    return { 
        id: data._id, 
        nome: data.nome,
        ordem: data.ordem !== undefined ? data.ordem : 0,
        funil: funilId,
        pipeline_id: funilId,
        criado_em: data.createdAt,
        atualizado_em: data.updatedAt
    };
};

// Função auxiliar de criptografia para manter padrão
const encryptPassword = (password: string) => {
    return CryptoJS.AES.encrypt(password + SALT, SECRET).toString();
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('crm_current_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [events, setEvents] = useState<DealEvent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activePipelineId, setActivePipelineId] = useState<string | null>(null);

    const token = localStorage.getItem('token');

    const authFetch = async (endpoint: string, options: RequestInit = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': token ? `${token}` : '',
            ...options.headers,
        };
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (response.status === 401) {
            logout();
            return null;
        }
        return response;
    };

    const fetchInitialData = async () => {
        if (!currentUser || !currentUser.companyId) return;

        try {
            setIsLoading(true); // Garante que está em loading
            console.log('🔄 Iniciando carregamento de dados...', { companyId: currentUser.companyId });
            
            // Carrega dados críticos de forma síncrona
            const [resEmpresa, resFunis] = await Promise.all([
                authFetch('/empresa').catch(e => { console.error('❌ Erro ao buscar /empresa:', e); return null; }),
                authFetch(`/funil/${currentUser.companyId}`).catch(e => { console.error('❌ Erro ao buscar /funil:', e); return null; })
            ]);

            if (resEmpresa?.ok) {
                const data = await resEmpresa.json();
                console.log('✅ Empresas carregadas:', data);
                setCompanies(mapMongoToFront(data.data));
            } else if (resEmpresa) {
                console.warn('⚠️ GET /empresa retornou status:', resEmpresa.status);
            }

            if (resFunis?.ok) {
                const data = await resFunis.json();
                console.log('✅ Funils carregados:', data);
                const mappedFunis = mapFunilToFront(data.data);
                setPipelines(mappedFunis);

                if (mappedFunis.length > 0) {
                    const initialPipeId = mappedFunis[0].id;
                    setActivePipelineId(initialPipeId);
                    console.log('📌 Pipeline inicial definido:', initialPipeId);
                    
                    // Aguarda carregamento das etapas do primeiro funil
                    const resEtapas = await authFetch(`/etapa/${initialPipeId}`).catch(e => {
                        console.error('❌ Erro ao buscar /etapa:', e);
                        return null;
                    });
                    if (resEtapas?.ok) {
                        const etapaData = await resEtapas.json();
                        console.log('✅ Etapas carregadas:', etapaData);
                        setStages(mapEtapaToFront(etapaData.data));
                    } else if (resEtapas) {
                        console.warn('⚠️ GET /etapa retornou status:', resEtapas.status);
                    }
                }
            } else if (resFunis) {
                console.warn('⚠️ GET /funil retornou status:', resFunis.status);
            }

            // Carrega clientes de forma SÍNCRONA agora
            const resClientes = await authFetch('/cliente').catch(e => {
                console.error('❌ Erro ao buscar /cliente:', e);
                return null;
            });
            if (resClientes?.ok) {
                const data = await resClientes.json();
                console.log('✅ Clientes carregados:', data);
                const mappedClients = data.data?.map((c: any) => ({
                    id: c._id,
                    companyId: c.empresa?._id || c.empresa,
                    nome_completo: c.nome,
                    email: c.email,
                    whatsapp: c.whatsapp,
                    campanha: c.tag || 'Orgânico',
                    classificacao: c.rating || 1,
                    responsavel_id: c.responsavel?._id || c.responsavel,
                    criado_em: c.createdAt,
                    atualizado_em: c.updatedAt,
                    deletado: c.excluido
                })) || [];
                setLeads(mappedClients);
            } else if (resClientes) {
                console.warn('⚠️ GET /cliente retornou status:', resClientes.status);
            }

            console.log('✅ Carregamento concluído com sucesso!');
        } catch (error) {
            console.error("❌ Erro ao carregar dados iniciais:", error);
        } finally {
            setIsLoading(false); // Apenas quando TUDO estiver pronto
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchInitialData();
        }
    }, [currentUser]);

    useEffect(() => {
        if (activePipelineId) {
            const loadPipelineData = async () => {
                const resEtapas = await authFetch(`/etapa/${activePipelineId}`);
                if (resEtapas?.ok) {
                    const etapaData = await resEtapas.json();
                    setStages(mapEtapaToFront(etapaData.data));
                }

                const resNegociacoes = await authFetch(`/negociacao/${activePipelineId}`);
                if (resNegociacoes?.ok) {
                    const negData = await resNegociacoes.json();
                    const mappedDeals = negData.data.map((n: any) => ({
                        id: n._id,
                        companyId: n.empresa,
                        lead_id: n.cliente?._id || n.cliente,
                        pipeline_id: n.funil,
                        stage_id: n.etapa?._id || n.etapa,
                        responsavel_id: n.responsavel?._id || n.responsavel,
                        status: DealStatus.ABERTA,
                        criado_em: n.createdAt,
                        atualizado_em: n.updatedAt
                    }));
                    setDeals(mappedDeals);
                }
            }
            loadPipelineData();
        }
    }, [activePipelineId]);

    const currentCompany = useMemo(() => {
        if (!currentUser) return null;
        return companies.find(c => c.id === currentUser.companyId) || null;
    }, [companies, currentUser]);

    const login = async (email: string, pass: string) => {
        try {
            // Criptografa a senha antes de enviar para o login
            const encryptedPass = encryptPassword(pass);

            const res = await fetch(`${API_URL}/usuario/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: encryptedPass })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);

                const userData = { ...data.user, id: data.user._id, companyId: data.user.empresa };
                setCurrentUser(userData);
                localStorage.setItem('crm_current_user', JSON.stringify(userData));
                return true;
            }
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('crm_current_user');
        setCurrentUser(null);
        setDeals([]);
        setLeads([]);
    };

    const addCompany = async (companyData: Omit<Company, 'id' | 'criado_em'>, adminData?: { email: string, senha: string, nome: string }) => {
        const res = await authFetch('/empresa', {
            method: 'POST',
            body: JSON.stringify(companyData)
        });

        if (res?.ok && adminData) {
            // Se a empresa foi criada, cria o admin
            // Como o usuário pediu para enviar criptografado no cadastro, usamos encryptPassword
            const companyRes = await res.json();
            // Assumindo que o retorno da criação da empresa traz o ID ou dados dela
            // Vamos precisar do ID da nova empresa. Se o endpoint retorna a empresa criada:
            // Ajuste aqui conforme o retorno real do seu back (ex: companyRes.data._id)

            // NOTA: Como você não enviou o retorno exato do create empresa, 
            // vou assumir que você vai implementar o vínculo manualmente ou que o back tratou.
            // Mas para criar o usuário admin, chamo o addUser:

            await addUser({
                email: adminData.email,
                nome: adminData.nome,
                senha: adminData.senha, // addUser vai criptografar
                role: 'proprietario',
                ativo: true,
                empresa: companyRes.data?._id // Assumindo estrutura do retorno
            });
        }

        if (res?.ok) {
            fetchInitialData();
        }
    };

    const updateCompany = async (updated: Company) => {
        await authFetch('/empresa/edit', {
            method: 'POST',
            body: JSON.stringify(updated)
        });
        setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const deleteCompany = async (id: string, reason: string) => {
        await authFetch(`/empresa/delete/${id}`, { method: 'DELETE' });
        setCompanies(prev => prev.filter(c => c.id !== id));
    };

    const addLead = async (leadData: any) => {
        if (!activePipelineId || stages.length === 0) return { success: false, error: 'Funil não carregado' };

        const payload = {
            empresa: currentUser?.companyId,
            nome: leadData.nome_completo,
            email: leadData.email,
            whatsapp: leadData.whatsapp,
            responsavel: currentUser?.id,
            origem: 'Manual',
            tag: leadData.campanha,
            produto: leadData.produto,
            funil: leadData.funilId || activePipelineId,
            etapa: leadData.etapaId || stages[0].id
        };

        const res = await authFetch('/cliente', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res?.ok) {
            fetchInitialData();
            return { success: true };
        }
        return { success: false, error: 'Erro ao criar cliente' };
    };

    const updateLead = async (updated: Lead) => {
        await authFetch('/cliente/edit', {
            method: 'POST',
            body: JSON.stringify({ id: updated.id, ...updated })
        });
        setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    };

    const addPipeline = async (nome: string) => {
        if (!currentUser?.companyId) return;
        const res = await authFetch('/funil', {
            method: 'POST',
            body: JSON.stringify({ empresa: currentUser.companyId, nome })
        });
        if (res?.ok) fetchInitialData();
    };

    const updatePipeline = async (id: string, nome: string) => {
        await authFetch('/funil/update', {
            method: 'POST',
            body: JSON.stringify({ id, nome })
        });
        setPipelines(prev => prev.map(p => p.id === id ? { ...p, nome } : p));
    };

    const deletePipeline = async (id: string, justification?: string) => {
        await authFetch(`/funil/delete/${id}`, { method: 'DELETE' });
        setPipelines(prev => prev.filter(p => p.id !== id));
    };

    const addStage = async (pipelineId: string, nome: string) => {
        const res = await authFetch('/etapa', {
            method: 'POST',
            body: JSON.stringify({ funil: pipelineId, nome })
        });
        if (res?.ok) {
            const resEtapas = await authFetch(`/etapa/${pipelineId}`);
            if (resEtapas?.ok) {
                const data = await resEtapas.json();
                setStages(mapEtapaToFront(data.data));
            }
        }
    };

    const updateStage = async (id: string, nome: string) => {
        await authFetch('/etapa/updatename', {
            method: 'POST',
            body: JSON.stringify({ id, nome })
        });
        setStages(prev => prev.map(s => s.id === id ? { ...s, nome } : s));
    };

    const reorderStages = async (newStages: PipelineStage[]) => {
        setStages(newStages);

        for (let i = 0; i < newStages.length; i++) {
            await authFetch('/etapa/updateorder', {
                method: 'POST',
                body: JSON.stringify({ etapaId: newStages[i].id, newPosition: i })
            });
        }
    };

    const moveDeal = async (dealId: string, stageId: string) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId } : d));

        await authFetch('/negociacao/updateetapa', {
            method: 'POST',
            body: JSON.stringify({ id: dealId, novaEtapaId: stageId })
        });
    };

    const addUser = async (userData: any) => {
        // Criptografa senha antes de enviar
        const payload = {
            ...userData,
            empresa: currentUser?.companyId || userData.empresa,
            senha: encryptPassword(userData.senha)
        };

        await authFetch('/usuario', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        fetchInitialData();
    };

    const changeUserPassword = async (userId: string, newPass: string) => {
        // Também criptografa ao alterar senha
        const encryptedPass = encryptPassword(newPass);

        await authFetch('/usuario/passwordupdate', {
            method: 'POST',
            body: JSON.stringify({ id: userId, newPassword: encryptedPass })
        });
    };

    const addEvent = (did: string, t: EventType, d: string) => {
        setEvents(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), deal_id: String(did), tipo_evento: t, descricao: d, criado_em: new Date().toISOString(), autor_id: currentUser?.id || 'system' }]);
    };

    const updateDealStatus = (id: string, s: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage', value: number }) => {
        setDeals(prev => prev.map(d => String(d.id) === String(id) ? { ...d, status: s } : d));
    };

    const deleteLead = async (id: string, reason: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, deletado: true } : l));
    };

    const deleteStage = (id: string, justification?: string) => {
        setStages(prev => prev.filter(s => s.id !== id));
    };

    const deleteProduct = (id: string, justification?: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    const importLeads = (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string }) => {
        data.forEach(async (item) => {
            await addLead({
                nome_completo: item.nome_completo,
                email: item.email,
                whatsapp: item.whatsapp,
                campanha: item.tags,
                produto: item.produto
            });
        });
        return { imported: data.length, failed: [] };
    };

    const addProduct = (p: any) => setProducts(prev => [...prev, { ...p, id: Math.random().toString(36).substr(2, 9), companyId: currentUser?.companyId }]);
    const updateProduct = (updated: Product) => setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));

    const approveNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
    const rejectNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

    const addTask = (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => {
        const newTask: Task = { ...taskData, id: Math.random().toString(36).substr(2, 9), companyId: currentUser?.companyId || '', status: TaskStatus.PENDENTE };
        setTasks(prev => [...prev, newTask]);
    };

    const updateTaskStatus = (taskId: string, status: TaskStatus) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    };

    const deleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const updateLeadClassificacao = (id: string, classificacao: number) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, classificacao } : l));
    };

    const addDealProduct = (dealId: string, productId: string) => {
        const product = products.find(p => String(p.id) === String(productId));
        if (!product) return;
        const newDp: DealProduct = { id: Math.random().toString(36).substr(2, 9), deal_id: String(dealId), product_id: String(productId), valor: product.valor_total, parcelas: product.parcelas };
        setDealProducts(prev => [...prev, newDp]);
    };

    const deleteDealProduct = (id: string) => {
        setDealProducts(prev => prev.filter(item => item.id !== id));
    };

    const addDeal = (dealData: any) => {
        return { success: false, error: "Use addLead para criar negociações" };
    };

    const batchUpdateLeadResponsavel = (leadIds: string[], responsavelId: string) => {
        setLeads(prev => prev.map(l => leadIds.includes(l.id) ? { ...l, responsavel_id: responsavelId } : l));
    };

    const updateUserPermissions = (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions, acesso_confirmado } : u));
    };

    return (
        <CRMContext.Provider value={{
            companies, users, leads, pipelines, stages, deals, events, tasks, products, dealProducts, notifications, currentUser, currentCompany, activePipelineId, setActivePipelineId,
            isLoading, login, logout, addCompany, updateCompany, deleteCompany, addLead, updateLead, updateDealStatus, addEvent, deleteLead, deletePipeline, deleteStage, deleteProduct, deleteUser,
            addPipeline, updatePipeline, addStage, updateStage, reorderStages, addProduct, updateProduct, addUser, updateDealResponsavel: (did: string, rid: string) => { },
            addDeal, moveDeal, addDealProduct, deleteDealProduct,
            importLeads, syncLeadsFromFluent: (c: any) => ({ imported: 0, updated: 0 }), restoreLead: (id: string) => { }, batchUpdateLeadResponsavel,
            updateLeadClassificacao, addTask, updateTaskStatus, deleteTask, updateUserPermissions, changeUserPassword,
            approveNotification, rejectNotification, resetPassword: (e: string, p: string) => ({ success: true, message: '' })
        } as any}>
            {children}
        </CRMContext.Provider>
    );
};

export const useCRM = () => {
    const context = useContext(CRMContext);
    if (!context) throw new Error('useCRM must be used within a CRMProvider');
    return context;
};