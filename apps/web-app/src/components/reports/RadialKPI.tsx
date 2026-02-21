'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export interface RadialKPIProps {
    data: {
        score: number;
        mastery: number;
        readiness: number;
    };
}

export const RadialKPI = React.memo(({ data }: RadialKPIProps) => {
    const chartData = [
        { name: "Score", value: data.score, fill: "url(#scoreGradient)" },
        { name: "Mastery", value: data.mastery, fill: "url(#masteryGradient)" },
        { name: "Readiness", value: data.readiness, fill: "url(#readinessGradient)" }
    ];

    return (
        <div className="w-full h-[320px] flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Composite</span>
                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{data.score}%</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    innerRadius="35%"
                    outerRadius="100%"
                    data={chartData}
                    startAngle={90}
                    endAngle={450}
                    barSize={12}
                >
                    <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <linearGradient id="masteryGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                        <linearGradient id="readinessGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                    </defs>
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                    />
                    <RadialBar
                        background={{ fill: 'rgba(255,255,255,0.03)' }}
                        dataKey="value"
                        cornerRadius={15}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                </RadialBarChart>
            </ResponsiveContainer>

            <div className="flex gap-6 mt-2 pb-4">
                {[
                    { name: "Score", fill: "#6366f1" },
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
