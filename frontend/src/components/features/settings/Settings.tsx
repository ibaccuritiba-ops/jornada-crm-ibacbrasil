import React, { useState } from 'react';
import { useCRM } from '../../../store';
import { User, Eye, EyeOff } from 'lucide-react';

const Settings: React.FC = () => {
    const {
        currentUser, changeUserPassword
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

    const userRoleDisplay = (currentUser?.role || 'Usuário').toUpperCase();

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-12 px-4 animate-in fade-in">

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
