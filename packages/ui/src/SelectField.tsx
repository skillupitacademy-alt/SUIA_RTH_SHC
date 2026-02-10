'use client';

import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { ZLoader } from './ZLoader';

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
    accentColor?: string;
}

export function SelectField({
    label,
    value,
    options,
    loading,
    disabled,
    onChange,
    onCreate,
    placeholder,
    active,
    hideCreate,
    icon,
    accentColor = '#FF4B91'
}: SelectFieldProps) {
    const activeStyles = active ? {
        borderColor: `${accentColor}66`, // 40% opacity
        boxShadow: `0 10px 15px -3px ${accentColor}0D` // 5% opacity
    } : {};

    return (
        <div className={`flex flex-col gap-2 transition-opacity duration-300 ${disabled ? "opacity-50 grayscale" : ""}`}>
            <label className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2 ${active ? "" : "text-slate-500"}`}
                style={active ? { color: accentColor } : {}}>
                {icon && icon}
                {label}
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1 group/input">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full h-11 pl-3 pr-8 bg-white/50 border rounded-xl text-[#1A1A1A] font-bold text-[13px] focus:outline-none transition-all appearance-none cursor-pointer backdrop-blur-md shadow-sm hover:bg-white/80 ${active ? "ring-2" : "border-slate-300"
                            }`}
                        style={{
                            ...activeStyles,
                            ...(active ? { ringColor: `${accentColor}1A` } : {})
                        }}
                        disabled={disabled}
                    >
                        <option value="" disabled className="text-slate-400">{placeholder}</option>
                        {options.map((opt) => (
                            <option key={opt.id || opt.dimensionId} value={opt.id || opt.dimensionId} className="bg-white text-slate-800 font-medium">
                                {opt.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 transition-colors group-hover/input:text-[#FF4B91]">
                        {loading ? <ZLoader size="xs" center={false} color={accentColor} /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
                {!hideCreate && onCreate && (
                    <button
                        type="button"
                        onClick={onCreate}
                        disabled={disabled}
                        className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl transition-all border shadow-sm ${active
                                ? "hover:bg-opacity-10 border-opacity-30"
                                : "bg-white/40 text-slate-500 border-slate-300 cursor-not-allowed"
                            }`}
                        style={active ? {
                            backgroundColor: `${accentColor}0D`,
                            color: accentColor,
                            borderColor: `${accentColor}4D`
                        } : {}}
                        title={`Add new ${label}`}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
