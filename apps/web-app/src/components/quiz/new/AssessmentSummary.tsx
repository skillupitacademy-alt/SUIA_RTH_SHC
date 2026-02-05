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
        <aside className="w-full flex flex-col h-full max-h-[600px]">
            <div className={cn(
                "glass-morphism pink-glow rounded-[2rem] p-5 space-y-2 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,45,85,0.15)] flex-1 flex flex-col border border-gray-300",
                isLocked && "opacity-60 grayscale"
            )}>
                {/* Visual Aura */}
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#FF2D55]/10 rounded-full blur-[90px] group-hover:bg-[#FF2D55]/20 transition-all duration-700" />

                <div className="relative z-10 flex-1 flex flex-col h-full">
                    <h2 className="text-base font-black font-outfit tracking-tight text-[#1A1A1A] mb-1 uppercase">Assessment Summary</h2>

                    <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield size={13} className="text-[#FF2D55]" />
                                <span className="text-[9px] font-bold font-inter uppercase tracking-widest opacity-60">Domain</span>
                            </div>
                            <span className="text-xs font-bold font-inter text-[#1A1A1A] pl-5 truncate">
                                {domainName !== 'Not Selected' ? domainName : (
                                    <span className="opacity-20 italic">Awaiting Selection...</span>
                                )}
                            </span>
                        </div>

                        <div className="h-[1px] bg-gray-300 w-full ml-5" />

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Tag size={13} className="text-[#FF2D55]" />
                                <span className="text-[9px] font-bold font-inter uppercase tracking-widest opacity-60">Subjects</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pl-5 min-h-[1.5rem]">
                                {selectedSubjects.length > 0 ? (
                                    selectedSubjects.map(s => (
                                        <span key={s} className="px-2 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-500 rounded border border-gray-200/50 uppercase tracking-tighter">{s}</span>
                                    ))
                                ) : (
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic opacity-40">None Selected</span>
                                )}
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-300 w-full ml-5" />

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Check size={13} className="text-[#FF2D55]" />
                                <span className="text-[9px] font-bold font-inter uppercase tracking-widest opacity-60">Knowledge Units</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pl-5 min-h-[1.5rem]">
                                {selectedTopics.length > 0 ? (
                                    selectedTopics.map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-[#FF2D55]/5 text-[9px] font-bold text-[#FF2D55] rounded border border-[#FF2D55]/10 uppercase tracking-tighter">{t}</span>
                                    ))
                                ) : (
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic opacity-40">None Selected</span>
                                )}
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-300 w-full ml-5" />

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock size={13} className="text-[#FF2D55]" />
                                <span className="text-[9px] font-bold font-inter uppercase tracking-widest opacity-60">Precision Skills</span>
                            </div>
                            <div className="flex flex-wrap gap-1 pl-5 min-h-[1.5rem]">
                                {selectedSubtopics.length > 0 ? (
                                    selectedSubtopics.map(st => (
                                        <span key={st} className="px-2 py-0.5 bg-[#FF2D55]/10 text-[9px] font-black text-[#FF2D55] rounded border border-[#FF2D55]/20 uppercase tracking-tighter italic">{st}</span>
                                    ))
                                ) : (
                                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter italic opacity-40">None Selected</span>
                                )}
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-300 w-full my-2" />

                        <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-300">
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Est. Time</p>
                                <p className="text-base font-black font-outfit text-[#1A1A1A]">{Math.ceil(questionCount * 1.5)} MIN</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">Questions</p>
                                <p className="text-base font-black font-outfit text-[#1A1A1A]">{questionCount}</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-1 w-1 rounded-full bg-[#FF2D55]" />
                                <p className="text-[9px] font-black font-outfit text-[#1A1A1A] uppercase tracking-widest">Engine Calibration</p>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Difficulty</span>
                                <span className="text-[9px] font-black text-[#1A1A1A] uppercase">{difficulty}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Potential</span>
                                <span className="text-[9px] font-black text-[#FF2D55] uppercase tracking-tighter">{totalPoints} PTS</span>
                            </div>
                        </div>
                    </div>

                    {isReady && !isLocked && (
                        <div className="mt-auto pt-4 border-t border-gray-300">
                            <button
                                onClick={onStart}
                                disabled={loading}
                                className={cn(
                                    "w-full min-h-[56px] rounded-xl bg-gradient-to-br from-[#FF2D55] to-[#D4145A] text-white font-black font-outfit uppercase tracking-[0.1em] shadow-[0_12px_30px_rgba(255,45,85,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:grayscale disabled:opacity-30 group hover:shadow-[0_15px_40px_rgba(255,45,85,0.45)]",
                                    "animate-in fade-in zoom-in duration-500 shadow-[0_0_30px_rgba(255,45,85,0.5)] border-2 border-white/20"
                                )}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <Activity size={18} className="animate-spin" />
                                        <span>INITIALIZING...</span>
                                    </div>
                                ) : (
                                    <>
                                        Launch Assessment
                                        <div className="bg-white/20 p-1.5 rounded-full">
                                            <Play size={12} fill="currentColor" />
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {isLocked && (
                        <div className="mt-auto pt-4 border-t border-gray-300">
                            <div className="w-full min-h-[56px] rounded-xl bg-gray-100 text-gray-400 font-black font-outfit uppercase tracking-[0.1em] flex items-center justify-center gap-3 border-2 border-dashed border-gray-200/50">
                                <Activity size={18} className="animate-pulse" />
                                <span>INITIALIZING...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
