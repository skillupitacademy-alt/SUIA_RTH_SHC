'use client';

import { Clock, Layers, Shield, Tag, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentSummaryProps {
    domainName?: string;
    subjectsCount: number;
    topicsCount: number;
    questionCount: number;
    difficulty: string;
    totalPoints: number;
    onStart: () => void;
    isReady: boolean;
    loading?: boolean;
}

export function AssessmentSummary({
    domainName = 'Not Selected',
    subjectsCount,
    topicsCount,
    questionCount,
    difficulty,
    totalPoints,
    onStart,
    isReady,
    loading = false
}: AssessmentSummaryProps) {
    return (
        <aside className="sticky top-8 w-full">
            <div className="glass-morphism pink-glow rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,45,85,0.15)]">
                {/* Visual Aura */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF2D55]/10 rounded-full blur-[80px] group-hover:bg-[#FF2D55]/20 transition-all duration-700" />

                <div className="relative z-10 space-y-6">
                    <h2 className="text-2xl font-bold font-outfit tracking-tight text-[#1A1A1A]">Assessment Summary</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Shield size={18} className="text-[#FF2D55]" />
                                <span className="text-sm font-medium font-inter">Selected Domain</span>
                            </div>
                            <span className="text-sm font-bold font-inter text-right max-w-[150px] truncate">{domainName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Tag size={18} className="text-[#FF2D55]" />
                                <span className="text-sm font-medium font-inter">Topics</span>
                            </div>
                            <span className="text-sm font-bold font-inter">{topicsCount} selected</span>
                        </div>

                        <div className="h-px bg-[#F3F4F6] w-full" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Clock size={18} className="text-[#FF2D55]" />
                                <span className="text-sm font-medium font-inter">Time Limit</span>
                            </div>
                            <span className="text-sm font-bold font-inter">{Math.ceil(questionCount * 1.5)} min</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Layers size={18} className="text-[#FF2D55]" />
                                <span className="text-sm font-medium font-inter">Question Count</span>
                            </div>
                            <span className="text-sm font-bold font-inter">{questionCount} questions</span>
                        </div>

                        <div className="h-px bg-[#F3F4F6] w-full" />

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Difficulty</span>
                                <span className="text-[#1A1A1A] capitalize">{difficulty}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Total Points</span>
                                <span className="text-[#1A1A1A]">{totalPoints} pts</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onStart}
                        disabled={!isReady || loading}
                        className={cn(
                            "w-full py-5 rounded-2xl bg-gradient-to-r from-[#FF2D55] to-[#D4145A] text-white font-bold font-outfit uppercase tracking-wider shadow-[0_10px_30px_rgba(255,45,85,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 group hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]",
                            isReady && "animate-in fade-in zoom-in duration-500"
                        )}
                    >
                        {loading ? 'Starting...' : (
                            <>
                                Start Assessment
                                <div className="bg-white/20 p-1.5 rounded-full">
                                    <Play size={14} fill="currentColor" />
                                </div>
                            </>
                        )}
                    </button>

                    {!isReady && !loading && (
                        <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-tight opacity-60">
                            Complete all steps to launch evaluation
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}
