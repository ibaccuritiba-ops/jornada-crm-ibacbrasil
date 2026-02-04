// Hook para gerenciar produtos e products-deals
import { useState, useCallback } from 'react';
import { Product, DealProduct } from '../types';
import { useAuthFetch } from './useAuthFetch';

interface UseProductsReturn {
    products: Product[];
    dealProducts: DealProduct[];
    setProducts: (p: Product[]) => void;
    setDealProducts: (dp: DealProduct[]) => void;
    addProduct: (product: Omit<Product, 'id' | 'companyId'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string, justification?: string) => void;
    addDealProduct: (dealId: string, productId: string) => Promise<void>;
    deleteDealProduct: (dealProductId: string) => Promise<void>;
}

export const useProducts = (): UseProductsReturn => {
    const [products, setProducts] = useState<Product[]>([]);
    const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
    const authFetch = useAuthFetch();

    const addProduct = useCallback((product: Omit<Product, 'id' | 'companyId'>) => {
        const newProduct: Product = {
            ...product,
            id: Math.random().toString(36),
            companyId: ''
        };
        setProducts(prev => [...prev, newProduct]);
    }, []);

    const updateProduct = useCallback((product: Product) => {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    }, []);

    const deleteProduct = useCallback((id: string, justification?: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    }, []);

    const addDealProduct = useCallback(async (dealId: string, productId: string) => {
        if (!authFetch) return;
        
        const res = await authFetch('/negociacao/addproduto', {
            method: 'POST',
            body: JSON.stringify({ negociacaoId: dealId, produtoId: productId })
        });

        if (res?.ok) {
            const data = await res.json();
            if (data?.data?.produtos) {
                const allDealProds: DealProduct[] = [];
                data.data.produtos.forEach((p: any) => {
                    const prodId = p._id || p;
                    const valor = p.valor_total || p.value || 0;
                    const parcelas = p.parcelas || p.maxParcelas || 1;
                    
                    allDealProds.push({
                        id: prodId,
                        deal_id: dealId,
                        product_id: prodId,
                        valor: valor,
                        parcelas: parcelas
                    });
                });
                setDealProducts(prev => [...prev.filter(dp => dp.deal_id !== dealId), ...allDealProds]);
            }
        }
    }, [authFetch]);

    const deleteDealProduct = useCallback(async (dealProductId: string) => {
        if (!authFetch) return;
        
        const dealProduct = dealProducts.find(dp => dp.id === dealProductId);
        if (!dealProduct) return;

        const res = await authFetch('/negociacao/removeproduto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                negociacaoId: dealProduct.deal_id,
                produtoId: dealProduct.product_id
            })
        });

        if (res?.ok) {
            const data = await res.json();
            if (data?.data?.produtos) {
                const allDealProds: DealProduct[] = [];
                data.data.produtos.forEach((p: any) => {
                    const prodId = p._id || p;
                    const valor = p.valor_total || p.value || 0;
                    const parcelas = p.parcelas || p.maxParcelas || 1;
                    
                    allDealProds.push({
                        id: prodId,
                        deal_id: dealProduct.deal_id,
                        product_id: prodId,
                        valor: valor,
                        parcelas: parcelas
                    });
                });
                setDealProducts(prev => [...prev.filter(dp => dp.deal_id !== dealProduct.deal_id), ...allDealProds]);
            }
        }
    }, [authFetch, dealProducts]);

    return {
        products,
        dealProducts,
        setProducts,
        setDealProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        addDealProduct,
        deleteDealProduct
    };
};
