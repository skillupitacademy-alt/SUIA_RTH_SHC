'use client';

import { ChevronDown, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZLoader } from '@/components/ui/ZLoader';

export interface SelectFieldProps {
    label: string;
    value: string | null;
    options: any[];
    loading: boolean;
    disabled?: boolean;
    onChange: (id: string) => void;
    onCreate?: () => void;
    placeholder: string;
    active?: boolean;
    hideCreate?: boolean;
    icon?: React.ReactNode;
}

export function SelectField({ label, value, options, loading, disabled, onChange, onCreate, placeholder, active, hideCreate, icon }: SelectFieldProps) {
    return (
        <div className={cn("flex flex-col gap-2 transition-opacity duration-300", disabled && "opacity-50 grayscale")}>
            <label className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2",
                active ? "text-[#FF4B91]" : "text-slate-400"
            )}>
                {icon && icon}
                {label}
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1 group/input">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            "w-full h-10 pl-3 pr-8 bg-white/50 border rounded-xl text-[#1A1A1A] font-bold text-xs focus:outline-none transition-all appearance-none cursor-pointer backdrop-blur-md shadow-sm",
                            "hover:bg-white/80",
                            active
                                ? "border-[#FF4B91]/30 focus:border-[#FF4B91] focus:ring-2 focus:ring-[#FF4B91]/10"
                                : "border-slate-200"
                        )}
                        disabled={disabled}
                    >
                        <option value="" disabled className="text-slate-400">{placeholder}</option>
                        {options.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-white text-slate-800 font-medium">
                                {opt.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-hover/input:text-[#FF4B91]">
                        {loading ? <ZLoader size="xs" center={false} /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
                {!hideCreate && onCreate && (
                    <button
                        type="button"
                        onClick={onCreate}
                        disabled={disabled}
                        className={cn(
                            "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all border shadow-sm",
                            active
                                ? "bg-[#FF4B91]/5 hover:bg-[#FF4B91]/10 text-[#FF4B91] border-[#FF4B91]/20"
                                : "bg-white/40 text-slate-400 border-slate-200 cursor-not-allowed"
                        )}
                        title={`Add new ${label}`}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

export interface MultiSelectFieldProps {
    label: string;
    values: string[];
    options: any[];
    loading: boolean;
    onChange: (ids: string[]) => void;
    placeholder: string;
    active?: boolean;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export function MultiSelectField({ label, values, options, loading, onChange, placeholder, active, icon, disabled }: MultiSelectFieldProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        onChange(selectedOptions);
    };

    return (
        <div className={cn("flex flex-col gap-2 transition-opacity duration-300", disabled && "opacity-50 grayscale")}>
            <label className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2",
                active ? "text-[#FF4B91]" : "text-slate-400"
            )}>
                {icon && icon}
                {label} (Multi)
            </label>
            <div className="relative flex-1">
                <select
                    multiple
                    value={values}
                    onChange={handleChange}
                    disabled={disabled}
                    className={cn(
                        "w-full h-36 p-2 bg-white/70 border rounded-2xl text-[#1A1A1A] font-bold text-xs focus:outline-none transition-all cursor-pointer backdrop-blur-md shadow-sm scrollbar-thin scrollbar-thumb-[#FF4B91]/20",
                        "hover:bg-white",
                        active
                            ? "border-[#FF4B91]/30 focus:border-[#FF4B91] focus:ring-4 focus:ring-[#FF4B91]/5 shadow-[#FF4B91]/5"
                            : "border-slate-200"
                    )}
                >
                    {loading && <option disabled className="p-2 italic opacity-50"></option>}
                    {!loading && options.length === 0 && <option disabled className="p-2 italic opacity-50">No skills available for this topic</option>}
                    {options.map((opt) => (
                        <option
                            key={opt.id}
                            value={opt.id}
                            className="bg-white text-slate-800 font-bold py-2 px-3 rounded-lg mb-1 last:mb-0 hover:bg-[#FF4B91]/5 checked:bg-[#FF4B91] checked:text-white"
                        >
                            {opt.name} {opt.category || opt.weight ? `[${(opt.category || 'N/A').toUpperCase()} | W: ${opt.weight || 1}]` : ''}
                        </option>
                    ))}
                </select>
                {loading && (
                    <div className="absolute top-2 right-2 pointer-events-none">
                        <ZLoader size="xs" center={false} />
                    </div>
                )}
                {!values.length && !loading && options.length > 0 && (
                    <div className="absolute top-4 left-4 pointer-events-none text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-40">
                        {placeholder}
                    </div>
                )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold italic tracking-tight opacity-70">
                Hold Ctrl/Cmd to select multiple mappings.
            </p>
        </div>
    );
}
