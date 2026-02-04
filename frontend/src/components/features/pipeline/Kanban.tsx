import React, { useState, useMemo, useEffect } from 'react';
import { Lock, RotateCcw, Target, DollarSign, AlertCircle, Check, X, Trophy, Plus } from 'lucide-react';
import { useCRM } from '../../../store';
import { Deal, DealStatus, EventType, TaskType, TaskStatus } from '../../../types';

// Função auxiliar para extrair ID de forma segura
const getSafeId = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    return data.id || data._id || '';
};

const Stars: React.FC<{ rating: number; size?: 'sm' | 'md'; onSelect?: (r: number) => void }> = ({ rating, size = 'sm', onSelect }) => {
    const stars = [1, 2, 3, 4, 5];
    const sizeClasses = size === 'sm' ? 'text-[10px]' : 'text-lg';
    return (
        <div className="flex gap-0.5">
            {stars.map(s => (
                <button key={s} type="button" disabled={!onSelect} onClick={() => onSelect?.(s)} className={`${sizeClasses} ${s <= rating ? 'text-amber-400' : 'text-slate-200'} transition-colors ${onSelect ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}>★</button>
            ))}
        </div>
    );
};

const DealDetailModal: React.FC<{ dealId: string; onClose: () => void; onStatusChanged?: (newStatus: DealStatus) => void; }> = ({ dealId, onClose, onStatusChanged }) => {
    const {
        deals, leads, products, dealProducts, events, tasks, currentUser,
        updateDealStatus, addEvent, addDealProduct, deleteDealProduct,
        addTask, updateTaskStatus, deleteTask, updateLeadClassificacao
    } = useCRM();

    const [activeTab, setActiveTab] = useState<'tasks' | 'products'>('tasks');
    const [showLostReason, setShowLostReason] = useState(false);
    const [showWonReason, setShowWonReason] = useState(false);
    const [reasonText, setReasonText] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [newNote, setNewNote] = useState('');
    const [showCelebration, setShowCelebration] = useState(false);
    const [showLostFeedback, setShowLostFeedback] = useState(false);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ titulo: '', tipo: TaskType.LIGACAO, data_hora: new Date().toISOString().slice(0, 16) });

    const hasPermission = currentUser?.role === 'proprietario' || currentUser?.role === 'superadmin' || currentUser?.acessos?.includes('negocios');

    const deal = deals.find(d => String(d.id) === String(dealId));

    if (!deal) return null;

    const clientId = getSafeId((deal as any).cliente || deal.lead_id);
    const lead = leads.find(l => String(l.id) === String(clientId));

    // Proteção contra lead nulo
    const leadRating = (lead as any)?.rating || lead?.classificacao || 1;
    const leadName = lead?.nome_completo || (lead as any)?.nome || 'Lead Desconhecido';

    const currentDealProducts = dealProducts ? dealProducts.filter(dp => String(dp.deal_id) === String(dealId)) : [];
    const totalOriginal = currentDealProducts.reduce((acc, curr) => acc + Number(curr.valor), 0);

    const calculatedDiscount = useMemo(() => {
        if (discountType === 'percentage') return (totalOriginal * discountValue) / 100;
        return discountValue;
    }, [totalOriginal, discountType, discountValue]);

    const finalTotal = Math.max(0, totalOriginal - calculatedDiscount);

    const dealEvents = events.filter(e => String(e.deal_id) === String(dealId)).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
    const dealTasks = tasks.filter(t => String(t.deal_id) === String(dealId)).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

    const handleConfirmWon = (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPermission) return;
        if (!reasonText.trim()) return alert('Nota de venda obrigatória.');
        updateDealStatus(String(dealId), DealStatus.GANHA, reasonText, { type: discountType, value: discountValue });
        if (onStatusChanged) onStatusChanged(DealStatus.GANHA);
        setShowCelebration(true);
    };

    const handleConfirmLost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPermission) return;
        if (!reasonText.trim()) return alert('Motivo de perda obrigatório.');
        updateDealStatus(String(dealId), DealStatus.PERDIDA, reasonText);
        if (onStatusChanged) onStatusChanged(DealStatus.PERDIDA);
        setShowLostFeedback(true);
    };

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPermission) return;
        if (!newNote.trim()) return;
        addEvent(String(dealId), EventType.ANOTACAO, newNote.trim());
        setNewNote('');
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPermission) return;
        if (!newTask.titulo.trim()) return;
        await addTask({ deal_id: String(dealId), titulo: newTask.titulo, tipo: newTask.tipo, data_hora: newTask.data_hora });
        setNewTask({ titulo: '', tipo: TaskType.LIGACAO, data_hora: new Date().toISOString().slice(0, 16) });
        setShowTaskForm(false);
    };

    if (showCelebration) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[300] p-4">
                <div className="bg-white rounded-[50px] w-full max-w-xl p-12 text-center shadow-[0_0_100px_rgba(16,185,129,0.3)] border-4 border-emerald-500 animate-in zoom-in duration-300">
                <div className="text-8xl mb-8 animate-bounce"><Trophy className="w-24 h-24 text-yellow-500 mx-auto" /></div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">NEGÓCIO GANHO!</h2>
                    <button onClick={onClose} className="btn-liquid-glass bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all cursor-pointer">Voltar</button>
                </div>
            </div>
        );
    }

    if (showLostFeedback) {
        return (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[300] p-4">
                <div className="bg-white rounded-[50px] w-full max-w-xl p-12 text-center shadow-[0_0_100px_rgba(239,68,68,0.2)] border-4 border-red-500 animate-in zoom-in duration-300">
                    <div className="text-8xl mb-8 opacity-60">🚫</div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">NEGÓCIO PERDIDO</h2>
                    <button onClick={onClose} className="btn-liquid-glass bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all cursor-pointer">Voltar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg ${deal.status === DealStatus.GANHA ? 'bg-emerald-600' : deal.status === DealStatus.PERDIDA ? 'bg-red-600' : 'bg-blue-600'}`}>
                            {leadName[0]}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{leadName}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{deal.status}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    {!hasPermission && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-8">
                            <div className="bg-amber-100 text-amber-900 p-6 rounded-3xl border-2 border-amber-200 shadow-xl max-w-xs text-center"><span className="text-3xl mb-2 block">🔒</span><p className="font-black text-xs uppercase tracking-widest">Acesso Limitado</p></div>
                        </div>
                    )}

                    <div className="w-1/3 border-r border-slate-100 p-8 space-y-8 bg-slate-50/30 overflow-y-auto">
                        {!showLostReason && !showWonReason ? (
                            <>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Classificação</p><Stars rating={leadRating} onSelect={r => hasPermission && lead && updateLeadClassificacao(lead.id, r)} /></div>
                                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Valor</p><h4 className="text-3xl font-black text-slate-900">R$ {totalOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4></div>
                                {deal.status === DealStatus.ABERTA && hasPermission && (
                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <button onClick={() => setShowWonReason(true)} className="w-full btn-liquid-glass bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all text-xs uppercase cursor-pointer flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Marcar Venda</button>
                                        <button onClick={() => setShowLostReason(true)} className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase cursor-pointer flex items-center justify-center gap-2"><X className="w-4 h-4" /> Perder Negócio</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <form onSubmit={showWonReason ? handleConfirmWon : handleConfirmLost} className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">{showWonReason ? 'Fechar Venda' : 'Motivo Perda'}</h4>
                                {showWonReason && (
                                    <div className="bg-white p-4 rounded-2xl border space-y-4">
                                        <div className="flex gap-2"><button type="button" onClick={() => setDiscountType('percentage')} className={`flex-1 py-2 text-[10px] font-black rounded ${discountType === 'percentage' ? 'bg-slate-100' : ''}`}>% Percentual</button><button type="button" onClick={() => setDiscountType('fixed')} className={`flex-1 py-2 text-[10px] font-black rounded ${discountType === 'fixed' ? 'bg-slate-100' : ''}`}>$ Valor Fixo</button></div>
                                        <input type="number" className="w-full p-2 border rounded font-bold" value={discountValue} onChange={e => setDiscountValue(Number(e.target.value))} />
                                        <div className="text-xs font-black text-emerald-600 text-right">Final: R$ {finalTotal.toLocaleString('pt-BR')}</div>
                                    </div>
                                )}
                                <textarea required autoFocus className="w-full p-4 border rounded-2xl text-sm font-bold h-28" value={reasonText} onChange={e => setReasonText(e.target.value)} placeholder="Justificativa..." />
                                <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase cursor-pointer">Confirmar</button>
                                <button type="button" onClick={() => { setShowWonReason(false); setShowLostReason(false); }} className="w-full text-slate-400 font-bold text-[10px] uppercase mt-2">Cancelar</button>
                            </form>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="flex border-b border-slate-100 mb-8">
                            {['tasks', 'products'].map(t => (
                                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>{t}</button>
                            ))}
                        </div>
                        {/* Aba de histórico comentada - será implementada posteriormente */}
                        {/* {activeTab === 'history' && (
                            <div className="space-y-6">
                                {hasPermission && <form onSubmit={handleAddNote} className="flex gap-2"><input className="flex-1 p-3 border rounded-xl font-bold text-xs" placeholder="Nova observação..." value={newNote} onChange={e => setNewNote(e.target.value)} /><button type="submit" className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px]">Salvar</button></form>}
                                {dealEvents.map(e => (
                                    <div key={e.id} className="relative pl-4 border-l-2 border-slate-100"><p className="text-[10px] text-slate-400">{new Date(e.criado_em).toLocaleString()}</p><p className="text-sm font-bold">{e.descricao}</p></div>
                                ))}
                            </div>
                        )} */}
                        {activeTab === 'tasks' && (
                            <div className="space-y-4">
                                {hasPermission && !showTaskForm && <button onClick={() => setShowTaskForm(true)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase w-full">+ Nova Tarefa</button>}
                                {showTaskForm && <form onSubmit={handleAddTask} className="space-y-2 bg-slate-50 p-4 rounded-xl">
                                    <input required className="w-full p-2 rounded border font-bold text-xs" placeholder="Título" value={newTask.titulo} onChange={e => setNewTask({ ...newTask, titulo: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select
                                            className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-xs"
                                            value={newTask.tipo}
                                            onChange={e => setNewTask({ ...newTask, tipo: e.target.value as TaskType })}
                                        >
                                            <option value={TaskType.LIGACAO}>Ligar</option>
                                            <option value={TaskType.WHATSAPP}>WhatsApp</option>
                                            <option value={TaskType.EMAIL}>E-mail</option>
                                        </select>
                                        <input
                                            required
                                            type="datetime-local"
                                            className="w-full p-2 rounded border font-bold text-xs"
                                            value={newTask.data_hora}
                                            onChange={e => setNewTask({ ...newTask, data_hora: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 text-white py-2 rounded font-black text-xs"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTaskForm(false)}
                                            className="px-4 text-slate-400 font-black text-xs"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                    </form>
                                    }
                                {dealTasks.map(t => (
                                    <div
                                        key={t.id}
                                        className="flex justify-between items-center p-3 border rounded-xl"
                                    >
                                        <div className={t.status === TaskStatus.CONCLUIDA ? 'opacity-50 line-through' : ''}>
                                            <p className="font-bold text-sm">{t.titulo}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(t.data_hora).toLocaleString()}
                                            </p>
                                        </div>
                                        {hasPermission && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateTaskStatus(t.id, t.status === TaskStatus.CONCLUIDA ? TaskStatus.PENDENTE : TaskStatus.CONCLUIDA)}
                                                    className={`font-black flex items-center justify-center ${t.status === TaskStatus.CONCLUIDA ? 'text-slate-400' : 'text-emerald-600'}`}
                                                >
                                                    {t.status === TaskStatus.CONCLUIDA ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => deleteTask(t.id)}
                                                    className="text-red-600 font-black flex items-center justify-center"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'products' && (
                            <div className="space-y-4">
                                {deal.status === DealStatus.ABERTA && hasPermission && (
                                    <div className="flex gap-2">
                                        <select
                                            className="flex-1 p-3 border rounded-xl font-bold text-xs"
                                            value={selectedProductId}
                                            onChange={e => setSelectedProductId(e.target.value)}
                                        >
                                            <option value="">Selecionar Produto...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.nome}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                if (selectedProductId) {
                                                    addDealProduct(String(dealId), selectedProductId);
                                                    setSelectedProductId('');
                                                }
                                            }}
                                            className="bg-blue-600 text-white px-4 rounded-xl font-black text-[10px]"
                                        >
                                            ADD
                                        </button>
                                    </div>
                                )}
                                {currentDealProducts.map(dp => {
                                    const p = products.find(prod => String(prod.id) === String(dp.product_id));
                                    return (
                                        <div
                                            key={dp.id}
                                            className="flex justify-between p-4 border rounded-xl items-center"
                                        >
                                            <span className="font-bold text-sm">{p?.nome}</span>
                                            <div className="flex gap-4 items-center">
                                                <span className="font-black">
                                                    R$ {Number(dp.valor).toLocaleString('pt-BR')}
                                                </span>
                                                {deal.status === DealStatus.ABERTA && hasPermission && (
                                                    <button
                                                        onClick={() => deleteDealProduct(dp.id)}
                                                        className="text-red-400 font-black"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Kanban: React.FC = () => {
    const { stages, deals, leads, dealProducts, activePipelineId, setActivePipelineId, moveDeal, currentUser, pipelines, currentCompany, companies, loadPipelinesForCompany, loadStagesForPipeline, loadDealsForCompany } = useCRM();
    const [activeStatusTab, setActiveStatusTab] = useState<DealStatus>(DealStatus.ABERTA);
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(currentCompany?.id || '');

    const canInteract = currentUser?.role === 'proprietario' || currentUser?.role === 'superadmin' || currentUser?.acessos?.includes('negocios');
    const isProprietario = currentUser?.role === 'proprietario';

    const selectedCompanyObj = useMemo(() => {
        return companies.find(c => c.id === selectedCompanyId);
    }, [companies, selectedCompanyId]);

    // Carrega funis, etapas e negociações quando o proprietário muda de empresa
    useEffect(() => {
        if (isProprietario && selectedCompanyId) {
            loadPipelinesForCompany(selectedCompanyId);
            loadDealsForCompany(selectedCompanyId);
            setActivePipelineId(''); // Reseta o funil ativo para recarregar
        }
    }, [selectedCompanyId, isProprietario, loadPipelinesForCompany, loadDealsForCompany, setActivePipelineId]);

    // Carrega etapas quando o funil ativo muda
    useEffect(() => {
        if (activePipelineId) {
            loadStagesForPipeline(activePipelineId);
        }
    }, [activePipelineId, loadStagesForPipeline]);

    const availablePipelines = useMemo(() => {
        const companyToFilter = isProprietario ? selectedCompanyId : getSafeId(currentCompany?.id);
        return pipelines.filter(p => {
            const belongsToCompany = (getSafeId(p.companyId) || getSafeId(p.empresa)) === companyToFilter;
            return belongsToCompany;
        });
    }, [pipelines, currentCompany, selectedCompanyId, isProprietario]);

    useEffect(() => {
        if ((!activePipelineId || activePipelineId === '') && availablePipelines.length > 0) {
            setActivePipelineId(availablePipelines[0].id);
        }
    }, [activePipelineId, availablePipelines, setActivePipelineId]);

    const activeDeals = useMemo(() => deals.filter(d => {
        const clientId = getSafeId((d as any).cliente || d.lead_id);
        const lead = leads.find(l => String(l.id) === String(clientId));
        const matchesStatus = d.status === activeStatusTab;
        const dealPipelineId = getSafeId((d as any).funil || d.pipeline_id);
        const matchesPipeline = String(dealPipelineId) === String(activePipelineId);
        const leadRating = (lead as any)?.rating || lead?.classificacao || 1;
        const matchesRating = filterRating === 'all' || leadRating === filterRating;
        return matchesStatus && matchesPipeline && matchesRating;
    }), [deals, leads, activeStatusTab, activePipelineId, filterRating]);

    const sortedStages = useMemo(() => stages.filter(s => {
        const stagePipelineId = getSafeId((s as any).funil || s.pipeline_id);
        return String(stagePipelineId) === String(activePipelineId);
    }).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [stages, activePipelineId]);

    const getDealValue = (dealId: string) => {
        if (!dealProducts) return 0;
        return dealProducts.filter(dp => String(dp.deal_id) === String(dealId)).reduce((a, b) => a + Number(b.valor), 0);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const handleDragStart = (e: React.DragEvent, dealId: string) => {
        if (!canInteract) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('dealId', dealId);
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        if (!canInteract) return;
        const dealId = e.dataTransfer.getData('dealId');
        if (dealId && stageId) moveDeal(dealId, stageId);
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className={`p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        {isProprietario && (
                            <select
                                className="rounded-xl px-5 py-2.5 font-black text-xs uppercase cursor-pointer outline-none border"
                                style={{
                                    backgroundColor: selectedCompanyObj?.cor_destaque ? `${selectedCompanyObj.cor_destaque}20` : '#f0f0f0',
                                    borderColor: selectedCompanyObj?.cor_destaque || '#e5e7eb',
                                    color: selectedCompanyObj?.cor_destaque || '#6b7280'
                                }}
                                value={selectedCompanyId}
                                onChange={e => setSelectedCompanyId(e.target.value)}
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nome}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-2.5 font-black text-blue-700 text-xs uppercase cursor-pointer outline-none"
                            value={activePipelineId || ''}
                            onChange={e => setActivePipelineId(e.target.value)}
                        >
                            {availablePipelines.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nome}
                                </option>
                            ))}
                        </select>
                        <select
                            className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 font-black text-slate-500 text-xs uppercase cursor-pointer outline-none"
                            value={filterRating}
                            onChange={e => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">Todas as Estrelas</option>
                            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                            <option value="4">⭐⭐⭐⭐ (4)</option>
                            <option value="3">⭐⭐⭐ (3)</option>
                            <option value="2">⭐⭐ (2)</option>
                            <option value="1">⭐ (1)</option>
                        </select>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        {[DealStatus.ABERTA, DealStatus.GANHA, DealStatus.PERDIDA].map(s => (
                            <button
                                key={s}
                                onClick={() => setActiveStatusTab(s)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${activeStatusTab === s ? (s === DealStatus.GANHA ? 'bg-emerald-600 text-white shadow-lg' : s === DealStatus.PERDIDA ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400'}`}
                            >
                                {s === DealStatus.ABERTA ? (
                                    <><Target className="w-4 h-4" /> Negociações</>
                                ) : s === DealStatus.GANHA ? (
                                    <><DollarSign className="w-4 h-4" /> Vendidos</>
                                ) : (
                                    <><AlertCircle className="w-4 h-4" /> Perdidos</>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="font-black text-sm px-4 py-2 rounded-xl border bg-slate-50 border-slate-100 text-slate-800">
                    TOTAL R${' '}
                    {activeDeals
                        .reduce((acc, d) => acc + getDealValue(d.id), 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
            </div>

            <div className={`flex-1 flex gap-6 overflow-x-auto pb-6 custom-scrollbar transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                {sortedStages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-center">
                            Nenhum funil/etapa carregado.
                        </p>
                    </div>
                ) : (
                    sortedStages.map(stage => {
                        const stageDeals = activeDeals.filter(d => {
                            const dealEtapaId = getSafeId((d as any).etapa || d.stage_id);
                            return String(dealEtapaId) === String(stage.id);
                        });

                        return (
                            <div
                                key={stage.id}
                                onDragOver={(e) => canInteract && e.preventDefault()}
                                onDrop={(e) => handleDrop(e, stage.id)}
                                className="kanban-column flex flex-col h-full bg-slate-100/40 rounded-[30px] border border-slate-200/60 shadow-inner min-w-[300px]"
                            >
                                <div className="p-5 flex justify-between items-center bg-white/60 rounded-t-[30px] border-b border-black/5">
                                    <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-widest truncate">
                                        {stage.nome}
                                    </h3>
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-sm">
                                        {stageDeals.length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {stageDeals.map(deal => {
                                        const clientId = getSafeId((deal as any).cliente || deal.lead_id);
                                        const lead = leads.find(l => String(l.id) === String(clientId));
                                        const value = getDealValue(deal.id);
                                        const leadRating = (lead as any)?.rating || lead?.classificacao || 1;
                                        const leadName = lead?.nome_completo || (lead as any)?.nome || 'Sem Nome';
                                        const leadTag = (lead as any)?.tag || lead?.campanha || 'Geral';

                                        return (
                                            <div
                                                key={deal.id}
                                                draggable={canInteract}
                                                onDragStart={(e) => handleDragStart(e, deal.id)}
                                                onClick={() => setSelectedDealId(deal.id)}
                                                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all shadow-sm cursor-pointer group active:scale-95"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <Stars rating={leadRating} />
                                                </div>
                                                <p className="font-black text-slate-800 text-sm leading-tight mb-1">
                                                    {leadName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-tighter">
                                                    {leadTag}
                                                </p>
                                                <div className="p-3 rounded-xl border bg-slate-50 border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                                                        Ticket
                                                    </p>
                                                    <p className="font-black text-sm text-slate-900">
                                                        R${' '}
                                                        {value.toLocaleString('pt-BR', {
                                                            minimumFractionDigits: 2
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {selectedDealId && (
                <DealDetailModal
                    dealId={selectedDealId}
                    onClose={() => setSelectedDealId(null)}
                    onStatusChanged={s => setActiveStatusTab(s)}
                />
            )}
        </div>
    );
};
export default Kanban;

