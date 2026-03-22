'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';
import { useReportThemeTokens } from './hooks/useReportThemeTokens';

export interface HeatmapGridProps {
    data: { subtopic: string; difficulty: string; accuracy: number; attempts: number }[];
}

export const HeatmapGrid = React.memo(({ data }: HeatmapGridProps) => {
    const { tokens, theme } = useReportThemeTokens();
    const subtopics = Array.from(new Set(data.map(d => d.subtopic))).sort();
    const difficulties = ["Simple", "Intermediate", "Expert"];

    const getCellColor = (accuracy: number | undefined, attempts: number | undefined) => {
        if (!attempts || attempts === 0) return theme === 'dark' ? "bg-slate-900/20" : "bg-slate-100/50";
        if (accuracy === undefined) return theme === 'dark' ? "bg-slate-900/20" : "bg-slate-100/50";
        if (accuracy >= 90) return "bg-indigo-600/80";
        if (accuracy >= 75) return "bg-indigo-500/50";
        if (accuracy >= 50) return "bg-amber-500/40";
        return "bg-rose-500/40";
    };

    return (
        <div 
            className="w-full h-full flex flex-col rounded-[2.5rem] p-8 py-[30px] lg:p-10 lg:py-[30px] border shadow-2xl relative overflow-hidden group transition-colors duration-300"
            style={{ 
                backgroundColor: tokens.cardBg,
                borderColor: tokens.cardBorder
            }}
        >
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-5 mb-5 relative z-20">
                <div>
                    <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Matrix Analysis</h3>
                    <p className="text-2xl font-black tracking-tighter uppercase leading-tight" style={{ color: tokens.textPrimary }}>Neural Accuracy Heatmap</p>
                </div>
            </div>

            <div className="flex-grow overflow-x-auto overflow-y-hidden scrollbar-hide py-4">
                <div className="min-w-[800px] h-full flex flex-col">
                    <div className="flex mb-4">
                        <div className="w-48 shrink-0" />
                        <div className="flex-grow grid grid-cols-3 gap-3">
                            {difficulties.map(diff => (
                                <div key={diff} className="text-center text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: tokens.textMuted }}>
                                    {diff}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow space-y-3 overflow-y-auto pr-4 scrollbar-hide">
                        {subtopics.map(subtopic => (
                            <div key={subtopic} className="flex items-center group/row">
                                <div className="w-48 shrink-0 pr-6">
                                    <span className="text-[13px] font-bold truncate block transition-colors uppercase tracking-tight" style={{ color: tokens.textSecondary }}>
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
                                                    "rounded-xl border relative overflow-hidden group/cell transition-all duration-300 hover:scale-[1.02] hover:z-10",
                                                    getCellColor(entry?.accuracy, entry?.attempts)
                                                )}
                                                style={{ borderColor: tokens.borderSubtle }}
                                            >
                                                {entry && entry.attempts > 0 && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-lg font-black tracking-tighter" style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>
                                                            {entry.accuracy}%
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>
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

            <div 
                className="mt-auto pt-5 border-t space-y-6"
                style={{ borderTopColor: tokens.borderSubtle }}
            >
                <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-rose-500/40" />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tokens.textMuted }}>Correction Required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500/40" />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tokens.textMuted }}>Logic Buffer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-600/80" />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: tokens.textMuted }}>Stable Sync</span>
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
