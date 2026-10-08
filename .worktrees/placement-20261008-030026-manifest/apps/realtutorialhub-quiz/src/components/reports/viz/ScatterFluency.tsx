'use client';

import React from 'react';

interface ScatterFluencyProps {
    title?: string;
    points: Array<{ x: number; y: number; label: string; correct: boolean }>;
}

export const ScatterFluency: React.FC<ScatterFluencyProps> = ({ title = 'Fluency Scatter', points }) => {
    if (points.length === 0) return null;
    const maxX = Math.max(...points.map((p) => p.x), 1);
    const maxY = Math.max(...points.map((p) => p.y), 1);
    const width = 280;
    const height = 200;
    const xMid = maxX / 2;
    const yMid = maxY / 2;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Axes */}
                <line x1={40} y1={20} x2={40} y2={height - 30} stroke="#e2e8f0" strokeWidth={1} />
                <line x1={40} y1={height - 30} x2={width - 12} y2={height - 30} stroke="#e2e8f0" strokeWidth={1} />

                {/* Quadrant guides */}
                <line
                    x1={40 + (xMid / maxX) * (width - 60)}
                    y1={20}
                    x2={40 + (xMid / maxX) * (width - 60)}
                    y2={height - 30}
                    stroke="#cbd5e1"
                    strokeDasharray="4 4"
                    strokeWidth={0.75}
                />
                <line
                    x1={40}
                    y1={(height - 30) - (yMid / maxY) * (height - 50)}
                    x2={width - 12}
                    y2={(height - 30) - (yMid / maxY) * (height - 50)}
                    stroke="#cbd5e1"
                    strokeDasharray="4 4"
                    strokeWidth={0.75}
                />

                {/* Quadrant labels */}
                <text x={60} y={32} className="text-[9px] fill-slate-500 font-semibold">Fast & Accurate</text>
                <text x={width - 90} y={32} textAnchor="end" className="text-[9px] fill-slate-500 font-semibold">Slow & Accurate</text>
                <text x={60} y={height - 8} className="text-[9px] fill-slate-500 font-semibold">Fast & Inaccurate</text>
                <text x={width - 90} y={height - 8} textAnchor="end" className="text-[9px] fill-slate-500 font-semibold">Slow & Inaccurate</text>

                {/* Points */}
                {points.map((p, idx) => {
                    const x = 40 + (p.x / maxX) * (width - 60);
                    const y = (height - 30) - (p.y / maxY) * (height - 50);
                    return (
                        <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r={4.5}
                            fill={p.correct ? '#10b981' : '#ef4444'}
                            opacity={0.9}
                        >
                            <title>{`${p.label}: ${p.y}% accuracy, ${p.x}s`}</title>
                        </circle>
                    );
                })}

                {/* Axis labels */}
                <text x={width / 2} y={height - 6} textAnchor="middle" className="text-[10px] fill-slate-500 font-semibold">
                    Time per question (s)
                </text>
                <text
                    x={14}
                    y={height / 2}
                    transform={`rotate(-90 14 ${height / 2})`}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-500 font-semibold"
                >
                    Accuracy (%)
                </text>
            </svg>
            <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Correct</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Incorrect</span>
            </div>
        </div>
    );
};
