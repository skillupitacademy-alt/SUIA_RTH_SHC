'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MoreHorizontal, Clock } from "lucide-react";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';

export interface TimeSpentDonutProps {
    data: {
        totalSeconds: number;
        questions: { isCorrect: boolean; timeSpent: number }[];
        timeBuckets?: { stable: number; logic: number; neural: number };
    };
    suppressAnimation?: boolean;
}

export const TimeSpentDonut = React.memo(({ data, suppressAnimation }: TimeSpentDonutProps) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Breakdown logic: preferring server-side binned data for precision
    const buckets = data.timeBuckets
        ? {
            stable: Number(data.timeBuckets.stable ?? 0),
            logic: Number(data.timeBuckets.logic ?? 0),
            neural: Number(data.timeBuckets.neural ?? 0)
        }
        : {
            stable: data.questions.filter(q => q.isCorrect && q.timeSpent < 45).reduce((s, q) => s + q.timeSpent, 0),
            logic: data.questions.filter(q => q.isCorrect && q.timeSpent >= 45).reduce((s, q) => s + q.timeSpent, 0),
            neural: data.questions.filter(q => !q.isCorrect).reduce((s, q) => s + q.timeSpent, 0)
        };

    let breakdown = [
        { name: "Stable Processing", value: buckets.stable, color: '#3b82f6', label: "Study" },
        { name: "Logic Synthesis", value: buckets.logic, color: '#10b981', label: "Practice" },
        { name: "Neural Friction", value: buckets.neural, color: '#a855f7', label: "Review" }
    ].filter(b => b.value > 0);

    // Fallback: if no bucket has value but total time exists, show a neutral slice
    if (breakdown.length === 0 && data.totalSeconds > 0) {
        breakdown = [{ name: "Total", value: data.totalSeconds, color: '#64748b', label: "Total Time" }];
    }

    // If still empty (no time at all), show an empty donut with label
    if (breakdown.length === 0) {
        breakdown = [{ name: "No data", value: 1, color: '#1f2937', label: "No time recorded" }];
    }

    const formatTotalTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <div className="w-full h-full flex flex-col p-8 bg-[#0d111a] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    <h3 className="text-xl font-bold text-white tracking-tight">Time Spent</h3>
                </div>
                <MoreHorizontal className="text-slate-600 hover:text-slate-400 cursor-pointer transition-colors" size={20} />
            </div>

            <div className="relative h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={mounted ? 'mounted' : 'unmounted'}>
                        <defs>
                            <filter id="timeGlow_TSD" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <Pie
                            data={breakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={105}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={!suppressAnimation}
                            animationDuration={suppressAnimation ? 0 : 600}
                            cornerRadius={4}
                        >
                            {breakdown.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    filter="url(#timeGlow_TSD)"
                                    className="outline-none"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                            <p className="text-2xl font-black text-white">{formatTotalTime(Number(payload[0].value))}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {formatTotalTime(data.totalSeconds)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">TOTAL</span>
                        </div>

                    </div>
                </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {breakdown.map((item) => (
                        <div key={item.name} className="flex items-center gap-2.5">
                            <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[13px] font-bold text-slate-400 tracking-tight">{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="relative z-20">
                    <MethodologyDisclaimer
                        text="TEMPORAL ANALYSIS: CATEGORIZES COGNITIVE LOAD INTO STABLE (FAST), LOGIC (DELIBERATE), AND NEURAL FRICTION (CORRECTION) PHASES."
                        className="max-w-none text-center"
                    />
                </div>
            </div>
        </div>
    );
});

TimeSpentDonut.displayName = "TimeSpentDonut";
