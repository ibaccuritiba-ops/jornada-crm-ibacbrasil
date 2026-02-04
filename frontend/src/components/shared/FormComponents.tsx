import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className, ...props }) => {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-bold text-slate-600 uppercase">{label}</label>}
            <input
                {...props}
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } ${className}`}
            />
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string | number; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({ label, error, options, className, ...props }) => {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-bold text-slate-600 uppercase">{label}</label>}
            <select
                {...props}
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error ? 'border-red-500 bg-red-50' : 'border-slate-300'
                } ${className}`}
            >
                <option value="">Selecione uma opção</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
    );
};

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
}

export const FormButton: React.FC<FormButtonProps> = ({ 
    variant = 'primary', 
    loading = false, 
    children, 
    className,
    disabled,
    ...props 
}) => {
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
        danger: 'bg-red-600 text-white hover:bg-red-700'
    };

    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                variantClasses[variant]
            } ${className}`}
        >
            {loading ? '...' : children}
        </button>
    );
};
