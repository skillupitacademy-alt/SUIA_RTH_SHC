'use client';

import React from 'react';

interface DifficultyGroupedBarsProps {
    title?: string;
    bars: Array<{ label: string; simple: number; intermediate: number; expert: number }>;
}

const colors = {
    simple: '#10b981',
    intermediate: '#f59e0b',
    expert: '#ef4444',
};

export const DifficultyGroupedBars: React.FC<DifficultyGroupedBarsProps> = ({ title = 'Difficulty Bridge', bars }) => {
    const max = 100;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</div>
            <div className="space-y-3">
                {bars.map((b) => (
                    <div key={b.label} className="space-y-1">
                        <div className="text-xs font-bold text-slate-700">{b.label}</div>
                        <div className="flex items-end gap-2">
                            {(['simple', 'intermediate', 'expert'] as const).map((k) => {
                                const val = b[k];
                                return (
                                    <div key={k} className="flex-1">
                                        <div className="h-20 w-full bg-slate-100 rounded-lg overflow-hidden">
                                            <div
                                                style={{ height: `${Math.min(val, max)}%`, background: colors[k] }}
                                                className="w-full rounded-b-lg transition-all"
                                            />
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-slate-500 mt-1 text-center">{k}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
