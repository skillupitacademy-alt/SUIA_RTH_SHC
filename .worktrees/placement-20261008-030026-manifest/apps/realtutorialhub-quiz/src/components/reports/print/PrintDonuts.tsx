'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { StableRenderGuard } from '../recharts/StableRenderGuard';
import { usePdfMarkReady } from './usePdfMarkReady';

/**
 * PRINT-OPTIMIZED SKILL DONUT
 * No headers, no methodologies, percentage-based radii for grid stability.
 */
export function SkillDonutChartPrint({ data }: { data: { name: string; accuracy: number; attempts: number }[] }) {
    usePdfMarkReady("print:skill-donut");
    return (
        <div className="w-full h-full flex flex-col">
            <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-visible">
                <StableRenderGuard>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="75%"
                                paddingAngle={4}
                                dataKey="accuracy"
                                stroke="none"
                                isAnimationActive={false}
                                cornerRadius={4}
                            >
                                {data.map((entry, index) => {
                                    const hue = (index * 137.5) % 360;
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`hsl(${hue}, 70%, 50%)`}
                                            className="outline-none"
                                            style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.1))" }}
                                        />
                                    );
                                })}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </StableRenderGuard>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
                        {data.length}
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5 opacity-60">Nodes</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
                {data.map((skill, i) => (
                    <div key={skill.name} className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: `hsl(${(i * 137.5) % 360}, 70%, 50%)` }}
                        />
                        <span className="text-[11px] font-bold text-slate-400">{skill.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * PRINT-OPTIMIZED TIME DONUT
 * Minimalist time distribution view for cramped PDF grids.
 */
export function TimeSpentDonutPrint({ data }: { 
    data: { 
        totalSeconds: number; 
        questions: { isCorrect: boolean; timeSpent: number }[]; 
        timeBuckets?: { stable?: number; logic?: number; neural?: number } 
    } 
}) {
    usePdfMarkReady("print:time-donut");
    const buckets = data.timeBuckets || {
        stable: data.questions.filter(q => q.isCorrect && q.timeSpent < 45).reduce((s, q) => s + q.timeSpent, 0),
        logic: data.questions.filter(q => q.isCorrect && q.timeSpent >= 45).reduce((s, q) => s + q.timeSpent, 0),
        neural: data.questions.filter(q => !q.isCorrect).reduce((s, q) => s + q.timeSpent, 0)
    };

    const breakdown = [
        { name: "Stable", label: "Stable", value: buckets.stable || 0, color: '#3b82f6' },
        { name: "Logic", label: "Logic", value: buckets.logic || 0, color: '#10b981' },
        { name: "Neural", label: "Neural", value: buckets.neural || 0, color: '#a855f7' }
    ].filter(b => b.value > 0);

    const formatTotalTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-visible">
                <StableRenderGuard>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={breakdown.length ? breakdown : [{ value: 1, color: '#1f2937' }]}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="75%"
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={false}
                                cornerRadius={4}
                            >
                                {breakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </StableRenderGuard>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white tracking-tighter tabular-nums drop-shadow-sm">
                        {formatTotalTime(data.totalSeconds)}
                    </span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5 opacity-60">Spend</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
                {breakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] font-bold text-slate-400">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
