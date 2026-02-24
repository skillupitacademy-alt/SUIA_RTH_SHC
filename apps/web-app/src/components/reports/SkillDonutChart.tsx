'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MoreHorizontal } from "lucide-react";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';

export interface SkillDonutChartProps {
    data: { name: string; accuracy: number }[];
    suppressAnimation?: boolean;
}

export const SkillDonutChart = React.memo(({ data, suppressAnimation }: SkillDonutChartProps) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Subject Breakdown colors matching the premium palette
    const COLORS = ['#22d3ee', '#34d399', '#facc15', '#818cf8', '#f472b6'];

    // Calculate total average to show in center (Mastery)
    const averageAccuracy = data.length > 0
        ? Math.round(data.reduce((acc, curr) => acc + curr.accuracy, 0) / data.length)
        : 0;
    const centerDigits = `${averageAccuracy}`.length;
    const centerFontClass = centerDigits >= 3 ? "text-5xl" : "text-6xl";

    return (
        <div className="w-full h-full flex flex-col p-8 bg-[#0d111a] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white tracking-tight">Subject Breakdown</h3>
                <MoreHorizontal className="text-slate-600 hover:text-slate-400 cursor-pointer transition-colors" size={20} />
            </div>

            <div className="relative h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={mounted ? 'mounted' : 'unmounted'}>
                        <defs>
                            <filter id="segmentGlow_SDC" x="-50%" y="-50%" width="200%" height="200%">
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
                            animationDuration={suppressAnimation ? 0 : 1500}
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    filter="url(#segmentGlow_SDC)"
                                    className="hover:opacity-80 transition-opacity outline-none"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                                            <p className="text-[12px] font-black text-indigo-400 uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                                            <p className="text-2xl font-black text-white">{payload[0].value}% Accuracy</p>
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
                        <span className={`${centerFontClass} font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] leading-none`}>
                            {averageAccuracy}%
                        </span>
                        <span className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mt-1">TOTAL</span>
                    </div>
                </div>
            </div>

            {/* Legend with improved legibility */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                {data.map((skill, i) => (
                    <div key={skill.name} className="flex items-center gap-2.5">
                        <div
                            className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-[13px] font-bold text-slate-400 tracking-tight">{skill.name}</span>
                    </div>
                ))}
            </div>

            <MethodologyDisclaimer
                text="DOMAIN DISTRIBUTION: PROPORTIONAL REPRESENTATION OF ACTIVE SUBJECT AREAS BASED ON TOTAL ASSESSMENT BLUEPRINT VOLUME."
                className="absolute bottom-8 left-8 max-w-[80%]"
            />
        </div>
    );
});

SkillDonutChart.displayName = "SkillDonutChart";
