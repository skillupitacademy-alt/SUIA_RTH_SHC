'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export interface SkillDonutChartProps {
    data: { name: string; accuracy: number }[];
}

export const SkillDonutChart = React.memo(({ data }: SkillDonutChartProps) => {
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    return (
        <div className="w-full h-[300px] p-4 flex flex-col">
            <div className="mb-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Vector Distro</h3>
                <p className="text-sm font-bold text-white tracking-tight">Skill Matrix</p>
            </div>

            <div className="flex-grow relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="accuracy"
                            stroke="none"
                            animationDuration={1200}
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
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
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Skills</span>
                    <span className="text-xl font-black text-white">{data.length}</span>
                </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {data.slice(0, 4).map((skill, i) => (
                    <div key={skill.name} className="flex items-center gap-1.5 overflow-hidden">
                        <div className="h-1 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[9px] font-bold text-slate-400 truncate tracking-tight">{skill.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

SkillDonutChart.displayName = "SkillDonutChart";
