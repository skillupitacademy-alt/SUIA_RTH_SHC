'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { Calendar, Activity } from "lucide-react";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';
import { StableRenderGuard } from './recharts/StableRenderGuard';
import { usePdfMarkReady } from "./print/usePdfMarkReady";

type RadialBarFixedProps = React.ComponentProps<typeof RadialBar> & {
    innerRadius?: number | string;
    outerRadius?: number | string;
};

const RadialBarFixed = RadialBar as React.ComponentType<RadialBarFixedProps>;

export interface RadialKPIProps {
    data: {
        score: number;
        mastery: number;
        readiness: number;
        percentile: number;
        totalTimeSpentSeconds: number;
        timeEfficiency: 'FAST' | 'OPTIMAL' | 'SLOW';
    };
    suppressAnimation?: boolean;
}

export const RadialKPI = React.memo(({ data, suppressAnimation = false }: RadialKPIProps) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    usePdfMarkReady("print:radial-kpi");

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

    const radialData = [{
        score: data.score,
        mastery: data.mastery,
        rank: data.percentile,
        time: data.timeEfficiency === 'FAST' ? 95 : (data.timeEfficiency === 'OPTIMAL' ? 75 : 45),
    }];

    return (
        <div className="w-full h-full flex flex-col bg-[#0d111a] rounded-[2.5rem] p-8 py-[30px] lg:p-10 lg:py-[30px] border border-white/5 shadow-2xl relative overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Executive Summary</h3>
                    <p className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">Readiness Diagnostic</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-white/5 rounded-xl cursor-default">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[13px] font-bold text-slate-300">Session Metrics</span>
                </div>
            </div>

            <div className="relative flex-grow flex flex-col items-center justify-center min-h-[300px] relative z-20">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">
                        Readiness
                    </span>
                    <span className={`${data.readiness >= 100 ? 'text-5xl' : 'text-6xl'} font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]`}>
                        {data.readiness}%
                    </span>
                    {!suppressAnimation && (
                        <div className="mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                            <Activity size={12} className="text-indigo-400" />
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                AI Matrix Active
                            </span>
                        </div>
                    )}
                </div>

                <div className="w-full h-full flex items-center justify-center relative">
                    <StableRenderGuard>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <RadialBarChart
                                key={mounted ? 'mounted' : 'unmounted'}
                                cx="50%"
                                cy="50%"
                                innerRadius="30%"
                                outerRadius="80%"
                                startAngle={90}
                                endAngle={450}
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
                                    <filter id="glow_RKPI" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                <RadialBarFixed
                                    dataKey="time"
                                    innerRadius="32%"
                                    outerRadius="40%"
                                    fill="url(#violetLinear)"
                                    cornerRadius={20}
                                    background={{ fill: 'rgba(255,255,255,0.02)' }}
                                    filter="url(#glow_RKPI)"
                                    isAnimationActive={!suppressAnimation}
                                />
                                <RadialBarFixed
                                    dataKey="rank"
                                    innerRadius="47%"
                                    outerRadius="55%"
                                    fill="url(#amberLinear)"
                                    cornerRadius={20}
                                    background={{ fill: 'rgba(255,255,255,0.02)' }}
                                    filter="url(#glow_RKPI)"
                                    isAnimationActive={!suppressAnimation}
                                />
                                <RadialBarFixed
                                    dataKey="mastery"
                                    innerRadius="62%"
                                    outerRadius="70%"
                                    fill="url(#emeraldLinear)"
                                    cornerRadius={20}
                                    background={{ fill: 'rgba(255,255,255,0.02)' }}
                                    filter="url(#glow_RKPI)"
                                    isAnimationActive={!suppressAnimation}
                                />
                                <RadialBarFixed
                                    dataKey="score"
                                    innerRadius="77%"
                                    outerRadius="85%"
                                    fill="url(#cyanLinear)"
                                    cornerRadius={20}
                                    background={{ fill: 'rgba(255,255,255,0.02)' }}
                                    filter="url(#glow_RKPI)"
                                    isAnimationActive={!suppressAnimation}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </StableRenderGuard>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4 py-6 border-t border-white/5 relative z-20">
                <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Score</span>
                    <span className="text-3xl font-black text-cyan-400 tracking-tighter">{data.score}%</span>
                </div>
                <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Synthesis</span>
                    <span className="text-3xl font-black text-emerald-400 tracking-tighter">{getMasteryLabel(data.mastery)}</span>
                </div>
                <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Rank</span>
                    <span className="text-3xl font-black text-amber-500 tracking-tighter">{data.percentile}th</span>
                </div>
                <div className="flex flex-col items-center text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Efficiency</span>
                    <span className="text-3xl font-black text-violet-400 tracking-tighter">{formatTime(data.totalTimeSpentSeconds)}</span>
                </div>
            </div>

            <div className="relative z-20">
                <MethodologyDisclaimer
                    text="READINESS INDEX: HIGH-PRECISION METRIC SYNTHESIZED FROM RAW SCORE (50%), HISTORICAL TOPIC MASTERY (30%), AND PERFORMANCE CONSISTENCY VARIANCE (20%)."
                    className="max-w-none text-center"
                />
            </div>
        </div>
    );
});

RadialKPI.displayName = "RadialKPI";
