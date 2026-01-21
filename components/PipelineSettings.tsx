
import React, { useState, useMemo } from 'react';
import { useCRM } from '../store';
import { UserProfile } from '../types';

const PipelineSettings: React.FC = () => {
  const { 
    currentUser, currentCompany, pipelines, activePipelineId, setActivePipelineId,
    stages, addStage, deleteStage, updateStage, reorderStages,
    addPipeline, updatePipeline, deletePipeline
  } = useCRM();

  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isAddingPipeline, setIsAddingPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
  const [editPipelineName, setEditPipelineName] = useState('');

  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.perfil === UserProfile.PROPRIETARIO || 
           currentUser.perfil === UserProfile.SUPER_ADMIN || 
           currentUser.permissions.pipelines === true;
  }, [currentUser]);

  const companyPipelines = useMemo(() => 
    pipelines.filter(p => !p.deletado && p.companyId === currentCompany?.id && p.ativo),
    [pipelines, currentCompany]
  );

  const selectedPipeline = useMemo(() => 
    pipelines.find(p => p.id === activePipelineId && !p.deletado),
    [pipelines, activePipelineId]
  );

  const filteredStages = useMemo(() => 
    stages
      .filter(s => !s.deletado && String(s.pipeline_id) === String(activePipelineId))
      .sort((a, b) => a.ordem - b.ordem),
    [stages, activePipelineId]
  );

  const handleConfirmAddPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!newPipelineName.trim()) return;
    addPipeline(newPipelineName.trim());
    setNewPipelineName('');
    setIsAddingPipeline(false);
  };

  const startEditingPipeline = (e: React.MouseEvent, id: string, currentName: string) => {
    e.stopPropagation();
    if (!canEdit) return;
    setEditingPipelineId(id);
    setEditPipelineName(currentName);
  };

  const handleUpdatePipelineName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPipelineId && editPipelineName.trim()) {
      updatePipeline(editingPipelineId, editPipelineName.trim());
      setEditingPipelineId(null);
    }
  };

  const handleConfirmAddStage = (e: React.FormEvent) => {
    e.preventDefault(); e.stopPropagation();
    let pipeId = activePipelineId;
    if (!pipeId && companyPipelines.length > 0) { pipeId = companyPipelines[0].id; setActivePipelineId(pipeId); }
    if (!canEdit) { alert('Você não tem permissão para editar o funil.'); return; }
    if (!pipeId) { alert('Nenhum funil ativo selecionado para adicionar etapa.'); return; }
    const trimmedName = newStageName.trim();
    if (trimmedName === '') { alert('Por favor, informe o nome da etapa.'); return; }
    addStage(pipeId, trimmedName);
    setNewStageName(''); setIsAddingStage(false);
  };

  const onDragStart = (index: number) => { if (!canEdit) return; setDraggedItemIndex(index); };
  const onDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (!canEdit || draggedItemIndex === null || draggedItemIndex === index) return; const items = [...filteredStages]; const draggedItem = items[draggedItemIndex]; items.splice(draggedItemIndex, 1); items.splice(index, 0, draggedItem); const reordered = items.map((item, idx) => ({ ...item, ordem: idx })); reorderStages(reordered); setDraggedItemIndex(index); };
  const onDragEnd = () => { setDraggedItemIndex(null); };

  const handleDeletePipelineRequest = (id: string, name: string) => {
    if (!canEdit) return;
    const reason = prompt(`Deseja excluir permanentemente o funil "${name}"? Informe o motivo:`);
    if (reason && reason.trim()) deletePipeline(id, reason.trim());
    else if (reason !== null) alert("Motivo obrigatório para exclusão.");
  };

  const handleDeleteStageRequest = (id: string, name: string) => {
    if (!canEdit) return;
    const reason = prompt(`Deseja excluir a etapa "${name}"? Informe o motivo:`);
    if (reason && reason.trim()) deleteStage(id, reason.trim());
    else if (reason !== null) alert("Motivo obrigatório para exclusão.");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in pb-20">
      <section className="space-y-6">
        <div className="flex justify-between items-end">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl"><span className="text-2xl">🔄</span></div>
              <div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Arquitetura de Funis</h2><p className="text-slate-500 text-sm font-medium">Gestão e personalização das esteiras de venda</p></div>
           </div>
           {canEdit && !isAddingPipeline && (<button onClick={() => setIsAddingPipeline(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer">+ Novo Funil</button>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {companyPipelines.map(p => {
             return (
              <div 
                key={p.id} 
                onClick={() => setActivePipelineId(p.id)}
                className={`p-8 rounded-[40px] border-2 transition-all text-left relative group ${activePipelineId === p.id ? 'border-blue-600 bg-blue-50/30 shadow-md cursor-pointer' : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'}`}
              >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estrutura de Vendas</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2 transition-opacity">
                        <button onClick={(e) => startEditingPipeline(e, p.id, p.nome)} className="text-slate-400 hover:text-blue-600 transition-colors p-1 bg-white rounded shadow-sm border border-slate-100" title="Renomear Funil">✏️</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePipelineRequest(p.id, p.nome); }} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white rounded shadow-sm border border-slate-100" title="Apagar Funil">🗑️</button>
                      </div>
                    )}
                  </div>
                  {editingPipelineId === p.id ? (
                    <form onSubmit={handleUpdatePipelineName} onClick={e => e.stopPropagation()} className="mb-2"><input autoFocus className="w-full bg-white border border-blue-400 rounded-lg p-2 font-black text-slate-800 outline-none shadow-inner" value={editPipelineName} onChange={e => setEditPipelineName(e.target.value)} onBlur={() => setEditingPipelineId(null)} /></form>
                  ) : (
                    <h4 className={`text-lg font-black ${activePipelineId === p.id ? 'text-blue-700' : 'text-slate-800'}`}>{p.nome}</h4>
                  )}
                  <div className="mt-4 flex items-center gap-1"><div className="flex gap-0.5">{stages.filter(s => !s.deletado && s.pipeline_id === p.id).slice(0, 5).map((_, i) => (<div key={i} className={`w-3 h-1 rounded ${activePipelineId === p.id ? 'bg-blue-300' : 'bg-slate-200'}`}></div>))}</div><span className="text-[10px] font-bold text-slate-400 ml-1.5">{stages.filter(s => !s.deletado && s.pipeline_id === p.id).length} Etapas Definidas</span></div>
              </div>
             );
           })}
           {isAddingPipeline && (
             <form onSubmit={handleConfirmAddPipeline} className="p-8 rounded-[40px] border-2 border-dashed border-blue-400 bg-blue-50/20 flex flex-col justify-center animate-in zoom-in duration-200"><input autoFocus className="bg-white p-4 rounded-xl border border-blue-200 font-bold mb-4 outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Ex: Novos Clientes..." value={newPipelineName} onChange={e => setNewPipelineName(e.target.value)} /><div className="flex gap-2"><button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest cursor-pointer active:scale-95 transition-transform">Confirmar Criação</button><button type="button" onClick={() => setIsAddingPipeline(false)} className="px-4 bg-white text-slate-500 border border-slate-200 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer">✕</button></div></form>
           )}
        </div>
      </section>

      {selectedPipeline && (
        <section className="space-y-6">
          <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl"><span className="text-2xl">🎯</span></div><div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Etapas de: {selectedPipeline.nome}</h2><p className="text-slate-500 text-sm font-medium">Configure a jornada do lead nesta esteira</p></div></div>
          {!canEdit && (<div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center gap-4"><span className="text-2xl">🔒</span><div className="text-amber-800 text-xs font-bold">Acesso Somente Leitura. Contate um administrador para alterar a jornada.</div></div>)}
          <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
            <div className="space-y-3">
              {filteredStages.length === 0 && !isAddingStage && (<div className="p-16 text-center border-2 border-dashed border-slate-100 rounded-[30px]"><p className="text-slate-400 font-medium text-sm italic">Este funil ainda não possui colunas na jornada.</p></div>)}
              {filteredStages.map((s, idx) => {
                return (
                  <div key={s.id} draggable={canEdit} onDragStart={() => onDragStart(idx)} onDragOver={(e) => onDragOver(e, idx)} onDragEnd={onDragEnd} className={`flex items-center gap-4 p-5 border border-slate-100 rounded-2xl bg-white transition-all ${canEdit ? 'hover:bg-slate-50 cursor-move group' : 'opacity-80'}`}>
                    <div className={`transition-colors ${canEdit ? 'text-slate-300 group-hover:text-slate-500' : 'text-slate-200'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg></div>
                    <span className="bg-slate-100 text-slate-400 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                    <div className="flex-1 flex items-center gap-3">
                      <input disabled={!canEdit} className={`flex-1 font-black text-slate-800 bg-white border border-transparent rounded-xl px-4 py-3 outline-none transition-all ${canEdit ? 'focus:border-blue-300 focus:bg-slate-50' : ''}`} defaultValue={s.nome} onBlur={(e) => canEdit && updateStage(s.id, e.target.value)} />
                    </div>
                    {canEdit && (<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button type="button" onClick={() => handleDeleteStageRequest(s.id, s.nome)} className="p-3 text-slate-400 hover:text-red-500 cursor-pointer transition-all">🗑️</button></div>)}
                  </div>
                );
              })}
              {isAddingStage && canEdit && (<form onSubmit={handleConfirmAddStage} className="p-6 border-2 border-blue-200 rounded-[30px] bg-blue-50/30 flex gap-4 animate-in slide-in-from-top-2"><input autoFocus required className="flex-1 bg-white p-4 rounded-xl border border-blue-200 font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10" placeholder="Nome da etapa (Ex: Proposta Enviada)..." value={newStageName} onChange={(e) => setNewStageName(e.target.value)} /><button type="submit" className="bg-blue-600 text-white px-8 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">Confirmar</button><button type="button" onClick={() => setIsAddingStage(false)} className="text-slate-400 font-black text-[10px] uppercase px-4 cursor-pointer hover:text-slate-600 transition-colors">✕</button></form>)}
              {canEdit && !isAddingStage && (<button type="button" onClick={() => setIsAddingStage(true)} className="w-full p-8 border-2 border-dashed border-slate-200 rounded-[30px] text-xs font-black text-slate-400 uppercase tracking-widest hover:border-emerald-400 hover:text-emerald-600 transition-all cursor-pointer mt-6 flex flex-col items-center justify-center gap-2 group"><span className="text-2xl group-hover:scale-125 transition-transform">➕</span>Inserir Etapa na Jornada</button>)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PipelineSettings;
