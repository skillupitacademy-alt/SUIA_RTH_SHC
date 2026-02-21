'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export interface SubtopicAccuracy {
    name: string;
    accuracy: number;
}

export interface SubtopicBarChartProps {
    data: SubtopicAccuracy[];
}

export const SubtopicBarChart = React.memo(({ data }: SubtopicBarChartProps) => {
    const sortedData = useMemo(() =>
        [...data].sort((a, b) => b.accuracy - a.accuracy),
        [data]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full h-full p-8 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl"
        >
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Diagnosis</h3>
                    <p className="text-lg font-bold text-white tracking-tight">Subtopic Performance</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={sortedData}
                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                            <p className="text-xl font-black text-white">{payload[0].value}% <span className="text-[10px] text-indigo-400 uppercase">Accuracy</span></p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="accuracy"
                            radius={[0, 10, 10, 0]}
                            barSize={16}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.accuracy < 50 ? '#f43f5e' : (index === 0 ? '#6366f1' : '#1e293b')}
                                    fillOpacity={entry.accuracy < 50 ? 1 : 0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Mastery</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Critical Gap</span>
                </div>
            </div>
        </motion.div>
    );
});

SubtopicBarChart.displayName = 'SubtopicBarChart';
