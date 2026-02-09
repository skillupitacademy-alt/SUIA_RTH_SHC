'use client';

import { cn } from '@/lib/utils';
import { QuizResultResponse } from '@quiz/api-client';
import { Target, Zap, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

type ResultData = Exclude<QuizResultResponse, { status: 'processing' }>;
type QuestionData = ResultData['questions'][number];

interface EfficiencyQuadrantProps {
    questions: QuestionData[];
    className?: string;
}

export function EfficiencyQuadrant({ questions, className }: EfficiencyQuadrantProps) {
    if (!questions || questions.length === 0) return null;

    // Deterministic Rule: Fast <= 60s, Slow > 60s
    const TIME_THRESHOLD = 60;

    const timedQuestions = questions.filter(q => q.timeSpent > 0);
    const hasSufficientLatencyData = timedQuestions.length >= 5;

    if (!hasSufficientLatencyData) {
        return (
            <div className={cn("glass-morphism rounded-[3rem] p-12 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-muted-foreground/20", className)}>
                <div className="h-16 w-16 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground/40">
                    <Clock size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight uppercase text-muted-foreground/60">Efficiency Analytics</h3>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] max-w-[240px] mx-auto mt-2">
                        Insufficient latency data (Min. 5 timestamped questions required).
                    </p>
                </div>
            </div>
        );
    }

    const quadrants = {
        mastery: questions.filter(q => q.isCorrect && q.timeSpent > 0 && q.timeSpent <= TIME_THRESHOLD),
        depth: questions.filter(q => q.isCorrect && q.timeSpent > TIME_THRESHOLD),
        rash: questions.filter(q => !q.isCorrect && q.timeSpent > 0 && q.timeSpent <= TIME_THRESHOLD),
        struggle: questions.filter(q => !q.isCorrect && q.timeSpent > TIME_THRESHOLD),
    };

    return (
        <div className={cn("glass-morphism rounded-[3rem] p-8 space-y-6", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black tracking-tight uppercase">Efficiency Quadrant</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none mt-1"> Precision vs. Speed Analysis</p>
                </div>
                <span title="X-Axis: Speed (Fast <= 60s), Y-Axis: Precision (Correct/Wrong)" className="cursor-help">
                    <HelpCircle size={14} className="text-muted-foreground/40" />
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 aspect-square md:aspect-auto md:h-[400px]">
                {/* Quadrant 1: Mastery (Top Left) */}
                <div className="relative rounded-3xl bg-[#10B981]/10 border border-[#10B981]/20 p-6 flex flex-col overflow-hidden group">
                    <Zap className="absolute -right-4 -top-4 font-black h-24 w-24 text-[#10B981]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#10B981]">
                        <Zap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Mastery</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Fast & Correct</p>
                    <div className="mt-4 flex flex-wrap gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
                        {quadrants.mastery.map((_, i) => (
                            <div key={i} className="h-2 w-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        ))}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#10B981]">{quadrants.mastery.length}</span>
                </div>

                {/* Quadrant 2: Depth / Persistence (Top Right) */}
                <div className="relative rounded-3xl bg-[#34D399]/10 border border-[#34D399]/20 p-6 flex flex-col overflow-hidden group">
                    <Clock className="absolute -right-4 -top-4 h-24 w-24 text-[#34D399]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#34D399]">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Persistence</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Slow & Correct</p>
                    <div className="mt-4 flex flex-wrap gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
                        {quadrants.depth.map((_, i) => (
                            <div key={i} className="h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                        ))}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#34D399]">{quadrants.depth.length}</span>
                </div>

                {/* Quadrant 3: Rash (Bottom Left) */}
                <div className="relative rounded-3xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 p-6 flex flex-col overflow-hidden group">
                    <AlertTriangle className="absolute -right-4 -top-4 h-24 w-24 text-[#F59E0B]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#F59E0B]">
                        <Zap size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Rash</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Fast & Wrong</p>
                    <div className="mt-4 flex flex-wrap gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
                        {quadrants.rash.map((_, i) => (
                            <div key={i} className="h-2 w-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        ))}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#F59E0B]">{quadrants.rash.length}</span>
                </div>

                {/* Quadrant 4: Struggle (Bottom Right) */}
                <div className="relative rounded-3xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 p-6 flex flex-col overflow-hidden group">
                    <Target className="absolute -right-4 -top-4 h-24 w-24 text-[#FF2D55]/5 rotate-12 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-2 text-[#FF2D55]">
                        <Target size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Struggle</span>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Slow & Wrong</p>
                    <div className="mt-4 flex flex-wrap gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
                        {quadrants.struggle.map((_, i) => (
                            <div key={i} className="h-2 w-2 rounded-full bg-[#FF2D55] shadow-[0_0_8px_rgba(255,45,85,0.4)]" />
                        ))}
                    </div>
                    <span className="mt-auto text-2xl font-black text-[#FF2D55]">{quadrants.struggle.length}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-white/10">
                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest text-center">
                    Phase 21 Behavioral Intelligence Stack
                </p>
            </div>
        </div>
    );
}
