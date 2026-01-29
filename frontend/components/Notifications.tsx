
import React from 'react';
import { useCRM } from '../store';

const Notifications: React.FC = () => {
  const { notifications, approveNotification, rejectNotification, currentUser } = useCRM();

  const typeLabels: Record<string, string> = {
    LEAD: 'Lead',
    PIPELINE: 'Funil',
    STAGE: 'Etapa do Funil',
    PRODUCT: 'Produto'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-[40px] flex items-center gap-6">
        <span className="text-4xl">🛡️</span>
        <div>
          <h2 className="text-2xl font-black text-amber-900 tracking-tight">Centro de Governança</h2>
          <p className="text-amber-700/80 font-medium">Revise e aprove solicitações de exclusão enviadas pelo time.</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map(n => (
          <div key={n.id} className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-300 transition-all group">
            <div className="flex items-center gap-6 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                {n.type === 'LEAD' ? '👤' : n.type === 'PIPELINE' ? '🎯' : n.type === 'PRODUCT' ? '📦' : '🏗️'}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitado por {n.userName}</p>
                <h4 className="text-lg font-black text-slate-800 leading-tight">
                  Excluir {typeLabels[n.type]}: <span className="text-blue-600">{n.targetName}</span>
                </h4>
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 italic text-xs text-slate-600">
                  " {n.justificativa} "
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-2">🕒 {new Date(n.criado_em).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex gap-3 shrink-0">
              <button 
                onClick={() => approveNotification(n.id)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                ✓ Aprovar
              </button>
              <button 
                onClick={() => rejectNotification(n.id)}
                className="bg-slate-100 text-slate-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
              >
                ✕ Negar
              </button>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="bg-white p-20 rounded-[40px] border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
               <span className="text-4xl">🌈</span>
            </div>
            <h4 className="text-xl font-black text-slate-800">Tudo sob controle!</h4>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Não há solicitações de exclusão pendentes no momento para a sua operação.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
