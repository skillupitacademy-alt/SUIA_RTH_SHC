'use client';

import React from 'react';
import {
    BrainCircuit,
    AlertTriangle,
    CheckCircle2,
    Zap,
    Terminal,
    LucideIcon
} from 'lucide-react';
import { cn } from "@/lib/utils";

/**
 * 1. TACTICAL PRESCRIPTION PANEL (PRINT OPTIMIZED)
 * Replicates the executive AI recommendation panel of the dashboard.
 */
interface DiagnosticTierProps {
    title: string;
    status: string;
    color: string;
    icon: LucideIcon;
    progress: number;
    items: string[];
}

const DiagnosticTier = ({ title, status, color, icon: Icon, progress, items }: DiagnosticTierProps) => (
    <div className="p-4 bg-slate-900/40 rounded-[1.5rem] border border-white/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg border", color.replace('bg-', 'border-').replace('/10', '/20'))}>
                    <Icon className={cn("h-3.5 w-3.5", color.replace('bg-', 'text-').split(' ')[0])} />
                </div>
                <div>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{title}</span>
                    <span className={cn("text-[9px] font-bold ml-2", color.replace('bg-', 'text-').split(' ')[0])}>({status})</span>
                </div>
            </div>
            {/* Rigid non-animated progress bar */}
            <div className="h-1 w-16 bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
                <div
                    className={cn("h-full rounded-full", color.split(' ')[0])}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
        <ul className="space-y-1.5 px-1">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                    <div className={cn("h-1 w-1 rounded-full mt-1.5 shrink-0", color.split(' ')[0])} />
                    <span className="text-[11px] text-slate-300 font-medium leading-tight">{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

type AIData = {
    actions: string[];
    weakest_subtopic: string;
    weakest_skill: string;
    status: string;
};

type TacticalPrescriptionProps = {
    data: { ai?: AIData };
};

export function TacticalPrescriptionPrintPanel({ data }: TacticalPrescriptionProps) {
    if (!data.ai) return null;
    const ai = data.ai;

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
            items: ai.actions.length > 2 ? ai.actions.slice(2, 4) : ["Maintain current neural baseline stability"]
        }
    ];

    return (
        <div className="pdf-panel w-full h-full p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <BrainCircuit className="h-5 w-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Tactical Prescription</h3>
            </div>

            <div className="space-y-4 flex-grow">
                {tiers.map((tier, idx) => (
                    <DiagnosticTier key={idx} {...tier} />
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-50">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DIAGNOSTIC LOGS V9.4</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">AI STATUS: {ai.status}</span>
            </div>
        </div>
    );
}

/**
 * 2. INTERPRETATION CARD
 * Bottom insight bands providing qualitative context.
 */
export function InterpretationCard({ title, bullets }: { title: string, bullets: string[] }) {
    if (!bullets || bullets.length === 0) return null;

    return (
        <div className="interpretation-card h-full">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/10 text-indigo-400">
                    <Terminal size={14} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {title}
                </h4>
            </div>
            <ul className="space-y-2.5">
                {bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-indigo-500/40" />
                        <p className="text-[11.5px] font-medium leading-normal text-slate-300">
                            {bullet}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * 3. HEATMAP MATRIX PRINT
 * Replaces the basic table with a high-fidelity pilled grid.
 */
type HeatmapRow = {
    subtopic: string;
    difficulty: string;
    accuracy?: number | string;
    attempts?: number;
};

export function HeatmapMatrixPrint({ data }: { data: HeatmapRow[] }) {
    const subtopics = Array.from(new Set(data.map((d) => d.subtopic)));
    const difficulties = ["Simple", "Intermediate", "Expert"];

    const getCellColor = (accuracy: number) => {
        if (accuracy >= 85) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]';
        if (accuracy >= 65) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]';
        if (accuracy >= 40) return 'bg-amber-500/15 text-amber-400 border-amber-500/20 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]';
        return 'bg-rose-500/25 text-rose-400 border-rose-500/30';
    };

    return (
        <div className="w-full flex flex-col space-y-6">
            <div className="flex gap-3 px-6">
                <div className="w-48 flex-shrink-0" />
                {difficulties.map(diff => (
                    <div key={diff} className="flex-1 text-center py-2.5 bg-slate-900/60 rounded-xl border border-white/5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{diff}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-2.5">
                {subtopics.slice(0, 7).map((sub) => ( // Clamp to visible space
                    <div key={sub} className="flex gap-3">
                        <div className="w-48 flex-shrink-0 flex items-center pr-6 overflow-hidden">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight truncate">
                                {sub}
                            </span>
                        </div>
                        {difficulties.map(diff => {
                            const cell = data.find(d => d.subtopic === sub && d.difficulty === diff);
                            const accuracy = cell ? Math.round(Number(cell.accuracy ?? 0)) : 0;
                            const hasData = !!cell && (cell.attempts ?? 0) > 0;

                            return (
                                <div
                                    key={diff}
                                    className={cn(
                                        "heat-pill flex-1",
                                        hasData ? getCellColor(accuracy) : "bg-slate-900/10 text-slate-700 border-white/5"
                                    )}
                                >
                                    <span className="text-[14px] font-black tracking-tighter">
                                        {hasData ? `${accuracy}%` : '---'}
                                    </span>
                                    {hasData && (
                                        <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">
                                            {cell.attempts} VECTORS
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
