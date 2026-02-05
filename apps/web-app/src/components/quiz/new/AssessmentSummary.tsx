'use client';

import { Clock, Layers, Shield, Tag, Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssessmentSummaryProps {
    domainName: string;
    subjectsCount: number;
    topicsCount: number;
    questionCount: number;
    difficulty: string;
    totalPoints: number;
    onStart: () => void;
    isReady: boolean;
    loading?: boolean;
    selectedSubjects?: string[];
    selectedTopics?: string[];
    selectedSubtopics?: string[];
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
    loading = false,
    selectedSubjects = [],
    selectedTopics = [],
    selectedSubtopics = []
}: AssessmentSummaryProps) {
    return (
        <aside className="sticky top-8 w-full flex flex-col h-full">
            <div className="glass-morphism pink-glow rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,45,85,0.15)] flex-1 flex flex-col">
                {/* Visual Aura */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF2D55]/10 rounded-full blur-[80px] group-hover:bg-[#FF2D55]/20 transition-all duration-700" />

                <div className="relative z-10 space-y-5 flex-1 flex flex-col h-full">
                    <h2 className="text-xl font-bold font-outfit tracking-tight text-[#1A1A1A]">Assessment Summary</h2>

                    <div className="space-y-4 flex-1">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Shield size={14} className="text-[#FF2D55]" />
                                <span className="text-[10px] font-bold font-inter uppercase tracking-widest opacity-60">Domain</span>
                            </div>
                            <span className="text-sm font-bold font-inter text-[#1A1A1A] pl-7 truncate">{domainName}</span>
                        </div>

                        {selectedSubjects.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Tag size={14} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-bold font-inter uppercase tracking-widest opacity-60">Subjects</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-7">
                                    {selectedSubjects.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-md border border-gray-100">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTopics.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Check size={14} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-bold font-inter uppercase tracking-widest opacity-60">Target Topics</span>
                                </div>
                                <div className="flex flex-wrap gap-2 pl-7">
                                    {selectedTopics.map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-[#FF2D55]/5 text-[10px] font-bold text-[#FF2D55]/60 rounded-md border border-[#FF2D55]/10">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-[#F3F4F6] w-full" />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Time</p>
                                <p className="text-sm font-bold font-inter">{Math.ceil(questionCount * 1.5)} min</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Volume</p>
                                <p className="text-sm font-bold font-inter">{questionCount} Qs</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-[#F3F4F6]">
                            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Difficulty</span>
                                <span className="text-[#1A1A1A] capitalize">{difficulty}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Total Points</span>
                                <span className="text-[#FF2D55] font-black">{totalPoints} pts</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 space-y-4">
                        <button
                            onClick={onStart}
                            disabled={!isReady || loading}
                            className={cn(
                                "w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2D55] to-[#D4145A] text-white font-bold font-outfit uppercase tracking-wider shadow-[0_10px_30px_rgba(255,45,85,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale disabled:opacity-50 group hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]",
                                isReady && "animate-in fade-in zoom-in duration-500"
                            )}
                        >
                            {loading ? 'Starting...' : (
                                <>
                                    Start Assessment
                                    <div className="bg-white/20 p-1.5 rounded-full">
                                        <Play size={12} fill="currentColor" />
                                    </div>
                                </>
                            )}
                        </button>

                        {!isReady && !loading && (
                            <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-tight opacity-60">
                                Complete all steps to launch evaluation
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
