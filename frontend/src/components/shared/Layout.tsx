import React, { useMemo } from 'react';
import { useCRM } from '../../store';
import { UserProfile, TaskStatus } from '../../types';
import Logo from './Logo';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const { currentUser, currentCompany, logout, tasks, isLoading } = useCRM();

    // Ajuste: O Backend não tem tarefas integradas globalmente ainda, então protegemos com ?.
    const userTasksCount = tasks?.filter(t =>
        String(t.responsavel_id) === String(currentUser?.id) &&
        t.status === TaskStatus.PENDENTE
    ).length || 0;

    // Mapeamento de permissões baseado no array 'acessos' do Backend
    const checkPermission = (perm: string | undefined) => {
        if (!currentUser) return false;
        if (currentUser.role === 'proprietario' || currentUser.role === 'supervisor') return true; // Proprietário/Supervisor vê tudo
        if (!perm) return true; // Se não tem exigência, libera
        return currentUser.acessos?.includes(perm);
    };

    const menuItems = [
        { id: 'dashboard', label: 'Início', icon: '📊', roles: ['proprietario', 'supervisor', 'vendedor'], perm: 'relatorios' },
        { id: 'pipeline_settings', label: 'Configurar Funil', icon: '🛠️', roles: ['proprietario', 'supervisor'], perm: 'config.funil' }, // Ajustado para config.funil
        { id: 'kanban', label: 'Funil de Vendas', icon: '🎯', roles: ['proprietario', 'supervisor', 'vendedor'], perm: 'negocios' }, // Ajustado para negocios
        { id: 'companies', label: 'Empresas SaaS', icon: '🏢', roles: ['proprietario'] },
        { id: 'users_permissions', label: 'Usuários e Permissões', icon: '🔐', roles: ['proprietario', 'supervisor'], perm: 'config.conta' },
        { id: 'tasks', label: 'Minhas Tarefas', icon: '📅', roles: ['proprietario', 'supervisor', 'vendedor'], badge: userTasksCount, perm: 'agenda' }, // Ajustado para agenda
        { id: 'leads', label: 'Base de Leads', icon: '👤', roles: ['proprietario', 'supervisor', 'vendedor'], perm: 'leads' },
        { id: 'products', label: 'Produtos', icon: '📦', roles: ['proprietario', 'supervisor'], perm: 'produtos' },
        { id: 'branding', label: 'Identidade Visual', icon: '🎨', roles: ['proprietario', 'supervisor'], perm: 'branding' },
        { id: 'import', label: 'Importação', icon: '📥', roles: ['proprietario', 'supervisor'], perm: 'importacao' },
        { id: 'settings', label: 'Configurar Conta', icon: '⚙️', roles: ['proprietario', 'supervisor', 'vendedor'] },
    ];

    const themeVariables = useMemo(() => {
        // Ajuste: Nomes dos campos vindos do Banco de Dados (EmpresaModel)
        return {
            '--primary': currentCompany?.cor_principal || '#0f172a', // Antes: cor_primaria
            '--secondary': currentCompany?.cor_destaque || '#2563eb', // Antes: cor_secundaria
            '--tertiary': '#0f172a', // O banco não tem terciária, usando padrão
        };
    }, [currentCompany]);

    const logoUrl = currentCompany?.logo_url || null;

    const visibleMenuItems = useMemo(() => {
        return menuItems.filter(item => {
            if (!currentUser) return false;

            // Ajuste: Verifica se a role do usuário está na lista permitida
            const hasRole = item.roles.includes(currentUser.role);
            
            // Ajuste: Verifica permissão no array de acessos
            const hasPermission = checkPermission(item.perm);

            return hasRole && hasPermission;
        });
    }, [currentUser, menuItems]);

    // Proteção contra undefined no replace
    const userRoleDisplay = (currentUser?.role || '').replace('_', ' ');
    const userNameDisplay = currentUser?.nome || 'Usuário';

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

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
                            {userNameDisplay[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate text-white leading-tight">{userNameDisplay}</p>
                            <p className="text-[9px] text-white/50 truncate font-black uppercase tracking-widest mt-0.5">{userRoleDisplay}</p>
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
