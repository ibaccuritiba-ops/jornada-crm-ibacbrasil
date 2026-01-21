
import React, { useState, useRef, useEffect } from 'react';
import { useCRM } from '../store';

const Branding: React.FC = () => {
  const { currentCompany, updateCompany } = useCRM();

  const [branding, setBranding] = useState({
    logo_url: currentCompany?.logo_url || '',
    cor_primaria: currentCompany?.cor_primaria || '#0f172a',
    cor_secundaria: currentCompany?.cor_secundaria || '#2563eb',
    cor_terciaria: currentCompany?.cor_terciaria || '#0f172a'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentCompany) {
      setBranding({
        logo_url: currentCompany.logo_url || '',
        cor_primaria: currentCompany.cor_primaria,
        cor_secundaria: currentCompany.cor_secundaria,
        cor_terciaria: currentCompany.cor_terciaria
      });
    }
  }, [currentCompany]);

  const handleUpdateBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    updateCompany({ ...currentCompany, ...branding });
    alert('Identidade Visual salva com sucesso!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBranding({ ...branding, logo_url: event.target?.result as string });
    reader.readAsDataURL(file);
  };

  if (!currentCompany) return null;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200">
          <span className="text-2xl">🎨</span>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identidade Visual</h2>
          <p className="text-slate-500 text-sm font-medium">Personalize a aparência da plataforma para a sua empresa</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
        <form onSubmit={handleUpdateBranding} className="space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Logo Upload Area */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Logo da Operação</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative group h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              >
                {branding.logo_url ? (
                  <img src={branding.logo_url} className="max-h-full p-6 object-contain" alt="Preview Logo" />
                ) : (
                  <div className="text-center p-6">
                    <span className="text-3xl mb-2 block">🖼️</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clique para Upload</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 flex items-center justify-center transition-all">
                   <span className="opacity-0 group-hover:opacity-100 text-[10px] font-black text-blue-600 uppercase bg-white px-4 py-2 rounded-full shadow-lg">Trocar Imagem</span>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
              <p className="text-[9px] text-slate-400 text-center font-bold italic">Formatos aceitos: PNG, JPG ou SVG. Recomendado fundo transparente.</p>
            </div>

            {/* Colors Management */}
            <div className="space-y-8">
               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor Principal (Menu Lateral)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-md" 
                      value={branding.cor_primaria} 
                      onChange={e => setBranding({...branding, cor_primaria: e.target.value})} 
                    />
                    <input 
                      type="text" 
                      className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-black text-slate-700 uppercase"
                      value={branding.cor_primaria}
                      onChange={e => setBranding({...branding, cor_primaria: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor de Destaque (Botões e Ações)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-md" 
                      value={branding.cor_secundaria} 
                      onChange={e => setBranding({...branding, cor_secundaria: e.target.value})} 
                    />
                    <input 
                      type="text" 
                      className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-black text-slate-700 uppercase"
                      value={branding.cor_secundaria}
                      onChange={e => setBranding({...branding, cor_secundaria: e.target.value})}
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer"
            >
              Salvar Alterações de Marca
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Branding;
