'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MethodologyDisclaimer } from './MethodologyDisclaimer';


export interface HeatmapCell {
    subtopic: string;
    difficulty: string;
    accuracy: number;
    attempts: number;
    showNoData?: boolean;
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
        <div className="w-full flex flex-col space-y-10 pb-16 relative">
            <div className="border-b border-slate-800 pb-6 mb-2">
                <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Matrix Analysis</h3>
                <p className="text-2xl font-black text-white tracking-tighter uppercase">Neural Accuracy Heatmap</p>
            </div>

            <div className="flex flex-col gap-5 overflow-x-hidden">
                {/* Header Row */}
                <div className="flex gap-4">
                    <div className="w-48 flex-shrink-0" />
                    {difficulties.map(diff => (
                        <div key={diff} className="flex-1 min-w-[120px] max-w-[200px] text-center py-4 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{diff}</span>
                        </div>
                    ))}
                </div>

                {/* Subtopic Rows */}
                <div className="space-y-4">
                    {subtopics.map((sub, idx) => (
                        <motion.div
                            key={sub}
                            className="flex gap-4"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="w-48 flex-shrink-0 flex items-start pt-4 border-r border-slate-800/60 pr-6">
                                <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest leading-tight text-left">
                                    {sub}
                                </span>
                            </div>
                            {difficulties.map(diff => {
                                const cell = data.find(d => d.subtopic === sub && d.difficulty === diff);
                                // Show data as soon as we have at least 1 attempt (backend already guards for nulls)
                                const hasSufficientData = !!cell && (cell.attempts ?? 0) >= 1;
                                const accuracy = cell ? Math.round(Number(cell.accuracy ?? 0)) : 0;

                                return (
                                    <div
                                        key={diff}
                                        className={`flex-1 min-w-[120px] max-w-[200px] h-20 flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 hover:brightness-125 group relative ${hasSufficientData ? getCellColor(accuracy) : 'bg-slate-900/10 text-slate-500 border-white/5 shadow-none'}`}
                                    >
                                        <span className="text-[18px] font-black tracking-tight z-10">
                                            {hasSufficientData ? `${accuracy}%` : '---'}
                                        </span>
                                        {cell && (
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">
                                                {cell.attempts} {cell.attempts === 1 ? 'Attempt' : 'Attempts'}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Legend with matching logic */}
            <div className="mt-6 flex items-center justify-center gap-10 border-t border-slate-800 pt-10">
                {[
                    { label: 'Mastery', color: 'bg-emerald-500' },
                    { label: 'Advancing', color: 'bg-indigo-500' },
                    { label: 'Growth', color: 'bg-amber-500' },
                    { label: 'Critical', color: 'bg-rose-500' }
                ].map(leg => (
                    <div key={leg.label} className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] opacity-50 ${leg.color}`} />
                        {leg.label}
                    </div>
                ))}
            </div>

            <MethodologyDisclaimer
                text="NEURAL PROJECTION: MAPS CROSS-FUNCTIONAL PERFORMANCE DENSITY. MATRIX SATURATION CORRELATES WITH THE CONFIDENCE DEPTH OF UNDERLYING ACCURACY DATA."
                className="absolute bottom-0 left-0 max-w-[80%]"
            />
        </div>
    );
});

HeatmapGrid.displayName = "HeatmapGrid";
