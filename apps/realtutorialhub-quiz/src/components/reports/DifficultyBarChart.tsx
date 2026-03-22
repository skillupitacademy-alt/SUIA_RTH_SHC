'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MethodologyDisclaimer } from './MethodologyDisclaimer';
import { StableRenderGuard } from './recharts/StableRenderGuard';
import { useReportThemeTokens } from './hooks/useReportThemeTokens';

export interface DifficultyBarChartProps {
    data: { level: string; accuracy: number; attempts: number }[];
    expertDropOff?: boolean;
}

export const DifficultyBarChart = React.memo(({ data, expertDropOff }: DifficultyBarChartProps) => {
    const { tokens } = useReportThemeTokens();
    const sortedData = React.useMemo(() => {
        const order = ["Simple", "Intermediate", "Expert"];
        return [...data].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
    }, [data]);

    return (
        <div 
            className="w-full h-full flex flex-col rounded-[2.5rem] p-8 py-[30px] lg:p-10 lg:py-[30px] border shadow-2xl relative overflow-hidden group transition-colors duration-300"
            style={{ 
                backgroundColor: tokens.cardBg,
                borderColor: tokens.cardBorder
            }}
        >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Complexity Threshold</h3>
                    <p className="text-2xl font-black uppercase tracking-tighter leading-tight" style={{ color: tokens.textPrimary }}>Difficulty Matrix Diagnostic</p>
                </div>
            </div>

            <div className="flex-grow min-h-0 relative z-10 py-6">
                <StableRenderGuard>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={tokens.chartGrid} vertical={false} />
                            <XAxis
                                dataKey="level"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 800 }}
                                padding={{ left: 40, right: 40 }}
                            />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                             <div 
                                                className="backdrop-blur-xl border p-5 rounded-2xl shadow-2xl"
                                                style={{ backgroundColor: tokens.panelBg, borderColor: tokens.borderMedium }}
                                            >
                                                <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-2">{payload[0].payload.level} Gravity</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black" style={{ color: tokens.textPrimary }}>{payload[0].value}%</span>
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: tokens.textMuted }}>Accuracy</span>
                                                </div>
                                                <div className="mt-4 pt-4 border-t" style={{ borderTopColor: tokens.borderSubtle }}>
                                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: tokens.textSecondary }}>{payload[0].payload.attempts} Diagnostic Cycles</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="accuracy"
                                radius={[12, 12, 4, 4]}
                                barSize={60}
                                isAnimationActive={true}
                                animationDuration={1200}
                            >
                                {sortedData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.accuracy < 50 ? '#f43f5e' : entry.accuracy < 75 ? '#6366f1' : '#10b981'}
                                        fillOpacity={0.9}
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
                {expertDropOff && (
                    <div className="flex items-center gap-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <span className="text-amber-500 font-bold">!</span>
                        </div>
                        <p className="text-[12px] font-black text-amber-400 uppercase tracking-widest leading-relaxed">
                            Vector Stability Loss: Significant performance decay detected at Expert Complexity level.
                        </p>
                    </div>
                )}
                <div className="relative z-20">
                    <MethodologyDisclaimer
                        text="LOAD VECTOR STABILITY: MEASURES STABILITY OF LOGIC RECOVERY ACROSS INCREASING LEVELS OF PROBLEM ENTROPY."
                        className="max-w-none text-center"
                    />
                </div>
            </div>
        </div>
    );
});

DifficultyBarChart.displayName = "DifficultyBarChart";
