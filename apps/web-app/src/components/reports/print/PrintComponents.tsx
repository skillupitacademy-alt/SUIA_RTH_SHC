'use client';

import React from 'react';
import {
    BrainCircuit,
    AlertTriangle,
    CheckCircle2,
    Zap,
    Terminal,
    Activity,
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
    dense?: boolean;
}

const DiagnosticTier = ({ title, status, color, icon: Icon, progress, items, dense }: DiagnosticTierProps) => (
    <div className={cn("p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden group/tier hover:bg-slate-900/60 transition-all duration-300", dense && "p-4 rounded-3xl")}>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />
        <div className={cn("flex items-center justify-between mb-5 relative z-10", dense && "mb-3")}>
            <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl border border-white/5 shadow-inner", color.replace('bg-', 'text-').split(' ')[0], dense && "p-1.5")}>
                    <Icon className={cn("h-4 w-4", dense && "h-3 w-3")} />
                </div>
                <div>
                    <span className={cn("text-[13px] font-black text-white uppercase tracking-widest", dense && "text-[11px]")}>{title}</span>
                    <span className={cn("text-[11px] font-bold ml-2", color.replace('bg-', 'text-').split(' ')[0], dense && "text-[9px] font-black")}>({status})</span>
                </div>
            </div>
            {/* Rigid non-animated progress bar matching web thickness */}
            <div className={cn("h-1.5 w-24 bg-slate-800/50 rounded-full overflow-hidden p-[1px] border border-white/5", dense && "w-16 h-1")}>
                <div
                    className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", color.split(' ')[0])}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
        <ul className={cn("space-y-3 relative z-10", dense && "space-y-1.5")}>
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 group/item">
                    <div className={cn("h-1.5 w-1.5 rounded-full mt-2 shrink-0 shadow-sm", color.split(' ')[0], dense && "h-1 w-1 mt-1.5")} />
                    <span className={cn("text-[13px] text-slate-300 font-medium leading-relaxed", dense && "text-[11px] line-clamp-1")}>
                        {item}
                    </span>
                </li>
            ))}
        </ul>
    </div>
);

type AIData = {
    actions: string[];
    weakest_subtopic: string;
    weakest_skill?: string;
    status: string;
};

type TierOverride = {
    label: string;
    status: string;
    items: string[];
    color: string;
    progress: number;
};

type TacticalPrescriptionProps = {
    data: { ai?: AIData; timePattern?: string; isInconsistent?: boolean };
    title?: string;
    dense?: boolean;
    tierOverrides?: TierOverride[];
    behaviorBadge?: string;
};

export function TacticalPrescriptionPrintPanel({ data, title, dense, tierOverrides, behaviorBadge }: TacticalPrescriptionProps) {
    if (!data.ai) return null;
    const ai = data.ai;

    const tiers = tierOverrides
        ? tierOverrides.map((t) => ({
            title: t.label,
            status: t.status,
            color: t.color,
            icon: t.label === "Focus Areas" ? AlertTriangle : t.label === "Strengthen" ? Zap : CheckCircle2,
            progress: t.progress,
            items: t.items,
        }))
        : [
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
                items: ai.actions.length > 1
                    ? [ai.actions[1], `Optimization: ${ai.weakest_skill || ai.weakest_subtopic}`]
                    : [`Optimization: ${ai.weakest_skill || ai.weakest_subtopic}`]
            },
            {
                title: "Maintain",
                status: "Mastered",
                color: "bg-emerald-500 text-emerald-400",
                icon: CheckCircle2,
                progress: 95,
                items: ai.actions.length > 2 ? ai.actions.slice(2, 4) : ["Maintain current neural baseline stability"]
            }
        ];

    // Resolve behavior badge from prop or data
    const resolvedBehavior = behaviorBadge || (data.timePattern ? data.timePattern.replace(/_/g, ' ') : undefined);

    return (
        <div className={cn("pdf-panel w-full h-full p-5 lg:p-6 flex flex-col bg-[#0a0c12]/90 border border-slate-800/60 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden group")}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className={cn("flex items-center justify-between mb-6", dense && "mb-4")}>
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-inner group-hover:border-indigo-500/40 transition-all", dense && "p-1.5 rounded-xl")}>
                            <BrainCircuit className={cn("h-6 w-6 text-indigo-400", dense && "h-4 w-4")} />
                        </div>
                        <h3 className={cn("text-xl font-black text-white uppercase tracking-tighter", dense && "text-base")}>Tactical Prescription</h3>
                    </div>
                    <div className={cn("px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg", dense && "px-2 py-1")}>
                        <span className={cn("text-[12px] font-black text-emerald-400 uppercase tracking-widest leading-none flex items-center gap-2", dense && "text-[9px]")}>
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            AI STATUS: {ai.status === 'READY' ? 'OPTIMIZED' : ai.status}
                        </span>
                    </div>
                </div>

                {/* Behavior / Inconsistency badges */}
                {(resolvedBehavior || data.isInconsistent) && (
                    <div className={cn("flex flex-wrap gap-2 mb-4", dense && "mb-2")}>
                        {data.isInconsistent && (
                            <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                                <AlertTriangle size={10} className="text-rose-400" />
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Inconsistent Performance</span>
                            </div>
                        )}
                        {resolvedBehavior && (
                            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                                <Activity size={10} className="text-amber-400" />
                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                    Behavior: {resolvedBehavior}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <h4 className={cn("text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-4", dense && "text-[9px] mb-2 pb-2")}>
                    {title || "Diagnostic Matrix"}
                </h4>

                <div className={cn("space-y-6 flex-grow overflow-visible", dense && "space-y-3")}>
                    {tiers.map((tier, idx) => (
                        <DiagnosticTier key={idx} {...tier} dense={dense} />
                    ))}
                </div>

                <div className={cn("mt-6 pt-4 border-t border-white/5", dense && "mt-2 pt-2")}>
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-2">
                            <span>DIAGNOSTIC LOGS V9.4</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-700">SYS_5DNJLE</span>
                    </div>
                </div>
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
            <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/10 text-indigo-400">
                    <Terminal size={14} />
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    {title}
                </h4>
            </div>
            <ul className="space-y-1.5">
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
        <div className="w-full flex-1 flex flex-col space-y-6">
            <div className="flex gap-4 px-6 mb-2">
                <div className="w-72 flex-shrink-0" />
                {difficulties.map(diff => (
                    <div key={diff} className="flex-1 min-w-[120px] max-w-[200px] text-center py-4 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{diff}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 space-y-4">
                {subtopics.slice(0, 8).map((sub) => ( // Expanded slice for 1080p
                    <div key={sub} className="flex gap-4">
                        <div className="w-72 flex-shrink-0 flex items-start pt-4 border-r border-slate-800/60 pr-6 overflow-hidden">
                            <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest leading-tight text-left">
                                {sub}
                            </span>
                        </div>
                        {difficulties.map(diff => {
                            const cell = data.find(d => d.subtopic === sub && d.difficulty === diff);
                            // Show data as soon as we have at least 1 attempt
                            const hasSufficientData = !!cell && (cell.attempts ?? 0) >= 1;
                            const accuracy = cell ? Math.round(Number(cell.accuracy ?? 0)) : 0;

                            return (
                                <div
                                    key={diff}
                                    className={cn(
                                        "flex-1 min-w-[120px] max-w-[200px] h-20 flex flex-col items-center justify-center rounded-2xl border transition-all duration-300 relative",
                                        hasSufficientData ? getCellColor(accuracy) : "bg-slate-900/10 text-slate-700 border-white/5"
                                    )}
                                >
                                    <span className="text-[18px] font-black tracking-tight z-10">
                                        {hasSufficientData ? `${accuracy}%` : '---'}
                                    </span>
                                    {hasSufficientData && (
                                        <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-1">
                                            {cell.attempts} VECTORS
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend matching web */}
            <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-white/5">
                {[
                    { label: "Mastery", color: "bg-emerald-500" },
                    { label: "Advancing", color: "bg-indigo-500" },
                    { label: "Growth", color: "bg-amber-500" },
                    { label: "Critical", color: "bg-rose-500" },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", item.color)} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                    </div>
                ))}
            </div>
            <p className="text-[8px] text-slate-600 mt-3 flex items-center gap-1.5">
                <span className="opacity-50">ⓘ</span>
                NEURAL PROJECTION MAPS CROSS-FUNCTIONAL PERFORMANCE DENSITY. MATRIX SATURATION CORRELATES WITH THE CONFIDENCE DEPTH OF UNDERLYING ACCURACY DATA.
            </p>
        </div>
    );
}
