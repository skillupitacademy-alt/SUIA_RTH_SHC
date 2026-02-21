'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

// Recharts typings don't expose per-series radii, so we cast for multi-ring styling.
const AnyRadialBar = RadialBar as unknown as React.ComponentType<any>;

export interface RadialKPIProps {
    data: {
        score: number;
        mastery: number;
        readiness: number;
    };
}

export const RadialKPI = React.memo(({ data }: RadialKPIProps) => {
    const rings = [
        { key: "score", dataKey: "score", color: "url(#scoreGradient)", inner: "65%", outer: "95%" },
        { key: "mastery", dataKey: "mastery", color: "url(#masteryGradient)", inner: "50%", outer: "78%" },
        { key: "readiness", dataKey: "readiness", color: "url(#readinessGradient)", inner: "35%", outer: "58%" },
    ];
    const chartData = [{ score: data.score, mastery: data.mastery, readiness: data.readiness }];

    return (
        <div className="w-full h-[320px] flex flex-col items-center justify-center relative">
            {/* dotted guide */}
            <div className="absolute inset-6 rounded-full border border-dashed border-white/5 pointer-events-none" />

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Overall Readiness</span>
                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{Math.round((data.score + data.mastery + data.readiness) / 3)}%</span>
                <div className="mt-2 text-[10px] text-slate-400 font-bold space-x-3 uppercase tracking-[0.2em]">
                    <span>Score {data.score}%</span>
                    <span>Mastery {data.mastery}%</span>
                    <span>Readiness {data.readiness}%</span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={450}
                    data={chartData}
                >
                    <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                        <linearGradient id="masteryGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#a3e635" />
                        </linearGradient>
                        <linearGradient id="readinessGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />

                    {rings.map((ring) => (
                        <AnyRadialBar
                            key={ring.key}
                            dataKey={ring.dataKey}
                            cornerRadius={20}
                            fill={ring.color}
                            background={{ fill: 'rgba(255,255,255,0.03)' }}
                            innerRadius={ring.inner}
                            outerRadius={ring.outer}
                            barSize={12}
                            filter="url(#glow)"
                            animationDuration={1400}
                            animationEasing="ease-out"
                        />
                    ))}
                </RadialBarChart>
            </ResponsiveContainer>

            <div className="flex gap-6 mt-2 pb-4">
                {[
                    { name: "Score", fill: "#06b6d4" },
                    { name: "Mastery", fill: "#10b981" },
                    { name: "Readiness", fill: "#f59e0b" }
                ].map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-full border border-white/5">
                        <div className="h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: item.fill }} />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

RadialKPI.displayName = "RadialKPI";
