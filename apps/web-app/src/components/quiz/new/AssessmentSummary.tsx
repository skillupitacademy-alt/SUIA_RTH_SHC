'use client';

import { Clock, Layers, Shield, Tag, Play, Check, Activity } from 'lucide-react';
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
        <aside className="w-full h-full flex flex-col">
            <div className={cn(
                "glass-morphism pink-glow rounded-[2rem] p-5 space-y-2 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,45,85,0.15)] flex-1 flex flex-col border border-gray-300",
                isLocked && "opacity-60 grayscale"
            )}>
                {/* Visual Aura */}
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#FF2D55]/10 rounded-full blur-[90px] group-hover:bg-[#FF2D55]/20 transition-all duration-700" />

                <div className="relative z-10 flex-1 flex flex-col h-full">
                    <h2 className="text-base font-black font-outfit tracking-tighter text-[#1A1A1A] mb-4 uppercase">Assessment Summary</h2>

                    <div className="space-y-4 flex-1 flex flex-col">
                        {/* Zone 1: The Core */}
                        <div className="space-y-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield size={14} className="text-[#FF2D55]" />
                                    <span className="text-[9px] font-black font-inter uppercase tracking-[0.15em] opacity-50">Core Domain</span>
                                </div>
                                <span className="text-[13px] font-black font-inter text-[#1A1A1A] pl-0 leading-tight">
                                    {domainName !== 'Not Selected' ? domainName : (
                                        <span className="opacity-20 italic">Awaiting Selection...</span>
                                    )}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag size={12} className="text-[#FF2D55]" />
                                    <span className="text-[9px] font-black font-inter uppercase tracking-[0.15em] opacity-50">Target Subjects</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-0 min-h-[1.2rem]">
                                    {selectedSubjects.length > 0 ? (
                                        <>
                                            {selectedSubjects.slice(0, 4).map(s => (
                                                <span key={s} className="px-2 py-0.5 bg-gray-50 text-[9px] font-bold text-gray-600 rounded-md border border-gray-200/60 uppercase tracking-tighter">{s}</span>
                                            ))}
                                            {selectedSubjects.length > 4 && (
                                                <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 rounded-md border border-dashed border-gray-200 uppercase tracking-tighter">+{selectedSubjects.length - 4} More</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic opacity-40">None Selected</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Zone 2: The Scope */}
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Check size={14} className="text-[#FF2D55]" />
                                    <span className="text-[9px] font-black font-inter uppercase tracking-[0.15em] opacity-50">Knowledge Scope</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-0 min-h-[1.2rem]">
                                    {selectedTopics.length > 0 ? (
                                        <>
                                            {selectedTopics.slice(0, 4).map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-[#FF2D55]/5 text-[9px] font-black text-[#FF2D55] rounded-md border border-[#FF2D55]/10 uppercase tracking-tighter">{t}</span>
                                            ))}
                                            {selectedTopics.length > 4 && (
                                                <span className="px-2 py-0.5 bg-[#FF2D55]/5 text-[9px] font-black text-[#FF2D55]/40 rounded-md border border-dashed border-[#FF2D55]/10 uppercase tracking-tighter">+{selectedTopics.length - 4}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic opacity-40">None Selected</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Activity size={14} className="text-[#FF2D55]" />
                                    <span className="text-[9px] font-black font-inter uppercase tracking-[0.15em] opacity-50">Precision Focus</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pl-0 min-h-[1.2rem]">
                                    {selectedSubtopics.length > 0 ? (
                                        <>
                                            {selectedSubtopics.slice(0, 4).map(st => (
                                                <span key={st} className="px-2 py-0.5 bg-[#FF2D551A] text-[9px] font-black text-[#FF2D55] rounded-md border border-[#FF2D5533] uppercase tracking-tighter italic">{st}</span>
                                            ))}
                                            {selectedSubtopics.length > 4 && (
                                                <span className="px-2 py-0.5 bg-[#FF2D551A] text-[9px] font-black text-[#FF2D55]/40 rounded-md border border-dashed border-[#FF2D5533] uppercase tracking-tighter">+{selectedSubtopics.length - 4}</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic opacity-40">Dynamic selection active</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Zone 3: Calibration Metrics */}
                        <div className="mt-auto space-y-4">
                            <div className="grid grid-cols-2 gap-3 bg-[#1A1A1A] p-4 rounded-[1.25rem] shadow-xl">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Est. Time</p>
                                    <p className="text-xl font-black font-outfit text-white leading-none">{Math.ceil(questionCount * 1.5)}<span className="text-[10px] ml-1 opacity-60">MIN</span></p>
                                </div>
                                <div className="space-y-1 border-l border-white/10 pl-3">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em]">Density</p>
                                    <p className="text-xl font-black font-outfit text-white leading-none">{questionCount}<span className="text-[10px] ml-1 opacity-60">QUES</span></p>
                                </div>
                            </div>

                            <div className="space-y-2 opacity-90">
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                    <span className="text-[9px] font-black text-[#1A1A1A] uppercase tracking-[0.1em]">Engine Tier</span>
                                    <span className="text-[10px] font-black text-[#FF2D55] uppercase">{difficulty}</span>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-[9px] font-black text-[#1A1A1A] uppercase tracking-[0.1em]">Potential Yield</span>
                                    <span className="text-[10px] font-black text-[#1A1A1A] uppercase">{totalPoints} <span className="text-[8px] opacity-40">PTS</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HUD FOOTER SYNC: Aligning button to the footer baseline */}
                    <div className="mt-4 h-[12dvh] min-h-[90px] flex items-center pt-2 border-t border-gray-100 pointer-events-auto">
                        <button
                            onClick={onStart}
                            disabled={!isReady}
                            className={cn(
                                "w-full h-[52px] rounded-xl font-black font-outfit text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 group border-2 relative overflow-hidden",
                                !isReady
                                    ? "bg-[#FF2D550D] text-[#FF2D554D] border-[#FF2D551A] cursor-not-allowed opacity-100"
                                    : "bg-[#FF2D55] text-white border-[#FF2D55] shadow-[0_10px_30px_rgba(255,45,85,0.3)] hover:shadow-[0_15px_40px_rgba(255,45,85,0.5)] hover:scale-[1.02]"
                            )}
                        >
                            {loading ? (
                                <Activity size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Launch Assessment</span>
                                    <Play size={14} fill="currentColor" className={cn(
                                        "transition-transform group-hover:scale-110",
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
