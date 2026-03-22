'use client';

import React from 'react';

interface DonutSnapshotProps {
    title?: string;
    correct: number;
    incorrect: number;
    skipped: number;
}

export const DonutSnapshot: React.FC<DonutSnapshotProps> = ({ title = 'Snapshot', correct, incorrect, skipped }) => {
    const total = Math.max(correct + incorrect + skipped, 1);
    const pct = (n: number) => (n / total) * 100;
    const stroke = 14;
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const segments = [
        { value: correct, color: '#10b981', label: 'Correct' },
        { value: incorrect, color: '#ef4444', label: 'Incorrect' },
        { value: skipped, color: '#cbd5e1', label: 'Skipped' },
    ];
    let offset = 0;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
            <div className="flex items-center gap-4">
                <svg width="160" height="160" viewBox="0 0 160 160">
                    {segments.map((s, idx) => {
                        const len = (s.value / total) * circ;
                        const dasharray = `${len} ${circ - len}`;
                        const el = (
                            <circle
                                key={idx}
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={stroke}
                                strokeDasharray={dasharray}
                                strokeDashoffset={-offset}
                                strokeLinecap="round"
                            />
                        );
                        offset += len;
                        return el;
                    })}
                    <text x="80" y="82" textAnchor="middle" className="font-black text-slate-800" fontSize="16">
                        {Math.round(pct(correct))}%
                    </text>
                </svg>
                <div className="text-xs space-y-1">
                    {segments.map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="font-semibold text-slate-700">{s.label}</span>
                            <span className="text-slate-500 font-mono">{Math.round(pct(s.value))}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
