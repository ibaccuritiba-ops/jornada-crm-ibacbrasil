
import React, { useMemo } from 'react';
import { useCRM } from '../store';
import { UserProfile, TaskStatus } from '../types';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, currentCompany, logout, tasks, notifications } = useCRM();

  const userTasksCount = tasks.filter(t => 
    String(t.responsavel_id) === String(currentUser?.id) && 
    t.status === TaskStatus.PENDENTE
  ).length;

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: '📊', roles: [UserProfile.PROPRIETARIO, UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'relatorios' },
    { id: 'pipeline_settings', label: 'Configurar Funil', icon: '🛠️', roles: [UserProfile.PROPRIETARIO, UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'pipelines' },
    { id: 'kanban', label: 'Funil de Vendas', icon: '🎯', roles: [UserProfile.PROPRIETARIO, UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'negociacoes' },
    { id: 'companies', label: 'Empresas SaaS', icon: '🏢', roles: [UserProfile.PROPRIETARIO] },
    { id: 'users_permissions', label: 'Usuários e Permissões', icon: '🔐', roles: [UserProfile.PROPRIETARIO, UserProfile.SUPER_ADMIN, UserProfile.ADMIN] },
    { id: 'tasks', label: 'Minhas Tarefas', icon: '📅', roles: [UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], badge: userTasksCount, perm: 'tarefas' },
    { id: 'leads', label: 'Base de Leads', icon: '👤', roles: [UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'leads' },
    { id: 'trash', label: 'Lixeira', icon: '🗑️', roles: [UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'leads' },
    { id: 'products', label: 'Produtos', icon: '📦', roles: [UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'produtos' },
    { id: 'branding', label: 'Identidade Visual', icon: '🎨', roles: [UserProfile.PROPRIETARIO, UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'branding' },
    { id: 'import', label: 'Importação', icon: '📥', roles: [UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER], perm: 'importacao' },
    { id: 'settings', label: 'Configurar Conta', icon: '⚙️', roles: [UserProfile.PROPRIETARIO, UserProfile.SUPER_ADMIN, UserProfile.ADMIN, UserProfile.FINAL_USER] },
  ];

  const themeVariables = useMemo(() => {
    return {
      '--primary': currentCompany?.cor_primaria || '#0f172a',
      '--secondary': currentCompany?.cor_secundaria || '#2563eb',
      '--tertiary': currentCompany?.cor_terciaria || '#0f172a',
    };
  }, [currentCompany]);

  const logoUrl = currentCompany?.logo_url || null;

  const visibleMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!currentUser) return false;
      
      const hasRole = item.roles.includes(currentUser.perfil);
      const isConfirmed = currentUser.acesso_confirmado || currentUser.perfil === UserProfile.PROPRIETARIO;
      
      if (item.id === 'settings') return hasRole;

      // Se o item tem uma permissão específica (perm), verificamos se o usuário a possui.
      // Proprietários ignoram as travas de permissão de módulo.
      // Se for Tarefas, aceita permissão 'tarefas' OU 'negociacoes' para facilitar o fluxo.
      const hasPermission = currentUser.perfil === UserProfile.PROPRIETARIO || (
        isConfirmed && (item.perm ? ((currentUser.permissions as any)?.[item.perm] || (item.perm === 'tarefas' && currentUser.permissions.negociacoes)) : true)
      );

      return hasRole && hasPermission;
    });
  }, [currentUser, menuItems]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden theme-container" style={themeVariables as any}>
      <style>{`
        .theme-container { color: var(--tertiary) !important; }
        .sidebar-bg { background-color: var(--primary) !important; }
        .action-bg { background-color: var(--secondary) !important; }
        .action-border { border-color: var(--secondary) !important; }
        .action-text { color: var(--secondary) !important; }
        .main-text { color: var(--tertiary) !important; }
        
        button.action-btn { 
            background-color: var(--secondary) !important; 
            color: white !important;
            box-shadow: 0 4px 15px -5px var(--secondary);
        }
        
        button.liquid-glass-action {
            background: linear-gradient(135deg, var(--secondary), color-mix(in srgb, var(--secondary), white 20%)) !important;
        }

        input:focus, select:focus, textarea:focus { 
            border-color: var(--secondary) !important; 
            box-shadow: 0 0 0 4px color-mix(in srgb, var(--secondary) 10%, transparent) !important; 
        }
      `}</style>

      <aside className="w-64 sidebar-bg text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-white/10 flex items-center justify-center min-h-[100px]">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-16 object-contain" /> : <Logo variant="light" size="sm" />}
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {visibleMenuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative group ${isActive ? 'bg-white/10 text-white shadow-xl' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-bold text-[11px] flex-1 text-left uppercase tracking-wide">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg absolute right-2">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-black border border-white/20 uppercase">
              {currentUser?.nome[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate text-white leading-tight">{currentUser?.nome}</p>
              <p className="text-[9px] text-white/50 truncate font-black uppercase tracking-widest mt-0.5">{currentUser?.perfil.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-center px-4 py-2 text-[10px] font-black uppercase text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">Encerrar Sessão</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-100">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4">
             <div className="w-2.5 h-6 rounded-full shadow-sm action-bg"></div>
             <h2 className="text-lg font-black main-text uppercase tracking-tighter">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ambiente:</span>
            <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm action-border action-text">{currentCompany?.nome || 'Gestão Geral'}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
