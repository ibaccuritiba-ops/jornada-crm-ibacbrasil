
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCRM } from '../../../store';
import { UserProfile } from '../../../types';
import { Download, RotateCcw, Check } from 'lucide-react';

const ImportLeads: React.FC = () => {
    const { importLeads, stages, syncLeadsFromFluent, currentUser, users, companies } = useCRM();
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ imported: number; failed: any[] } | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados para Importação Automática
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('crm_last_fluent_sync'));

    // Novos estados para Alocação
    const [allocationMode, setAllocationMode] = useState<'specific' | 'distribute'>('specific');
    const [specificUserId, setSpecificUserId] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    const isProprietario = currentUser?.role === 'proprietario';

    // Empresas disponíveis (todas para proprietario, apenas a sua para outros)
    const availableCompanies = useMemo(() => {
        if (isProprietario) {
            return companies.filter(c => !c.deletado);
        }
        return companies.filter(c => c.id === currentUser?.companyId && !c.deletado);
    }, [companies, isProprietario, currentUser]);

    // Empresa efetiva (selecionada ou do usuário)
    const effectiveCompanyId = isProprietario ? selectedCompanyId : currentUser?.companyId;

    // Usuários da empresa selecionada
    const companyUsers = useMemo(() => {
        if (!effectiveCompanyId) return [];
        return users.filter(u => 
            u.companyId === effectiveCompanyId && 
            u.ativo && 
            (u.role === 'vendedor' || u.role === 'superadmin')
        );
    }, [users, effectiveCompanyId]);

    // Inicializar specificUserId quando a empresa mudar
    useEffect(() => {
        if (companyUsers.length > 0) {
            setSpecificUserId(companyUsers[0].id);
        } else {
            setSpecificUserId('');
        }
    }, [effectiveCompanyId, companyUsers]);

    const parseData = (text: string) => {
        if (!text.trim()) return [];
        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 1) return [];

        const firstLine = lines[0];
        let delimiter = ',';
        if (firstLine.includes('\t')) delimiter = '\t';
        else if (firstLine.includes(';')) delimiter = ';';

        const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim().replace(/"/g, ''));

        return lines.slice(1).map(line => {
            const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, i) => {
                if (header.includes('nome')) obj.nome_completo = values[i];
                if (header.includes('email') || header.includes('e-mail')) obj.email = values[i];
                if (header.includes('whatsapp') || header.includes('telefone') || header.includes('phone') || header.includes('celular')) obj.whatsapp = values[i];
                if (header.includes('campanha') || header.includes('tag') || header.includes('origem')) obj.campanha = values[i];
                if (header.includes('pessoa') || header.includes('tipo')) obj.tipo_pessoa = values[i];
            });
            return obj;
        });
    };

    const handleTextChange = (text: string) => {
        setRawText(text);
        const parsed = parseData(text);
        setPreview(parsed.slice(0, 5));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            handleTextChange(text);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!effectiveCompanyId && isProprietario) {
            alert('Selecione uma empresa para importar leads');
            return;
        }

        if (allocationMode === 'specific' && !specificUserId) {
            alert('Selecione um responsável para os leads');
            return;
        }

        setIsProcessing(true);
        const data = parseData(rawText);

        try {
            const report = await importLeads(data, {
                mode: allocationMode,
                userId: allocationMode === 'specific' ? specificUserId : undefined,
                companyId: effectiveCompanyId
            } as any);
            setResult(report);
            setRawText('');
            setPreview([]);
        } catch (error) {
            console.error('Erro na importação:', error);
            alert('Erro ao importar leads. Verifique o console.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSyncFluent = () => {
        setIsSyncing(true);
        setTimeout(() => {
            syncLeadsFromFluent({ tags: ['Interesse 2024'], lists: ['Principal'] });
            const now = new Date().toLocaleString('pt-BR');
            setLastSync(now);
            localStorage.setItem('crm_last_fluent_sync', now);
            setIsSyncing(false);
        }, 1500);
    };

    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'proprietario';

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-12 px-4 animate-in fade-in">

            {/* Manual Import Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <Download className="w-6 h-6 text-white bg-blue-600 rounded-xl p-2" />
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Importação por Planilha (CSV/TXT)</h3>
                        <p className="text-slate-500 text-sm font-medium">Insira seus dados para processamento em lote com verificação de duplicidade</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Área de Dados */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm space-y-4">
                            <textarea
                                className="w-full h-80 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white font-mono text-xs text-slate-900 placeholder:text-slate-400 transition-all resize-none"
                                placeholder="Cole aqui: Nome, Email, Whatsapp, Campanha..."
                                value={rawText}
                                onChange={(e) => handleTextChange(e.target.value)}
                            />
                            <div className="flex justify-between items-center px-2">
                                <input type="file" accept=".csv,.txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline cursor-pointer">Selecionar Arquivo Local</button>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Delimitadores aceitos: , ; tab</span>
                            </div>
                        </div>

                        {result && result.failed.length > 0 && (
                            <div className="p-6 bg-red-50 border border-red-100 rounded-[30px] animate-in slide-in-from-bottom-2">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3">Linhas Não Importadas ({result.failed.length}):</p>
                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                    {result.failed.map((fail, i) => (
                                        <p key={i} className="text-[11px] font-bold text-red-400">Linha {fail.row}: {fail.reason}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Painel de Configurações de Distribuição */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-white/10 space-y-8">
                            {/* Filtro de Empresa para Proprietarios */}
                            {isProprietario && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4">Selecionar Empresa</h4>
                                    <select
                                        className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-blue-500/30 cursor-pointer"
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    >
                                        <option value="">-- Selecione uma Empresa --</option>
                                        {availableCompanies.map(c => (
                                            <option key={c.id} value={c.id} className="bg-slate-900">{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Regra de Distribuição</h4>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setAllocationMode('specific')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${allocationMode === 'specific' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-4 ${allocationMode === 'specific' ? 'border-blue-500 bg-white' : 'border-white/20'}`}></div>
                                        <div className="flex-1">
                                            <p className="font-black text-[10px] uppercase tracking-widest">Consultor Único</p>
                                            <p className="text-[9px] text-slate-400 font-bold">Todos os leads para uma pessoa</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setAllocationMode('distribute')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${allocationMode === 'distribute' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-4 ${allocationMode === 'distribute' ? 'border-blue-500 bg-white' : 'border-white/20'}`}></div>
                                        <div className="flex-1">
                                            <p className="font-black text-[10px] uppercase tracking-widest">Distribuir Igualmente</p>
                                            <p className="text-[9px] text-slate-400 font-bold">Rodízio entre todos os usuários</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {allocationMode === 'specific' && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Selecionar Responsável</label>
                                    {companyUsers.length === 0 ? (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-300 text-[10px] font-bold text-center">
                                            Nenhum consultor disponível na empresa selecionada
                                        </div>
                                    ) : (
                                        <select
                                            className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-blue-500/30 cursor-pointer"
                                            value={specificUserId}
                                            onChange={(e) => setSpecificUserId(e.target.value)}
                                        >
                                            <option value="">-- Selecione um Responsável --</option>
                                            {companyUsers.map(u => (
                                                <option key={u.id} value={u.id} className="bg-slate-900">{u.nome}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    onClick={handleImport}
                                    disabled={isProcessing || !rawText.trim() || (isProprietario && !selectedCompanyId)}
                                    className="w-full btn-liquid-glass bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-30 cursor-pointer shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                                >
                                    {isProcessing ? 'Processando Dados...' : 'Iniciar Lote Agora'}
                                </button>
                                {result && (
                                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-black text-[10px] uppercase text-center animate-bounce flex items-center justify-center gap-2">
                                        <Check className="w-4 h-4" /> {result.imported} Importados com Sucesso
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Campos de Mapeamento:</p>
                            <div className="flex flex-wrap gap-2">
                                {['Nome', 'Email', 'Whatsapp', 'Campanha'].map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção de Distribuição Automática */}
            {isSuperAdmin && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Distribuição Automática (FluentCRM)</h3>
                            <p className="text-slate-500 text-sm font-medium">Sincronização em tempo real com o ecossistema <span className="text-indigo-600 font-bold">IbacBrasil</span></p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                            <div>
                                <p className="font-black text-slate-800 text-sm uppercase tracking-widest">Monitoramento de Campanhas Ativas</p>
                                <p className="text-xs text-slate-500 font-medium">Última checagem: {lastSync || 'Nunca sincronizado'}</p>
                            </div>
                            <button
                                onClick={handleSyncFluent}
                                disabled={isSyncing}
                                className="w-full sm:w-auto btn-liquid-glass bg-indigo-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                {isSyncing ? 'Conectando...' : 'Processar Sync Agora'}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default ImportLeads;

