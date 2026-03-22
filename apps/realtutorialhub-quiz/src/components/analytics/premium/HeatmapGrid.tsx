'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface HeatmapCell {
    subtopic: string;
    difficulty: 'simple' | 'intermediate' | 'expert';
    accuracy: number;
}

export interface HeatmapGridProps {
    data: HeatmapCell[];
}

export const HeatmapGrid = React.memo(({ data }: HeatmapGridProps) => {
    const subtopics = Array.from(new Set(data.map(d => d.subtopic)));
    const difficulties: ('simple' | 'intermediate' | 'expert')[] = ['simple', 'intermediate', 'expert'];

    const getCellColor = (accuracy: number) => {
        if (accuracy >= 85) return 'bg-emerald-500/80 border-emerald-400/30';
        if (accuracy >= 70) return 'bg-emerald-500/40 border-emerald-500/20';
        if (accuracy >= 50) return 'bg-amber-500/40 border-amber-500/20';
        if (accuracy >= 30) return 'bg-rose-500/40 border-rose-500/20';
        return 'bg-rose-500/80 border-rose-400/30';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full p-8 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 shadow-xl"
        >
            <div className="mb-8">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Cognitive Deep-Drill</h3>
                <p className="text-lg font-bold text-white tracking-tight">Difficulty Matrix</p>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                    {/* Header Row */}
                    <div className="grid grid-cols-[1fr_rep-peat(3,minmax(80px,1fr))] gap-2 mb-4">
                        <div />
                        {difficulties.map(diff => (
                            <div key={diff} className="text-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{diff}</span>
                            </div>
                        ))}
                    </div>

                    {/* Data Rows */}
                    <div className="space-y-2">
                        {subtopics.map((sub, rowIndex) => (
                            <motion.div
                                key={sub}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: rowIndex * 0.1 }}
                                suppressHydrationWarning
                                className="grid grid-cols-[1fr_repeat(3,minmax(80px,1fr))] gap-2 items-center"
                            >
                                <div className="overflow-hidden">
                                    <span className="text-[11px] font-bold text-slate-300 truncate block pr-4">{sub}</span>
                                </div>
                                {difficulties.map(diff => {
                                    const cell = data.find(c => c.subtopic === sub && c.difficulty === diff);
                                    const accuracy = cell?.accuracy ?? 0;

                                    return (
                                        <div
                                            key={`${sub}-${diff}`}
                                            className={cn(
                                                "h-12 rounded-xl border flex items-center justify-center transition-all hover:scale-105 hover:z-10 cursor-pointer group relative",
                                                getCellColor(accuracy)
                                            )}
                                        >
                                            <span className="text-[11px] font-black text-white">{accuracy}%</span>

                                            {/* Tooltip on Hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-950 border border-slate-800 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">{sub} • {diff}</p>
                                                <p className="text-xs font-bold text-white">Accuracy: {accuracy}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 overflow-x-auto pb-2">
                {[
                    { label: 'Critical', color: 'bg-rose-500/80' },
                    { label: 'Risk', color: 'bg-rose-500/40' },
                    { label: 'Growth', color: 'bg-amber-500/40' },
                    { label: 'Steady', color: 'bg-emerald-500/40' },
                    { label: 'Mastery', color: 'bg-emerald-500/80' }
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className={cn("h-2 w-4 rounded-sm", item.color)} />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
});

HeatmapGrid.displayName = 'HeatmapGrid';
