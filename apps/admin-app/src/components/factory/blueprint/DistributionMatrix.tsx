'use client';

import React from 'react';
import { Signal, BarChart3, Binary, BrainCircuit, Plus, Minus, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DistributionMatrixProps {
    counts: {
        simple: number;
        intermediate: number;
        expert: number;
    };
    onChange: (field: 'simple' | 'intermediate' | 'expert', value: number) => void;
}

export function DistributionMatrix({ counts, onChange }: DistributionMatrixProps) {
    const total = counts.simple + counts.intermediate + counts.expert;

    const Counter = ({
        label,
        value,
        field,
        color,
        icon: Icon
    }: {
        label: string;
        value: number;
        field: keyof typeof counts;
        color: string;
        icon: any;
    }) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-[#FF4B91]/20 hover:shadow-xl hover:shadow-[#FF4B91]/5 transition-all relative overflow-hidden group">
            {/* Background Icon Watermark */}
            <div className={cn("absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12", color)}>
                <Icon size={80} />
            </div>

            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Icon size={14} className={color} />
                {label} (Volume)
            </label>

            <div className="flex items-center gap-4 relative z-10">
                <button
                    onClick={() => onChange(field, Math.max(0, value - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all active:scale-90"
                >
                    <Minus size={16} />
                </button>

                <style jsx>{`
                    input::-webkit-outer-spin-button,
                    input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type=number] {
                        -moz-appearance: textfield;
                    }
                `}</style>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(field, Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center font-black text-3xl text-[#1A1A1A] outline-none bg-transparent"
                />

                <button
                    onClick={() => onChange(field, (Number(value) || 0) + 1)}
                    className="w-10 h-10 rounded-xl bg-[#FF4B91]/5 border border-[#FF4B91]/20 hover:bg-[#FF4B91]/10 flex items-center justify-center text-[#FF4B91] transition-all active:scale-90 shadow-sm"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                        2. Quantum Distribution
                    </h3>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black text-[#FF4B91] uppercase tracking-widest shadow-2xl">
                    <Calculator size={14} /> Total: {total} Assets
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Counter label="Simple" value={counts.simple} field="simple" color="text-emerald-500" icon={Binary} />
                <Counter label="Intermediate" value={counts.intermediate} field="intermediate" color="text-indigo-500" icon={BarChart3} />
                <Counter label="Expert" value={counts.expert} field="expert" color="text-rose-500" icon={BrainCircuit} />
            </div>
        </div>
    );
}
