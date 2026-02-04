
import React, { useState, useEffect } from 'react';
import { useCRM } from '../../../store';
import { UserProfile, UserPermissions, User } from '../../../types';
import { User as UserIcon, Target, Download, BarChart3, Box, Wrench, Palette, Settings, Calendar, Check, X, Search, Edit2, Save, Plus, Trash2 } from 'lucide-react';

// Mapeamento de nomes amigáveis para as permissões
const permissionLabels: Record<keyof UserPermissions, {label: string; icon: React.ReactNode}> = {
    leads: {label: 'Leads', icon: <UserIcon className="w-4 h-4" />},
    negociacoes: {label: 'Negócios', icon: <Target className="w-4 h-4" />},
    importacao: {label: 'Importação', icon: <Download className="w-4 h-4" />},
    relatorios: {label: 'Relatórios', icon: <BarChart3 className="w-4 h-4" />},
    produtos: {label: 'Produtos', icon: <Box className="w-4 h-4" />},
    pipelines: {label: 'Config. Funil', icon: <Wrench className="w-4 h-4" />},
    branding: {label: 'Branding', icon: <Palette className="w-4 h-4" />},
    configuracoes: {label: 'Config. Conta', icon: <Settings className="w-4 h-4" />},
    tarefas: {label: 'Agenda', icon: <Calendar className="w-4 h-4" />}
};

// Sub-componente para gerenciar a linha do usuário com estado local de rascunho
const UserRow: React.FC<{
    user: User;
    canEdit: boolean;
    isCurrent: boolean;
    isProprietario: boolean;
    companyName?: string;
    onUpdate: (userId: string, perms: UserPermissions, access: boolean) => void;
    onResetPass: (userId: string) => void;
    onDelete: (userId: string) => void;
}> = ({ user, canEdit, isCurrent, isProprietario, companyName, onUpdate, onResetPass, onDelete }) => {
    const [draftPerms, setDraftPerms] = useState<UserPermissions>(user.permissions);
    const [draftAccess, setDraftAccess] = useState<boolean>(user.acesso_confirmado);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Sincroniza se o usuário mudar externamente
    useEffect(() => {
        setDraftPerms(user.permissions);
        setDraftAccess(user.acesso_confirmado);
    }, [user]);

    // Verifica se houve mudanças reais
    useEffect(() => {
        const permsChanged = JSON.stringify(draftPerms) !== JSON.stringify(user.permissions);
        const accessChanged = draftAccess !== user.acesso_confirmado;
        setHasChanges(permsChanged || accessChanged);
    }, [draftPerms, draftAccess, user]);

    const handleTogglePerm = (key: keyof UserPermissions) => {
        if (!canEdit || !draftAccess) return;
        setDraftPerms(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleToggleAccess = () => {
        if (!canEdit || isCurrent) return;
        setDraftAccess(!draftAccess);
    };

    const handleSave = () => {
        setSaveStatus('saving');
        setTimeout(() => {
            onUpdate(user.id, draftPerms, draftAccess);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 500);
    };

    return (
        <tr className={`hover:bg-slate-50/50 transition-colors ${hasChanges ? 'bg-blue-50/30' : ''}`}>
            <td className="px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase border border-slate-200">
                        {user.nome[0]}
                    </div>
                    <div>
                        <p className="font-black text-slate-800 text-sm">{user.nome} {isCurrent && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full ml-1 uppercase">Você</span>}</p>
                        <p className="text-xs text-slate-500 font-medium mb-1">{user.email}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{user.role}</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">@{companyName || 'Sem empresa'}</span>
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-6 py-4">
                <button
                    disabled={!canEdit || isCurrent}
                    onClick={handleToggleAccess}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${draftAccess ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        } ${canEdit && !isCurrent ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
                >
                    {draftAccess ? 'Acesso Liberado' : 'Acesso Bloqueado'}
                </button>
            </td>

            <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                    {(Object.keys(draftPerms) as Array<keyof UserPermissions>).map((key) => (
                        <button
                            key={key}
                            disabled={!canEdit || !draftAccess}
                            onClick={() => handleTogglePerm(key)}
                            className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border-2 transition-all ${draftPerms[key]
                                    ? 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-200'
                                    : 'bg-white text-slate-300 border-slate-100'
                                } ${canEdit && draftAccess ? 'cursor-pointer hover:brightness-95' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <span className="flex items-center gap-2">
                                {permissionLabels[key]?.icon}
                                {permissionLabels[key]?.label || key}
                            </span>
                        </button>
                    ))}
                </div>
            </td>

            <td className="px-6 py-4 text-right">
                <div className="flex justify-end items-center gap-3">
                    {hasChanges && saveStatus === 'idle' && (
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg animate-bounce cursor-pointer"
                        >
                            Salvar Alterações
                        </button>
                    )}

                    {saveStatus === 'saving' && (
                        <span className="text-[10px] font-black text-blue-600 uppercase animate-pulse">Gravando...</span>
                    )}

                    {saveStatus === 'saved' && (
                        <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                            <Check className="w-4 h-4" /> Atualizado
                        </span>
                    )}

                    <div className="flex gap-1">
                        <button
                            onClick={() => onResetPass(user.id)}
                            className={`p-2.5 bg-white text-slate-400 rounded-xl border border-slate-200 shadow-sm transition-all ${canEdit ? 'hover:text-slate-900 hover:border-slate-400 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
                            disabled={!canEdit}
                            title="Alterar Senha Manualmente"
                        >
                            🔑
                        </button>
                        {canEdit && !isCurrent && (
                            <button
                                onClick={() => onDelete(user.id)}
                                className="p-2.5 bg-white text-slate-300 hover:text-red-500 rounded-xl border border-slate-200 cursor-pointer shadow-sm transition-all hover:border-red-200"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};

const UsersPermissions: React.FC = () => {
    const { users, companies, currentUser, addUser, deleteUser, changeUserPassword, updateUserPermissions } = useCRM();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', role: 'vendedor', empresa: '' });
    const [showPass, setShowPass] = useState(false);

    const isProprietario = currentUser?.role === 'proprietario';
    const isSuperadmin = currentUser?.role === 'superadmin';

    // Apenas proprietários podem criar usuários
    const isPlatformMaster = currentUser?.role === 'proprietario';

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
        if (isProprietario) {
            // Proprietário vê TODOS os usuários de todas as empresas
            return matchesSearch;
        }
        // Superadmin/outros veem apenas usuários da sua empresa, exceto proprietários
        return matchesSearch && u.companyId === currentUser?.companyId && u.role !== 'proprietario';
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        addUser({ ...newUser });
        setShowModal(false);
        setNewUser({ nome: '', email: '', senha: '', role: 'vendedor', empresa: '' });
        setShowPass(false);
    };

    const handleUpdate = (userId: string, perms: UserPermissions, access: boolean) => {
        updateUserPermissions(userId, perms, access);
    };

    const handleResetPassword = (userId: string) => {
        const newPass = prompt('Informe a nova senha manual (Mínimo 6 caracteres):');
        if (newPass && newPass.trim().length >= 6) {
            changeUserPassword(userId, newPass);
            alert('Senha do colaborador alterada!');
        } else if (newPass) {
            alert('Senha muito curta.');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto pb-20">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full">
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                        <input
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            placeholder="Buscar colaboradores por nome ou e-mail..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                {isProprietario && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full md:w-auto action-bg text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        + Novo Colaborador
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-6 py-4">Colaborador / Perfil</th>
                            <th className="px-6 py-4">Autorização de Acesso</th>
                            <th className="px-6 py-4">Acessos a Módulos</th>
                            <th className="px-6 py-4 text-right">Controle Global</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <UserRow
                                key={user.id}
                                user={user}
                                isCurrent={user.id === currentUser?.id}
                                isProprietario={isProprietario}
                                companyName={companies.find(c => c.id === user.companyId)?.nome}
                                canEdit={isProprietario}
                                onUpdate={handleUpdate}
                                onResetPass={handleResetPassword}
                                onDelete={(id) => { if (confirm('Remover este acesso permanentemente?')) deleteUser(id); }}
                            />
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-medium">Nenhum usuário localizado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in duration-200">
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Novo Colaborador</h4>
                            <button onClick={() => { setShowModal(false); setShowPass(false); }} className="text-slate-400 hover:text-slate-900 p-2 cursor-pointer"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nome Completo</label>
                                <input required className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none" value={newUser.nome} onChange={e => setNewUser({ ...newUser, nome: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">E-mail Corporativo</label>
                                <input required type="email" className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nível de Função</label>
                                <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 outline-none" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="superadmin">Superadmin</option>
                                    <option value="vendedor">Vendedor</option>
                                    {isPlatformMaster && <option value="proprietario">Proprietário</option>}
                                </select>
                            </div>
                            {isPlatformMaster && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Empresa {newUser.role !== 'proprietario' ? '*' : '(Opcional - Proprietário Global)'}</label>
                                    <select 
                                        required={newUser.role !== 'proprietario'}
                                        disabled={newUser.role === 'proprietario'}
                                        className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                                        value={newUser.empresa} 
                                        onChange={e => setNewUser({ ...newUser, empresa: e.target.value })}
                                    >
                                        <option value="">{newUser.role === 'proprietario' ? 'Nenhuma (Global)' : 'Selecione uma empresa...'}</option>
                                        {newUser.role !== 'proprietario' && companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Senha Inicial</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPass ? "text" : "password"}
                                        minLength={6}
                                        className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                                        value={newUser.senha}
                                        onChange={e => setNewUser({ ...newUser, senha: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                                        {showPass ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full action-bg text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:brightness-90 shadow-xl cursor-pointer">Criar Acesso</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPermissions;

