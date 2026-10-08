'use client';

import React from 'react';

interface LollipopDeltaProps {
    title?: string;
    items: Array<{ label: string; value: number; baseline: number }>;
}

export const LollipopDelta: React.FC<LollipopDeltaProps> = ({ title = 'Delta vs Baseline', items }) => {
    const max = Math.max(...items.map((i) => Math.abs(i.value - i.baseline)), 10);
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</div>
            <div className="space-y-2">
                {items.map((i) => {
                    const diff = i.value - i.baseline;
                    const bar = (Math.abs(diff) / max) * 100;
                    return (
                        <div key={i.label} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <span className="w-24 truncate">{i.label}</span>
                            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300" />
                                <div
                                    className={`h-full ${diff >= 0 ? 'bg-green-500/70' : 'bg-red-500/70'}`}
                                    style={{
                                        width: `${bar}%`,
                                        transform: `translateX(${diff >= 0 ? '0' : '-100%'})`,
                                    }}
                                />
                            </div>
                            <span className={`w-12 text-right ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {diff >= 0 ? '+' : ''}{Math.round(diff)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
