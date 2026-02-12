'use client';

import { Shield, Tag, Play, Activity, Check } from 'lucide-react';
/* eslint-disable @typescript-eslint/no-unused-vars */
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
    isLocked?: boolean;
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
    isLocked = false,
    loading = false,
    selectedSubjects = [],
    selectedTopics = [],
    selectedSubtopics = []
}: AssessmentSummaryProps) {
    return (
        <aside className="w-full h-full flex flex-col md:pr-12">
            <div className={cn(
                "glass-morphism pink-glow rounded-[2rem] space-y-2 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,45,85,0.15)] flex-1 flex flex-col border border-gray-300",
                isLocked && "opacity-60 grayscale"
            )}>
                {/* Visual Aura */}
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#FF2D55]/10 rounded-full blur-[90px] group-hover:bg-[#FF2D55]/20 transition-all duration-700" />

                <div className="relative z-10 flex-1 flex flex-col h-full pt-8 px-8">
                    <h2 className="text-base font-black font-outfit tracking-tighter text-[#1A1A1A] mb-6 uppercase">Assessment Summary</h2>

                    <div className="space-y-6 flex-1 flex flex-col">
                        {/* Zone 1: The Core */}
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5 focus-within:scale-[1.02] transition-transform cursor-pointer group/item">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield size={14} className="text-[#FF2D55] group-hover/item:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black font-inter uppercase tracking-[0.2em] opacity-40">Core Domain</span>
                                </div>
                                <span className="text-[14px] font-black font-inter text-[#1A1A1A] leading-tight">
                                    {domainName !== 'Not Selected' ? domainName : (
                                        <span className="opacity-20">Awaiting Selection...</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag size={12} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-black font-inter uppercase tracking-[0.2em] opacity-40">Target Subjects</span>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[1.2rem]">
                                    {selectedSubjects.length > 0 ? (
                                        <>
                                            {selectedSubjects.slice(0, 4).map(s => (
                                                <span key={s} className="px-2.5 py-1 bg-gray-50 text-[9px] font-bold text-gray-500 rounded-lg border border-gray-200/60 uppercase tracking-tighter hover:bg-[#FF2D55] hover:text-white hover:border-[#FF2D55] transition-colors cursor-default">{s}</span>
                                            ))}
                                            {selectedSubjects.length > 4 && (
                                                <span className="px-2.5 py-1 bg-gray-50 text-[9px] font-black text-gray-400 rounded-lg border border-dashed border-gray-200 uppercase tracking-tighter">+{selectedSubjects.length - 4}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter opacity-30">Selection Pending</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Zone 2: The Scope */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Check size={14} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-black font-inter uppercase tracking-[0.2em] opacity-40">Knowledge Scope</span>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[1.2rem]">
                                    {selectedTopics.length > 0 ? (
                                        <>
                                            {selectedTopics.slice(0, 4).map(t => (
                                                <span key={t} className="px-2.5 py-1 bg-[#FF2D55]/5 text-[9px] font-black text-[#FF2D55] rounded-lg border border-[#FF2D55]/10 uppercase tracking-tighter hover:bg-[#FF2D55] hover:text-white transition-colors cursor-default">{t}</span>
                                            ))}
                                            {selectedTopics.length > 4 && (
                                                <span className="px-2.5 py-1 bg-[#FF2D55]/5 text-[9px] font-black text-[#FF2D55]/40 rounded-lg border border-dashed border-[#FF2D55]/10 uppercase tracking-tighter">+{selectedTopics.length - 4}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter opacity-30">Awaiting Topics</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Activity size={14} className="text-[#FF2D55]" />
                                    <span className="text-[10px] font-black font-inter uppercase tracking-[0.2em] opacity-40">Precision Focus</span>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[1.2rem]">
                                    {selectedSubtopics.length > 0 ? (
                                        <>
                                            {selectedSubtopics.slice(0, 4).map(st => (
                                                <span key={st} className="px-2.5 py-1 bg-[#FF2D551A] text-[9px] font-black text-[#FF2D55] rounded-lg border border-[#FF2D5533] uppercase tracking-tighter hover:scale-110 transition-transform cursor-default">{st}</span>
                                            ))}
                                            {selectedSubtopics.length > 4 && (
                                                <span className="px-2.5 py-1 bg-[#FF2D551A] text-[9px] font-black text-[#FF2D55]/40 rounded-lg border border-dashed border-[#FF2D5533] uppercase tracking-tighter">+{selectedSubtopics.length - 4}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter opacity-30">Sub-skills inactive</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Zone 3: Calibration Metrics (Project DNA Look) */}
                        <div className="mt-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-white rounded-[1.5rem] border border-gray-200 p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative group/metrics overflow-hidden">
                                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#FF2D55] rounded-r-full" />
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Est. Time</p>
                                    <p className="text-2xl font-black font-outfit text-[#FF2D55] leading-none">{Math.ceil(questionCount * 1.5)}<span className="text-xs ml-1 opacity-40 text-[#1A1A1A]">MIN</span></p>
                                </div>
                                <div className="space-y-1 border-l border-gray-100 pl-4">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Density</p>
                                    <p className="text-2xl font-black font-outfit text-[#1A1A1A] leading-none">{questionCount}<span className="text-xs ml-1 opacity-40">QUES</span></p>
                                </div>
                            </div>

                            <div className="space-y-3 opacity-90">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 group/tier cursor-default">
                                    <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.1em] group-hover/tier:text-[#FF2D55] transition-colors">Engine Tier</span>
                                    <span className="text-[11px] font-black text-[#FF2D55] uppercase">{difficulty}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 group/yield cursor-default">
                                    <span className="text-[10px] font-black text-[#1A1A1A] uppercase tracking-[0.1em] group-hover/yield:text-[#FF2D55] transition-colors">Potential Yield</span>
                                    <span className="text-[11px] font-black text-[#1A1A1A] uppercase">{totalPoints} <span className="text-[9px] opacity-40">PTS</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HUD FOOTER SYNC: Perfect Baseline Floor */}
                    <div className="mt-6 h-[12dvh] flex items-center border-t border-gray-100 pointer-events-auto">
                        <button
                            onClick={onStart}
                            disabled={!isReady}
                            className={cn(
                                "w-full h-[54px] rounded-xl font-black font-outfit text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 group border-2 relative overflow-hidden",
                                !isReady
                                    ? "bg-[#FF2D550D] text-[#FF2D554D] border-[#FF2D551A] cursor-not-allowed opacity-100"
                                    : "bg-[#FF2D55] text-white border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.2)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.4)] hover:bg-[#FF2D55] hover:border-[#FF2D55] hover:scale-[1.02]"
                            )}
                        >
                            {loading ? (
                                <Activity size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Launch Assessment</span>
                                    <Play size={16} fill="currentColor" className={cn(
                                        "transition-all group-hover:translate-x-1 group-hover:scale-110",
                                        !isReady ? "opacity-20" : "opacity-100"
                                    )} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
