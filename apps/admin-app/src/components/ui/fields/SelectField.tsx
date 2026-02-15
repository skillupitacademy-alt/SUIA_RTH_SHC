import { Loader2 } from 'lucide-react';
import React from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string | number; label: string }[];
    isLoading?: boolean;
    error?: string;
    placeholder?: string;
}

export function SelectField({ label, options, isLoading, error, className, ...props }: SelectFieldProps) {
    return (
        <div className="space-y-1.5 w-full">
            {label !== undefined ? <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                {label}
            </label> : null}
            <div className="relative">
                <select
                    {...props}
                    disabled={props.disabled || isLoading}
                    className={`
                        w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 
                        appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                        disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm
                        ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : ''}
                        ${className}
                    `}
                >
                    <option value="" disabled selected={!props.value}>
                        {props.placeholder || "Select option..."}
                    </option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    ) : (
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
            </div>
            {error !== undefined ? <p className="text-xs text-rose-500 font-medium">{error}</p> : null}
        </div>
    );
}
