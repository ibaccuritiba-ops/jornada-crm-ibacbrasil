import React from 'react';

interface PeriodSelectorProps {
    period: string;
    setPeriod: (p: string) => void;
    startDate: string;
    setStartDate: (d: string) => void;
    endDate: string;
    setEndDate: (d: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
    period,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
}) => {
    const periods = [
        { id: 'today', label: 'Hoje' },
        { id: '7d', label: '7 Dias' },
        { id: '30d', label: '30 Dias' },
        { id: 'custom', label: 'Personalizado' },
        { id: 'all', label: 'Tudo' }
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl w-full md:w-auto self-start">
                {periods.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setPeriod(p.id)}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            period === p.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {period === 'custom' && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                    <div className="flex-1 w-full">
                        <label className="block text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Início</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-blue-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Fim</label>
                        <input
                            type="date"
                            className="w-full bg-white border border-blue-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
