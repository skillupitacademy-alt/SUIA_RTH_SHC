'use client';

import React, { useMemo } from 'react';
import { motion } from "framer-motion";

export interface SubtopicBarChartProps {
    data: { name: string; accuracy: number }[];
    weakest?: string;
}

export const SubtopicBarChart = React.memo(({ data, weakest }: SubtopicBarChartProps) => {
    const sortedData = useMemo(() =>
        [...data].sort((a, b) => b.accuracy - a.accuracy),
        [data]);

    return (
        <div className="w-full flex flex-col space-y-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-2">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Diagnostic Sweep</h3>
                    <p className="text-2xl font-black text-white uppercase tracking-tighter">Subtopic Accuracy Profile</p>
                </div>
                {weakest && (
                    <div className="px-5 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">Priority Target: {weakest}</span>
                    </div>
                )}
            </div>

            <div className="space-y-10">
                {sortedData.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="flex items-end justify-between mb-3 px-1">
                            <span className="text-[13px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">
                                {item.name}
                            </span>
                            <span className={cn(
                                "text-[15px] font-black tracking-tight",
                                item.name === weakest ? "text-rose-400" : "text-indigo-400"
                            )}>
                                {item.accuracy}%
                            </span>
                        </div>

                        <div className="relative h-2.5 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.accuracy}%` }}
                                transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                className={cn(
                                    "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                                    item.name === weakest
                                        ? "bg-gradient-to-r from-rose-600 to-pink-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                        : "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                )}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// Helper for class names since we are outside main components often
function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

SubtopicBarChart.displayName = "SubtopicBarChart";
