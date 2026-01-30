
import React, { useState, useMemo } from 'react';
import { useCRM } from '../store';
import { Product } from '../types';

const Products: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useCRM();
    const [showModal, setShowModal] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState({ nome: '', valor_total: 0, parcelas: 1 });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            !p.deletado && p.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.nome.trim()) return;

        if (editingProductId) {
            const existing = products.find(p => p.id === editingProductId);
            if (existing) {
                updateProduct({
                    ...existing,
                    ...newProduct
                } as Product);
            }
        } else {
            addProduct(newProduct);
        }

        setNewProduct({ nome: '', valor_total: 0, parcelas: 1 });
        setEditingProductId(null);
        setShowModal(false);
    };

    const handleEdit = (product: Product) => {
        setEditingProductId(product.id);
        setNewProduct({
            nome: product.nome,
            valor_total: product.valor_total,
            parcelas: product.parcelas
        });
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingProductId(null);
        setNewProduct({ nome: '', valor_total: 0, parcelas: 1 });
    };

    const handleDelete = (id: string, nome: string) => {
        const reason = prompt(`Deseja excluir permanentemente o produto "${nome}"? Informe o motivo:`);
        if (reason && reason.trim()) {
            deleteProduct(id, reason.trim());
        } else if (reason !== null) {
            alert("Motivo obrigatório para exclusão.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 px-4 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">📦</div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Catálogo de Produtos</h3>
                            <p className="text-sm text-slate-500 font-medium">Itens disponíveis para oferta comercial</p>
                        </div>
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                        <input
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            placeholder="Buscar por nome do produto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={() => { setEditingProductId(null); setShowModal(true); }}
                    className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                    + Novo Produto
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-6">Produto / Serviço</th>
                            <th className="px-6 py-6">Valor Total</th>
                            <th className="px-6 py-6 text-center">Máx. Parcelas</th>
                            <th className="px-6 py-6 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-medium">Nenhum produto localizado.</td>
                            </tr>
                        ) : filteredProducts.map(product => {
                            return (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-800 text-sm">{product.nome}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-black text-slate-700">R$ {product.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                                {product.parcelas}x Parcelas
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                                                title="Editar Produto"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(String(product.id), product.nome)}
                                                className="p-3 transition-all cursor-pointer text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                                                title="Excluir Produto"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in duration-200 overflow-hidden">
                        <div className="p-8 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingProductId ? 'Editar Item' : 'Novo Item de Catálogo'}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome do Produto</label>
                                <input required autoFocus className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 placeholder:text-slate-400" placeholder="Ex: Pós-Graduação em Direito" value={newProduct.nome} onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Valor Total (R$)</label>
                                    <input required type="number" step="0.01" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 placeholder:text-slate-400" value={newProduct.valor_total} onChange={(e) => setNewProduct({ ...newProduct, valor_total: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Máx. Parcelas</label>
                                    <input required type="number" min="1" className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-900 placeholder:text-slate-400" value={newProduct.parcelas} onChange={(e) => setNewProduct({ ...newProduct, parcelas: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={handleClose} className="flex-1 px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Cancelar</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 cursor-pointer transition-all active:scale-95">
                                    {editingProductId ? 'Salvar Alterações' : 'Salvar Produto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
