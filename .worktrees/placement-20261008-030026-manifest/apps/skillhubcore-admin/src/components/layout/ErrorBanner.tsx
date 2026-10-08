import { ShieldAlert, X } from 'lucide-react';
import React from 'react';

interface ErrorBannerProps {
    message: string;
    onClose: () => void;
}

export function ErrorBanner({ message, onClose }: ErrorBannerProps) {
    return (
        <div className="fixed top-20 right-8 z-[300] animate-in slide-in-from-right-10 duration-500">
            <div className="bg-white border border-red-200 rounded-2xl shadow-2xl p-5 flex items-center gap-4 max-w-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1.5 bg-red-500" />
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <ShieldAlert size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Security Error</p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}
