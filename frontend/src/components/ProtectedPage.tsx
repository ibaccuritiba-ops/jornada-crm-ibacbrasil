import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { AlertCircle } from 'lucide-react';

interface ProtectedPageProps {
    requiredPermission: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const ProtectedPage: React.FC<ProtectedPageProps> = ({ 
    requiredPermission, 
    children, 
    fallback 
}) => {
    const { canAccess } = usePermissions();

    if (!canAccess(requiredPermission)) {
        return fallback || (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-sm border border-slate-200 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Acesso Negado</h1>
                    <p className="text-slate-600 mb-6">
                        Você não tem permissão para acessar esta página. Entre em contato com o proprietário da conta para solicitar acesso.
                    </p>
                    <a 
                        href="/" 
                        className="inline-block action-bg text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-95 transition-all"
                    >
                        Voltar ao Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
