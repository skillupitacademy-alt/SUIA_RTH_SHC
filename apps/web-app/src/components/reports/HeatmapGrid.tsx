'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';

export interface HeatmapGridProps {
    data: { subtopic: string; difficulty: string; accuracy: number; attempts: number }[];
}

export const HeatmapGrid = React.memo(({ data }: HeatmapGridProps) => {
    const subtopics = Array.from(new Set(data.map(d => d.subtopic))).sort();
    const difficulties = ["Simple", "Intermediate", "Expert"];

    const getCellColor = (accuracy: number | undefined, attempts: number | undefined) => {
        if (!attempts || attempts === 0) return "bg-slate-900/20";
        if (accuracy === undefined) return "bg-slate-900/20";
        if (accuracy >= 90) return "bg-indigo-600/80";
        if (accuracy >= 75) return "bg-indigo-500/50";
        if (accuracy >= 50) return "bg-amber-500/40";
        return "bg-rose-500/40";
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#0d111a] rounded-[2.5rem] p-8 py-[30px] lg:p-10 lg:py-[30px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Matrix Analysis</h3>
                    <p className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">Neural Accuracy Heatmap</p>
                </div>
            </div>

            <div className="flex-grow overflow-x-auto overflow-y-hidden scrollbar-hide py-4">
                <div className="min-w-[800px] h-full flex flex-col">
                    <div className="flex mb-4">
                        <div className="w-48 shrink-0" />
                        <div className="flex-grow grid grid-cols-3 gap-3">
                            {difficulties.map(diff => (
                                <div key={diff} className="text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                    {diff}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow space-y-3 overflow-y-auto pr-4 scrollbar-hide">
                        {subtopics.map(subtopic => (
                            <div key={subtopic} className="flex items-center group/row">
                                <div className="w-48 shrink-0 pr-6">
                                    <span className="text-[13px] font-bold text-slate-300 truncate block group-hover/row:text-white transition-colors uppercase tracking-tight">
                                        {subtopic}
                                    </span>
                                </div>
                                <div className="flex-grow grid grid-cols-3 gap-3 h-14">
                                    {difficulties.map(diff => {
                                        const entry = data.find(d => d.subtopic === subtopic && d.difficulty === diff);
                                        return (
                                            <div
                                                key={diff}
                                                className={cn(
                                                    "rounded-xl border border-white/5 relative overflow-hidden group/cell transition-all duration-300 hover:scale-[1.02] hover:z-10",
                                                    getCellColor(entry?.accuracy, entry?.attempts)
                                                )}
                                            >
                                                {entry && entry.attempts > 0 && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black text-white tracking-tighter">
                                                            {entry.accuracy}%
                                                        </span>
                                                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                                                            {entry.attempts} ATTEMPTS
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-5 border-t border-white/5 space-y-6">
                <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500/40" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Correction Required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500/40" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Buffer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-600/80" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stable Sync</span>
                    </div>
                </div>
                <div className="relative z-20">
                    <MethodologyDisclaimer
                        text="MATRIX ANALYSIS: EVALUATES RESPONSE VECTORS AT MULTIPLE GRAVITY LEVELS TO LOCATE CROSS-DIMENSIONAL WEAKNESSES."
                        className="max-w-none text-center"
                    />
                </div>
            </div>
        </div>
    );
});

HeatmapGrid.displayName = "HeatmapGrid";
