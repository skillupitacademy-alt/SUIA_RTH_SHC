'use client';

import {
    Cpu,
    Edit2, Hash, Shield, Trash2, Zap
} from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import type { Skill } from '@/types/domain';

type SkillCard = Skill & {
    category?: string;
    mappingType?: 'conceptual' | 'technical' | 'practical';
    weight?: number;
};

interface SkillReviewCardProps {
    skill: SkillCard;
    index: number;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onDeleteRequest: (skill: SkillCard) => void;
    onEditRequest: (skill: SkillCard) => void;
}

const SKILL_CATEGORIES: Record<string, string> = {
    problem_solving: 'Problem Solving',
    code_debugging: 'Code Debugging',
    api_design: 'API Design',
    data_analysis: 'Data Analysis',
    system_design: 'System Design',
    security_awareness: 'Security Awareness',
    performance_optimization: 'Performance Optimization',
    testing_qa: 'Testing & QA',
    version_control: 'Version Control',
    agile_methodology: 'Agile Methodology',
    technical: 'Technical',
    conceptual: 'Conceptual',
    practical: 'Practical'
};

export function SkillReviewCard({
    skill,
    index,
    isSelected = false,
    onSelect,
    onDeleteRequest,
    onEditRequest
}: SkillReviewCardProps) {

    return (
        <div className={cn(
            "w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-cyan-500/20 transition-all duration-500 overflow-hidden flex flex-col group relative",
            isSelected && "ring-2 ring-cyan-500 border-transparent shadow-2xl bg-cyan-500/[0.01]"
        )}>
            {/* SELECTION OVERLAY GLOW */}
            {isSelected === true ? <div className="absolute inset-0 bg-cyan-500/[0.02] pointer-events-none animate-in fade-in duration-500" /> : null}

            {/* Header Area: Status */}
            <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-5">
                    {/* CHECKBOX SECTOR */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect?.(skill.id, e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer transition-all checked:border-cyan-500"
                            aria-label={`Select skill ${skill.name ?? 'item'}`}
                        />
                    </div>

                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300",
                        isSelected === true ? "bg-cyan-600 text-white border-cyan-600 shadow-lg" : "bg-cyan-50 text-cyan-600 border-cyan-100"
                    )}>
                        #{index + 1}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <Hash size={10} className="text-slate-500" />
                            <span>{(skill.category != null && SKILL_CATEGORIES[skill.category] != null) ? SKILL_CATEGORIES[skill.category] : skill.category ?? 'Technical'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">KID: {skill.id.split('-')[0]}...</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Cpu size={10} />
                        {skill.mappingType ?? 'conceptual'}
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => onEditRequest(skill)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-cyan-500 hover:border-cyan-500/20 transition-all active:scale-95 shadow-sm"
                        title="Edit Skill"
                        aria-label={`Edit skill ${skill.name ?? ''}`}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDeleteRequest(skill)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                        title="Delete Skill"
                        aria-label={`Delete skill ${skill.name ?? ''}`}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8 flex gap-8">
                {/* Left: Metadata Column */}
                <div className="w-64 flex-shrink-0 space-y-4">
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</h4>
                            <div className="flex items-center gap-2 text-cyan-600">
                                <Hash size={14} />
                                <span className="text-sm font-black uppercase tracking-tight">{(skill.category != null && SKILL_CATEGORIES[skill.category] != null) ? SKILL_CATEGORIES[skill.category] : skill.category ?? 'General'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-slate-200 pt-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Application</h4>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Cpu size={14} />
                                <span className="text-sm font-black uppercase tracking-tight">{skill.mappingType ?? 'conceptual'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-slate-200 pt-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Weight</h4>
                            <div className="flex items-center gap-2 text-amber-600">
                                <Zap size={14} className="text-amber-500" />
                                <span className="text-sm font-black uppercase tracking-tight">Impact: {(skill.weight != null && skill.weight !== 0) ? skill.weight : 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-50 text-cyan-500 shadow-sm">
                                <Shield size={16} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">
                                    {skill.name ?? ''}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
