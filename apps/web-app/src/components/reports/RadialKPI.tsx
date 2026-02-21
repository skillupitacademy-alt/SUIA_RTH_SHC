'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { Calendar, Activity, Trophy, Timer, Target } from "lucide-react";

// Recharts typing is strict; cast to allow per-ring radii and filters.
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

    // Single data row with separate keys for each ring
    const radialData = [{
        score: data.score,
        mastery: data.mastery,
        rank: data.percentile,
        time: data.timeEfficiency === 'FAST' ? 95 : (data.timeEfficiency === 'OPTIMAL' ? 75 : 45),
    }];

    return (
        <div className="w-full h-full flex flex-col bg-[#0d111a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Corner Stat Grid - FIXED POSITIONING */}
            <div className="absolute inset-x-8 inset-y-24 lg:inset-x-10 lg:inset-y-28 z-30 pointer-events-none">
                <div className="w-full h-full flex flex-col justify-between">
                    <div className="flex justify-between">
                        {/* Top Left: Score */}
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-cyan-400" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Score</span>
                            </div>
                            <span className="text-[20px] font-black text-white leading-none">{data.score}%</span>
                        </div>

                        {/* Top Right: Synthesis */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Synthesis</span>
                                <Activity size={14} className="text-emerald-400" />
                            </div>
                            <span className="text-[20px] font-black text-emerald-400 leading-none">{getMasteryLabel(data.mastery)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        {/* Bottom Left: Rank */}
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <Trophy size={14} className="text-amber-400" />
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Rank</span>
                            </div>
                            <span className="text-[20px] font-black text-amber-500 leading-none">{data.percentile}th</span>
                        </div>

                        {/* Bottom Right: Efficiency */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">Efficiency</span>
                                <Timer size={14} className="text-violet-400" />
                            </div>
                            <span className="text-[20px] font-black text-violet-400 leading-none">{formatTime(data.totalTimeSpentSeconds)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 relative z-20">
                <h3 className="text-xl font-bold text-white tracking-tight uppercase">Executive Summary</h3>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-white/5 rounded-xl cursor-default">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[13px] font-bold text-slate-300">Session Metrics</span>
                </div>
            </div>

            <div className="relative flex-grow flex flex-col items-center justify-center">
                {/* Center Core Content */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <span className="text-[13px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Readiness</span>
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                            <span className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                                {data.readiness}%
                            </span>
                        </div>
                        <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <Activity size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Matrix Active</span>
                        </div>
                    </div>
                </div>

                {/* Main Radial Chart - Layered Rings */}
                <div className="w-[430px] h-[430px] flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="95%"
                            startAngle={90}
                            endAngle={450}
                            barSize={12}
                            data={radialData}
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
                                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />

                            {/* Inner Ring: Time Efficiency */}
                            <AnyRadialBar
                                dataKey="time"
                                innerRadius="40%"
                                outerRadius="40%"
                                fill="url(#violetLinear)"
                                cornerRadius={20}
                                background={{ fill: 'rgba(255,255,255,0.02)' }}
                                filter="url(#glow)"
                            />

                            {/* Middle Ring 1: Rank */}
                            <AnyRadialBar
                                dataKey="rank"
                                innerRadius="55%"
                                outerRadius="55%"
                                fill="url(#amberLinear)"
                                cornerRadius={20}
                                background={{ fill: 'rgba(255,255,255,0.02)' }}
                                filter="url(#glow)"
                            />

                            {/* Middle Ring 2: Mastery */}
                            <AnyRadialBar
                                dataKey="mastery"
                                innerRadius="70%"
                                outerRadius="70%"
                                fill="url(#emeraldLinear)"
                                cornerRadius={20}
                                background={{ fill: 'rgba(255,255,255,0.02)' }}
                                filter="url(#glow)"
                            />

                            {/* Outer Ring: Score */}
                            <AnyRadialBar
                                dataKey="score"
                                innerRadius="85%"
                                outerRadius="85%"
                                fill="url(#cyanLinear)"
                                cornerRadius={20}
                                background={{ fill: 'rgba(255,255,255,0.02)' }}
                                filter="url(#glow)"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});

RadialKPI.displayName = "RadialKPI";
