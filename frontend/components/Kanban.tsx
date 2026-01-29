
import React, { useState, useMemo } from 'react';
import { useCRM } from '../store';
import { Deal, Lead, DealStatus, EventType, TaskType, TaskStatus, User, Product, Task } from '../types';

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
  
  const [activeTab, setActiveTab] = useState<'history' | 'tasks' | 'products'>('history');
  const [showLostReason, setShowLostReason] = useState(false);
  const [showWonReason, setShowWonReason] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLostFeedback, setShowLostFeedback] = useState(false);

  // Estados de Desconto
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Verificação de Permissão - Bloqueia manipulação por usuários sem permissão específica
  const hasPermission = currentUser?.permissions.negociacoes || currentUser?.perfil === 'PROPRIETARIO' || currentUser?.perfil === 'SUPER_ADMIN';

  // Estados para nova tarefa
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    titulo: '',
    tipo: TaskType.LIGACAO,
    data_hora: new Date().toISOString().slice(0, 16)
  });

  const dealIdStr = String(dealId);
  const deal = deals.find(d => String(d.id) === dealIdStr);
  if (!deal) return null;

  const lead = leads.find(l => String(l.id) === String(deal.lead_id));
  const currentDealProducts = dealProducts.filter(dp => String(dp.deal_id) === dealIdStr);
  const totalOriginal = currentDealProducts.reduce((acc, curr) => acc + Number(curr.valor), 0);
  
  // Cálculo de Desconto Real-Time
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percentage') return (totalOriginal * discountValue) / 100;
    return discountValue;
  }, [totalOriginal, discountType, discountValue]);

  const finalTotal = Math.max(0, totalOriginal - calculatedDiscount);

  const dealEvents = events.filter(e => String(e.deal_id) === dealIdStr).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());
  const dealTasks = tasks.filter(t => String(t.deal_id) === dealIdStr).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  const handleConfirmWon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission) return;
    if (!reasonText.trim()) return alert('Nota de venda obrigatória.');
    
    updateDealStatus(dealIdStr, DealStatus.GANHA, reasonText, {
        type: discountType,
        value: discountValue
    });
    
    if (onStatusChanged) onStatusChanged(DealStatus.GANHA);
    setShowCelebration(true);
  };

  const handleConfirmLost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission) return;
    if (!reasonText.trim()) return alert('Motivo de perda obrigatório.');
    updateDealStatus(dealIdStr, DealStatus.PERDIDA, reasonText);
    if (onStatusChanged) onStatusChanged(DealStatus.PERDIDA);
    setShowLostFeedback(true);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission) return;
    if (!newNote.trim()) return;
    addEvent(dealIdStr, EventType.ANOTACAO, newNote.trim());
    setNewNote('');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission) return;
    if (!newTask.titulo.trim()) return;
    addTask({
      deal_id: dealIdStr,
      titulo: newTask.titulo,
      tipo: newTask.tipo,
      data_hora: newTask.data_hora,
      responsavel_id: currentUser?.id || 'system'
    });
    setNewTask({ titulo: '', tipo: TaskType.LIGACAO, data_hora: new Date().toISOString().slice(0, 16) });
    setShowTaskForm(false);
  };

  if (showCelebration) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[300] p-4">
        <div className="bg-white rounded-[50px] w-full max-w-xl p-12 text-center shadow-[0_0_100px_rgba(16,185,129,0.3)] border-4 border-emerald-500 animate-in zoom-in duration-300">
           <div className="text-8xl mb-8 animate-bounce">🏆</div>
           <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">PARABÉNS PELA VENDA! NEGÓCIO GANHO!</h2>
           <div className="flex justify-center gap-2 mb-10">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{animationDelay: `${i*100}ms`}}></div>)}
           </div>
           <button 
            onClick={onClose}
            className="btn-liquid-glass bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/40 active:scale-95 cursor-pointer"
           >
             Retornar ao Funil
           </button>
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
           <p className="text-slate-500 font-bold mb-10 uppercase tracking-widest text-xs">O lead foi arquivado e movido para a aba de perdidos.</p>
           <button 
            onClick={onClose}
            className="btn-liquid-glass bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-700 transition-all shadow-2xl shadow-red-500/40 active:scale-95 cursor-pointer"
           >
             Retornar ao Funil
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg ${deal.status === DealStatus.GANHA ? 'bg-emerald-600 shadow-emerald-500/20' : deal.status === DealStatus.PERDIDA ? 'bg-red-600 shadow-red-500/20' : 'bg-blue-600'}`}>
              {lead?.nome_completo[0]}
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{lead?.nome_completo}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status: {deal.status === DealStatus.GANHA ? 'VENDIDO' : deal.status === DealStatus.PERDIDA ? 'PERDIDO' : 'EM NEGOCIAÇÃO'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-800 transition-all cursor-pointer">✕</button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {!hasPermission && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-8">
               <div className="bg-amber-100 text-amber-900 p-6 rounded-3xl border-2 border-amber-200 shadow-xl max-w-xs text-center">
                  <span className="text-3xl mb-2 block">🔒</span>
                  <p className="font-black text-xs uppercase tracking-widest">Acesso Limitado</p>
                  <p className="text-[10px] font-bold mt-1">Você não possui permissões para alterar o estágio ou status desta negociação.</p>
               </div>
            </div>
          )}

          <div className="w-1/3 border-r border-slate-100 p-8 space-y-8 bg-slate-50/30 overflow-y-auto">
            {!showLostReason && !showWonReason ? (
              <>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Classificação</p>
                  <Stars rating={lead?.classificacao || 1} onSelect={r => hasPermission && lead && updateLeadClassificacao(lead.id, r)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Valor da Negociação</p>
                  <div className={`p-6 rounded-3xl text-white ${deal.status === DealStatus.GANHA ? 'bg-emerald-600 shadow-xl' : deal.status === DealStatus.PERDIDA ? 'bg-red-600 shadow-xl' : 'bg-slate-900'}`}>
                    <h4 className="text-3xl font-black">R$ {totalOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                  </div>
                </div>
                {deal.status === DealStatus.ABERTA && hasPermission && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <button onClick={() => setShowWonReason(true)} className="w-full btn-liquid-glass bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest cursor-pointer active:scale-95">✓ Marcar Venda</button>
                    <button onClick={() => setShowLostReason(true)} className="w-full bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer">✕ Perder Negócio</button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={showWonReason ? handleConfirmWon : handleConfirmLost} className="space-y-6">
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${showWonReason ? 'text-emerald-600' : 'text-red-600'}`}>
                  {showWonReason ? 'Fechar Venda com Sucesso' : 'Motivo do Descarte / Perda'}
                </h4>

                {showWonReason && (
                   <div className="bg-white p-5 rounded-3xl border-2 border-emerald-50 space-y-4 shadow-inner">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Aplicar Desconto</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                           <button type="button" onClick={() => setDiscountType('percentage')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${discountType === 'percentage' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>% Percentual</button>
                           <button type="button" onClick={() => setDiscountType('fixed')} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${discountType === 'fixed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>$ Valor Fixo</button>
                        </div>
                      </div>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">{discountType === 'fixed' ? 'R$' : '%'}</span>
                         <input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-emerald-300" 
                            value={discountValue} 
                            onChange={e => setDiscountValue(Number(e.target.value))}
                         />
                      </div>
                      <div className="pt-2 border-t border-slate-50">
                         <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                            <span>Subtotal Original</span>
                            <span>R$ {totalOriginal.toLocaleString('pt-BR')}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs font-black text-emerald-600">
                            <span>TOTAL FINAL</span>
                            <span>R$ {finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                      </div>
                   </div>
                )}

                <textarea required autoFocus className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold h-28" placeholder={showWonReason ? "Nota sobre o fechamento..." : "Por que o lead não comprou?"} value={reasonText} onChange={e => setReasonText(e.target.value)} />
                
                <button type="submit" className={`w-full btn-liquid-glass text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs cursor-pointer ${showWonReason ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-red-600 shadow-red-500/20'}`}>
                  Confirmar {showWonReason ? 'Venda (R$ ' + finalTotal.toLocaleString('pt-BR') + ')' : 'Perda'}
                </button>
                
                <button type="button" onClick={() => { setShowWonReason(false); setShowLostReason(false); setReasonText(''); setDiscountValue(0); }} className="w-full text-slate-400 font-bold text-[10px] uppercase">Voltar</button>
              </form>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex border-b border-slate-100 mb-8">
              {['history', 'tasks', 'products'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest cursor-pointer ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>{t === 'history' ? 'Histórico' : t === 'tasks' ? 'Tarefas' : 'Produtos'}</button>
              ))}
            </div>
            
            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {hasPermission && (
                  <form onSubmit={handleAddNote} className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registrar Observação</p>
                    <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-24" placeholder="Algum detalhe importante?" value={newNote} onChange={e => setNewNote(e.target.value)} />
                    <div className="flex justify-end"><button type="submit" disabled={!newNote.trim()} className="btn-liquid-glass bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg disabled:opacity-30 cursor-pointer">Salvar</button></div>
                  </form>
                )}
                <div className="space-y-6 border-l-2 border-slate-100 pl-6 ml-2">
                  {dealEvents.length === 0 ? <p className="text-slate-400 italic text-xs py-4 text-center">Sem histórico registrado.</p> : dealEvents.map(e => (
                    <div key={e.id} className="relative">
                      <div className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-white border-4 ${e.tipo_evento === EventType.STATUS ? 'border-red-500' : 'border-blue-500'}`}></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(e.criado_em).toLocaleString()}</p>
                      <p className="text-sm font-medium text-slate-700 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm mt-1">{e.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Compromissos</h4>
                   {!showTaskForm && hasPermission && <button onClick={() => setShowTaskForm(true)} className="btn-liquid-glass bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer">+ Agendar</button>}
                </div>

                {showTaskForm && hasPermission && (
                  <form onSubmit={handleAddTask} className="bg-blue-50 p-6 rounded-3xl border border-blue-200 space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-4">
                       <input required className="col-span-2 w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-xs" placeholder="Título da tarefa..." value={newTask.titulo} onChange={e => setNewTask({...newTask, titulo: e.target.value})} />
                       <select className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-xs" value={newTask.tipo} onChange={e => setNewTask({...newTask, tipo: e.target.value as TaskType})}>
                          <option value={TaskType.LIGACAO}>📞 Ligar</option>
                          <option value={TaskType.WHATSAPP}>💬 WhatsApp</option>
                          <option value={TaskType.EMAIL}>📧 E-mail</option>
                       </select>
                       <input required type="datetime-local" className="w-full p-3 bg-white border border-blue-200 rounded-xl font-bold text-xs" value={newTask.data_hora} onChange={e => setNewTask({...newTask, data_hora: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                       <button type="submit" className="flex-1 btn-liquid-glass bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-lg">Confirmar</button>
                       <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 text-slate-500 font-black text-[10px] uppercase cursor-pointer">Cancelar</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                   {dealTasks.length === 0 && !showTaskForm ? <p className="text-center py-10 opacity-30 text-xs font-bold uppercase">Nenhuma tarefa agendada.</p> : dealTasks.map(t => (
                       <div key={t.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${t.status === TaskStatus.CONCLUIDA ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm'}`}>
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">{t.tipo === TaskType.LIGACAO ? '📞' : t.tipo === TaskType.WHATSAPP ? '💬' : '📧'}</div>
                             <div>
                                <h5 className={`text-sm font-bold ${t.status === TaskStatus.CONCLUIDA ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.titulo}</h5>
                                <p className="text-[10px] font-black uppercase text-slate-400">{new Date(t.data_hora).toLocaleString('pt-BR')}</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             {t.status === TaskStatus.PENDENTE && hasPermission && <button onClick={() => updateTaskStatus(t.id, TaskStatus.CONCLUIDA)} className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all cursor-pointer">✓</button>}
                             {hasPermission && <button onClick={() => deleteTask(t.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-all cursor-pointer">✕</button>}
                          </div>
                       </div>
                   ))}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {deal.status === DealStatus.ABERTA && hasPermission && (
                  <div className="flex gap-3 mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <select className="flex-1 p-3 bg-white border border-blue-200 rounded-xl font-bold text-xs" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                      <option value="">Vincular Produto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.nome} - R$ {Number(p.valor_total).toLocaleString('pt-BR')}</option>)}
                    </select>
                    <button onClick={() => { if(selectedProductId) { addDealProduct(dealIdStr, selectedProductId); setSelectedProductId(''); } }} className="btn-liquid-glass bg-blue-600 text-white px-6 rounded-xl font-black text-[10px] uppercase cursor-pointer">Add</button>
                  </div>
                )}
                {currentDealProducts.map(dp => {
                  const p = products.find(prod => String(prod.id) === String(dp.product_id));
                  return (
                    <div key={dp.id} className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3"><span className="text-xl">📦</span><span className="font-bold text-sm text-slate-700">{p?.nome || 'Produto Indisponível'}</span></div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-900">R$ {Number(dp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {deal.status === DealStatus.ABERTA && hasPermission && <button onClick={() => deleteDealProduct(dp.id)} className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer">✕</button>}
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
  const { stages, deals, leads, dealProducts, users, activePipelineId, setActivePipelineId, moveDeal, currentUser, pipelines } = useCRM();
  const [activeStatusTab, setActiveStatusTab] = useState<DealStatus>(DealStatus.ABERTA);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Verificação de Permissão Global para Kanban
  const canInteract = currentUser?.permissions.negociacoes || currentUser?.perfil === 'PROPRIETARIO' || currentUser?.perfil === 'SUPER_ADMIN';

  const activeDeals = deals.filter(d => {
    const lead = leads.find(l => String(l.id) === String(d.lead_id));
    const matchesStatus = d.status === activeStatusTab;
    const matchesPipeline = String(d.pipeline_id) === String(activePipelineId);
    const matchesRating = filterRating === 'all' || lead?.classificacao === filterRating;
    return matchesStatus && matchesPipeline && matchesRating;
  });

  const sortedStages = stages.filter(s => String(s.pipeline_id) === String(activePipelineId) && !s.deletado).sort((a, b) => a.ordem - b.ordem);

  const getDealValue = (dealId: string) => dealProducts.filter(dp => String(dp.deal_id) === String(dealId)).reduce((a, b) => a + Number(b.valor), 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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
    if (dealId && stageId) {
      moveDeal(dealId, stageId);
    }
  };

  const themeClasses = {
    [DealStatus.ABERTA]: { accent: 'bg-blue-600', text: 'text-blue-600', ring: 'ring-blue-500/10', border: 'border-slate-200' },
    [DealStatus.GANHA]: { accent: 'bg-emerald-600', text: 'text-emerald-600', ring: 'ring-emerald-500/10', border: 'border-emerald-500' },
    [DealStatus.PERDIDA]: { accent: 'bg-red-600', text: 'text-red-600', ring: 'ring-red-500/10', border: 'border-red-500' }
  }[activeStatusTab];

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-6 bg-white p-6 rounded-[30px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button 
                onClick={handleRefresh}
                className={`p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
                title="Sincronizar Dados"
            >
                🔄
            </button>
            <select className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-2.5 font-black text-blue-700 text-xs uppercase cursor-pointer outline-none" value={activePipelineId || ''} onChange={e => setActivePipelineId(e.target.value)}>
              {pipelines.filter(p => p.companyId === currentUser?.companyId && !p.deletado).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-2.5 font-black text-slate-500 text-xs uppercase cursor-pointer outline-none" value={filterRating} onChange={e => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
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
              <button key={s} onClick={() => setActiveStatusTab(s)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${activeStatusTab === s ? (s === DealStatus.GANHA ? 'bg-emerald-600 text-white shadow-lg' : s === DealStatus.PERDIDA ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400'}`}>
                {s === DealStatus.ABERTA ? '🎯 Negociações' : s === DealStatus.GANHA ? '💰 Vendidos' : '🚫 Perdidos'}
              </button>
            ))}
          </div>
        </div>
        <div className={`font-black text-sm px-4 py-2 rounded-xl border ${activeStatusTab === DealStatus.GANHA ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : activeStatusTab === DealStatus.PERDIDA ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
          TOTAL R$ {activeDeals.reduce((acc, d) => acc + getDealValue(d.id), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {!canInteract && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center gap-3 mx-2">
           <span className="text-xl">⚠️</span>
           <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Atenção: Modo de Visualização. Seu perfil não tem permissão para movimentar cards ou finalizar vendas.</p>
        </div>
      )}

      <div className={`flex-1 flex gap-6 overflow-x-auto pb-6 custom-scrollbar transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
        {sortedStages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-bold uppercase tracking-widest text-center">Aguardando configuração de etapas.<br/><span className="text-[10px]">Acesse "Configurar Funil" para iniciar.</span></p>
          </div>
        ) : sortedStages.map(stage => {
          const stageDeals = activeDeals.filter(d => String(d.stage_id) === String(stage.id));
          return (
            <div 
              key={stage.id} 
              onDragOver={(e) => canInteract && e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="kanban-column flex flex-col h-full bg-slate-100/40 rounded-[30px] border border-slate-200/60 shadow-inner"
            >
              <div className="p-5 flex justify-between items-center bg-white/60 rounded-t-[30px] border-b border-black/5">
                <h3 className="font-black text-slate-700 text-[10px] uppercase tracking-widest truncate">{stage.nome}</h3>
                <span className={`${themeClasses.accent} text-white px-3 py-1 rounded-xl text-[10px] font-black shadow-sm`}>{stageDeals.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {stageDeals.map(deal => {
                  const lead = leads.find(l => String(l.id) === String(deal.lead_id));
                  const value = getDealValue(deal.id);
                  const isWon = deal.status === DealStatus.GANHA;
                  const isLost = deal.status === DealStatus.PERDIDA;
                  return (
                    <div 
                      key={deal.id} 
                      draggable={canInteract} 
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onClick={() => setSelectedDealId(deal.id)} 
                      className={`bg-white p-5 rounded-2xl border transition-all shadow-sm group ${canInteract ? 'cursor-grab active:cursor-grabbing active:scale-95' : 'cursor-pointer'} ${isWon ? 'border-emerald-500 ring-4 ring-emerald-500/10' : isLost ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 hover:border-blue-400'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                         <Stars rating={lead?.classificacao || 1} />
                         {isWon && <span className="bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-lg">Vendido</span>}
                         {isLost && <span className="bg-red-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg shadow-lg">Perdido</span>}
                      </div>
                      <p className="font-black text-slate-800 text-sm leading-tight mb-1">{lead?.nome_completo}</p>
                      <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-tighter">{lead?.campanha || 'Campanha Direta'}</p>
                      <div className={`p-3 rounded-xl border ${isWon ? 'bg-emerald-50 border-emerald-100' : isLost ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ticket Operacional</p>
                        <p className={`font-black text-sm ${isWon ? 'text-emerald-700' : isLost ? 'text-red-700' : 'text-slate-900'}`}>R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {selectedDealId && <DealDetailModal dealId={selectedDealId} onClose={() => setSelectedDealId(null)} onStatusChanged={s => setActiveStatusTab(s)} />}
    </div>
  );
};
export default Kanban;
