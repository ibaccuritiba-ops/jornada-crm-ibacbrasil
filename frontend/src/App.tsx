
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Edit2, Rocket, Trash2, Box, User as UserIcon, Clock, Eye, EyeOff, Search, X, Download, AlertCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { CRMProvider, useCRM } from './store';
import { useAuthFetch } from './hooks/useAuthFetch';
import Layout from './components/shared/Layout';
import Kanban from './components/features/pipeline/Kanban';
import ImportLeads from './components/features/leads/ImportLeads';
import Trash from './components/features/leads/Trash';
import Settings from './components/features/settings/Settings';
import PipelineSettings from './components/features/pipeline/PipelineSettings';
import Branding from './components/features/admin/Branding';
import Products from './components/features/Products';
import Reports from './components/features/Reports';
import UsersPermissions from './components/features/admin/UsersPermissions';
import NotificationsView from './components/shared/Notifications';
import Companies from './components/features/admin/Companies';
import TasksView from './components/features/Tasks';
import Logo from './components/shared/Logo';
import { UserProfile, DealStatus, PersonType, Lead, Company, User, TaskStatus, TaskType, EventType } from './types';

// Utilitário para exportação em Excel com estilos
export const exportToExcel = async (data: any[], fileName: string) => {
    if (data.length === 0) return;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Base de Leads");
    
    const colKeys = Object.keys(data[0]);
    
    // Adicionar cabeçalho
    const headerRow = worksheet.addRow(colKeys);
    
    // Estilo do cabeçalho
    headerRow.eachCell((cell) => {
        cell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 11,
            name: "Calibri"
        };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1F4E78" }
        };
        cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true
        };
        cell.border = {
            top: { style: "medium", color: { argb: "FF1F4E78" } },
            bottom: { style: "medium", color: { argb: "FF1F4E78" } },
            left: { style: "thin", color: { argb: "FF1F4E78" } },
            right: { style: "thin", color: { argb: "FF1F4E78" } }
        };
    });
    
    // Altura do cabeçalho
    headerRow.height = 25;
    
    // Adicionar dados
    data.forEach((item, rowIndex) => {
        const row = worksheet.addRow(colKeys.map(key => item[key]));
        row.height = 20;
        
        // Estilo alternado (zebrado)
        const bgColor = rowIndex % 2 === 0 ? "FFFFFFFF" : "FFD9E8F5";
        
        row.eachCell((cell) => {
            cell.font = {
                color: { argb: "FF000000" },
                size: 10,
                name: "Calibri"
            };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: bgColor }
            };
            cell.alignment = {
                horizontal: "left",
                vertical: "middle",
                wrapText: true
            };
            cell.border = {
                top: { style: "thin", color: { argb: "FFC6D9F0" } },
                bottom: { style: "thin", color: { argb: "FFC6D9F0" } },
                left: { style: "thin", color: { argb: "FFC6D9F0" } },
                right: { style: "thin", color: { argb: "FFC6D9F0" } }
            };
        });
    });
    
    // Configurar largura das colunas
    worksheet.columns = colKeys.map(key => {
        const maxLength = Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
        );
        return { width: Math.min(maxLength + 3, 35) };
    });
    
    // Congelar primeira linha
    worksheet.views = [
        { state: "frozen", ySplit: 1 }
    ];
    
    // Gerar e fazer download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Componente de Seleção de Período Reutilizável
const PeriodSelector: React.FC<{
    period: string;
    setPeriod: (p: any) => void;
    startDate: string;
    setStartDate: (d: string) => void;
    endDate: string;
    setEndDate: (d: string) => void;
}> = ({ period, setPeriod, startDate, setStartDate, endDate, setEndDate }) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl w-full md:w-auto self-start">
                {[
                    { id: 'today', label: 'Hoje' },
                    { id: '7d', label: '7 Dias' },
                    { id: '30d', label: '30 Dias' },
                    { id: 'custom', label: 'Personalizado' },
                    { id: 'all', label: 'Tudo' }
                ].map(p => (
                    <button
                        key={p.id}
                        onClick={() => setPeriod(p.id)}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${period === p.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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

// Funçao auxiliar de filtro por data
const checkDateInRange = (dateStr: string, period: string, startDate: string, endDate: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (period === 'all') return true;
    if (period === 'custom') {
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
    }
    if (period === 'today') return date.toDateString() === now.toDateString();
    const diff = now.getTime() - date.getTime();
    const days = diff / (1000 * 3600 * 24);
    if (period === '7d') return days <= 7;
    if (period === '30d') return days <= 30;
    return true;
};

// SIMPLE STARS COMPONENT
const Stars: React.FC<{ rating: number; onSelect?: (r: number) => Promise<void> | void }> = ({ rating, onSelect }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
        <div className="flex gap-0.5">
            {stars.map(s => (
                <button
                    key={s}
                    type="button"
                    disabled={!onSelect}
                    onClick={() => onSelect?.(s)}
                    className={`text-lg ${s <= rating ? 'text-amber-500' : 'text-slate-300'} transition-colors ${onSelect ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

const LeadProfileModal: React.FC<{ leadId: string; onClose: () => void }> = ({ leadId, onClose }) => {
    const { leads, deals, dealProducts, products, events, tasks, users } = useCRM();
    const [activeTab, setActiveTab] = useState<'overview' | 'consumption' | 'timeline'>('overview');

    const lead = leads.find(l => String(l.id) === String(leadId));
    if (!lead) return null;

    const leadDeals = deals.filter(d => String(d.lead_id) === String(leadId));
    const dealIds = new Set(leadDeals.map(d => String(d.id)));

    const leadDealProducts = dealProducts.filter(dp => dealIds.has(String(dp.deal_id)));
    const totalConsumed = leadDealProducts.reduce((acc, curr) => acc + Number(curr.valor), 0);

    const leadEvents = events.filter(e => dealIds.has(String(e.deal_id))).sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in duration-200">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[30px] bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-200">
                            {lead.nome_completo[0]}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">{lead.nome_completo}</h3>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LTV: R$ {totalConsumed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <Stars rating={lead.classificacao} />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 text-slate-400 hover:text-slate-800 transition-all cursor-pointer bg-white rounded-2xl shadow-sm border border-slate-100"><X className="w-5 h-5" /></button>
                </div>

                {/* Tabs */}
                <div className="flex px-8 border-b border-slate-100 bg-white">
                    {[
                        { id: 'overview', label: 'Informações & Origem', icon: <UserIcon className="w-4 h-4" /> },
                        { id: 'consumption', label: 'Consumo & Produtos', icon: <Box className="w-4 h-4" /> },
                        { id: 'timeline', label: 'Jornada do Lead', icon: <Clock className="w-4 h-4" /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-5 font-black text-[10px] uppercase tracking-widest border-b-2 transition-all cursor-pointer ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm space-y-6">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-3">Dados de Contato</h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                                        <p className="font-bold text-slate-700">{lead.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp</p>
                                        <p className="font-bold text-emerald-600 text-lg">{lead.whatsapp}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Pessoa</p>
                                        <p className="font-bold text-slate-700">{lead.tipo_pessoa}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[30px] border border-slate-200 shadow-sm space-y-6">
                                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-50 pb-3">Origem e Campanhas</h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Campanha Primária</p>
                                        <span className="inline-block px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase border border-indigo-100">{lead.campanha || 'Busca Direta'}</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Cadastro</p>
                                        <p className="font-bold text-slate-700">{new Date(lead.criado_em).toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'consumption' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Consumido (LTV)</p>
                                    <p className="text-2xl font-black text-slate-900">R$ {totalConsumed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Qtd. Negociações</p>
                                    <p className="text-2xl font-black text-blue-600">{leadDeals.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Itens Adquiridos</p>
                                    <p className="text-2xl font-black text-emerald-600">{leadDealProducts.length}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Produto</th>
                                            <th className="px-6 py-4">Negociação Ref.</th>
                                            <th className="px-6 py-4 text-center">Parcelas</th>
                                            <th className="px-6 py-4 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {leadDealProducts.map(dp => {
                                            const product = products.find(p => String(p.id) === String(dp.product_id));
                                            const deal = leadDeals.find(d => String(d.id) === String(dp.deal_id));
                                            return (
                                                <tr key={dp.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-700">{product?.nome || 'Item Desconhecido'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${deal?.status === DealStatus.GANHA ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {deal?.status === DealStatus.GANHA ? 'Vendido' : 'Em Aberto'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{dp.parcelas}x</td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-900">R$ {Number(dp.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })}
                                        {leadDealProducts.length === 0 && (
                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">Sem consumo registrado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                {leadEvents.map(e => (
                                    <div key={e.id} className="relative">
                                        <div className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white shadow-sm ${e.tipo_evento === EventType.STATUS ? 'bg-red-500' : e.tipo_evento === EventType.ANOTACAO ? 'bg-amber-400' : 'bg-blue-500'}`}></div>
                                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(e.criado_em).toLocaleString('pt-BR')}</span>
                                                <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-md">{e.tipo_evento}</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{e.descricao}</p>
                                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Registrado por {users.find(u => u.id === e.autor_id)?.nome || 'Sistema'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {leadEvents.length === 0 && <div className="text-center py-20 text-slate-400 italic">Sem histórico disponível.</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LoginView = () => {
    const { login } = useCRM();
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [err, setErr] = useState('');
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        const success = await login(email, pass);
        if (!success) {
            setErr('Credenciais inválidas ou acesso pendente de liberação.');
            setTimeout(() => setErr(''), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            {err && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl animate-in slide-in-from-top duration-300 z-50 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{err}</span>
                </div>
            )}
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-200 w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center mb-10">
                    <Logo size="lg" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 text-center mb-2 tracking-tight">Seja bem-vindo</h2>
                <p className="text-slate-500 text-center mb-8 font-medium">Faça login para gerenciar sua operação</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">E-mail Corporativo</label>
                        <input
                            required
                            type="email"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Senha de Acesso</label>
                        <div className="relative">
                            <input
                                required
                                type={showPass ? "text" : "password"}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900"
                                value={pass}
                                onChange={e => setPass(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-liquid-glass bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 cursor-pointer">Acessar CRM</button>
                </form>
                <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2024 IbacBrasil Ecossistema</p>
            </div>
        </div>
    );
};

const LeadsView = () => {
    const { leads, deals, products, addLead, updateLead, deleteLead, addDeal, addDealProduct, stages, pipelines, currentUser, users, companies, updateLeadClassificacao, batchUpdateLeadResponsavel } = useCRM();
    const authFetch = useAuthFetch();

    const isProprietario = currentUser?.role === 'proprietario';

    // States para Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState<number | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'negotiating'>('all');
    const [filterPipeline, setFilterPipeline] = useState<string>('all');
    const [filterStage, setFilterStage] = useState<string>('all');
    const [filterResponsavel, setFilterResponsavel] = useState<string>('all');
    const [selectedCompanyForList, setSelectedCompanyForList] = useState<string>('');

    // Filtro de Período
    const [period, setPeriod] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    const [profileLeadId, setProfileLeadId] = useState<string | null>(null);

    const [allocationModal, setAllocationModal] = useState<{ show: boolean, leadIds: string[] }>({ show: false, leadIds: [] });
    const [responsavelModal, setResponsavelModal] = useState<{ show: boolean, leadIds: string[] }>({ show: false, leadIds: [] });
    const [dealModal, setDealModal] = useState<{ show: boolean, lead: Lead | null }>({ show: false, lead: null });
    const [selectedPipelineId, setSelectedPipelineId] = useState('');
    const [selectedStageId, setSelectedStageId] = useState('');
    const [newResponsavelId, setNewResponsavelId] = useState('');
    const [selectedCompanyForForm, setSelectedCompanyForForm] = useState<string>('');
    const [formProducts, setFormProducts] = useState<any[]>([]);

    const [newLead, setNewLead] = useState({
        nome_completo: '',
        email: '',
        whatsapp: '',
        tipo_pessoa: PersonType.PF,
        campanha: '',
        classificacao: 3,
        pipeline_id: '',
        stage_id: '',
        responsavel_id: '',
        productId: '' // Novo campo para produto inicial
    });

    // Determina qual empresa usar para filtros/formulário
    const effectiveCompanyId = isProprietario ? selectedCompanyForList : currentUser?.companyId;
    const effectiveCompanyForForm = isProprietario ? selectedCompanyForForm : currentUser?.companyId;

    const companyPipelines = useMemo(() => pipelines.filter(p => effectiveCompanyForForm && p.companyId === effectiveCompanyForForm), [pipelines, effectiveCompanyForForm]);
    const companyUsers = useMemo(() => users.filter(u => effectiveCompanyForForm && u.companyId === effectiveCompanyForForm), [users, effectiveCompanyForForm]);

    // Ajuste de estágios disponíveis para o modal de novo lead
    const availableStagesForNewLead = useMemo(() => {
        if (!newLead.pipeline_id) return [];
        return stages.filter(s => s.pipeline_id === newLead.pipeline_id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }, [stages, newLead.pipeline_id]);

    const stagesForAllocation = useMemo(() => {
        if (!selectedPipelineId) return [];
        return stages.filter(s => s.pipeline_id === selectedPipelineId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }, [stages, selectedPipelineId]);

    const stagesForFilter = useMemo(() => stages.filter(s => s.pipeline_id === filterPipeline).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), [stages, filterPipeline]);

    // Reseta a empresa selecionada do formulário quando o modal fecha
    useEffect(() => {
        if (!showModal) {
            setSelectedCompanyForForm('');
            setFormProducts([]);
        }
    }, [showModal]);

    // Carrega produtos quando proprietario seleciona empresa
    useEffect(() => {
        if (isProprietario && selectedCompanyForForm && authFetch) {
            const loadProductsForCompany = async () => {
                try {
                    const res = await authFetch(`/produto/${selectedCompanyForForm}`);
                    if (res?.ok) {
                        const data = await res.json();
                        const mappedProducts = (data.data || []).map((p: any) => ({
                            id: p._id,
                            nome: p.nome,
                            valor_total: p.valor_total,
                            parcelas: p.parcelas,
                            companyId: p.empresa,
                            deletado: p.excluido
                        }));
                        setFormProducts(mappedProducts);
                    } else {
                        setFormProducts([]);
                    }
                } catch (error) {
                    console.error('Erro ao carregar produtos:', error);
                    setFormProducts([]);
                }
            };
            loadProductsForCompany();
        } else if (!isProprietario) {
            // Para admin/vendedor, usar os produtos do store
            setFormProducts(products.filter(p => !p.deletado));
        }
    }, [selectedCompanyForForm, isProprietario, authFetch]);

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            if (l.deletado) return false;
            
            // Filtra por empresa (para proprietarios usa selectedCompanyForList, para outros usa sua empresa)
            if (effectiveCompanyId && l.companyId !== effectiveCompanyId) return false;

            // Filtro de Busca (Texto) - Prioritário
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = term === '' ||
                (l.nome_completo && l.nome_completo.toLowerCase().includes(term)) ||
                (l.email && l.email.toLowerCase().includes(term)) ||
                (l.whatsapp && l.whatsapp.includes(term));

            if (!matchesSearch) return false;

            // Se houver busca por texto, ignoramos filtros restritivos de classificação/status para facilitar a localização
            if (term === '') {
                if (filterRating !== 'all' && l.classificacao !== filterRating) return false;
                if (filterResponsavel !== 'all' && l.responsavel_id !== filterResponsavel) return false;

                const activeDeal = deals.find(d => String(d.lead_id) === String(l.id) && d.status === DealStatus.ABERTA);
                if (filterStatus === 'available' && activeDeal) return false;
                if (filterStatus === 'negotiating' && !activeDeal) return false;

                if (filterPipeline !== 'all') {
                    if (!activeDeal || String(activeDeal.pipeline_id) !== String(filterPipeline)) return false;
                    if (filterStage !== 'all' && String(activeDeal.stage_id) !== String(filterStage)) return false;
                }
            }

            // Filtro de Período
            if (!checkDateInRange(l.criado_em, period, startDate, endDate)) return false;

            return true;
        });
    }, [leads, deals, searchTerm, filterRating, filterStatus, filterPipeline, filterStage, filterResponsavel, currentUser, period, startDate, endDate, effectiveCompanyId]);

    const toggleLeadSelection = (id: string) => {
        setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const selectAll = (checked: boolean) => {
        if (checked) setSelectedLeads(filteredLeads.map(l => l.id));
        else setSelectedLeads([]);
    };

    const handleExportLeads = async () => {
        const dataToExport = filteredLeads.map(l => ({
            Nome: l.nome_completo,
            Email: l.email,
            WhatsApp: l.whatsapp,
            Responsavel: users.find(u => u.id === l.responsavel_id)?.nome || 'Não Atribuído',
            Campanha: l.campanha || 'N/A',
            Estrelas: l.classificacao,
            CriadoEm: new Date(l.criado_em).toLocaleString('pt-BR')
        }));
        await exportToExcel(dataToExport, 'BaseLeads_IbacBrasil');
    };

    const handleEditLead = (lead: Lead) => {
        setEditingLeadId(lead.id);
        setNewLead({
            nome_completo: lead.nome_completo,
            email: lead.email,
            whatsapp: lead.whatsapp,
            tipo_pessoa: lead.tipo_pessoa,
            campanha: lead.campanha || '',
            classificacao: lead.classificacao,
            pipeline_id: '',
            stage_id: '',
            responsavel_id: lead.responsavel_id || '',
            productId: ''
        });
        setShowModal(true);
    };

    const handleCreateOrUpdateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        const { pipeline_id, stage_id, productId, ...leadToSave } = newLead;

        console.log('🚀 handleCreateOrUpdateLead - Iniciado');
        console.log('pipeline_id:', pipeline_id, 'stage_id:', stage_id);

        // Validar: se funil está selecionado, etapa é obrigatória
        if (pipeline_id && !stage_id) {
            alert('Por favor, selecione uma etapa para o funil selecionado.');
            return;
        }

        if (editingLeadId) {
            console.log('📝 Editando lead existente');
            const existing = leads.find(l => l.id === editingLeadId);
            if (existing) {
                updateLead({ ...existing, ...leadToSave } as Lead);
            }
        } else {
            console.log('➕ Criando novo lead');
            // Determina a empresa: proprietarios usam a selecionada, outros usam sua própria empresa
            const companyId = isProprietario ? selectedCompanyForForm : currentUser?.companyId;

            // Mapeia os campos do frontend para o backend
            const leadPayload = {
                nome: leadToSave.nome_completo,
                email: leadToSave.email,
                whatsapp: leadToSave.whatsapp,
                responsavel: leadToSave.responsavel_id || currentUser?.id,
                funil: pipeline_id,
                etapa: stage_id,
                empresa: companyId,
                classificacao: leadToSave.classificacao
            };

            const res = await addLead(leadPayload as any);
            
            if (res.success && res.lead && pipeline_id && stage_id) {
                console.log('🎯 Condição atendida: criaremos deal');
                console.log('Chamando addDeal com:', {
                    lead_id: res.lead.id,
                    pipeline_id,
                    stage_id,
                    companyId
                });
                
                const dealRes = await addDeal({
                    lead_id: res.lead.id,
                    pipeline_id: pipeline_id,
                    stage_id: stage_id,
                    responsavel_id: res.lead.responsavel_id || currentUser?.id || '',
                    status: DealStatus.ABERTA,
                    companyId: companyId || ''
                });

                console.log('✨ Deal result:', dealRes);

                // Vínculo inicial de produto para que o valor apareça no Kanban
                if (dealRes.success && dealRes.deal && productId) {
                    addDealProduct(dealRes.deal.id, productId);
                }
            } else {
                console.log('❌ Condição não atendida:', {
                    'res.success': res.success,
                    'res.lead': res.lead?.id,
                    pipeline_id,
                    stage_id
                });
            }
        }
        console.log('🏁 Fechando modal e limpando estado');
        setShowModal(false);
        setEditingLeadId(null);
        setSelectedCompanyForForm('');
        setNewLead({ nome_completo: '', email: '', whatsapp: '', tipo_pessoa: PersonType.PF, campanha: '', classificacao: 3, pipeline_id: '', stage_id: '', responsavel_id: '', productId: '' });
    };

    const handleBatchUpdateResponsavel = (e: React.FormEvent) => {
        e.preventDefault();
        if (responsavelModal.leadIds.length === 0 || !newResponsavelId) return;
        batchUpdateLeadResponsavel(responsavelModal.leadIds, newResponsavelId);
        setResponsavelModal({ show: false, leadIds: [] });
        setNewResponsavelId('');
        setSelectedLeads([]);
    };

    const handleBatchAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (allocationModal.leadIds.length === 0 || !selectedPipelineId || !selectedStageId) return;

        for (const id of allocationModal.leadIds) {
            const alreadyInFunnel = deals.some(d => String(d.lead_id) === String(id) && d.status === DealStatus.ABERTA);
            if (!alreadyInFunnel) {
                const lead = leads.find(l => l.id === id);
                await addDeal({
                    lead_id: id,
                    pipeline_id: selectedPipelineId,
                    stage_id: selectedStageId,
                    responsavel_id: lead?.responsavel_id || currentUser?.id || '',
                    status: DealStatus.ABERTA,
                    companyId: lead?.companyId || ''
                });
            }
        }

        setAllocationModal({ show: false, leadIds: [] });
        setSelectedPipelineId('');
        setSelectedStageId('');
        setSelectedLeads([]);
    };

    const handleBatchDelete = () => {
        const reason = prompt(`Deseja excluir logicamente ${selectedLeads.length} leads selecionados? Informe o motivo:`);
        if (reason && reason.trim()) {
            selectedLeads.forEach(id => deleteLead(id, reason.trim()));
            setSelectedLeads([]);
        }
    };

    const isLeadInFunnel = (leadId: string) => {
        return deals.some(d => String(d.lead_id) === String(leadId) && d.status === DealStatus.ABERTA);
    };

    // Obter o status da negociação de um lead (qualquer negociação, não apenas ativas)
    const getLeadDealStatus = (leadId: string) => {
        const deal = deals.find(d => String(d.lead_id) === String(leadId));
        return deal ? deal.status : null;
    };

    // Verificar se há leads já lançados entre os selecionados
    const hasLaunchedLeads = selectedLeads.some(id => {
        const deal = deals.find(d => String(d.lead_id) === String(id));
        return !!deal;
    });

    // Obter a empresa dos leads selecionados (para os modais de massa)
    const selectedLeadsCompanyId = useMemo(() => {
        if (selectedLeads.length === 0) return null;
        const firstLead = leads.find(l => l.id === selectedLeads[0]);
        return firstLead?.companyId || null;
    }, [selectedLeads, leads]);

    // Verificar se todos os leads selecionados são da mesma empresa
    const allSelectedLeadsSameCompany = useMemo(() => {
        if (selectedLeads.length === 0) return true;
        const firstCompanyId = selectedLeadsCompanyId;
        return selectedLeads.every(id => {
            const lead = leads.find(l => l.id === id);
            return lead?.companyId === firstCompanyId;
        });
    }, [selectedLeads, selectedLeadsCompanyId, leads]);

    // Pipelines e usuários para os modais de massa (usam a empresa dos leads selecionados)
    const massActionPipelines = useMemo(() => {
        if (!selectedLeadsCompanyId) return [];
        return pipelines.filter(p => p.companyId === selectedLeadsCompanyId);
    }, [pipelines, selectedLeadsCompanyId]);

    const massActionUsers = useMemo(() => {
        if (!selectedLeadsCompanyId) return [];
        return users.filter(u => u.companyId === selectedLeadsCompanyId && u.ativo);
    }, [users, selectedLeadsCompanyId]);

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRating('all');
        setFilterStatus('all');
        setFilterPipeline('all');
        setFilterStage('all');
        setFilterResponsavel('all');
        setPeriod('all');
    };

    return (
        <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-32">

            {/* BARRA DE FILTROS AVANÇADA */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1 w-full space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                placeholder="Buscar por nome, e-mail ou WhatsApp..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Cadastro:</p>
                            <PeriodSelector
                                period={period} setPeriod={setPeriod}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                        <button
                            onClick={() => { setEditingLeadId(null); setShowModal(true); }}
                            className="btn-liquid-glass bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 cursor-pointer"
                        >
                            + Novo Lead
                        </button>
                        <button
                            onClick={handleExportLeads}
                            className="btn-liquid-glass bg-emerald-50 text-emerald-600 border border-emerald-100 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Extrair Base
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 pt-6 border-t border-slate-100">
                    {isProprietario && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                                value={selectedCompanyForList}
                                onChange={e => setSelectedCompanyForList(e.target.value)}
                            >
                                <option value="">Todas as Empresas</option>
                                {companies.filter(c => !c.deletado).map(c => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estrelas</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                            value={filterRating}
                            onChange={e => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        >
                            <option value="all">Todas as Estrelas</option>
                            <option value="1">⭐ 1 Estrela</option>
                            <option value="2">⭐⭐ 2 Estrelas</option>
                            <option value="3">⭐⭐⭐ 3 Estrelas</option>
                            <option value="4">⭐⭐⭐⭐ 4 Estrelas</option>
                            <option value="5">⭐⭐⭐⭐⭐ 5 Estrelas</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proprietário</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                            value={filterResponsavel}
                            onChange={e => setFilterResponsavel(e.target.value)}
                        >
                            <option value="all">Qualquer Responsável</option>
                            {companyUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Comercial</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">Todos os Status</option>
                            <option value="available">Disponível (S/ Negócio)</option>
                            <option value="negotiating">Em Negociação</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Funil</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300"
                            value={filterPipeline}
                            onChange={e => { setFilterPipeline(e.target.value); setFilterStage('all'); }}
                        >
                            <option value="all">Todos os Funis</option>
                            {companyPipelines.map(p => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Etapa</label>
                        <select
                            disabled={filterPipeline === 'all'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-xs outline-none focus:border-blue-300 disabled:opacity-40"
                            value={filterStage}
                            onChange={e => setFilterStage(e.target.value)}
                        >
                            <option value="all">Todas as Etapas</option>
                            {stagesForFilter.map(s => (
                                <option key={s.id} value={s.id}>{s.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={clearFilters}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        Limpar Filtros ×
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                                    onChange={e => selectAll(e.target.checked)}
                                    checked={selectedLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                                />
                            </th>
                            <th className="px-6 py-4">Lead / Nome</th>
                            <th className="px-6 py-4">Contato</th>
                            {isProprietario && <th className="px-6 py-4">Empresa</th>}
                            <th className="px-6 py-4 text-center">Responsável</th>
                            <th className="px-6 py-4 text-center">Classificação</th>
                            <th className="px-6 py-4 text-center">Status Comercial</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLeads.map(lead => {
                            const inFunnel = isLeadInFunnel(lead.id);
                            const isSelected = selectedLeads.includes(lead.id);
                            const responsavel = users.find(u => u.id === lead.responsavel_id);

                            return (
                                <tr key={lead.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                                            checked={isSelected}
                                            onChange={() => toggleLeadSelection(lead.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => setProfileLeadId(lead.id)}
                                            className="text-left group cursor-pointer"
                                        >
                                            <p className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors underline-offset-4 decoration-2 decoration-blue-500/30 hover:underline">{lead.nome_completo || 'Sem Nome'}</p>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lead.campanha || 'Base Geral'}</span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-600">{lead.email}</p>
                                        <p className="text-xs font-black text-emerald-600">{lead.whatsapp}</p>
                                    </td>
                                    {isProprietario && (
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-700">{companies.find(c => c.id === lead.companyId)?.nome || 'N/A'}</span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black uppercase">
                                                {responsavel?.nome[0] || '?'}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter truncate max-w-[80px]">
                                                {responsavel?.nome.split(' ')[0] || 'S/D'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <Stars rating={lead.classificacao} onSelect={async (r) => await updateLeadClassificacao(lead.id, r)} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {(() => {
                                                const dealStatus = getLeadDealStatus(lead.id);
                                                if (!dealStatus) {
                                                    return <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Disponível</span>;
                                                }
                                                if (dealStatus === DealStatus.ABERTA) {
                                                    return <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">Negociação Ativa</span>;
                                                }
                                                if (dealStatus === DealStatus.GANHA) {
                                                    return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">✓ Sucesso</span>;
                                                }
                                                if (dealStatus === DealStatus.PERDIDA) {
                                                    return <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">✗ Perda</span>;
                                                }
                                                return <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Disponível</span>;
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {!getLeadDealStatus(lead.id) && (
                                                <button
                                                    onClick={() => setDealModal({ show: true, lead })}
                                                    className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-all cursor-pointer border border-amber-200/50"
                                                    title="Lançar Negociação"
                                                >
                                                    <Rocket className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditLead(lead)}
                                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all cursor-pointer border border-blue-200/50"
                                                title="Editar Lead"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt(`Deseja excluir logicamente "${lead.nome_completo}"? Informe o motivo:`);
                                                    if (reason && reason.trim()) deleteLead(lead.id, reason.trim());
                                                }}
                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all cursor-pointer border border-red-200/50"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedLeads.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-10 py-6 rounded-[30px] shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom duration-300 z-50 border border-white/10">
                    <div className="flex flex-col border-r border-white/20 pr-8">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Gestão em Massa</span>
                        <span className="font-black text-lg">{selectedLeads.length} Leads Ativos</span>
                    </div>
                    <div className="flex gap-3">
                        <button disabled={!allSelectedLeadsSameCompany} onClick={() => setResponsavelModal({ show: true, leadIds: selectedLeads })} className="btn-liquid-glass bg-white text-slate-900 hover:bg-slate-100 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title={!allSelectedLeadsSameCompany ? 'Selecione leads da mesma empresa' : ''}><UserIcon className="w-4 h-4" /> Trocar Responsável</button>
                        <button disabled={hasLaunchedLeads || !allSelectedLeadsSameCompany} onClick={() => setAllocationModal({ show: true, leadIds: selectedLeads })} className="btn-liquid-glass bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title={hasLaunchedLeads ? 'Não é possível lançar leads que já estão em um funil' : !allSelectedLeadsSameCompany ? 'Selecione leads da mesma empresa' : ''}><Rocket className="w-4 h-4" /> Lançar em Funil</button>
                        <button onClick={handleBatchDelete} className="btn-liquid-glass bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-red-600/20 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Excluir</button>
                        <button onClick={() => setSelectedLeads([])} className="text-slate-400 hover:text-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest cursor-pointer">X</button>
                    </div>
                </div>
            )}

            {responsavelModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 bg-slate-900 text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">Alterar Propriedade</h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">Reatribuindo {responsavelModal.leadIds.length} leads</p>
                        </div>
                        <form onSubmit={handleBatchUpdateResponsavel} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Novo Responsável</label>
                                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer" value={newResponsavelId} onChange={e => setNewResponsavelId(e.target.value)}>
                                    <option value="">Escolher colaborador...</option>
                                    {massActionUsers.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setResponsavelModal({ show: false, leadIds: [] })} className="flex-1 px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="flex-1 btn-liquid-glass bg-slate-900 text-white px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-lg transition-all active:scale-95 cursor-pointer">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {allocationModal.show && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 bg-blue-600 text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">Lançar no Funil</h3>
                            <p className="text-blue-100 text-xs font-bold mt-1">Movendo {allocationModal.leadIds.length} leads selecionados</p>
                        </div>
                        <form onSubmit={handleBatchAllocate} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Selecionar Funil</label>
                                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer" value={selectedPipelineId} onChange={e => { setSelectedPipelineId(e.target.value); setSelectedStageId(''); }}>
                                    <option value="">Escolher pipeline...</option>
                                    {massActionPipelines.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Etapa Inicial</label>
                                <select required disabled={!selectedPipelineId} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer disabled:opacity-50" value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)}>
                                    <option value="">Escolher etapa...</option>
                                    {stagesForAllocation.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setAllocationModal({ show: false, leadIds: [] })} className="flex-1 px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="flex-1 btn-liquid-glass bg-blue-600 text-white px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg transition-all active:scale-95 cursor-pointer">Lançar Agora</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {dealModal.show && dealModal.lead && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 bg-amber-600 text-white">
                            <h3 className="text-xl font-black uppercase tracking-tight">Lançar Negociação</h3>
                            <p className="text-amber-100 text-xs font-bold mt-1">{dealModal.lead.nome_completo}</p>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (selectedPipelineId && selectedStageId && dealModal.lead) {
                                await addDeal({
                                    lead_id: dealModal.lead.id,
                                    status: DealStatus.ABERTA,
                                    pipeline_id: selectedPipelineId,
                                    stage_id: selectedStageId,
                                    responsavel_id: dealModal.lead.responsavel_id || currentUser?.id || '',
                                    companyId: dealModal.lead.companyId
                                });
                                setDealModal({ show: false, lead: null });
                                setSelectedPipelineId('');
                                setSelectedStageId('');
                            }
                        }} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Funil</label>
                                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-slate-900 cursor-pointer" value={selectedPipelineId} onChange={e => { setSelectedPipelineId(e.target.value); setSelectedStageId(''); }}>
                                    <option value="">Escolher funil...</option>
                                    {pipelines.filter(p => p.companyId === dealModal.lead?.companyId).map(p => (
                                        <option key={p.id} value={p.id}>{p.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Etapa Inicial</label>
                                <select required disabled={!selectedPipelineId} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 transition-all font-bold text-slate-900 cursor-pointer disabled:opacity-50" value={selectedStageId} onChange={e => setSelectedStageId(e.target.value)}>
                                    <option value="">Escolher etapa...</option>
                                    {stages.filter(s => s.pipeline_id === selectedPipelineId).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(s => (
                                        <option key={s.id} value={s.id}>{s.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => { setDealModal({ show: false, lead: null }); setSelectedPipelineId(''); setSelectedStageId(''); }} className="flex-1 px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="flex-1 btn-liquid-glass bg-amber-600 text-white px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all active:scale-95 cursor-pointer">Lançar Negociação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingLeadId ? 'Editar Dados do Lead' : 'Cadastro Individual de Lead'}</h3>
                            <button onClick={() => { setShowModal(false); setEditingLeadId(null); }} className="text-slate-400 hover:text-slate-800 p-2 cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreateOrUpdateLead} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                                    <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" value={newLead.nome_completo} onChange={e => setNewLead({ ...newLead, nome_completo: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                                    <input required type="email" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">WhatsApp</label>
                                    <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900" value={newLead.whatsapp} onChange={e => setNewLead({ ...newLead, whatsapp: e.target.value })} />
                                </div>

                                {isProprietario && !editingLeadId && (
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Empresa *</label>
                                        <select 
                                            required 
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer"
                                            value={selectedCompanyForForm}
                                            onChange={e => setSelectedCompanyForForm(e.target.value)}
                                        >
                                            <option value="">Selecionar Empresa...</option>
                                            {companies.filter(c => !c.deletado).map(c => (
                                                <option key={c.id} value={c.id}>{c.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Responsável</label>
                                    <select 
                                        disabled={isProprietario && !editingLeadId && !selectedCompanyForForm}
                                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                        value={newLead.responsavel_id} 
                                        onChange={e => setNewLead({ ...newLead, responsavel_id: e.target.value })}
                                    >
                                        <option value="">Atribuir a mim</option>
                                        {companyUsers.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                                    </select>
                                </div>

                                {/* Novos Campos de Alocação de Funil - Exibidos apenas na criação */}
                                {!editingLeadId && (
                                    <>
                                        <div className="pt-4 col-span-2 border-t border-slate-100">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Posicionar no Funil de Vendas (Opcional)</p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Funil (Pipeline)</label>
                                            <select
                                                className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer"
                                                value={newLead.pipeline_id}
                                                onChange={e => setNewLead({ ...newLead, pipeline_id: e.target.value, stage_id: '' })}
                                            >
                                                <option value="">Nenhum funil selecionado</option>
                                                {companyPipelines.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1" style={{color: newLead.pipeline_id ? '#dc2626' : '#64748b'}}>Etapa Inicial {newLead.pipeline_id ? '(Obrigatória)' : '(Opcional)'}</label>
                                            <select
                                                disabled={!newLead.pipeline_id}
                                                className={`w-full p-4 bg-white border rounded-2xl outline-none focus:ring-4 transition-all font-bold text-slate-900 cursor-pointer disabled:opacity-50 ${
                                                    newLead.pipeline_id ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:ring-blue-500/10'
                                                }`}
                                                value={newLead.stage_id}
                                                onChange={e => setNewLead({ ...newLead, stage_id: e.target.value })}
                                            >
                                                <option value="">Nenhuma etapa selecionada</option>
                                                {availableStagesForNewLead.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nome}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Produto de Interesse (Opcional)</label>
                                            <select
                                                className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 cursor-pointer"
                                                value={newLead.productId}
                                                onChange={e => setNewLead({ ...newLead, productId: e.target.value })}
                                            >
                                                <option value="">Nenhum produto selecionado</option>
                                                {formProducts.filter(p => !p.deletado).map(prod => (
                                                    <option key={prod.id} value={prod.id}>{prod.nome} - R$ {Number(prod.valor_total).toLocaleString('pt-BR')}</option>
                                                ))}
                                            </select>
                                            <p className="text-[9px] text-slate-400 mt-2 font-bold italic">* Ao selecionar um produto, o valor será exibido automaticamente no card do Kanban.</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button type="submit" className="w-full btn-liquid-glass bg-blue-600 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl active:scale-95 cursor-pointer mt-4">
                                {editingLeadId ? 'Salvar Alterações' : (newLead.pipeline_id ? 'Cadastrar Lead e Lançar no Funil' : 'Cadastrar Lead')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {profileLeadId && <LeadProfileModal leadId={profileLeadId} onClose={() => setProfileLeadId(null)} />}
        </div>
    );
};

// Componente principal App que orquestra a navegação e autenticação
const App: React.FC = () => {
    return (
        <CRMProvider>
            <Main />
        </CRMProvider>
    );
};

// Componente de conteúdo que consome o contexto do CRM
const Main: React.FC = () => {
    const { currentUser, isLoading, pipelines, stages } = useCRM();
    const [activeTab, setActiveTab] = useState('dashboard');

    if (!currentUser) {
        return <LoginView />;
    }

    // Aguarda carregamento de dados críticos antes de exibir a interface
    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center z-50">
                <div className="text-center space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                        <div className="absolute inset-4 border-2 border-blue-500/30 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">Carregando CRM</h2>
                        <p className="text-blue-200 text-sm font-medium">Preparando dados essenciais...</p>
                        <p className="text-blue-300/60 text-xs">Se isso demorar muito, verifique a conexão com o servidor</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {activeTab === 'dashboard' && <Reports />}
            {activeTab === 'pipeline_settings' && <PipelineSettings />}
            {activeTab === 'kanban' && <Kanban />}
            {activeTab === 'companies' && <Companies />}
            {activeTab === 'users_permissions' && <UsersPermissions />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'leads' && <LeadsView />}
            {activeTab === 'products' && <Products />}
            {activeTab === 'branding' && <Branding />}
            {activeTab === 'import' && <ImportLeads />}
            {activeTab === 'trash' && (
                <>
                    <div className="bg-white p-20 rounded-[40px] border border-slate-200 text-center mb-6">
                        <p className="text-slate-400 font-bold uppercase tracking-widest italic">
                            A Lixeira permite visualizar leads excluídos.<br />
                            <span className="text-[10px]">Módulo em implementação para consulta de logs de auditoria.</span>
                        </p>
                    </div>
                    <Trash />
                </>
            )}
            {activeTab === 'settings' && <Settings />}
            {activeTab === 'notifications' && <NotificationsView />}
        </Layout>
    );
};

export default App;
