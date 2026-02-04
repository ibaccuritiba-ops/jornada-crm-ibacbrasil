import React, { useState, useMemo } from 'react';
import { Trash2, Building2, Search, X } from 'lucide-react';
import { useCRM } from '../../../store';
import { Company } from '../../../types';

const Companies: React.FC = () => {
  const { companies, addCompany, updateCompany, deleteCompany } = useCRM();
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    cor_principal: '#0f172a',
    cor_destaque: '#2563eb',
    ativa: true
  });

  const [adminData, setAdminData] = useState({
    nome: '',
    email: '',
    senha: ''
  });

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      !c.deletado && c.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateCompany({ ...editingCompany, ...formData });
    } else {
      addCompany(formData as any, adminData);
    }
    handleClose();
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCompany(null);
    setFormData({
      nome: '',
      cnpj: '',
      cor_principal: '#0f172a',
      cor_destaque: '#2563eb',
      ativa: true
    });
    setAdminData({ nome: '', email: '', senha: '' });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      nome: company.nome,
      cnpj: company.cnpj || '',
      cor_principal: company.cor_principal,
      cor_destaque: company.cor_destaque,
      ativa: company.ativa
    });
    setShowModal(true);
  };

  const handleDelete = (id: string, nome: string) => {
    const reason = prompt(`Deseja excluir permanentemente a empresa "${nome}"? Esta ação removerá o acesso de todos os usuários vinculados. Informe o motivo:`);
    if (reason && reason.trim()) {
      deleteCompany(id, reason.trim());
    } else if (reason !== null) {
      alert("Motivo obrigatório para exclusão.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ecossistema de Empresas SaaS</h2>
              <p className="text-slate-500 text-sm font-medium">Gestão global de operações IbacBrasil</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              placeholder="Buscar por nome da empresa ou CNPJ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          + Nova Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(company => (
          <div key={company.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:border-blue-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
               <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner text-slate-400">
                    {company.logo_url ? <img src={company.logo_url} className="w-full h-full object-contain p-2" /> : <Building2 className="w-8 h-8" />}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${company.ativa ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {company.ativa ? 'Operação Ativa' : 'Inativa'}
                  </span>
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">{company.nome}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{company.cnpj || 'Sem CNPJ'}</p>
               </div>
               <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg border border-slate-200" style={{ backgroundColor: company.cor_principal }}></div>
                  <div className="w-6 h-6 rounded-lg border border-slate-200" style={{ backgroundColor: company.cor_destaque }}></div>
               </div>
            </div>
            <div className="pt-8 flex gap-2">
               <button onClick={() => handleEdit(company)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all cursor-pointer">Editar</button>
               <button onClick={() => handleDelete(company.id, company.nome)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[40px]">
            <p className="text-slate-400 font-bold italic">Nenhuma empresa encontrada.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in duration-200 custom-scrollbar">
            <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingCompany ? 'Editar Empresa' : 'Nova Operação SaaS'}</h3>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-800 p-2 cursor-pointer transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">Dados da Empresa</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome da Empresa</label>
                    <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Documento (CNPJ/CPF)</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
                  </div>
                </div>
              </section>

              {!editingCompany && (
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 pb-2">Administrador Responsável</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome do Administrador</label>
                      <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900" value={adminData.nome} onChange={e => setAdminData({...adminData, nome: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">E-mail de Login</label>
                      <input required type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900" value={adminData.email} onChange={e => setAdminData({...adminData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Senha Provisória</label>
                      <input required type="password" minLength={6} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900" value={adminData.senha} onChange={e => setAdminData({...adminData, senha: e.target.value})} />
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-6">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest border-b border-amber-100 pb-2">Branding (Cores)</h4>
                <div className="grid grid-cols-2 gap-8">
                  <div className="flex items-center gap-4">
                    <input type="color" className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white shadow-md" value={formData.cor_principal} onChange={e => setFormData({...formData, cor_principal: e.target.value})} />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Cor Principal</p>
                      <p className="text-xs font-mono font-black">{formData.cor_principal}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input type="color" className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white shadow-md" value={formData.cor_destaque} onChange={e => setFormData({...formData, cor_destaque: e.target.value})} />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Cor de Destaque</p>
                      <p className="text-xs font-mono font-black">{formData.cor_destaque}</p>
                    </div>
                  </div>
                </div>
              </section>

              {editingCompany && (
                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-b border-purple-100 pb-2">Status da Operação</h4>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {formData.ativa ? 'Operação Ativa' : 'Operação Inativa'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, ativa: !formData.ativa})}
                      className={`relative w-14 h-8 rounded-full transition-all ${formData.ativa ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${formData.ativa ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </section>
              )}

              <div className="flex gap-4 pt-10 border-t border-slate-100">
                <button type="button" onClick={handleClose} className="flex-1 px-4 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">Descartar</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white px-4 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl transition-all active:scale-95 cursor-pointer">
                  {editingCompany ? 'Salvar Alterações' : 'Finalizar e Ativar Operação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
