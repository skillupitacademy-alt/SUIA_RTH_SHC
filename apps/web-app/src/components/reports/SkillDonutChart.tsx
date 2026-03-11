'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MoreHorizontal } from "lucide-react";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';

export interface SkillDonutChartProps {
    data: { name: string; accuracy: number; attempts: number }[];
    suppressAnimation?: boolean;
}

export const SkillDonutChart = React.memo(({ data, suppressAnimation }: SkillDonutChartProps) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const centerDigits = data.length.toString().length;
    const centerFontClass = centerDigits >= 3 ? "text-5xl" : "text-6xl";

    return (
        <div className="w-full h-full flex flex-col p-8 py-[30px] lg:p-10 lg:py-[30px] bg-[#0d111a] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Cognitive Distribution</h3>
                    <p className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">Subject Breakdown</p>
                </div>
                <MoreHorizontal className="text-slate-600 hover:text-slate-400 cursor-pointer transition-colors" size={20} />
            </div>

            <div className="relative flex-grow min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart key={mounted ? 'mounted' : 'unmounted'}>
                        <defs>
                            <filter id="skillGlow_SDC" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={75}
                            outerRadius={105}
                            paddingAngle={4}
                            dataKey="accuracy"
                            stroke="none"
                            isAnimationActive={!suppressAnimation}
                            animationDuration={suppressAnimation ? 0 : 600}
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => {
                                const hue = (index * 137.5) % 360;
                                return (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`hsl(${hue}, 70%, 50%)`}
                                        filter="url(#skillGlow_SDC)"
                                        className="outline-none"
                                    />
                                );
                            })}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                                            <p className="text-2xl font-black text-white">{payload[0].value}%</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                                                {payload[0].payload.attempts} Vectors Tested
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="flex flex-col items-center">
                        <span className={`${centerFontClass} font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                            {data.length}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cognitive Nodes</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-5 border-t border-white/5 space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-6">
                    {data.map((skill, i) => (
                        <div key={skill.name} className="flex items-center gap-2.5">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: `hsl(${(i * 137.5) % 360}, 70%, 50%)` }}
                            />
                            <span className="text-[12px] font-bold text-slate-400 tracking-tight">{skill.name}</span>
                        </div>
                    ))}
                </div>

                <div className="relative z-20">
                    <MethodologyDisclaimer
                        text="COGNITIVE MATRIX: DATA AGGREGATED FROM MULTI-DIMENSIONAL RESPONSE VECTORS TO IDENTIFY CORE SUBJECT STABILITY."
                        className="max-w-none text-center"
                    />
                </div>
            </div>
        </div>
    );
});

SkillDonutChart.displayName = "SkillDonutChart";
