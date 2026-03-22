'use client';

import React from 'react';

interface TreemapSimpleProps {
    title?: string;
    items: Array<{ label: string; value: number; color?: string }>;
}

export const TreemapSimple: React.FC<TreemapSimpleProps> = ({ title = 'Knowledge Volume', items }) => {
    const total = items.reduce((sum, i) => sum + (i.value || 0), 0) || 1;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
            <div className="flex flex-wrap w-full rounded-xl overflow-hidden border border-slate-100">
                {items.map((i) => {
                    const w = `${Math.max((i.value / total) * 100, 5)}%`;
                    return (
                        <div
                            key={i.label}
                            className="h-20 relative flex items-end p-2 text-[10px] font-bold text-white"
                            style={{ width: w, background: i.color ?? '#64748b' }}
                            title={`${i.label}: ${i.value}`}
                        >
                            <span className="truncate">{i.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
