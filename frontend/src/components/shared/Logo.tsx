
import React from 'react';

interface LogoProps {
    variant?: 'light' | 'dark';
    size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md' }) => {
    const sizes = {
        sm: { icon: 'w-6 h-6', text: 'text-lg', dot: 'w-1 h-1' },
        md: { icon: 'w-8 h-8', text: 'text-2xl', dot: 'w-1.5 h-1.5' },
        lg: { icon: 'w-12 h-12', text: 'text-4xl', dot: 'w-2 h-2' }
    };

    const current = sizes[size];
    const isLight = variant === 'light';

    return (
        <div className="flex items-center gap-3 select-none group">
            <div className={`relative ${current.icon} flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform`}>
                <svg viewBox="0 0 24 24" className="w-2/3 h-2/3 text-white fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                </svg>
            </div>

            <div className="flex flex-col leading-none">
                <h1 className={`font-black tracking-tighter ${current.text} ${isLight ? 'text-white' : 'text-slate-900'}`}>
                    Jornada<span className="text-blue-600">CRM</span>
                </h1>
                <div className="flex items-center gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>
                        IbacBrasil
                    </span>
                    <div className={`${current.dot} rounded-full bg-blue-500 animate-pulse`}></div>
                </div>
            </div>
        </div>
    );
};

export default Logo;

