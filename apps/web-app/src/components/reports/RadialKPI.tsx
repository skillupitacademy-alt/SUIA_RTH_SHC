'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, type RadialBarProps } from "recharts";
import { Calendar, Activity, Trophy, Timer, Target } from "lucide-react";

const AnyRadialBar = RadialBar as unknown as React.ComponentType<RadialBarProps>;

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
        { key: "score", value: data.score, fill: "url(#cyanLinear)" },
        { key: "mastery", value: data.mastery, fill: "url(#emeraldLinear)" },
        { key: "rank", value: data.percentile, fill: "url(#amberLinear)" },
        { key: "time", value: data.timeEfficiency === 'FAST' ? 95 : (data.timeEfficiency === 'OPTIMAL' ? 75 : 45), fill: "url(#violetLinear)" },
    ];

    return (
        <div className="w-full h-full flex flex-col bg-[#0d111a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-20">
                <h3 className="text-xl font-bold text-white tracking-tight uppercase">Executive Summary</h3>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-white/5 rounded-xl cursor-default">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[13px] font-bold text-slate-300">Session Metrics</span>
                </div>
            </div>

            <div className="relative flex-grow flex flex-col items-center justify-center">
                {/* Stats Grid Overlay - Fixed Quadrants */}
                <div className="absolute inset-0 z-10 pointer-events-none grid grid-cols-2 grid-rows-2 gap-4 p-6">
                    {/* Top Left: Score */}
                    <div className="flex flex-col items-start justify-start p-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Target size={14} className="text-cyan-400" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Score</span>
                        </div>
                        <span className="text-[18px] font-black text-white">{data.score}%</span>
                    </div>

                    {/* Top Right: Mastery */}
                    <div className="flex flex-col items-end justify-start p-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Synthesis</span>
                            <Activity size={14} className="text-emerald-400" />
                        </div>
                        <span className="text-[18px] font-black text-emerald-400">{getMasteryLabel(data.mastery)}</span>
                    </div>

                    {/* Bottom Left: Rank */}
                    <div className="flex flex-col items-start justify-end p-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy size={14} className="text-amber-400" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
                        </div>
                        <span className="text-[18px] font-black text-amber-500">{data.percentile}th</span>
                    </div>

                    {/* Bottom Right: Time */}
                    <div className="flex flex-col items-end justify-end p-2">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                            <Timer size={14} className="text-violet-400" />
                        </div>
                        <span className="text-[18px] font-black text-violet-400">{formatTime(data.totalTimeSpentSeconds)}</span>
                    </div>
                </div>

                {/* Center Core Content */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Readiness</span>
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                                {data.readiness}%
                            </span>
                        </div>
                        <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <Activity size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Matrix Active</span>
                        </div>
                    </div>
                </div>

                {/* Main Radial Chart - Scaled down slightly more for collision safety */}
                <div className="w-[410px] h-[410px] flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="35%"
                            outerRadius="85%"
                            startAngle={90}
                            endAngle={450}
                            barSize={12}
                            data={rings}
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
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <AnyRadialBar
                                dataKey="value"
                                cornerRadius={20}
                                background={{ fill: 'rgba(255,255,255,0.02)' }}
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
