'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { Calendar, ChevronDown, Activity } from "lucide-react";

// Recharts typings don't expose per-series radii, so we cast for multi-ring styling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyRadialBar = RadialBar as unknown as React.ComponentType<any>;

export interface RadialKPIProps {
    data: {
        score: number;
        mastery: number;
        readiness: number;
        percentile: number;
        totalTimeSpentSeconds: number;
        timeEfficiency: 'FAST' | 'OPTIMAL' | 'SLOW';
    };
}

export const RadialKPI = React.memo(({ data }: RadialKPIProps) => {
    // Labels matching the high-fidelity request
    const getMasteryLabel = (val: number) => {
        if (val >= 90) return "Expert";
        if (val >= 75) return "Advanced";
        if (val >= 60) return "Intermediate";
        return "Beginner";
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const rings = [
        { key: "score", value: data.score, label: "Score", sub: `${data.score}%`, color: "url(#cyanLinear)", inner: "88%", outer: "95%" },
        { key: "mastery", value: data.mastery, label: "Mastery", sub: getMasteryLabel(data.mastery), color: "url(#emeraldLinear)", inner: "74%", outer: "81%" },
        { key: "rank", value: data.percentile, label: "Rank", sub: `${data.percentile}th Percentile`, color: "url(#amberLinear)", inner: "60%", outer: "67%" },
        { key: "time", value: data.timeEfficiency === 'FAST' ? 95 : (data.timeEfficiency === 'OPTIMAL' ? 75 : 45), label: "Time Efficiency", sub: formatTime(data.totalTimeSpentSeconds), color: "url(#violetLinear)", inner: "46%", outer: "53%" },
    ];

    const chartData = rings.map(r => ({ name: r.label, value: r.value, fill: r.color }));

    return (
        <div className="w-full h-full flex flex-col bg-[#0d111a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header section matching image */}
            <div className="flex items-center justify-between mb-2 relative z-20">
                <h3 className="text-xl font-bold text-white tracking-tight">KPI Chart</h3>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-white/5 rounded-xl cursor-default hover:bg-slate-800/80 transition-colors">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-300">Performance</span>
                    <ChevronDown size={14} className="text-slate-500" />
                </div>
            </div>

            <div className="relative flex-grow flex items-center justify-center">
                {/* Labels at top/bottom of rings matching image */}
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-between py-6">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Score</span>
                        <span className="text-sm font-black text-cyan-400 tracking-tighter">{data.score}%</span>
                    </div>
                    <div className="flex flex-col items-center mb-12">
                        <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest mb-0.5">Top 1%</span>
                        <span className="text-[10px] font-bold text-amber-500/40">99th Percentile</span>
                    </div>
                </div>

                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center pt-24">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Mastery</span>
                        <span className="text-xs font-bold text-emerald-400/60 uppercase">{getMasteryLabel(data.mastery)}</span>
                    </div>
                </div>

                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-end pb-12">
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-emerald-400 tracking-tighter">{formatTime(data.totalTimeSpentSeconds)}</span>
                        <span className="text-[9px] font-black text-emerald-400/40 uppercase tracking-widest">Fast</span>
                    </div>
                </div>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <div className="relative">
                        {/* Glow Filter behind center text */}
                        <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                        <div className="flex flex-col items-center relative gap-0.5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Score</span>
                            <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                {data.score}%
                            </span>
                            <div className="mt-2 p-2 bg-white/5 rounded-xl border border-white/5">
                                <Activity size={16} className="text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Radial Chart */}
                <div className="w-[480px] h-[480px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="35%"
                            outerRadius="100%"
                            startAngle={90}
                            endAngle={450}
                            barSize={12}
                            data={chartData}
                        >
                            <defs>
                                <linearGradient id="cyanLinear" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                                <linearGradient id="emeraldLinear" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#10b981" />
                                    <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                                <linearGradient id="amberLinear" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#fbbf24" />
                                </linearGradient>
                                <linearGradient id="violetLinear" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#a78bfa" />
                                </linearGradient>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <AnyRadialBar
                                dataKey="value"
                                cornerRadius={20}
                                background={{ fill: 'rgba(255,255,255,0.03)' }}
                                filter="url(#glow)"
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

RadialKPI.displayName = "RadialKPI";
