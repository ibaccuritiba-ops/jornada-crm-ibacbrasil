import React, { useState } from 'react';
import { useCRM } from '../../../store';
import { User, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
    const {
        currentUser, currentCompany, companies, changeUserPassword
    } = useCRM();

    const [myPassData, setMyPassData] = useState({ current: '', new: '', confirm: '' });
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const handleSelfPasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (myPassData.new.length < 6) { alert('A nova senha deve ter no mínimo 6 caracteres.'); return; }
        if (myPassData.new !== myPassData.confirm) { alert('As senhas não coincidem.'); return; }

        changeUserPassword(currentUser.id, myPassData.new);
        alert('Sua senha foi alterada com sucesso!');
        setMyPassData({ current: '', new: '', confirm: '' });
    };

    const handleSelectCompany = (id: string) => {
        // CORREÇÃO: Usa 'role' (string) em vez de UserProfile (enum)
        if (currentUser?.role !== 'proprietario') return;
        localStorage.setItem('crm_selected_company_id', id);
        window.location.reload();
    };

    // CORREÇÃO: Tratamento seguro para exibir o cargo (evita o erro do .replace)
    const userRoleDisplay = (currentUser?.role || 'Usuário').toUpperCase();

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-12 px-4 animate-in fade-in">

            {/* CONTEXTO (Apenas Proprietário) */}
            {currentUser?.role === 'proprietario' && (
                <section className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-black text-white">Alternar Operação SaaS</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configurações globais de visualização</p>
                        </div>
                        <select
                            className="bg-white/10 border border-white/20 p-4 rounded-2xl font-black text-xs uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500 transition-all cursor-pointer text-white w-full md:w-auto min-w-[240px]"
                            value={currentCompany?.id || ''}
                            onChange={(e) => handleSelectCompany(e.target.value)}
                        >
                            {companies.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.nome}</option>)}
                        </select>
                    </div>
                </section>
            )}

            {/* MEU PERFIL */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <User className="w-6 h-6 text-slate-900" />
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Segurança da Conta</h3>
                        <p className="text-slate-500 text-sm font-medium">Dados de acesso de {currentUser?.nome}</p>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                    <form onSubmit={handleSelfPasswordChange} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail de Login</label>
                                <input disabled className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed" value={currentUser?.email} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nível Hierárquico</label>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-600 text-xs uppercase tracking-widest">
                                    {/* CORREÇÃO: Usa a variável segura criada acima */}
                                    {userRoleDisplay}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Alterar Senha de Acesso</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <input
                                        required
                                        type={showNewPass ? "text" : "password"}
                                        placeholder="Nova senha (mín. 6 dígitos)"
                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:border-blue-500 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                        value={myPassData.new}
                                        onChange={e => setMyPassData({ ...myPassData, new: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            required
                                            type={showConfirmPass ? "text" : "password"}
                                            placeholder="Confirme a nova senha"
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:border-blue-500 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                            value={myPassData.confirm}
                                            onChange={e => setMyPassData({ ...myPassData, confirm: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                                            {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button type="submit" className="bg-slate-900 text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl cursor-pointer">Atualizar</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default Settings;
