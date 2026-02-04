
import React, { useState, useMemo, useEffect } from 'react';
import { useCRM } from '../../store';
import { UserProfile, DealStatus } from '../../types';
import { exportToExcel } from '../../App';
import { Download } from 'lucide-react';

const Reports: React.FC = () => {
    const { leads, deals, dealProducts, products, currentUser, companies, currentCompany } = useCRM();
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom' | 'all'>('month');
    const [filterProductId, setFilterProductId] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    const isProprietario = currentUser?.role === 'proprietario';

    // NÃO inicializa selectedCompanyId - deixa vazio (padrão é "Todas as Empresas")

    // Reset filtro de produto quando empresa muda
    useEffect(() => {
        setFilterProductId('all');
    }, [selectedCompanyId]);

    const filterByPeriod = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();

        if (period === 'all') return true;
        if (period === 'today') return date.toDateString() === now.toDateString();
        if (period === 'week') {
            const diff = now.getTime() - date.getTime();
            return diff / (1000 * 3600 * 24) <= 7;
        }
        if (period === 'month') {
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
        if (period === 'custom') {
            if (!startDate || !endDate) return true;
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        }
        return true;
    };

    const stats = useMemo(() => {
        const cid = selectedCompanyId;
        const pid = filterProductId;

        // Filtro base por período e empresa
        const fLeads = leads.filter(l => !l.deletado && filterByPeriod(l.criado_em) && (cid === '' || l.companyId === cid));
        let fDeals = deals.filter(d => filterByPeriod(d.criado_em) && (cid === '' || d.companyId === cid));

        // Aplica filtro de produto se selecionado
        if (pid !== 'all') {
            const dealsWithProduct = dealProducts
                .filter(dp => String(dp.product_id) === pid)
                .map(dp => String(dp.deal_id));
            fDeals = fDeals.filter(d => dealsWithProduct.includes(String(d.id)));
        }

        let filteredWonDeals = fDeals.filter(d => d.status === DealStatus.GANHA);
        let filteredLostDeals = fDeals.filter(d => d.status === DealStatus.PERDIDA);

        const wonIds = new Set(filteredWonDeals.map(d => String(d.id)));
        const lostIds = new Set(filteredLostDeals.map(d => String(d.id)));

        const totalRevenue = dealProducts
            .filter(dp => wonIds.has(String(dp.deal_id)) && (pid === 'all' || String(dp.product_id) === pid))
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

        const totalLostRevenue = dealProducts
            .filter(dp => lostIds.has(String(dp.deal_id)) && (pid === 'all' || String(dp.product_id) === pid))
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

        const conversion = fDeals.length > 0 ? (filteredWonDeals.length / fDeals.length) * 100 : 0;

        return {
            leadsCount: fLeads.length,
            dealsCount: fDeals.length,
            wonCount: filteredWonDeals.length,
            lostCount: filteredLostDeals.length,
            revenue: totalRevenue,
            lostRevenue: totalLostRevenue,
            conversion,
            wonDeals: filteredWonDeals
        };
    }, [leads, deals, dealProducts, products, period, selectedCompanyId, filterProductId, startDate, endDate]);

    const handleExportReport = async () => {
        const dataToExport = stats.wonDeals.map(d => {
            const lead = leads.find(l => l.id === d.lead_id);
            const dps = dealProducts.filter(dp => String(dp.deal_id) === String(d.id));
            const value = dps.reduce((a, b) => a + Number(b.valor), 0);
            const items = dps.map(dp => products.find(p => p.id === dp.product_id)?.nome).join(', ');

            return {
                Data: new Date(d.criado_em).toLocaleDateString('pt-BR'),
                Lead: lead?.nome_completo || 'Desconhecido',
                Email: lead?.email || 'N/A',
                Produtos: items,
                Valor: value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                Status: 'Vendido'
            };
        });

        await exportToExcel(dataToExport, `Relatorio_Performance_${period}`);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Painel de Performance</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Análise de Resultados de {currentUser?.nome}</p>
                    </div>
                    <button
                        onClick={handleExportReport}
                        className="btn-liquid-glass bg-emerald-50 text-emerald-600 border border-emerald-100 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Extrair Resultados
                    </button>
                </div>

                <div className="flex flex-col gap-6 pt-4 border-t border-slate-50">
                    <div className="flex flex-wrap gap-4 items-end">
                        {isProprietario && (
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                                    value={selectedCompanyId}
                                    onChange={e => setSelectedCompanyId(e.target.value)}
                                >
                                    <option value="">Todas as Empresas</option>
                                    {companies.filter(c => !c.deletado).map(c => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Intervalo de Datas</label>
                            <div className="flex bg-slate-100 p-1 rounded-2xl">
                                {[
                                    { id: 'today', label: 'Hoje' },
                                    { id: 'week', label: '7 Dias' },
                                    { id: 'month', label: 'Mês' },
                                    { id: 'custom', label: 'Personalizado' },
                                    { id: 'all', label: 'Tudo' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPeriod(p.id as any)}
                                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${period === p.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar Produto</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                                value={filterProductId}
                                onChange={e => setFilterProductId(e.target.value)}
                            >
                                <option value="all">Todos os Produtos</option>
                                {products
                                    .filter(p => !p.deletado && (selectedCompanyId === '' || p.companyId === selectedCompanyId))
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {period === 'custom' && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 animate-in slide-in-from-top-2">
                            <div className="flex-1 w-full">
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Início do Período</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-blue-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 ml-1">Fim do Período</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-blue-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Principal de Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-blue-600">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads Captados</p>
                    <h4 className="text-3xl font-black text-slate-800">{stats.leadsCount}</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-indigo-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxa de Conversão</p>
                    <h4 className="text-3xl font-black text-indigo-600">{stats.conversion.toFixed(1)}%</h4>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-blue-400">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Negociações Totais</p>
                    <h4 className="text-3xl font-black text-slate-800">{stats.dealsCount}</h4>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Seção Ganhos */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] ml-2">Sucesso de Vendas</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendas Concluídas</p>
                            <h4 className="text-3xl font-black text-emerald-600">{stats.wonCount}</h4>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-emerald-600">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faturamento Realizado</p>
                            <h4 className="text-xl font-black text-emerald-600 truncate">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        </div>
                    </div>
                </div>

                {/* Seção Perdas */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] ml-2">Negócios Perdidos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-red-500">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendas Perdidas</p>
                            <h4 className="text-3xl font-black text-red-600">{stats.lostCount}</h4>
                        </div>
                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm border-b-4 border-b-red-600">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receita Perdida</p>
                            <h4 className="text-xl font-black text-red-600 truncate">R$ {stats.lostRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;

