'use client';

import React from 'react';
import { Signal, BarChart3, Binary, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming global utils

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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-indigo-100 hover:shadow-sm transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
                <Icon size={48} />
            </div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Icon size={12} />
                {label} (Qty)
            </label>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onChange(field, Math.max(0, value - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold transition-colors"
                >
                    -
                </button>
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(field, Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center font-black text-2xl text-slate-700 outline-none w-16"
                />
                <button
                    onClick={() => onChange(field, value + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold transition-colors"
                >
                    +
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    3. Distribution Matrix
                </h3>
                <div className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500 shadow-inner">
                    Total Questions: {total}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Counter label="Simple" value={counts.simple} field="simple" color="text-emerald-500" icon={Binary} />
                <Counter label="Intermediate" value={counts.intermediate} field="intermediate" color="text-indigo-500" icon={BarChart3} />
                <Counter label="Expert" value={counts.expert} field="expert" color="text-rose-500" icon={BrainCircuit} />
            </div>
        </div>
    );
}
