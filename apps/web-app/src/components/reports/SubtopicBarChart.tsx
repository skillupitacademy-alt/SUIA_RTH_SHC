'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

export interface SubtopicBarChartProps {
    data: { name: string; accuracy: number }[];
    weakest?: string;
}

export const SubtopicBarChart = React.memo(({ data, weakest }: SubtopicBarChartProps) => {
    const sortedData = useMemo(() =>
        [...data].sort((a, b) => b.accuracy - a.accuracy),
        [data]);

    return (
        <div className="w-full h-[300px] p-4 flex flex-col">
            <div className="mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Diagnostic</h3>
                <p className="text-sm font-bold text-white tracking-tight">Subtopic Performance</p>
            </div>

            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            width={80}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-950 border border-slate-800 p-2 rounded-lg shadow-2xl">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{payload[0].payload.name}</p>
                                            <p className="text-lg font-black text-white">{payload[0].value}%</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="accuracy"
                            radius={[0, 8, 8, 0]}
                            barSize={12}
                            animationDuration={1000}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.name === weakest ? "#f43f5e" : "#6366f1"}
                                    fillOpacity={entry.name === weakest ? 1 : 0.6}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {weakest && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Weakest: {weakest}</p>
                </div>
            )}
        </div>
    );
});

SubtopicBarChart.displayName = "SubtopicBarChart";
