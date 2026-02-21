'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, AlertTriangle, ArrowRight, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIRecommendation {
    status: 'READY' | 'BORDERLINE' | 'NOT READY';
    actions: string[];
    weakestSubtopic?: string;
    weakestSkill?: string;
    nextExamHours: number;
}

export interface AIRecommendationPanelProps {
    data: AIRecommendation;
}

export const AIRecommendationPanel = React.memo(({ data }: AIRecommendationPanelProps) => {
    const statusConfig = {
        READY: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: <Target className="w-5 h-5" /> },
        BORDERLINE: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <Zap className="w-5 h-5" /> },
        'NOT READY': { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: <AlertTriangle className="w-5 h-5" /> },
    };

    const currentStatus = statusConfig[data.status];

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full flex flex-col h-full p-8 bg-indigo-950/20 backdrop-blur-xl rounded-[2.5rem] border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)] relative overflow-hidden"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px]" />

            <div className="relative space-y-8 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI Synthesis</h3>
                        <p className="text-xl font-black text-white">Advisory Panel</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={cn(
                    "flex items-center gap-4 p-5 rounded-3xl border transition-all",
                    currentStatus.bg,
                    currentStatus.border
                )}>
                    <div className={cn("p-2 rounded-xl bg-white/5", currentStatus.color)}>
                        {currentStatus.icon}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Readiness Status</span>
                        <span className={cn("text-lg font-black uppercase", currentStatus.color)}>{data.status}</span>
                    </div>
                </div>

                {/* Gaps Section */}
                <div className="grid grid-cols-1 gap-4">
                    {data.weakestSubtopic && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weakest Subtopic</p>
                            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl inline-block">
                                <span className="text-[11px] font-black text-rose-500 uppercase">{data.weakestSubtopic}</span>
                            </div>
                        </div>
                    )}
                    {data.weakestSkill && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Weakest Latent Skill</p>
                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-block">
                                <span className="text-[11px] font-black text-amber-500 uppercase">{data.weakestSkill}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action List */}
                <div className="space-y-4 flex-grow">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recommended Actions</p>
                    <div className="space-y-3">
                        {data.actions.map((action, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                <p className="text-sm font-bold text-slate-300 leading-snug group-hover:text-white transition-colors capitalize">{action}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Next Step Button */}
                <div className="pt-6 border-t border-white/5 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retake Window</span>
                        <span className="text-xs font-black text-indigo-400">{data.nextExamHours} Hours</span>
                    </div>
                    <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 group">
                        Unlock Next Tier
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
});

AIRecommendationPanel.displayName = 'AIRecommendationPanel';
