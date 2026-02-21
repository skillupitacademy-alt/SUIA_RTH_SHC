'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface HeatmapCell {
    subtopic: string;
    difficulty: string;
    accuracy: number;
}

export interface HeatmapGridProps {
    data: HeatmapCell[];
}

export const HeatmapGrid = React.memo(({ data }: HeatmapGridProps) => {
    const subtopics = Array.from(new Set(data.map(d => d.subtopic)));
    const difficulties = Array.from(new Set(data.map(d => d.difficulty)));

    const getCellColor = (accuracy: number) => {
        if (accuracy >= 85) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        if (accuracy >= 65) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
        if (accuracy >= 40) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    };

    return (
        <div className="w-full flex flex-col space-y-10">
            <div className="border-b border-slate-800 pb-6 mb-2">
                <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Matrix Analysis</h3>
                <p className="text-2xl font-black text-white tracking-tighter uppercase">Neural Accuracy Heatmap</p>
            </div>

            <div className="flex flex-col gap-5">
                {/* Header Row */}
                <div className="flex gap-6">
                    <div className="w-64 flex-shrink-0" /> {/* Corner spacer expanded */}
                    {difficulties.map(diff => (
                        <div key={diff} className="flex-1 text-center py-4 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <span className="text-[12px] font-black text-slate-300 uppercase tracking-[0.2em]">{diff} Level</span>
                        </div>
                    ))}
                </div>

                {/* Subtopic Rows */}
                <div className="space-y-4">
                    {subtopics.map((sub, idx) => (
                        <motion.div
                            key={sub}
                            className="flex gap-6"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="w-64 flex-shrink-0 flex items-start pt-4 pr-10 border-r border-slate-800/60">
                                <span className="text-[13px] font-bold text-slate-200 uppercase tracking-widest leading-relaxed text-left">
                                    {sub}
                                </span>
                            </div>
                            {difficulties.map(diff => {
                                const cell = data.find(d => d.subtopic === sub && d.difficulty === diff);
                                const accuracy = cell ? cell.accuracy : 0;
                                return (
                                    <div
                                        key={diff}
                                        className={`flex-1 h-16 flex items-center justify-center rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:brightness-125 group relative ${cell ? getCellColor(accuracy) : 'bg-slate-900/10 text-slate-800 border-white/5 opacity-20'}`}
                                    >
                                        <span className="text-[16px] font-black tracking-tight z-10 transition-transform group-hover:scale-110">{cell ? `${accuracy}%` : '--'}</span>
                                        {cell && (
                                            <div className="absolute inset-x-5 bottom-3 h-0.5 bg-current opacity-25 rounded-full" />
                                        )}
                                    </div>
                                );
                            })}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-12 border-t border-slate-800 pt-10">
                {[
                    { label: 'Mastery', color: 'bg-emerald-500' },
                    { label: 'Advancing', color: 'bg-indigo-500' },
                    { label: 'Growth', color: 'bg-amber-500' },
                    { label: 'Critical', color: 'bg-rose-500' }
                ].map(leg => (
                    <div key={leg.label} className="flex items-center gap-3 text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor] opacity-60 ${leg.color}`} />
                        {leg.label}
                    </div>
                ))}
            </div>
        </div>
    );
});

HeatmapGrid.displayName = "HeatmapGrid";
