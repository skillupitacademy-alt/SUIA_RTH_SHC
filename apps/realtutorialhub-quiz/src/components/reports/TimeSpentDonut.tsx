'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Clock } from "lucide-react";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';
import { StableRenderGuard } from './recharts/StableRenderGuard';
import { useReportThemeTokens } from './hooks/useReportThemeTokens';

export interface TimeSpentDonutProps {
    data: {
        totalSeconds: number;
        questions: { isCorrect: boolean; timeSpent: number }[];
        timeBuckets?: { stable: number; logic: number; neural: number };
    };
    suppressAnimation?: boolean;
}

export const TimeSpentDonut = React.memo(({ data, suppressAnimation }: TimeSpentDonutProps) => {
    const { tokens, theme } = useReportThemeTokens();
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
        breakdown = [{ name: "No data", value: 1, color: theme === 'dark' ? '#1f2937' : '#f1f5f9', label: "No time recorded" }];
    }

    const formatTotalTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <div 
            className="w-full h-full flex flex-col p-8 py-[30px] lg:p-10 lg:py-[30px] rounded-[2.5rem] border shadow-2xl relative overflow-hidden group transition-colors duration-300"
            style={{ 
                backgroundColor: tokens.cardBg,
                borderColor: tokens.cardBorder
            }}
        >
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Temporal Metrics</h3>
                    <p className="text-2xl font-black tracking-tighter uppercase leading-tight" style={{ color: tokens.textPrimary }}>Time Distribution</p>
                </div>
                <div 
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-xl cursor-default"
                    style={{ backgroundColor: tokens.pageBg, borderColor: tokens.borderSubtle }}
                >
                    <Clock size={14} className="text-indigo-400" />
                    <span className="text-[13px] font-bold" style={{ color: tokens.textSecondary }}>Active Spend</span>
                </div>
            </div>

            <div className="relative flex-grow min-h-[300px]">
                <StableRenderGuard>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                                            <div 
                                                className="backdrop-blur-xl border p-4 rounded-2xl shadow-2xl"
                                                style={{ backgroundColor: tokens.panelBg, borderColor: tokens.borderMedium }}
                                            >
                                                <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                <p className="text-2xl font-black" style={{ color: tokens.textPrimary }}>{formatTotalTime(Number(payload[0].value))}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </StableRenderGuard>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="flex flex-col items-center">
                        <span 
                            className="text-4xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                            style={{ color: tokens.textPrimary }}
                        >
                            {formatTotalTime(data.totalSeconds)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: tokens.textMuted }}>TOTAL</span>
                        </div>
                    </div>
                </div>
            </div>

            <div 
                className="mt-auto pt-5 border-t space-y-6"
                style={{ borderTopColor: tokens.borderSubtle }}
            >
                <div className="flex flex-wrap items-center justify-center gap-8">
                    {breakdown.map((item) => (
                        <div key={item.name} className="flex items-center gap-2.5">
                            <div
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                            <span className="text-[13px] font-bold tracking-tight" style={{ color: tokens.textSecondary }}>{item.label}</span>
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
