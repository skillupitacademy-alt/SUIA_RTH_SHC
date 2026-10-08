'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export interface DifficultyAccuracy {
    level: 'simple' | 'intermediate' | 'expert';
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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full h-full p-8 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl"
        >
            <div className="mb-8">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Verticality</h3>
                <p className="text-lg font-bold text-white tracking-tight">Difficulty Ladder</p>
            </div>

            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <XAxis
                            dataKey="level"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                                            <p className="text-xl font-black text-white">{payload[0].value}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="accuracy"
                            radius={[12, 12, 0, 0]}
                            barSize={40}
                            animationDuration={1500}
                        >
                            {data.map((entry) => (
                                <Cell key={`cell-${entry.level}`} fill={COLORS[entry.level]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mb-1 leading-tight">
                    Vertical Momentum
                </p>
                <p className="text-[11px] font-bold text-slate-400">
                    {data[2].accuracy > 50 ? "High technical ceiling detected." : "Progression blocked at Medium difficulty."}
                </p>
            </div>
        </motion.div>
    );
});

DifficultyBarChart.displayName = 'DifficultyBarChart';
