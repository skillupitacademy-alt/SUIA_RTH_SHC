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
        <aside className="w-full flex flex-col h-full">
            <div className="glass-morphism pink-glow rounded-[2rem] p-6 space-y-4 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,45,85,0.15)] flex-1 flex flex-col">
                {/* Visual Aura */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FF2D55]/10 rounded-full blur-[80px] group-hover:bg-[#FF2D55]/20 transition-all duration-700" />

                <div className="relative z-10 flex-1 flex flex-col h-full">
                    <h2 className="text-xl font-black font-outfit tracking-tight text-[#1A1A1A] mb-4 uppercase italic">Assessment Summary</h2>

                    <div className="space-y-4 flex-1">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield size={14} className="text-[#FF2D55]" />
                                <span className="text-[10px] font-bold font-inter uppercase tracking-widest opacity-60">Domain</span>
                            </div>
                            <span className="text-sm font-bold font-inter text-[#1A1A1A] pl-6 truncate">{domainName}</span>
                        </div>

                        {selectedSubjects.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag size={14} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-bold font-inter uppercase tracking-widest opacity-60">Selected Subjects</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-6">
                                    {selectedSubjects.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-500 rounded-md border border-gray-100 uppercase tracking-tighter">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedTopics.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Check size={14} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-bold font-inter uppercase tracking-widest opacity-60">Knowledge Units</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-6">
                                    {selectedTopics.map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-[#FF2D55]/5 text-[10px] font-bold text-[#FF2D55] rounded-md border border-[#FF2D55]/10 uppercase tracking-tighter">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent w-full my-2" />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Time</p>
                                <p className="text-base font-black font-outfit text-[#1A1A1A]">{Math.ceil(questionCount * 1.5)} MIN</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Volume</p>
                                <p className="text-base font-black font-outfit text-[#1A1A1A]">{questionCount} Qs</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-100 mt-2">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Complexity</span>
                                <span className="text-[#1A1A1A]">{difficulty}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Potential</span>
                                <span className="text-[#FF2D55] font-black">{totalPoints} PTS</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-100/50 space-y-3">
                        <button
                            onClick={onStart}
                            disabled={!isReady || loading}
                            className={cn(
                                "w-full py-4 rounded-xl bg-gradient-to-br from-[#FF2D55] to-[#D4145A] text-white font-black font-outfit text-sm uppercase tracking-widest shadow-[0_10px_25px_rgba(255,45,85,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale disabled:opacity-30 group hover:shadow-[0_15px_35px_rgba(255,45,85,0.45)]",
                                isReady && "animate-in fade-in zoom-in duration-500 shadow-[0_0_30px_rgba(255,45,85,0.5)]"
                            )}
                        >
                            {loading ? 'INITIALIZING...' : (
                                <>
                                    Launch Assessment
                                    <div className="bg-white/20 p-1.5 rounded-full">
                                        <Play size={12} fill="currentColor" />
                                    </div>
                                </>
                            )}
                        </button>

                        {!isReady && !loading && (
                            <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">
                                Selection Phase: Required Steps Remaining
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
