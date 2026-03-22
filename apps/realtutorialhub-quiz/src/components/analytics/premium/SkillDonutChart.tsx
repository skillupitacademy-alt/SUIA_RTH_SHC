'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export interface SkillAccuracy {
    name: string;
    accuracy: number;
}

export interface SkillDonutChartProps {
    data: SkillAccuracy[];
}

export const SkillDonutChart = React.memo(({ data }: SkillDonutChartProps) => {
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full h-full p-8 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl"
        >
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Vectors</h3>
                    <p className="text-lg font-bold text-white tracking-tight">Skill Distribution</p>
                </div>
            </div>

            <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={8}
                            dataKey="accuracy"
                            stroke="none"
                            animationDuration={1200}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                            <p className="text-xl font-black text-white">{payload[0].value}% <span className="text-[10px] text-slate-500 uppercase">Weight</span></p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cognition</span>
                    <span className="text-2xl font-black text-white">{data.length}</span>
                </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
                {data.slice(0, 4).map((skill, i) => (
                    <div key={skill.name} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-bold text-slate-400 truncate">{skill.name}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
});

SkillDonutChart.displayName = 'SkillDonutChart';
