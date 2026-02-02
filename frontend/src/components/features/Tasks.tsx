
import React, { useState, useMemo } from 'react';
import { useCRM } from '../../store';
import { TaskStatus, TaskType, DealStatus } from '../../types';

const Tasks: React.FC = () => {
    const { tasks, deals, leads, currentUser, updateTaskStatus, deleteTask } = useCRM();
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>(TaskStatus.PENDENTE);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const myTasks = useMemo(() => {
        return tasks.filter(t =>
            String(t.responsavel_id) === String(currentUser?.id) &&
            (filterStatus === 'ALL' || t.status === filterStatus)
        ).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    }, [tasks, currentUser, filterStatus]);

    const groupedTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdue: typeof myTasks = [];
        const forToday: typeof myTasks = [];
        const upcoming: typeof myTasks = [];

        myTasks.forEach(t => {
            const taskDay = new Date(t.data_hora);
            taskDay.setHours(0, 0, 0, 0);

            if (t.status === TaskStatus.CONCLUIDA) {
                upcoming.push(t);
            } else if (taskDay < today) {
                overdue.push(t);
            } else if (taskDay.getTime() === today.getTime()) {
                forToday.push(t);
            } else {
                upcoming.push(t);
            }
        });

        return { overdue, forToday, upcoming };
    }, [myTasks]);

    const renderTaskCard = (t: any) => {
        const deal = deals.find(d => String(d.id) === String(t.deal_id));
        const lead = leads.find(l => String(l.id) === String(deal?.lead_id));
        const isPast = new Date(t.data_hora) < new Date() && t.status === TaskStatus.PENDENTE;
        const isExpanded = expandedTaskId === t.id;

        return (
            <div key={t.id} className={`bg-white rounded-3xl border transition-all shadow-sm group hover:border-blue-300 overflow-hidden ${t.status === TaskStatus.CONCLUIDA ? 'opacity-60 bg-slate-50' : isPast ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}>
                <div className="p-6 flex items-center justify-between cursor-pointer" onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}>
                    <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${t.status === TaskStatus.CONCLUIDA ? 'bg-slate-200 text-slate-400' : isPast ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {t.tipo === TaskType.LIGACAO ? '📞' : t.tipo === TaskType.EMAIL ? '📧' : t.tipo === TaskType.WHATSAPP ? '💬' : '👤'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className={`text-lg font-black ${t.status === TaskStatus.CONCLUIDA ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.titulo}</h4>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">{t.tipo}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <p className={`text-[11px] font-black uppercase ${isPast && t.status === TaskStatus.PENDENTE ? 'text-red-600' : 'text-slate-400'}`}>
                                    🕒 {new Date(t.data_hora).toLocaleString('pt-BR')} {isPast && t.status === TaskStatus.PENDENTE && '• ATRASADO'}
                                </p>
                                {lead && <span className="text-[11px] font-bold text-slate-500">• 👤 {lead.nome_completo}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                </div>

                {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição do Compromisso</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">{t.titulo}</p>
                                </div>
                                {lead && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dados do Lead</p>
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                            <p className="text-xs font-bold text-slate-800">{lead.email}</p>
                                            <p className="text-xs font-black text-emerald-600 mt-1">{lead.whatsapp}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    {t.status === TaskStatus.PENDENTE && (
                                        <button
                                            onClick={() => updateTaskStatus(t.id, TaskStatus.CONCLUIDA)}
                                            className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer active:scale-95"
                                        >
                                            ✓ Marcar como Concluída
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteTask(t.id)}
                                        className="p-4 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl border border-slate-200 transition-all cursor-pointer"
                                    >
                                        🗑️ Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in pb-20">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <span className="text-2xl">📅</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Agenda Operacional</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Compromissos de {currentUser?.nome}</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    {[
                        { id: TaskStatus.PENDENTE, label: 'Pendentes' },
                        { id: TaskStatus.CONCLUIDA, label: 'Concluídas' },
                        { id: 'ALL', label: 'Tudo' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setFilterStatus(opt.id as any)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterStatus === opt.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-12">
                {filterStatus !== TaskStatus.CONCLUIDA && groupedTasks.overdue.length > 0 && (
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Pendências Atrasadas
                        </h3>
                        <div className="space-y-4">{groupedTasks.overdue.map(renderTaskCard)}</div>
                    </section>
                )}

                {(filterStatus === 'ALL' || filterStatus === TaskStatus.PENDENTE) && groupedTasks.forToday.length > 0 && (
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] ml-2">Agendado para Hoje</h3>
                        <div className="space-y-4">{groupedTasks.forToday.map(renderTaskCard)}</div>
                    </section>
                )}

                <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                        {filterStatus === TaskStatus.CONCLUIDA ? 'Histórico de Atividades' : 'Próximos Compromissos'}
                    </h3>
                    <div className="space-y-4">
                        {groupedTasks.upcoming.map(renderTaskCard)}
                        {myTasks.length === 0 && (
                            <div className="bg-white p-20 rounded-[40px] border border-slate-200 text-center space-y-4">
                                <span className="text-4xl block opacity-30">☕</span>
                                <h4 className="text-xl font-black text-slate-800">Tudo em dia por aqui!</h4>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto text-sm">Nenhum compromisso agendado.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Tasks;

