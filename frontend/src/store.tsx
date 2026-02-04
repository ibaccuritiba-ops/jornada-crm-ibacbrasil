// Store refatorado - Orquestrador leve que combine todos os hooks
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { mapMongoToFront, mapFunilToFront, mapEtapaToFront } from './utils/mappers';
import { createAuthFetch, encryptPassword } from './utils/helpers';
import { useAuth } from './hooks/useAuth';
import { useCompanies } from './hooks/useCompanies';
import { usePipelines } from './hooks/usePipelines';
import { useTasks } from './hooks/useTasks';
import { useLeads } from './hooks/useLeads';
import { useDeals } from './hooks/useDeals';
import { useProducts } from './hooks/useProducts';
import { useUsers } from './hooks/useUsers';
import { useNotifications } from './hooks/useNotifications';
import { CRMContextType } from './types';
import { API_URL } from './env';

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Hooks individuais
    const { currentUser, setCurrentUser, login, logout, resetPassword } = useAuth();
    const { companies, setCompanies, addCompany, updateCompany, deleteCompany } = useCompanies();
    const { pipelines, stages, activePipelineId, setPipelines, setStages, setActivePipelineId, addPipeline, updatePipeline, deletePipeline, loadPipelinesForCompany, loadStagesForPipeline, addStage, updateStage, deleteStage, reorderStages } = usePipelines();
    const { tasks, setTasks, addTask, updateTaskStatus, deleteTask, loadTasksForCompany } = useTasks();
    const { leads, setLeads, addLead, updateLead, deleteLead, restoreLead, permanentlyDeleteLead, updateLeadClassificacao, batchUpdateLeadResponsavel, importLeads } = useLeads();
    const { deals, events, setDeals, setEvents, moveDeal, updateDealStatus, updateDealResponsavel, addEvent, addDeal, loadDealsForCompany } = useDeals();
    const { products, dealProducts, setProducts, setDealProducts, addProduct, updateProduct, deleteProduct, addDealProduct, deleteDealProduct } = useProducts();
    const { users, setUsers, addUser, updateUser, deleteUser, changeUserPassword, updateUserPermissions, updateUserAccess } = useUsers();
    const { notifications, setNotifications, approveNotification, rejectNotification } = useNotifications();

    // Estado local do provider
    const [isLoading, setIsLoading] = useState(true);
    const [refreshUsers, setRefreshUsers] = useState(0); // Trigger para refetch de usuários
    const token = localStorage.getItem('token');
    const authFetch = useMemo(() => createAuthFetch(token), [token]);

    // currentCompany memoizado
    const currentCompany = useMemo(() => {
        if (!currentUser) return null;
        return companies.find(c => c.id === currentUser.companyId) || null;
    }, [companies, currentUser]);

    // Fetch inicial de dados
    const fetchInitialData = useCallback(async () => {
        if (!currentUser || !authFetch) return;

        try {
            setIsLoading(true);

            // Sempre carrega empresas e usuários
            const [resEmpresa, resUsuarios] = await Promise.all([
                authFetch('/empresa'),
                authFetch('/usuario')
            ]);

            if (resEmpresa?.ok) {
                const data = await resEmpresa.json();
                setCompanies(mapMongoToFront(data.data));
            }

            if (resUsuarios?.ok) {
                const data = await resUsuarios.json();
                const mappedUsers = data.data?.map((u: any) => {
                    // Converte array de acessos em objeto de permissions
                    const acessosArray = u.acessos || [];
                    const permissions = {
                        leads: acessosArray.includes('leads'),
                        negociacoes: acessosArray.includes('negocios'),
                        importacao: acessosArray.includes('importacao'),
                        relatorios: acessosArray.includes('relatorios'),
                        produtos: acessosArray.includes('produtos'),
                        configuracoes: acessosArray.includes('config.conta'),
                        branding: acessosArray.includes('branding'),
                        pipelines: acessosArray.includes('config.funil'),
                        tarefas: acessosArray.includes('agenda')
                    };

                    return {
                        id: u._id,
                        nome: u.nome,
                        email: u.email,
                        role: u.role,
                        companyId: typeof u.empresa === 'object' ? u.empresa?._id : u.empresa,
                        ativo: u.ativo !== false,
                        acesso_confirmado: u.ativo !== false, // ativo e acesso_confirmado são a mesma coisa
                        acessos: acessosArray,
                        permissions,
                        criado_em: u.createdAt,
                        atualizado_em: u.updatedAt
                    };
                }) || [];
                setUsers(mappedUsers);
            }

            // Carrega clientes
            const resClientes = await authFetch('/cliente');
            if (resClientes?.ok) {
                const data = await resClientes.json();
                const mappedClients = data.data?.map((c: any) => ({
                    id: c._id,
                    companyId: c.empresa?._id || c.empresa,
                    nome_completo: c.nome,
                    email: c.email,
                    whatsapp: c.whatsapp,
                    campanha: c.tag || 'Orgânico',
                    classificacao: c.rating || 3,
                    responsavel_id: c.responsavel?._id || c.responsavel,
                    criado_em: c.createdAt,
                    atualizado_em: c.updatedAt,
                    deletado: c.excluido
                })) || [];
                setLeads(mappedClients);
            }

            // Carrega dados: Proprietários carregam TODOS os dados, admin/vendedor carregam só da sua empresa
            if (currentUser.role === 'proprietario') {
                // Proprietários carregam todos os funis e etapas
                const resFunis = await authFetch('/funil');
                if (resFunis?.ok) {
                    const data = await resFunis.json();
                    const mappedFunis = mapFunilToFront(data.data);
                    setPipelines(mappedFunis);
                }

                const resEtapas = await authFetch('/etapa');
                if (resEtapas?.ok) {
                    const data = await resEtapas.json();
                    setStages(mapEtapaToFront(data.data));
                }

                // Carrega TODOS os produtos para proprietário
                const resProdutos = await authFetch('/produto');
                if (resProdutos?.ok) {
                    const data = await resProdutos.json();
                    const mappedProducts = data.data?.map((p: any) => ({
                        id: p._id,
                        nome: p.nome,
                        valor_total: p.valor_total,
                        parcelas: p.parcelas,
                        companyId: typeof p.empresa === 'object' ? p.empresa?._id : p.empresa,
                        deletado: p.excluido,
                        criado_em: p.createdAt,
                        atualizado_em: p.updatedAt
                    })) || [];
                    setProducts(mappedProducts);
                }
            } else {
                // Admin/Vendedor: carrega dados da sua empresa
                const resFunis = await authFetch(`/funil/${currentUser.companyId}`);
                if (resFunis?.ok) {
                    const data = await resFunis.json();
                    const mappedFunis = mapFunilToFront(data.data);
                    setPipelines(mappedFunis);

                    if (mappedFunis.length > 0) {
                        const initialPipeId = mappedFunis[0].id;
                        setActivePipelineId(initialPipeId);

                        const resEtapas = await authFetch(`/etapa/${initialPipeId}`);
                        if (resEtapas?.ok) {
                            const etapaData = await resEtapas.json();
                            setStages(mapEtapaToFront(etapaData.data));
                        }
                    }
                }

                // Carrega produtos da empresa
                const resProdutos = await authFetch(`/produto/${currentUser.companyId}`);
                if (resProdutos?.ok) {
                    const data = await resProdutos.json();
                    const mappedProducts = data.data?.map((p: any) => ({
                        id: p._id,
                        nome: p.nome,
                        valor_total: p.valor_total,
                        parcelas: p.parcelas,
                        companyId: typeof p.empresa === 'object' ? p.empresa?._id : p.empresa,
                        deletado: p.excluido,
                        criado_em: p.createdAt,
                        atualizado_em: p.updatedAt
                    })) || [];
                    setProducts(mappedProducts);
                }
            }

            // Carrega negociações para todos (proprietários e admin)
            const resNegociacoes = await authFetch('/negociacao');
            if (resNegociacoes?.ok) {
                const data = await resNegociacoes.json();
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

                // Extrai produtos das negociações
                const allDealProducts: any[] = [];
                data.data?.forEach((n: any) => {
                    if (n.produtos && Array.isArray(n.produtos)) {
                        n.produtos.forEach((p: any) => {
                            const prodId = p._id || p;
                            const valor = p.valor_total || p.value || 0;
                            const parcelas = p.parcelas || p.maxParcelas || 1;
                            
                            allDealProducts.push({
                                id: prodId,
                                deal_id: n._id,
                                product_id: prodId,
                                valor: valor,
                                parcelas: parcelas
                            });
                        });
                    }
                });
                setDealProducts(allDealProducts);

                // Extrai tarefas das negociações
                const allTasks: any[] = [];
                data.data?.forEach((n: any) => {
                    if (n.tarefas && Array.isArray(n.tarefas)) {
                        n.tarefas.forEach((t: any) => {
                            allTasks.push({
                                id: t._id || Math.random().toString(36),
                                deal_id: n._id,
                                tipo: t.tipo,
                                titulo: t.titulo || `Tarefa de ${t.tipo}`,
                                companyId: typeof n.empresa === 'object' ? n.empresa?._id : n.empresa,
                                data_hora: t.data || n.createdAt,
                                status: t.concluida ? 'concluida' : 'pendente'
                            });
                        });
                    }
                });
                setTasks(allTasks);
            }
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, authFetch, setCompanies, setUsers, setLeads, setTasks, setPipelines, setStages, setActivePipelineId, setProducts, setDeals]);

    // Trigger na mudança de usuário
    useEffect(() => {
        if (currentUser) {
            fetchInitialData();
        }
    }, [currentUser, fetchInitialData]);

    // Refetch apenas de usuários quando permissões são atualizadas
    useEffect(() => {
        if (refreshUsers > 0 && authFetch && currentUser) {
            const refetchUsers = async () => {
                try {
                    const resUsuarios = await authFetch('/usuario');
                    if (resUsuarios?.ok) {
                        const data = await resUsuarios.json();
                        const mappedUsers = data.data?.map((u: any) => {
                            // Converte array de acessos em objeto de permissions
                            const acessosArray = u.acessos || [];
                            const permissions = {
                                leads: acessosArray.includes('leads'),
                                negociacoes: acessosArray.includes('negocios'),
                                importacao: acessosArray.includes('importacao'),
                                relatorios: acessosArray.includes('relatorios'),
                                produtos: acessosArray.includes('produtos'),
                                configuracoes: acessosArray.includes('config.conta'),
                                branding: acessosArray.includes('branding'),
                                pipelines: acessosArray.includes('config.funil'),
                                tarefas: acessosArray.includes('agenda')
                            };

                            return {
                                id: u._id,
                                nome: u.nome,
                                email: u.email,
                                role: u.role,
                                companyId: typeof u.empresa === 'object' ? u.empresa?._id : u.empresa,
                                ativo: u.ativo !== false,
                                acesso_confirmado: u.ativo !== false,
                                acessos: acessosArray,
                                permissions,
                                criado_em: u.createdAt,
                                atualizado_em: u.updatedAt
                            };
                        }) || [];
                        setUsers(mappedUsers);

                        // Atualiza o currentUser se for um dos usuários
                        const updatedCurrentUser = mappedUsers.find(u => u.id === currentUser.id);
                        if (updatedCurrentUser) {
                            setCurrentUser(updatedCurrentUser);
                            localStorage.setItem('crm_current_user', JSON.stringify(updatedCurrentUser));
                        }
                    }
                } catch (error) {
                    console.error('Erro ao refetch usuários:', error);
                }
            };
            refetchUsers();
        }
    }, [refreshUsers, authFetch, currentUser, setUsers, setCurrentUser]);

    // Wrappers para atualizar usuários e refetch automático
    const handleUpdateUserPermissions = useCallback((userId: string, perms: any, access: boolean) => {
        updateUserPermissions(userId, perms, access);
        // Dispara refetch após pequeno delay
        setTimeout(() => setRefreshUsers(prev => prev + 1), 500);
    }, [updateUserPermissions]);

    const handleUpdateUserAccess = useCallback(async (userId: string, ativo: boolean) => {
        await updateUserAccess(userId, ativo);
        // Dispara refetch após pequeno delay
        setTimeout(() => setRefreshUsers(prev => prev + 1), 500);
    }, [updateUserAccess]);

    return (
        <CRMContext.Provider value={{
            // Estado
            companies, users, leads, pipelines, stages, deals, events, tasks, products, dealProducts, notifications,
            currentUser, currentCompany, activePipelineId,
            isLoading: isLoading,

            // Setters
            setActivePipelineId,

            // Auth
            login, logout, resetPassword,

            // Companies
            addCompany,
            updateCompany,
            deleteCompany,

            // Leads
            addLead,
            updateLead,
            deleteLead,
            restoreLead,
            permanentlyDeleteLead,
            updateLeadClassificacao,
            batchUpdateLeadResponsavel,
            importLeads,
            syncLeadsFromFluent: (c) => ({ imported: 0, updated: 0 }),

            // Pipelines
            addPipeline,
            updatePipeline,
            deletePipeline,
            loadPipelinesForCompany,
            loadStagesForPipeline,

            // Stages
            addStage,
            updateStage,
            deleteStage,
            reorderStages,

            // Deals
            addDeal,
            moveDeal,
            updateDealStatus,
            updateDealResponsavel,
            addEvent,
            loadDealsForCompany,
            addDealProduct,
            deleteDealProduct,

            // Tasks
            addTask,
            updateTaskStatus,
            deleteTask,
            loadTasksForCompany,

            // Products
            addProduct,
            updateProduct,
            deleteProduct,

            // Users
            addUser,
            updateUser,
            deleteUser,
            changeUserPassword,
            updateUserPermissions: handleUpdateUserPermissions,
            updateUserAccess: handleUpdateUserAccess,

            // Notifications
            approveNotification,
            rejectNotification
        } as CRMContextType}>
            {children}
        </CRMContext.Provider>
    );
};

export const useCRM = () => {
    const context = useContext(CRMContext);
    if (!context) throw new Error('useCRM must be used within a CRMProvider');
    return context;
};
