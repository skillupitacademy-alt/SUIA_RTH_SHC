'use client';

import React from 'react';

interface VelocityLineProps {
    title?: string;
    points: Array<{ label: string; value: number }>;
}

export const VelocityLine: React.FC<VelocityLineProps> = ({ title = 'Learning Velocity', points }) => {
    if (points.length === 0) return null;
    const max = Math.max(...points.map((p) => p.value), 1);
    const width = 260;
    const height = 140;
    const step = width / Math.max(points.length - 1, 1);
    const polyline = points
        .map((p, idx) => {
            const x = idx * step;
            const y = height - (p.value / max) * (height - 20);
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <defs>
                    <linearGradient id="vel-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polyline points={polyline} fill="url(#vel-fill)" stroke="none" />
                <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth={3} strokeLinecap="round" />
                {points.map((p, idx) => {
                    const x = idx * step;
                    const y = height - (p.value / max) * (height - 20);
                    return (
                        <circle key={p.label} cx={x} cy={y} r={3.5} fill="#1d4ed8">
                            <title>{`${p.label}: ${p.value}`}</title>
                        </circle>
                    );
                })}
            </svg>
            <div className="flex gap-2 flex-wrap text-[11px] text-slate-500 mt-2">
                {points.map((p) => (
                    <span key={p.label} className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 font-semibold">{p.label}</span>
                ))}
            </div>
        </div>
    );
};
