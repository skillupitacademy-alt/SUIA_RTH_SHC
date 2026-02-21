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

export interface AIRecommendation {
    status: "READY" | "BORDERLINE" | "NOT_READY";
    actions: string[];
    weakest_subtopic: string;
    weakest_skill: string;
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
    <div className="p-5 bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden group/tier hover:bg-slate-900/60 transition-all duration-500">
        <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl border", color.replace('bg-', 'border-').replace('/10', '/20'))}>
                    <Icon className={cn("h-4 w-4", color.replace('bg-', 'text-').split(' ')[0])} />
                </div>
                <div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">{title}</span>
                    <span className={cn("text-[9px] font-bold ml-2 tracking-tight", color.replace('bg-', 'text-').split(' ')[0])}>({status})</span>
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

        <ul className="space-y-2 relative z-10">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 group/item">
                    <div className={cn("h-1 w-1 rounded-full mt-1.5 shrink-0 transition-transform group-hover/item:scale-150", color.split(' ')[0])} />
                    <span className="text-[11px] text-slate-400 font-medium leading-relaxed group-hover/item:text-slate-200 transition-colors">
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
            items: ai.actions.filter((_, i) => i === 0).concat([`Targeting: ${ai.weakest_subtopic}`])
        },
        {
            title: "Strengthen",
            status: "Proficient",
            color: "bg-amber-500 text-amber-400",
            icon: Zap,
            progress: 65,
            items: ai.actions.filter((_, i) => i === 1).concat([`Optimization: ${ai.weakest_skill}`])
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
        <div className="w-full h-full p-8 flex flex-col bg-[#0a0c12]/90 border border-slate-800/60 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden group">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

            {/* Header matching image exactly */}
            <div className="flex items-center justify-between mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner group-hover:border-indigo-500/40 transition-all">
                        <BrainCircuit className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Neural Synthesis</h3>
                </div>
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-lg">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        AI STATUS: OPTIMIZED
                    </span>
                </div>
            </div>

            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-white/5 pb-4 relative z-10">Tactical Prescription</h4>

            <div className="space-y-5 flex-grow relative z-10 scrollbar-hide overflow-y-auto pr-1">
                {tiers.map((tier, idx) => (
                    <DiagnosticTier key={idx} {...tier} />
                ))}
            </div>

            {/* Footer mirroring layout logic */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <Activity size={12} className="text-indigo-500/40" />
                    <span>Diagnostic Engine v9.4</span>
                </div>
                <span className="text-[9px] font-bold text-slate-700 italic">LOGID: SYS_{Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>
        </div>
    );
});

AIRecommendationPanel.displayName = "AIRecommendationPanel";
