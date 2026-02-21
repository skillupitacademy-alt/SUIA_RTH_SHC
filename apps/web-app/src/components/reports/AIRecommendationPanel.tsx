'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    BrainCircuit,
    AlertTriangle,
    CheckCircle2,
    Zap,
    Activity
} from 'lucide-react';
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MethodologyDisclaimer } from './MethodologyDisclaimer';

export interface AIRecommendation {
    status: "READY" | "BORDERLINE" | "NOT_READY";
    actions: string[];
    weakest_subtopic: string;
    weakest_skill: string;
    confidence?: "HIGH" | "MEDIUM" | "LOW";
    isInconsistent?: boolean;
    timePattern?: 'slow_and_wrong' | 'fast_and_wrong' | 'slow_but_correct' | 'fast_and_correct';
}

export interface AIRecommendationPanelProps {
    ai: AIRecommendation;
}

const DiagnosticTier = ({
    title,
    status,
    color,
    icon: Icon,
    progress,
    items
}: {
    title: string;
    status: string;
    color: string;
    icon: LucideIcon;
    progress: number;
    items: string[];
}) => (
    <div className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden group/tier hover:bg-slate-900/60 transition-all duration-500">
        <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl border shadow-inner", color.replace('bg-', 'border-').replace('/10', '/20'))}>
                    <Icon className={cn("h-4 w-4", color.replace('bg-', 'text-').split(' ')[0])} />
                </div>
                <div>
                    <span className="text-[13px] font-black text-white uppercase tracking-[0.15em]">{title}</span>
                    <span className={cn("text-[11px] font-bold ml-2 tracking-tight", color.replace('bg-', 'text-').split(' ')[0])}>({status})</span>
                </div>
            </div>
            {/* Progress Bar matching image */}
            <div className="h-1.5 w-24 bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", color.split(' ')[0])}
                />
            </div>
        </div>

        <ul className="space-y-3 relative z-10">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 group/item">
                    <div className={cn("h-1.5 w-1.5 rounded-full mt-2 shrink-0 transition-transform group-hover/item:scale-150", color.split(' ')[0])} />
                    <span className="text-[13px] text-slate-300 font-medium leading-relaxed group-hover/item:text-slate-100 transition-colors">
                        {item}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

export const AIRecommendationPanel = React.memo(({ ai }: AIRecommendationPanelProps) => {
    // Generate tiers based on the AI status and provided actions
    const tiers = [
        {
            title: "Focus Areas",
            status: "Critical",
            color: "bg-rose-500 text-rose-400",
            icon: AlertTriangle,
            progress: 35,
            items: ai.actions.length > 0 ? [ai.actions[0], `Targeting: ${ai.weakest_subtopic}`] : [`Targeting: ${ai.weakest_subtopic}`]
        },
        {
            title: "Strengthen",
            status: "Proficient",
            color: "bg-amber-500 text-amber-400",
            icon: Zap,
            progress: 65,
            items: ai.actions.length > 1 ? [ai.actions[1], `Optimization: ${ai.weakest_skill}`] : [`Optimization: ${ai.weakest_skill}`]
        },
        {
            title: "Maintain",
            status: "Mastered",
            color: "bg-emerald-500 text-emerald-400",
            icon: CheckCircle2,
            progress: 90,
            items: ai.actions.length > 2 ? ai.actions.slice(2, 4) : ["Maintain current neural baseline stability", "Continue daily vector drills"]
        }
    ];

    return (
        <div className="w-full h-full flex flex-col p-8 lg:p-10 bg-[#0a0c12]/90 border border-slate-800/60 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden group">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

            {/* Header with badges */}
            <div className="flex flex-col gap-6 mb-12 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner group-hover:border-indigo-500/40 transition-all">
                            <BrainCircuit className="h-6 w-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Synthesis</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {ai.confidence && (
                            <div className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                ai.confidence === 'HIGH' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : (ai.confidence === 'MEDIUM' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400")
                            )}>
                                CONFIDENCE: {ai.confidence}
                            </div>
                        )}
                        <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {ai.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Secondary row for inconsistency and behavior */}
                {(ai.isInconsistent || ai.timePattern) && (
                    <div className="flex flex-wrap gap-2">
                        {ai.isInconsistent && (
                            <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 animate-pulse">
                                <AlertTriangle size={10} className="text-rose-400" />
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Inconsistent Performance</span>
                            </div>
                        )}
                        {ai.timePattern && (
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                                <Activity size={10} className="text-amber-400" />
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                    Behavior: {ai.timePattern.replace(/_/g, ' ')}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4 relative z-10">Tactical Prescription</h4>

            <div className="space-y-6 flex-grow relative z-10">
                {tiers.map((tier, idx) => (
                    <DiagnosticTier key={idx} {...tier} />
                ))}
            </div>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[12px] font-black text-slate-500 uppercase tracking-widest">
                    <Activity size={12} className="text-indigo-500/40" />
                    <span>Diagnostic Engine v9.4</span>
                </div>
                <span className="text-[12px] font-bold text-slate-600 italic">LOGID: PR0_{Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>

            <MethodologyDisclaimer
                className="mt-8"
                text="ADAPTIVE AI: REMEDIATION ENGINE FILTERS PERSISTENCE DIPS VS. COGNITIVE-LOAD OUTLIERS. PRESCRIPTIONS ARE UPDATED DYNAMICALLY AFTER EACH ASSESSMENT VECTOR."
            />
        </div>
    );
});

AIRecommendationPanel.displayName = "AIRecommendationPanel";
