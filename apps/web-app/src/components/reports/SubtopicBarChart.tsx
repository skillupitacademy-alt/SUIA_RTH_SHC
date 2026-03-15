'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from "@/lib/utils";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';
import { StableRenderGuard } from './recharts/StableRenderGuard';
import { usePdfMarkReady } from "./print/usePdfMarkReady";
import { useReportThemeTokens } from './hooks/useReportThemeTokens';

export interface SubtopicBarChartProps {
    data: { name: string; accuracy: number; attempts: number }[];
    weakest?: string;
    rootCauseText?: string;
    dense?: boolean;
}

export const SubtopicBarChart = React.memo(({ data, weakest, rootCauseText, dense }: SubtopicBarChartProps) => {
    const { tokens, theme } = useReportThemeTokens();
    usePdfMarkReady("print:subtopic-bar");
    const sortedData = React.useMemo(() =>
        [...data].sort((a, b) => a.accuracy - b.accuracy),
        [data]);

    return (
        <div 
            className={cn("w-full h-full flex flex-col rounded-[2.5rem] p-8 py-[30px] lg:p-10 lg:py-[30px] border shadow-2xl relative overflow-hidden group transition-colors duration-300", dense && "p-6")}
            style={{ 
                backgroundColor: tokens.cardBg,
                borderColor: tokens.cardBorder
            }}
        >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Diagnostic Sweep</h3>
                    <p className="text-2xl font-black uppercase tracking-tighter leading-tight" style={{ color: tokens.textPrimary }}>Subtopic Accuracy Profile</p>
                </div>
                {weakest && (
                    <div className="px-5 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest leading-none">
                            CRITICAL VECTOR: {weakest}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-grow min-h-0 relative z-10 py-4">
                <StableRenderGuard>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart
                            data={sortedData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={tokens.chartGrid} horizontal={true} vertical={false} />
                            <XAxis
                                type="number"
                                domain={[0, 100]}
                                hide
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: tokens.chartAxis, fontSize: 13, fontWeight: 700 }}
                                width={160}
                            />
                            <Tooltip
                                cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div 
                                                className="backdrop-blur-xl border p-5 rounded-2xl shadow-2xl"
                                                style={{ backgroundColor: tokens.panelBg, borderColor: tokens.borderMedium }}
                                            >
                                                <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-3xl font-black" style={{ color: tokens.textPrimary }}>{payload[0].value}%</span>
                                                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tokens.textMuted }}>Accuracy Sync</span>
                                                </div>
                                                <div className="mt-4 pt-4 border-t" style={{ borderTopColor: tokens.borderSubtle }}>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: tokens.textSecondary }}>{payload[0].payload.attempts} Diagnostic Vectors</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="accuracy"
                                radius={[0, 10, 10, 0]}
                                isAnimationActive={false}
                            >
                                {sortedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.accuracy < 60 ? '#f43f5e' : entry.accuracy < 80 ? '#f59e0b' : '#6366f1'}
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </StableRenderGuard>
            </div>

            <div 
                className="mt-auto pt-5 border-t space-y-6"
                style={{ borderTopColor: tokens.borderSubtle }}
            >
                {rootCauseText && (
                    <div 
                        className="flex items-center gap-4 p-5 rounded-2xl border"
                        style={{ backgroundColor: tokens.pageBg, borderColor: tokens.cardBorder }}
                    >
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <span className="text-indigo-500 font-bold">!</span>
                        </div>
                        <p className="text-[13px] font-black uppercase tracking-widest leading-relaxed" style={{ color: tokens.textSecondary }}>
                            {rootCauseText}
                        </p>
                    </div>
                )}
                <div className="relative z-20">
                    <MethodologyDisclaimer
                        text="DIAGNOSTIC VECTOR ANALYSIS: AGGREGATES SUBTOPIC PERFORMANCE DATA TO MAP ARCHITECTURAL WEAKNESSES AND STRENGTHS."
                        className="max-w-none text-center"
                    />
                </div>
            </div>
        </div>
    );
});

SubtopicBarChart.displayName = "SubtopicBarChart";
