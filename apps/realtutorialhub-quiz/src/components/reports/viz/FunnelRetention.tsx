'use client';

import React from 'react';

interface FunnelRetentionProps {
    title?: string;
    stages: Array<{ label: string; value: number }>;
}

export const FunnelRetention: React.FC<FunnelRetentionProps> = ({ title = 'Retention Funnel', stages }) => {
    const max = Math.max(...stages.map((s) => s.value), 1);
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</div>
            <div className="space-y-2">
                {stages.map((s) => {
                    const width = (s.value / max) * 100;
                    return (
                        <div key={s.label} className="space-y-1">
                            <div className="text-[11px] font-semibold text-slate-700 flex justify-between">
                                <span>{s.label}</span>
                                <span className="font-mono text-slate-500">{s.value}</span>
                            </div>
                            <div className="h-7 bg-slate-100 rounded-xl overflow-hidden">
                                <div
                                    className="h-full rounded-xl bg-gradient-to-r from-[#FF4B91] to-[#FF8FB1]"
                                    style={{ width: `${width}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
