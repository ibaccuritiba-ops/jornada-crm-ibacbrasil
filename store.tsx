import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  User, UserProfile, Lead, Pipeline, PipelineStage, Company,
  Deal, DealStatus, DealEvent, EventType, Task, TaskType, TaskStatus, Product, DealProduct, UserPermissions, Notification, PersonType
} from './types';

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
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addCompany: (company: Omit<Company, 'id' | 'criado_em'>, adminData?: { email: string, senha: string, nome: string }) => void;
  updateCompany: (company: Company) => void;
  deleteCompany: (id: string, reason: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'>) => { success: boolean; error?: string; lead?: Lead };
  updateLead: (lead: Lead) => void;
  deleteLead: (leadId: string, reason: string) => void;
  restoreLead: (leadId: string) => void;
  batchUpdateLeadResponsavel: (leadIds: string[], responsavelId: string) => void;
  importLeads: (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string }) => { imported: number; failed: { row: number; reason: string }[] };
  syncLeadsFromFluent: (config: { tags?: string[]; lists?: string[] }) => { imported: number; updated: number };
  updateLeadClassificacao: (leadId: string, classificacao: number) => void;
  addPipeline: (nome: string) => void;
  updatePipeline: (id: string, nome: string) => void;
  deletePipeline: (id: string, justification?: string) => void;
  addDeal: (dealData: Omit<Deal, 'id' | 'companyId' | 'criado_em' | 'atualizado_em'>) => { success: boolean; deal?: Deal; error?: string };
  moveDeal: (dealId: string, stageId: string) => void;
  updateDealStatus: (dealId: string, status: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage', value: number }) => void;
  updateDealResponsavel: (dealId: string, newResponsavelId: string) => void;
  addEvent: (dealId: string, type: EventType, description: string) => void;
  addDealProduct: (dealId: string, productId: string) => void;
  deleteDealProduct: (dealProductId: string) => void;
  addTask: (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  addUser: (user: Omit<User, 'id' | 'criado_em' | 'permissions' | 'acesso_confirmado'>) => void;
  deleteUser: (userId: string) => void;
  changeUserPassword: (userId: string, newPass: string) => void;
  resetPassword: (email: string, newPass: string) => { success: boolean; message: string };
  updateUser: (user: User) => void;
  updateUserPermissions: (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => void;
  addStage: (pipelineId: string, nome: string) => void;
  deleteStage: (id: string, justification?: string) => void;
  updateStage: (id: string, nome: string) => void;
  reorderStages: (newStages: PipelineStage[]) => void;
  addProduct: (product: Omit<Product, 'id' | 'companyId'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string, justification?: string) => void;
  approveNotification: (id: string) => void;
  rejectNotification: (id: string) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const superPermissions: UserPermissions = {
  leads: true, 
  negociacoes: true, 
  importacao: true, 
  relatorios: true, 
  produtos: true, 
  configuracoes: true, 
  branding: true,
  pipelines: true,
  tarefas: true
};

const TEST_COMPANY_ID_1 = 'comp_andre_teste';
const TEST_USER_EMAIL_1 = 'ANDREFELIPEGALVAO@GMAIL.COM';

const TEST_COMPANY_ID_2 = 'comp_ibac_teste';
const TEST_USER_EMAIL_2 = 'teste@ibacbrasil.com';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_companies') || '[]');
    if (!list.some((c: any) => c.id === TEST_COMPANY_ID_1)) {
      list.push({ id: TEST_COMPANY_ID_1, nome: 'André TESTE', documento: '096.175.29-41', logo_url: '', cor_primaria: '#0f172a', cor_secundaria: '#2563eb', cor_terciaria: '#0f172a', ativa: true, criado_em: new Date().toISOString() });
    }
    if (!list.some((c: any) => c.id === TEST_COMPANY_ID_2)) {
      list.push({ id: TEST_COMPANY_ID_2, nome: 'IbacBrasilTESTE', documento: '000.000.000-00', logo_url: '', cor_primaria: '#1e293b', cor_secundaria: '#10b981', cor_terciaria: '#0f172a', ativa: true, criado_em: new Date().toISOString() });
    }
    return list;
  });

  const [users, setUsers] = useState<User[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_users') || '[]');
    if (!list.some((u: any) => u.email === 'marketing@ibacbrasil.com')) {
      list.push({ id: 'prop_1', nome: 'Marketing IbacBrasil', email: 'marketing@ibacbrasil.com', senha: 'JornadaMKT26!', perfil: UserProfile.PROPRIETARIO, ativo: true, acesso_confirmado: true, permissions: superPermissions, criado_em: new Date().toISOString() });
    }
    if (!list.some((u: any) => u.email.toUpperCase() === TEST_USER_EMAIL_1)) {
      list.push({ id: 'gestor_andre', companyId: TEST_COMPANY_ID_1, nome: 'ANDRÉ GALVÃO', email: TEST_USER_EMAIL_1, senha: 'An@@2027', perfil: UserProfile.SUPER_ADMIN, ativo: true, acesso_confirmado: true, permissions: superPermissions, criado_em: new Date().toISOString() });
    }
    if (!list.some((u: any) => u.email.toLowerCase() === TEST_USER_EMAIL_2)) {
      list.push({ id: 'gestor_ibac_teste', companyId: TEST_COMPANY_ID_2, nome: 'IbacBrasil Teste', email: TEST_USER_EMAIL_2, senha: '123456789', perfil: UserProfile.SUPER_ADMIN, ativo: true, acesso_confirmado: true, permissions: superPermissions, criado_em: new Date().toISOString() });
    }
    return list;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => JSON.parse(localStorage.getItem('crm_current_user') || 'null'));
  
  const [pipelines, setPipelines] = useState<Pipeline[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_pipelines') || '[]');
    const now = new Date().toISOString();
    if (!list.some((p: any) => p.companyId === TEST_COMPANY_ID_1)) {
      list.push({ id: 'pipe_default_1', companyId: TEST_COMPANY_ID_1, nome: 'Funil de Vendas Principal', ativo: true, criado_em: now });
    }
    if (!list.some((p: any) => p.companyId === TEST_COMPANY_ID_2)) {
      list.push({ id: 'pipe_default_2', companyId: TEST_COMPANY_ID_2, nome: 'Funil Ibac Teste', ativo: true, criado_em: now });
    }
    return list;
  });

  const [stages, setStages] = useState<PipelineStage[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_stages') || '[]');
    const defaultStagesNames = ['Lead Novo', 'Em Contato', 'Solução Apresentada', 'Negociação', 'Decisão Final', 'Vendido | Perdido'];
    
    if (!list.some((s: any) => s.pipeline_id === 'pipe_default_1')) {
      defaultStagesNames.forEach((nome, index) => {
        list.push({ id: `stg_init_1_${index}`, pipeline_id: 'pipe_default_1', nome, ordem: index, ativo: true });
      });
    }
    if (!list.some((s: any) => s.pipeline_id === 'pipe_default_2')) {
      defaultStagesNames.forEach((nome, index) => {
        list.push({ id: `stg_init_2_${index}`, pipeline_id: 'pipe_default_2', nome, ordem: index, ativo: true });
      });
    }
    return list;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_products') || '[]');
    if (!list.some((p: any) => p.companyId === TEST_COMPANY_ID_1)) {
      list.push({ id: 'prod_default_1', companyId: TEST_COMPANY_ID_1, nome: 'PRIMEIRA CARTEIRA', valor_total: 50.00, parcelas: 1 });
    }
    if (!list.some((p: any) => p.companyId === TEST_COMPANY_ID_2)) {
      list.push({ id: 'prod_default_2', companyId: TEST_COMPANY_ID_2, nome: 'CURSO DE TESTE', valor_total: 100.00, parcelas: 1 });
    }
    return list;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_leads') || '[]');
    const hasTestData = list.some((l: any) => l.companyId === TEST_COMPANY_ID_2);
    
    if (!hasTestData) {
      const now = new Date().toISOString();
      const testLeads = [
        { id: 'lead_t1', nome: 'Raqueli', email: 'karpinskiraqueli@gmail.com', wa: '54996561146', tags: 'Baixou o Simulado Relâmpago, Em funil de isca' },
        { id: 'lead_t2', nome: 'Catarina Chaves', email: 'catarinadschaves@gmail.com', wa: '71994012468', tags: 'Baixou o E-book guia definitivo, Baixou o Simulado Relâmpago, Em funil de isca' },
        { id: 'lead_t3', nome: 'Izabelle', email: 'izabellevitoria041@gmail.com', wa: '79988177620', tags: 'Baixou o E-book guia definitivo' },
        { id: 'lead_t4', nome: 'Luisa da Costa Moreira', email: 'luisamooreira@outlook.com', wa: '51994018181', tags: 'Baixou o E-book guia definitivo' },
        { id: 'lead_t5', nome: 'Jean Luc Mendonca Ribeiro', email: 'jeancorico123@gmail.com', wa: '(66) 99204-6366', tags: 'Baixou o E-book guia definitivo, Comprou o curso completo' },
        { id: 'lead_t6', nome: 'Nilcelene Casimiro', email: 'nil_casi@hotmail.com', wa: '48991633572', tags: 'Baixou o E-book guia definitivo' },
        { id: 'lead_t7', nome: 'Kauan Victor Felizardo da Silva', email: 'kauanvictorsilva2006@gmail.com', wa: '(66) 98410-1475', tags: '' },
        { id: 'lead_t8', nome: 'Maria Eduarda Da Silva Vollkopf', email: 'vollkopfmadu@gmail.com', wa: '(67) 98411-5406', tags: '' },
        { id: 'lead_t9', nome: 'Lourani Ferreira', email: 'louraneferreiradorosariorosari@gmail.com', wa: '(33) 8448-3716', tags: '' },
        { id: 'lead_t10', nome: 'Mauricio Gomes de Oliveira', email: 'gomesoliveira06@gmail.com', wa: '61985938295', tags: '' },
        { id: 'lead_t11', nome: 'Giovanna', email: 'giovannardsdo@gmail.com', wa: '63984123565', tags: '' },
        { id: 'lead_t12', nome: 'sandra maria moscatelli', email: 'moscatelli.niki@gmail.com', wa: '94991017436', tags: 'Baixou o E-book guia definitivo, Em funil de isca' },
      ];

      testLeads.forEach(l => {
        list.push({
          id: l.id,
          companyId: TEST_COMPANY_ID_2,
          nome_completo: l.nome,
          email: l.email,
          whatsapp: l.wa,
          campanha: l.tags ? l.tags.split(',')[0] : 'Base de Teste',
          tipo_pessoa: PersonType.PF,
          classificacao: 3,
          criado_em: now,
          atualizado_em: now,
          deletado: false,
          responsavel_id: 'gestor_ibac_teste'
        });
      });
    }
    return list;
  });

  const [deals, setDeals] = useState<Deal[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_deals') || '[]');
    const hasTestData = list.some((d: any) => d.companyId === TEST_COMPANY_ID_2);
    
    if (!hasTestData) {
      const now = new Date().toISOString();
      for (let idx = 0; idx < 12; idx++) {
        list.push({
          id: `deal_test_${idx}`,
          companyId: TEST_COMPANY_ID_2,
          lead_id: `lead_t${idx+1}`,
          pipeline_id: 'pipe_default_2',
          stage_id: 'stg_init_2_0', 
          responsavel_id: 'gestor_ibac_teste',
          status: DealStatus.ABERTA,
          criado_em: now,
          atualizado_em: now
        });
      }
    }
    return list;
  });

  const [events, setEvents] = useState<DealEvent[]>(() => {
    let list = JSON.parse(localStorage.getItem('crm_events') || '[]');
    const hasTestData = list.some((e: any) => e.deal_id.startsWith('deal_test_'));
    
    if (!hasTestData) {
      const now = new Date().toISOString();
      for (let i = 0; i < 12; i++) {
        list.push({
          id: `event_test_${i}`,
          deal_id: `deal_test_${i}`,
          tipo_evento: EventType.CRIACAO,
          descricao: 'Lead importado automaticamente para o ambiente de testes IbacBrasil.',
          criado_em: now,
          autor_id: 'system'
        });
      }
    }
    return list;
  });

  const [tasks, setTasks] = useState<Task[]>(() => JSON.parse(localStorage.getItem('crm_tasks') || '[]'));
  const [dealProducts, setDealProducts] = useState<DealProduct[]>(() => JSON.parse(localStorage.getItem('crm_deal_products') || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(localStorage.getItem('crm_notifications') || '[]'));
  
  const [activePipelineId, setActivePipelineId] = useState<string | null>(() => {
    const saved = localStorage.getItem('crm_active_pipeline_id');
    if (saved) return saved;
    return currentUser?.companyId === TEST_COMPANY_ID_2 ? 'pipe_default_2' : 'pipe_default_1';
  });

  useEffect(() => {
    localStorage.setItem('crm_companies', JSON.stringify(companies));
    localStorage.setItem('crm_users', JSON.stringify(users));
    localStorage.setItem('crm_pipelines', JSON.stringify(pipelines));
    localStorage.setItem('crm_stages', JSON.stringify(stages));
    localStorage.setItem('crm_leads', JSON.stringify(leads));
    localStorage.setItem('crm_deals', JSON.stringify(deals));
    localStorage.setItem('crm_events', JSON.stringify(events));
    localStorage.setItem('crm_tasks', JSON.stringify(tasks));
    localStorage.setItem('crm_products', JSON.stringify(products));
    localStorage.setItem('crm_deal_products', JSON.stringify(dealProducts));
    localStorage.setItem('crm_notifications', JSON.stringify(notifications));
    localStorage.setItem('crm_current_user', JSON.stringify(currentUser));
    if (activePipelineId) localStorage.setItem('crm_active_pipeline_id', activePipelineId);
  }, [companies, users, pipelines, stages, leads, deals, events, tasks, products, dealProducts, notifications, currentUser, activePipelineId]);

  const currentCompany = useMemo(() => {
    if (!currentUser) return null;
    return companies.find(c => c.id === currentUser.companyId) || companies[0] || null;
  }, [companies, currentUser]);

  const login = (email: string, pass: string) => {
    const user = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim() && u.senha === pass && u.ativo);
    if (user) { 
      setCurrentUser(user);
      const companyPipe = pipelines.find(p => p.companyId === user.companyId && !p.deletado);
      if (companyPipe) setActivePipelineId(companyPipe.id);
      return true; 
    }
    return false;
  };
  const logout = () => setCurrentUser(null);

  const addCompany = (companyData: Omit<Company, 'id' | 'criado_em'>, adminData?: { email: string, senha: string, nome: string }) => {
    const newId = 'comp_' + Math.random().toString(36).substr(2, 9);
    const newCompany: Company = { ...companyData, id: newId, criado_em: new Date().toISOString(), ativa: true };
    setCompanies(prev => [...prev, newCompany]);
    
    if (adminData) {
      addUser({ 
        nome: adminData.nome, 
        email: adminData.email, 
        senha: adminData.senha, 
        perfil: UserProfile.SUPER_ADMIN, 
        ativo: true, 
        companyId: newId 
      });
    }
  };

  const updateCompany = (updated: Company) => {
    setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCompany = (id: string, reason: string) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, deletado: true, data_exclusao: new Date().toISOString(), motivo_exclusao: reason } : c));
  };

  const addEvent = (did: string, t: EventType, d: string) => {
    setEvents(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), deal_id: String(did), tipo_evento: t, descricao: d, criado_em: new Date().toISOString(), autor_id: currentUser?.id || 'system' }]);
  };

  const updateDealStatus = (id: string, s: DealStatus, reason?: string, discountInfo?: { type: 'fixed' | 'percentage', value: number }) => {
    const dealIdStr = String(id);
    const now = new Date().toISOString();

    setDeals(prev => prev.map(d => {
      if (String(d.id) === dealIdStr) {
        const pipeStages = stages.filter(stg => stg.pipeline_id === d.pipeline_id && !stg.deletado).sort((a,b) => a.ordem - b.ordem);
        const lastStage = pipeStages[pipeStages.length - 1];
        
        return { 
          ...d, 
          status: s, 
          stage_id: (s === DealStatus.GANHA || s === DealStatus.PERDIDA) && lastStage ? lastStage.id : d.stage_id,
          atualizado_em: now 
        };
      }
      return d;
    }));

    if (s === DealStatus.GANHA && discountInfo && discountInfo.value > 0) {
        setDealProducts(prev => {
            const dealProds = prev.filter(dp => String(dp.deal_id) === dealIdStr);
            const totalOriginal = dealProds.reduce((sum, item) => sum + Number(item.valor), 0);
            
            return prev.map(dp => {
                if (String(dp.deal_id) === dealIdStr) {
                    let newValue = Number(dp.valor);
                    if (discountInfo.type === 'percentage') {
                        newValue = newValue * (1 - (discountInfo.value / 100));
                    } else if (discountInfo.type === 'fixed') {
                        const proportion = totalOriginal > 0 ? dp.valor / totalOriginal : 0;
                        newValue = newValue - (discountInfo.value * proportion);
                    }
                    return { ...dp, valor: Math.max(0, newValue) };
                }
                return dp;
            });
        });
    }

    let desc = '';
    if (s === DealStatus.GANHA) {
        const discountText = discountInfo && discountInfo.value > 0 
            ? ` (Desconto: ${discountInfo.type === 'percentage' ? discountInfo.value + '%' : 'R$ ' + discountInfo.value.toLocaleString('pt-BR')})` 
            : '';
        desc = `GANHO!${discountText} Obs: ${reason || 'S/ observações'}`;
    } else if (s === DealStatus.PERDIDA) {
        desc = `PERDIDO. Motivo: ${reason}`;
    } else {
        desc = `Alterado para ${s}`;
    }
    
    addEvent(dealIdStr, EventType.STATUS, desc);
  };

  const deleteLead = (id: string, reason: string) => {
    if (currentUser?.perfil === UserProfile.PROPRIETARIO || currentUser?.perfil === UserProfile.SUPER_ADMIN) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, deletado: true, data_exclusao: new Date().toISOString(), motivo_exclusao: reason } : l));
    } else {
      const lead = leads.find(l => l.id === id);
      if (!lead) return;
      setLeads(prev => prev.map(l => l.id === id ? { ...l, exclusao_pendente: true } : l));
      setNotifications(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        companyId: currentUser?.companyId || TEST_COMPANY_ID_1,
        userId: currentUser?.id || '',
        userName: currentUser?.nome || '',
        type: 'LEAD',
        targetId: id,
        targetName: lead.nome_completo,
        justificativa: reason,
        criado_em: new Date().toISOString(),
        lida: false
      }]);
    }
  };

  const deletePipeline = (id: string, justification?: string) => {
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, deletado: true, data_exclusao: new Date().toISOString(), motivo_exclusao: justification } : p));
  };

  const deleteStage = (id: string, justification?: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, deletado: true, data_exclusao: new Date().toISOString(), motivo_exclusao: justification } : s));
  };

  const deleteProduct = (id: string, justification?: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, deletado: true, data_exclusao: new Date().toISOString(), motivo_exclusao: justification } : p));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addLead = (leadData: any) => {
    const leadId = Math.random().toString(36).substr(2, 9);
    const newLead: Lead = { ...leadData, id: leadId, companyId: currentUser?.companyId || TEST_COMPANY_ID_1, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), deletado: false };
    setLeads(prev => [...prev, newLead]);
    return { success: true, lead: newLead };
  };

  const updateLead = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? { ...updated, atualizado_em: new Date().toISOString() } : l));
  };

  const importLeads = (data: any[], allocation: { mode: 'specific' | 'distribute', userId?: string }) => {
    const cid = currentUser?.companyId || TEST_COMPANY_ID_1;
    let pipe = pipelines.find(p => p.companyId === cid && !p.deletado) || pipelines[0];
    const pipeStages = stages.filter(s => s.pipeline_id === pipe?.id && !s.deletado).sort((a,b) => a.ordem - b.ordem);
    const firstStage = pipeStages[0] || { id: 'default_stg' };
    const companyUsers = users.filter(u => u.companyId === cid && u.ativo);
    const availableProducts = products.filter(p => p.companyId === cid && !p.deletado);
    
    const newLeadsBatch: Lead[] = [];
    const newDealsBatch: Deal[] = [];
    const newEventsBatch: DealEvent[] = [];
    const newDealProductsBatch: DealProduct[] = [];
    const failedImports: { row: number; reason: string }[] = [];

    data.forEach((item, index) => {
      const existsInDB = leads.some(l => 
        (item.email && l.email.toLowerCase() === item.email.toLowerCase()) || 
        (item.whatsapp && l.whatsapp === item.whatsapp)
      );

      const existsInBatch = newLeadsBatch.some(l => 
        (item.email && l.email.toLowerCase() === item.email.toLowerCase()) || 
        (item.whatsapp && l.whatsapp === item.whatsapp)
      );

      if (existsInDB || existsInBatch) {
        failedImports.push({ row: index + 1, reason: 'Duplicado.' });
        return;
      }

      if (!item.nome_completo || (!item.email && !item.whatsapp)) {
        failedImports.push({ row: index + 1, reason: 'Dados incompletos.' });
        return;
      }

      const lid = Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      let respId = allocation.userId || currentUser?.id || 'system';
      if (allocation.mode === 'distribute' && companyUsers.length > 0) respId = companyUsers[index % companyUsers.length].id;
      
      newLeadsBatch.push({ 
        ...item, 
        id: lid, 
        companyId: cid, 
        responsavel_id: respId, 
        criado_em: now, 
        atualizado_em: now, 
        deletado: false, 
        classificacao: item.classificacao || 1 
      });

      if (pipe) {
        const did = Math.random().toString(36).substr(2, 9);
        newDealsBatch.push({ id: did, companyId: cid, lead_id: lid, pipeline_id: pipe.id, stage_id: firstStage.id, responsavel_id: respId, status: DealStatus.ABERTA, criado_em: now, atualizado_em: now });
        newEventsBatch.push({ id: Math.random().toString(36).substr(2, 9), deal_id: did, tipo_evento: EventType.CRIACAO, descricao: 'Importado.', criado_em: now, autor_id: currentUser?.id || 'system' });
        
        if (item.produto) {
            const matchedProduct = availableProducts.find(p => p.nome.toLowerCase().trim() === item.produto.toLowerCase().trim());
            if (matchedProduct) {
                newDealProductsBatch.push({
                    id: Math.random().toString(36).substr(2, 9),
                    deal_id: did,
                    product_id: matchedProduct.id,
                    valor: matchedProduct.valor_total,
                    parcelas: matchedProduct.parcelas
                });
            }
        }
      }
    });

    setLeads(prev => [...prev, ...newLeadsBatch]);
    setDeals(prev => [...prev, ...newDealsBatch]);
    setEvents(prev => [...prev, ...newEventsBatch]);
    setDealProducts(prev => [...prev, ...newDealProductsBatch]);

    return { imported: newLeadsBatch.length, failed: failedImports };
  };

  const addPipeline = (nome: string) => { 
    const cid = currentCompany?.id || currentUser?.companyId || TEST_COMPANY_ID_1;
    const newId = Math.random().toString(36).substr(2, 9); 
    setPipelines(prev => [...prev, { id: newId, companyId: cid, name: nome, nome, ativo: true, criado_em: new Date().toISOString() }]); 
    setActivePipelineId(newId); 
  };

  const addStage = (pipelineId: string, nome: string) => setStages(prev => [...prev, { id: `stg_${Math.random().toString(36).substr(2, 9)}`, pipeline_id: pipelineId, nome, ordem: prev.length, ativo: true }]);
  const updateStage = (id: string, nome: string) => setStages(prev => prev.map(s => s.id === id ? { ...s, nome } : s));
  const reorderStages = (newStages: PipelineStage[]) => setStages(prev => { const rest = prev.filter(s => !newStages.some(ns => ns.id === s.id)); return [...rest, ...newStages]; });

  const addProduct = (p: any) => setProducts(prev => [...prev, { ...p, id: Math.random().toString(36).substr(2, 9), companyId: currentUser?.companyId || TEST_COMPANY_ID_1 }]);
  const updateProduct = (updated: Product) => setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  
  const addUser = (userData: any) => { setUsers(prev => [...prev, { ...userData, id: Math.random().toString(36).substr(2, 9), companyId: userData.companyId || currentUser?.companyId || TEST_COMPANY_ID_1, acesso_confirmado: true, permissions: superPermissions, criado_em: new Date().toISOString() }]); };

  const approveNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    if (notification.type === 'LEAD') {
      setLeads(prev => prev.map(l => l.id === notification.targetId ? { ...l, deletado: true, exclusao_pendente: false, data_exclusao: new Date().toISOString(), motivo_exclusao: notification.justificativa } : l));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const rejectNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    if (notification.type === 'LEAD') {
      setLeads(prev => prev.map(l => l.id === notification.targetId ? { ...l, exclusao_pendente: false } : l));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addTask = (taskData: Omit<Task, 'id' | 'companyId' | 'status'>) => {
    const newTask: Task = { ...taskData, id: Math.random().toString(36).substr(2, 9), companyId: currentUser?.companyId || TEST_COMPANY_ID_1, status: TaskStatus.PENDENTE };
    setTasks(prev => [...prev, newTask]);
    addEvent(taskData.deal_id, EventType.TAREFA, `Tarefa: ${taskData.titulo}`);
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateLeadClassificacao = (id: string, classificacao: number) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, classificacao, atualizado_em: new Date().toISOString() } : l));
  };

  const addDealProduct = (dealId: string, productId: string) => {
    const product = products.find(p => String(p.id) === String(productId));
    if (!product) return;
    const newDp: DealProduct = { id: Math.random().toString(36).substr(2, 9), deal_id: String(dealId), product_id: String(productId), valor: product.valor_total, parcelas: product.parcelas };
    setDealProducts(prev => [...prev, newDp]);
    addEvent(String(dealId), EventType.ANOTACAO, `Produto: ${product.nome}`);
  };

  const deleteDealProduct = (id: string) => {
    setDealProducts(prev => prev.filter(item => item.id !== id));
  };

  const addDeal = (dealData: any) => {
    const dealId = Math.random().toString(36).substr(2, 9);
    const newDeal: Deal = { ...dealData, id: dealId, companyId: currentUser?.companyId || TEST_COMPANY_ID_1, criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() };
    setDeals(prev => [...prev, newDeal]);
    addEvent(dealId, EventType.CRIACAO, 'Iniciado.');
    return { success: true, deal: newDeal };
  };

  const moveDeal = (dealId: string, stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId, atualizado_em: new Date().toISOString() } : d));
    if (stage) addEvent(dealId, EventType.MUDANCA_ETAPA, `Para: ${stage.nome}`);
  };

  const updatePipeline = (id: string, nome: string) => {
    setPipelines(prev => prev.map(p => p.id === id ? { ...p, nome } : p));
  };

  const batchUpdateLeadResponsavel = (leadIds: string[], responsavelId: string) => {
    setLeads(prev => prev.map(l => leadIds.includes(l.id) ? { ...l, responsavel_id: responsavelId, atualizado_em: new Date().toISOString() } : l));
    setDeals(prev => prev.map(d => leadIds.includes(d.lead_id) && d.status === DealStatus.ABERTA ? { ...d, responsavel_id: responsavelId } : d));
  };

  const updateUserPermissions = (userId: string, permissions: UserPermissions, acesso_confirmado: boolean) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions, acesso_confirmado } : u));
  };

  const changeUserPassword = (userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, senha: newPass } : u));
  };

  return (
    <CRMContext.Provider value={{ 
      companies, users, leads, pipelines, stages, deals, events, tasks, products, dealProducts, notifications, currentUser, currentCompany, activePipelineId, setActivePipelineId,
      login, logout, addCompany, updateCompany, deleteCompany, addLead, updateLead, updateDealStatus, addEvent, deleteLead, deletePipeline, deleteStage, deleteProduct, deleteUser,
      addPipeline, updatePipeline, addStage, updateStage, reorderStages, addProduct, updateProduct, addUser, updateDealResponsavel: (did:string, rid:string)=>{},
      addDeal, moveDeal, addDealProduct, deleteDealProduct,
      importLeads, syncLeadsFromFluent: (c:any)=>({imported:0, updated:0}), restoreLead: (id:string)=>{}, batchUpdateLeadResponsavel, 
      updateLeadClassificacao, addTask, updateTaskStatus, deleteTask, updateUserPermissions, changeUserPassword,
      approveNotification, rejectNotification, resetPassword: (e:string, p:string)=>({success:true, message:''})
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