'use client';

import React from 'react';

type Slice = { label: string; value: number; color: string };

interface SunburstSimpleProps {
    title?: string;
    centerLabel?: string;
    slices: Slice[];
}

// Helper to convert polar coords to Cartesian
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function arcPath(cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number) {
    const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
    const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = polarToCartesian(cx, cy, rInner, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        'M', startOuter.x, startOuter.y,
        'A', rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
        'L', startInner.x, startInner.y,
        'A', rInner, rInner, 0, largeArc, 1, endInner.x, endInner.y,
        'Z',
    ].join(' ');
}

export const SunburstSimple: React.FC<SunburstSimpleProps> = ({ title = 'Sunburst', centerLabel = 'Mastery', slices }) => {
    const total = slices.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
    let currentAngle = 0;

    const paths = slices.map((s, idx) => {
        const angle = (s.value / total) * 360;
        const start = currentAngle;
        const end = currentAngle + angle;
        currentAngle = end;
        return (
            <path
                key={idx}
                d={arcPath(120, 120, 50, 110, start, end)}
                fill={s.color}
                stroke="white"
                strokeWidth={1}
                opacity={0.95}
            >
                <title>{`${s.label}: ${Math.round((s.value / total) * 100)}%`}</title>
            </path>
        );
    });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
            <svg viewBox="0 0 240 240" className="w-full h-auto">
                {paths}
                <circle cx={120} cy={120} r={45} fill="white" stroke="#e2e8f0" strokeWidth={1} />
                <text x="120" y="120" textAnchor="middle" dominantBaseline="middle" className="font-black text-slate-800" fontSize="12">
                    {centerLabel}
                </text>
            </svg>
            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                {slices.map((s) => (
                    <span key={s.label} className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-semibold text-slate-700">{s.label}</span>
                    </span>
                ))}
            </div>
        </div>
    );
};
