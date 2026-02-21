'use client';

import React from 'react';
import { motion } from "framer-motion";

export interface DifficultyAccuracy {
    level: string;
    accuracy: number;
}

export interface DifficultyBarChartProps {
    data: DifficultyAccuracy[];
}

export const DifficultyBarChart = React.memo(({ data }: DifficultyBarChartProps) => {
    const getLevelStyle = (level: string) => {
        const l = level.toLowerCase();
        if (l.includes('simple') || l.includes('easy')) return {
            gradient: "from-emerald-600 to-teal-600",
            shadow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
            text: "text-emerald-400"
        };
        if (l.includes('inter') || l.includes('medium')) return {
            gradient: "from-amber-600 to-orange-600",
            shadow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
            text: "text-amber-400"
        };
        if (l.includes('expert') || l.includes('hard')) return {
            gradient: "from-rose-600 to-pink-600",
            shadow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
            text: "text-rose-400"
        };
        return {
            gradient: "from-indigo-600 to-violet-600",
            shadow: "shadow-[0_0_15px_rgba(99,102,241,0.2)]",
            text: "text-indigo-400"
        };
    };

    return (
        <div className="w-full h-full flex flex-col space-y-12">
            <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Complexity Threshold</h3>
                <p className="text-xl font-bold text-white tracking-tight">Difficulty Matrix Diagnostic</p>
            </div>

            <div className="flex flex-col gap-12 flex-grow justify-center">
                {data.map((item, idx) => {
                    const style = getLevelStyle(item.level);
                    return (
                        <div key={idx} className="group">
                            <div className="flex items-end justify-between mb-4 px-1">
                                <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${style.text}`}>
                                    {item.level} Level
                                </span>
                                <span className={`text-sm font-black tracking-tighter ${style.text}`}>
                                    {item.accuracy}% Accuracy
                                </span>
                            </div>

                            <div className="relative h-4 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.accuracy}%` }}
                                    transition={{ duration: 1.5, delay: idx * 0.2, ease: "circOut" }}
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r ${style.gradient} ${style.shadow}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-8 border-t border-slate-800 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Entry</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Operational</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Master</span>
                </div>
            </div>
        </div>
    );
});

DifficultyBarChart.displayName = "DifficultyBarChart";
