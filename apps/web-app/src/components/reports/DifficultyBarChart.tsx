'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

export interface DifficultyAccuracy {
    level: string;
    accuracy: number;
}

export interface DifficultyBarChartProps {
    data: DifficultyAccuracy[];
}

export const DifficultyBarChart = React.memo(({ data }: DifficultyBarChartProps) => {
    const COLORS = {
        simple: '#10b981', // emerald-500
        intermediate: '#f59e0b', // amber-500
        expert: '#f43f5e', // rose-500
    };

    // Map user provided level strings if they are different (e.g. Easy/Medium/Hard)
    // But we use the COLORS map as a fallback
    const getLevelColor = (level: string) => {
        const l = level.toLowerCase();
        if (l.includes('simple') || l.includes('easy')) return COLORS.simple;
        if (l.includes('inter') || l.includes('medium')) return COLORS.intermediate;
        if (l.includes('expert') || l.includes('hard')) return COLORS.expert;
        return '#6366f1';
    };

    return (
        <div className="w-full h-[400px] p-6 flex flex-col">
            <div className="mb-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Complexity Ladder</h3>
                <p className="text-sm font-bold text-white tracking-tight">Difficulty Accuracy Vertical</p>
            </div>

            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                        <XAxis
                            dataKey="level"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg shadow-2xl">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{payload[0].payload.level}</p>
                                            <p className="text-lg font-black text-white">{payload[0].value}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="accuracy"
                            radius={[12, 12, 12, 12]}
                            barSize={40}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={getLevelColor(entry.level)}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-2 flex items-center gap-4 text-[9px] font-bold text-slate-600 tracking-[0.1em] border-t border-slate-900/40 pt-4">
                <span className="text-white">Vertical Momentum:</span>
                <span className="uppercase italic">High-Fidelity Tracking across difficulty spectrum</span>
            </div>
        </div>
    );
});

DifficultyBarChart.displayName = "DifficultyBarChart";
