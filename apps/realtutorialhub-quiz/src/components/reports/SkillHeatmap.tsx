'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { QuizResultResponse } from '@quiz/api-client';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

type ResultData = Exclude<QuizResultResponse, { status: 'processing' | 'started' }>;
type SkillData = NonNullable<ResultData['performance']['skill']>;

interface SkillHeatmapProps {
    data: SkillData;
    className?: string;
}

export function SkillHeatmap({ data, className }: SkillHeatmapProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Fallback safety: Empty state
    if (!data || data.length === 0) {
        return (
            <div className={cn("glass-morphism rounded-[3rem] p-12 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-muted-foreground/20", className)}>
                <div className="h-16 w-16 rounded-full bg-muted/10 flex items-center justify-center text-muted-foreground/40">
                    <Info size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black tracking-tight uppercase">No Granular Data</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] max-w-[240px] mx-auto mt-2">
                        Skill-level intelligence was not captured for this evaluation session.
                    </p>
                </div>
            </div>
        );
    }

    // Sort weakest-first for density control
    const sortedSkills = [...data].sort((a, b) => a.accuracy - b.accuracy);
    const displayedSkills = isExpanded ? sortedSkills : sortedSkills.slice(0, 24);
    const hasMore = sortedSkills.length > 24;

    // Deterministic color bands
    const getIntensityColor = (accuracy: number) => {
        if (accuracy >= 90) return 'bg-[#10B981] text-white'; // Mastery
        if (accuracy >= 70) return 'bg-[#34D399] text-white'; // Strong
        if (accuracy >= 40) return 'bg-[#F59E0B] text-white'; // Growth
        return 'bg-[#FF2D55] text-white'; // Critical
    };

    const getStatusLabel = (accuracy: number) => {
        if (accuracy >= 90) return 'Mastery';
        if (accuracy >= 70) return 'Strong';
        if (accuracy >= 40) return 'Growth';
        return 'Critical';
    };

    return (
        <div className={cn("glass-morphism rounded-[3rem] p-8 space-y-6", className)}>
            <div className="flex items-baseline justify-between">
                <div>
                    <h3 className="text-2xl font-black tracking-tight uppercase text-slate-900">Skill Matrix</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mt-1">
                        Phase 21 Granular Mastery Heatmap
                    </p>
                </div>
                <div className="flex gap-2">
                    <Info size={16} className="text-slate-400" />
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedSkills.map((skill) => (
                    <div
                        key={skill.id}
                        className={cn(
                            "group relative p-5 rounded-[1.5rem] transition-all hover:scale-[1.05] hover:z-10 cursor-default border shadow-sm",
                            getIntensityColor(skill.accuracy)
                        )}
                        title={`${skill.name}: ${skill.accuracy}% (${getStatusLabel(skill.accuracy)})`}
                        aria-label={`${skill.name}: ${skill.accuracy}% accuracy, ${getStatusLabel(skill.accuracy)} status`}
                    >
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-90 truncate leading-tight">{skill.name}</p>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-black tracking-tighter drop-shadow-sm">{skill.accuracy}%</span>
                                <div className="h-2 w-2 rounded-full bg-white/60 shadow-inner" />
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-tighter opacity-80">
                                {getStatusLabel(skill.accuracy)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#10B981]" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Mastery</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#34D399]" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Strong</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Growth</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-[#FF2D55]" />
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Critical</span>
                    </div>
                </div>

                {hasMore && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 hover:bg-white/60 text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                        {isExpanded ? (
                            <>Collapse Matrix <ChevronUp size={12} /></>
                        ) : (
                            <>Show All ({sortedSkills.length}) <ChevronDown size={12} /></>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
