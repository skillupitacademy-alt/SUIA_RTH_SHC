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
        if (accuracy >= 85) return 'bg-emerald-500/30 text-emerald-400 border-emerald-500/20';
        if (accuracy >= 65) return 'bg-indigo-500/30 text-indigo-400 border-indigo-500/20';
        if (accuracy >= 40) return 'bg-amber-500/30 text-amber-400 border-amber-500/20';
        return 'bg-rose-500/30 text-rose-400 border-rose-500/20';
    };

    return (
        <div className="w-full p-6">
            <div className="mb-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Matrix analysis</h3>
                <p className="text-sm font-bold text-white tracking-tight">Accuracy Heatmap (Subtopic × Difficulty)</p>
            </div>

            <div className="grid gap-2 overflow-x-auto pb-2">
                {/* Header Row */}
                <div className="flex gap-2 min-w-[600px]">
                    <div className="w-32 flex-shrink-0" /> {/* Corner spacer */}
                    {difficulties.map(diff => (
                        <div key={diff} className="flex-1 text-center py-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{diff}</span>
                        </div>
                    ))}
                </div>

                {/* Subtopic Rows */}
                {subtopics.map((sub, idx) => (
                    <motion.div
                        key={sub}
                        className="flex gap-2 min-w-[600px]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <div className="w-32 flex-shrink-0 flex items-center pr-4 border-r border-slate-800/40">
                            <span className="text-[10px] font-black text-slate-400 uppercase truncate leading-tight tracking-tight">{sub}</span>
                        </div>
                        {difficulties.map(diff => {
                            const cell = data.find(d => d.subtopic === sub && d.difficulty === diff);
                            const accuracy = cell ? cell.accuracy : 0;
                            return (
                                <div
                                    key={diff}
                                    className={`flex-1 h-12 flex items-center justify-center rounded-xl border transition-all duration-300 hover:scale-[1.02] border-transparent ${cell ? getCellColor(accuracy) : 'bg-slate-900/10 text-slate-800 border-slate-900/20'}`}
                                >
                                    <span className="text-xs font-black tracking-tighter">{cell ? `${accuracy}%` : '--'}</span>
                                </div>
                            );
                        })}
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-6 border-t border-slate-900/40 pt-4">
                {[
                    { label: 'Mastery', color: 'bg-emerald-500' },
                    { label: 'Advancing', color: 'bg-indigo-500' },
                    { label: 'Growth', color: 'bg-amber-500' },
                    { label: 'Critical', color: 'bg-rose-500' }
                ].map(leg => (
                    <div key={leg.label} className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        <div className={`h-1.5 w-1.5 rounded-full ${leg.color}`} />
                        {leg.label}
                    </div>
                ))}
            </div>
        </div>
    );
});

HeatmapGrid.displayName = "HeatmapGrid";
