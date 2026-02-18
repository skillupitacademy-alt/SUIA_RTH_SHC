'use client';

import React from 'react';

interface SkillsRadarSimpleProps {
    title?: string;
    skills: Array<{ name: string; value: number }>;
}

export const SkillsRadarSimple: React.FC<SkillsRadarSimpleProps> = ({ title = 'Skill DNA', skills }) => {
    const maxValue = 100;
    const cx = 120;
    const cy = 120;
    const r = 90;
    const count = Math.max(skills.length, 3);

    const points = skills.map((s, idx) => {
        const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
        const len = (s.value / maxValue) * r;
        return {
            x: cx + len * Math.cos(angle),
            y: cy + len * Math.sin(angle),
        };
    });

    const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
            <svg viewBox="0 0 240 240" className="w-full h-auto">
                {[0.25, 0.5, 0.75, 1].map((f, i) => (
                    <polygon
                        key={i}
                        points={Array.from({ length: count }).map((_, idx) => {
                            const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
                            const len = r * f;
                            const x = cx + len * Math.cos(angle);
                            const y = cy + len * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={1}
                    />
                ))}
                {skills.map((s, idx) => {
                    const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
                    const len = r + 10;
                    const x = cx + len * Math.cos(angle);
                    const y = cy + len * Math.sin(angle);
                    return (
                        <text key={s.name} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-slate-600 font-semibold">
                            {s.name}
                        </text>
                    );
                })}
                <polygon points={polygon} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth={2} />
            </svg>
        </div>
    );
};
