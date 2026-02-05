import React, { useState } from 'react';
import { useCRM } from '../../../store';
import { Trash2, AlertCircle, RotateCcw } from 'lucide-react';

export default function Trash() {
    const { leads, restoreLead, permanentlyDeleteLead } = useCRM();
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar apenas leads deletados
    const deletedLeads = leads.filter(l => l.deletado);
    const filteredLeads = deletedLeads.filter(l =>
        l.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.whatsapp?.includes(searchTerm)
    );

    const handleRestore = async (lead: any) => {
        await restoreLead(lead.id);
    };

    const handleDelete = async (lead: any) => {
        if (window.confirm(`Deletar permanentemente ${lead.nome_completo}? Esta ação não pode ser desfeita.`)) {
            await permanentlyDeleteLead(lead.id);
        }
    };

    const handleEmptyTrash = async () => {
        if (window.confirm(`Deletar permanentemente todos os ${deletedLeads.length} cliente(s) na lixeira? Esta ação não pode ser desfeita.`)) {
            for (const lead of deletedLeads) {
                await permanentlyDeleteLead(lead.id);
            }
        }
    };

    if (deletedLeads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Trash2 className="w-16 h-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-black text-slate-900 mb-2">Lixeira Vazia</h3>
                <p className="text-slate-400">Nenhum cliente deletado</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 items-end">
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="px-4 py-3 bg-slate-100 rounded-xl font-black text-sm text-slate-600">
                    {filteredLeads.length} cliente{filteredLeads.length !== 1 ? 's' : ''}
                </span>
                <button
                    onClick={handleEmptyTrash}
                    className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg cursor-pointer flex items-center gap-2"
                >
                    <Trash2 className="w-4 h-4" />
                    Esvaziar Lixeira
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Nome</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Email</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">WhatsApp</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest">Deletado em</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm text-slate-900">{lead.nome_completo}</div>
                                    <div className="text-[10px] text-slate-400">{lead.campanha || 'Orgânico'}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{lead.email}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{lead.whatsapp}</td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    {new Date(lead.atualizado_em).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleRestore(lead)}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2 border border-emerald-200/50"
                                            title="Restaurar cliente"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Restaurar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lead)}
                                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-2 border border-red-200/50"
                                            title="Deletar permanentemente"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Deletar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-bold mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Aviso</p>
                <p>Clientes deletados permanecerão na lixeira por 30 dias antes de serem removidos automaticamente.</p>
            </div>
        </div>
    );
}
