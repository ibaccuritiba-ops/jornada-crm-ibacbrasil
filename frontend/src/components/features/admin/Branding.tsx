import React, { useState, useRef, useEffect } from 'react';
import { Palette, Image } from 'lucide-react';
import { useCRM } from '../../../store';

const Branding: React.FC = () => {
    const { currentCompany, updateCompany } = useCRM();

    // Ajuste: Nomes dos campos conforme EmpresaModel
    const [branding, setBranding] = useState({
        logo_url: currentCompany?.logo_url || '',
        cor_principal: currentCompany?.cor_principal || '#0f172a',
        cor_destaque: currentCompany?.cor_destaque || '#2563eb'
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentCompany) {
            setBranding({
                logo_url: currentCompany.logo_url || '',
                cor_principal: currentCompany.cor_principal,
                cor_destaque: currentCompany.cor_destaque
            });
        }
    }, [currentCompany]);

    const handleUpdateBranding = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCompany) return;
        // Envia para o Backend com os campos corretos
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
                    <Palette className="w-6 h-6" />
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
                                        <Image className="w-12 h-12 mb-2 mx-auto text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clique para Upload</span>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                        </div>

                        {/* Colors Management */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor Principal (Menu Lateral)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-md"
                                        value={branding.cor_principal}
                                        onChange={e => setBranding({ ...branding, cor_principal: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-black text-slate-700 uppercase"
                                        value={branding.cor_principal}
                                        onChange={e => setBranding({ ...branding, cor_principal: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor de Destaque (Botões e Ações)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-md"
                                        value={branding.cor_destaque}
                                        onChange={e => setBranding({ ...branding, cor_destaque: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-black text-slate-700 uppercase"
                                        value={branding.cor_destaque}
                                        onChange={e => setBranding({ ...branding, cor_destaque: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all cursor-pointer"
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
