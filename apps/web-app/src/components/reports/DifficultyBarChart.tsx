'use client';

import React from 'react';
import { motion } from "framer-motion";
import { AlertCircle } from 'lucide-react';
import { MethodologyDisclaimer } from './MethodologyDisclaimer';


export interface DifficultyAccuracy {
    level: string;
    accuracy: number;
    attempts: number;
    showNoData?: boolean;
}

export interface DifficultyBarChartProps {
    data: DifficultyAccuracy[];
    expertDropOff?: boolean;
}

export const DifficultyBarChart = React.memo(({ data, expertDropOff }: DifficultyBarChartProps) => {
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
        <div className="w-full h-full flex flex-col space-y-12 pb-16 relative">
            <div>
                <h3 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Complexity Threshold</h3>
                <p className="text-2xl font-black text-white uppercase tracking-tighter">Difficulty Matrix Diagnostic</p>
            </div>

            <div className="flex flex-col gap-12 flex-grow justify-center">
                {data.map((item, idx) => {
                    const style = getLevelStyle(item.level);
                    const isHard = item.level.toLowerCase().includes('expert');
                    // Show data as soon as we have at least 1 attempt
                    const showMetrics = item.attempts >= 1;

                    return (
                        <div key={idx} className="group relative">
                            <div className="flex items-end justify-between mb-4 px-1">
                                <div className="flex items-baseline gap-3">
                                    <span className={`text-[13px] font-black uppercase tracking-[0.2em] ${style.text}`}>
                                        {item.level} Level
                                    </span>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                        {item.attempts} {item.attempts === 1 ? 'Question' : 'Questions'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isHard && expertDropOff && (
                                        <div className="flex items-center gap-2 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md animate-pulse">
                                            <AlertCircle size={10} className="text-rose-400" />
                                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Mastery Drop</span>
                                        </div>
                                    )}
                                    <span className={`text-[15px] font-black tracking-tight ${style.text}`}>
                                        {showMetrics ? `${item.accuracy}% Accuracy` : '---'}
                                    </span>
                                </div>
                            </div>

                            <div className="relative h-4 w-full bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                                {showMetrics && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.accuracy}%` }}
                                        transition={{ duration: 1.5, delay: idx * 0.2, ease: "circOut" }}
                                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r ${style.gradient} ${style.shadow}`}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-8 border-t border-slate-800 flex flex-col gap-6">
                {expertDropOff && (
                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl flex items-center gap-4 group hover:bg-rose-500/10 transition-colors">
                        <AlertCircle className="text-rose-400 h-5 w-5 shrink-0" />
                        <p className="text-[13px] text-slate-400 font-medium">
                            <span className="text-rose-400 font-bold uppercase tracking-tight mr-2">Significant Expert Drop-off detected:</span>
                            Fundamentals are strong, but mastery collapses under high complexity. Focus on expert-tier drills.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-10">
                    {[
                        { label: 'Entry', color: 'bg-emerald-500' },
                        { label: 'Operational', color: 'bg-amber-500' },
                        { label: 'Master', color: 'bg-rose-500' }
                    ].map(tier => (
                        <div key={tier.label} className="flex items-center gap-3">
                            <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] opacity-50 ${tier.color}`} />
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{tier.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <MethodologyDisclaimer
                text="QUANTUM WEIGHTING: THRESHOLD ANALYSIS (EXPERT [2.0], INTERMEDIATE [1.5], SIMPLE [1.0]) IDENTIFIES SPECIFIC CONCEPTUAL RIGIDITY COLLAPSES."
                className="absolute bottom-0 left-0 max-w-[80%]"
            />
        </div>
    );
});

DifficultyBarChart.displayName = "DifficultyBarChart";
