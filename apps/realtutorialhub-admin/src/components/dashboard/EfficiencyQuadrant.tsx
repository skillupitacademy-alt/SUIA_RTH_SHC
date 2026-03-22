'use client';

import { AlertTriangle, Clock, HelpCircle, Target, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EfficiencyData {
    mastery: number;
    persistence: number;
    rash: number;
    struggle: number;
    noData: number;
    total: number;
}

interface EfficiencyQuadrantProps {
    data: EfficiencyData | null;
    className?: string;
    loading?: boolean;
}

export function EfficiencyQuadrant({ data, className, loading }: EfficiencyQuadrantProps) {
    if (loading === true) {
        return (
            <div className={cn("rounded-[3rem] p-12 bg-muted/5 border animate-pulse flex flex-col items-center justify-center h-[500px]", className)}>
                <div className="h-16 w-16 rounded-full bg-muted/10 mb-4" />
                <div className="h-4 w-48 bg-muted/10 rounded" />
            </div>
        );
    }

    if (data === null || data.total === 0) {
        return (
            <div className={cn("rounded-[3rem] p-12 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-muted-foreground/20 bg-muted/5", className)}>
                <div className="h-16 w-16 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground/40">
                    <Clock size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight uppercase text-muted-foreground/60">Efficiency Analytics</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] max-w-[240px] mx-auto mt-2">
                        No latency data available.
                    </p>
                </div>
            </div>
        );
    }

    // Helper to generate "pips" representing the relative volume in each quadrant
    const renderPips = (count: number, color: string) => {
        const MAX_PIPS = 40;
        const pipCount = Math.min(MAX_PIPS, Math.ceil((count / data.total) * MAX_PIPS));
        return Array.from({ length: pipCount }).map((_, i) => (
            <div key={i} className={cn("h-1.5 w-1.5 rounded-full", color)} />
        ));
    };

    return (
        <div className={cn("p-8 space-y-6 rounded-[3rem] border bg-muted/5 backdrop-blur-sm", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black tracking-tight uppercase">Efficiency Quadrant</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none mt-1"> Aggregate Precision vs. Speed</p>
                </div>
                <div className="flex items-center gap-4">
                    {data.noData > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 border border-muted/30">
                            <HelpCircle size={12} className="text-muted-foreground/60" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                {data.noData} Untimed Results
                            </span>
                        </div>
                    )}
                    <span title="X-Axis: Speed (Fast <= 60s), Y-Axis: Precision (Correct/Wrong)" className="cursor-help">
                        <HelpCircle size={14} className="text-muted-foreground/40" />
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 h-[400px]">
                {/* Quadrant 1: Mastery (Top Left) */}
                <div className="relative rounded-3xl bg-[#10B981]/10 border border-[#10B981]/20 p-6 flex flex-col overflow-hidden group">
                    <Zap className="absolute -right-4 -top-4 font-black h-24 w-24 text-[#10B981]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#10B981]">
                        <Zap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Mastery</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Fast & Correct</p>
                    <div className="mt-4 flex flex-wrap gap-1 overflow-y-auto pr-2 custom-scrollbar">
                        {renderPips(data.mastery, "bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]")}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#10B981]">{data.mastery}</span>
                </div>

                {/* Quadrant 2: Persistence (Top Right) */}
                <div className="relative rounded-3xl bg-[#34D399]/10 border border-[#34D399]/20 p-6 flex flex-col overflow-hidden group">
                    <Clock className="absolute -right-4 -top-4 h-24 w-24 text-[#34D399]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#34D399]">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Persistence</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Slow & Correct</p>
                    <div className="mt-4 flex flex-wrap gap-1 overflow-y-auto pr-2 custom-scrollbar">
                        {renderPips(data.persistence, "bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.4)]")}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#34D399]">{data.persistence}</span>
                </div>

                {/* Quadrant 3: Rash (Bottom Left) */}
                <div className="relative rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 p-6 flex flex-col overflow-hidden group">
                    <AlertTriangle className="absolute -right-4 -top-4 h-24 w-24 text-[#F59E0B]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#F59E0B]">
                        <Zap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Rash</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Fast & Wrong</p>
                    <div className="mt-4 flex flex-wrap gap-1 overflow-y-auto pr-2 custom-scrollbar">
                        {renderPips(data.rash, "bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.4)]")}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#F59E0B]">{data.rash}</span>
                </div>

                {/* Quadrant 4: Struggle (Bottom Right) */}
                <div className="relative rounded-3xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 p-6 flex flex-col overflow-hidden group">
                    <Target className="absolute -right-4 -top-4 h-24 w-24 text-[#FF2D55]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#FF2D55]">
                        <Target size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Struggle</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Slow & Wrong</p>
                    <div className="mt-4 flex flex-wrap gap-1 overflow-y-auto pr-2 custom-scrollbar">
                        {renderPips(data.struggle, "bg-[#FF2D55] shadow-[0_0_8px_rgba(255,45,85,0.4)]")}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#FF2D55]">{data.struggle}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest">
                <span>System-Wide Behavioral Intelligence</span>
                <span>Total Attempts: {data.total}</span>
            </div>
        </div>
    );
}
