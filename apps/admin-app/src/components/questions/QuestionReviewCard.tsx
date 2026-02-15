'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import {
Activity, AlertCircle, ChevronDown, ChevronUp,
Clock,     Edit3, ExternalLink, Hash,
Info,     Layers, Tag, Target, Trash2} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn, formatTimeAgo } from '@/lib/utils';

interface QuestionReviewCardProps {
    question: any;
    index: number;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onDeleteRequest: (id: string) => void;
}

export function QuestionReviewCard({
    question,
    index,
    isSelected = false,
    onSelect,
    onDeleteRequest
}: QuestionReviewCardProps) {
    const [isRationaleOpen, setIsRationaleOpen] = useState(false);

    // Color mapping for Difficulty
    const difficultyColors: Record<string, string> = {
        simple: 'bg-green-50 text-green-600 border-green-100',
        mean: 'bg-orange-50 text-orange-600 border-orange-100',
        intermediate: 'bg-orange-50 text-orange-600 border-orange-100',
        expert: 'bg-rose-50 text-rose-600 border-rose-100'
    };

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-slate-50 text-slate-500 border-slate-100',
        draft: 'bg-amber-50 text-amber-600 border-amber-100'
    };

    const mappingColors: Record<string, string> = {
        conceptual: 'bg-blue-50 text-blue-600 border-blue-100',
        technical: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        practical: 'bg-teal-50 text-teal-600 border-teal-100'
    };

    return (
        <div className={cn(
            "w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-[#FF4B91]/20 transition-all duration-500 overflow-hidden flex flex-col group relative",
            isSelected && "ring-2 ring-[#FF4B91] border-transparent shadow-2xl bg-[#FF4B91]/[0.01]"
        )}>
            {/* SELECTION OVERLAY GLOW */}
            {isSelected ? <div className="absolute inset-0 bg-[#FF4B91]/[0.02] pointer-events-none animate-in fade-in duration-500" /> : null}

            {/* 1. Header Area: Hierarchy & Status */}
            <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-5">
                    {/* CHECKBOX SECTOR */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect?.(question.id, e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-[#FF4B91] focus:ring-[#FF4B91]/20 cursor-pointer transition-all checked:border-[#FF4B91]"
                        />
                    </div>

                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300",
                        isSelected ? "bg-[#FF4B91] text-white border-[#FF4B91] shadow-lg" : "bg-pink-50 text-[#FF4B91] border-pink-100"
                    )}>
                        #{index + 1}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <span>{question.topic?.subject?.domain?.name || 'N/A'}</span>
                            <span className="opacity-30">/</span>
                            <span>{question.topic?.subject?.name || 'N/A'}</span>
                            <span className="opacity-30">/</span>
                            <span className="text-[#FF4B91]">{question.topic?.name || 'N/A'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">QID: {question.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                        statusColors[question.status] || statusColors.active
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", question.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                        {question.status}
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                    <Link
                        href={`/questions/${question.id}/edit`}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#FF4B91] hover:border-[#FF4B91]/20 transition-all active:scale-95 shadow-sm"
                        title="Edit Question"
                    >
                        <Edit3 size={14} />
                    </Link>
                    <button
                        onClick={() => onDeleteRequest(question.id)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                        title="Delete Question"
                    >
                        <Trash2 size={14} />
                    </button>
                    <Link
                        href={`/questions/${question.id}/edit`}
                        className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-[#FF4B91] transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                    >
                        <ExternalLink size={14} />
                    </Link>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="p-8 flex gap-8">
                {/* Left: Metadata Column */}
                <div className="w-64 flex-shrink-0 space-y-4">
                    <div className={cn(
                        "p-4 rounded-2xl border flex flex-col gap-1",
                        difficultyColors[question.difficulty] || difficultyColors.intermediate
                    )}>
                        <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60">Complexity Level</h4>
                        <div className="flex items-center gap-2">
                            <Activity size={14} />
                            <span className="text-sm font-black uppercase">{question.difficulty}</span>
                        </div>
                    </div>

                    <div className={cn(
                        "p-4 rounded-2xl border flex flex-col gap-1",
                        mappingColors[question.mappingType] || 'bg-slate-50 text-slate-500 border-slate-100'
                    )}>
                        <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60">Mapping Nature</h4>
                        <div className="flex items-center gap-2">
                            <Target size={14} />
                            <span className="text-sm font-black uppercase">{question.mappingType || 'Legacy'}</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Targeted Dimensions</h4>
                        <div className="flex flex-wrap gap-1.5">
                            {question.questionSkills?.length ? (
                                [...new Set(question.questionSkills.map((qs: any) => qs.skill.category))].map((cat: any) => (
                                    <span key={cat} className={cn(
                                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                                        cat === 'technical' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            cat === 'cognitive' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    )}>
                                        {cat}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[9px] font-bold text-slate-400">No Dimension</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100 text-[10px] font-bold text-slate-500">
                        <Clock size={12} />
                        <span>Created {formatTimeAgo(question.createdAt)}</span>
                    </div>
                </div>

                {/* Right: Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-500">
                                <AlertCircle size={14} />
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-bold text-slate-800 leading-snug tracking-tight prose prose-slate max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {question.questionText}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Options Preview */}
                    <div className="grid grid-cols-2 gap-3 pl-10">
                        {Array.isArray(question.options) && question.options.map((opt: any, oIdx: number) => {
                            const isCorrect = typeof opt === 'object' ? opt.isCorrect : opt === question.correctAnswer;
                            const text = typeof opt === 'object' ? opt.text : opt;

                            return (
                                <div key={oIdx} className={cn(
                                    "p-3 rounded-xl border flex items-center gap-3 transition-colors",
                                    isCorrect ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100"
                                )}>
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                                        isCorrect ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {String.fromCharCode(65 + oIdx)}
                                    </div>
                                    <span className={cn("text-xs font-bold", isCorrect ? "text-emerald-700" : "text-slate-500")}>
                                        {text}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 3. Footer: Explanation & Skills */}
            <div className="border-t border-slate-100 bg-slate-50/30">
                <button
                    onClick={() => setIsRationaleOpen(!isRationaleOpen)}
                    className="w-full px-8 py-4 flex items-center justify-between group/rat hover:bg-white transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 rounded-lg text-slate-500 group-hover/rat:text-[#FF4B91] group-hover/rat:bg-[#FF4B91]/5 transition-colors">
                            <Info size={12} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assessment Rationale & Mapping</span>
                    </div>
                    {isRationaleOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                </button>

                {isRationaleOpen ? <div className="px-10 pb-10 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B91] mb-4">Official Explanation</h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                {question.explanation || 'No rationale document provided for this assessment.'}
                            </p>

                            <div className="mt-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Skill Taxonomy Mapping</h4>
                                <div className="flex flex-wrap gap-2">
                                    {question.questionSkills?.map((qs: any) => (
                                        <div key={qs.id || qs.skill.id} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[#FF4B91] text-[10px] font-bold flex items-center gap-2">
                                            <Tag size={10} className="text-slate-400" />
                                            {qs.skill.name}
                                        </div>
                                    ))}
                                    {!question.questionSkills?.length && <span className="text-[10px] font-bold text-slate-400">No skills mapped.</span>}
                                </div>
                            </div>
                        </div>
                    </div> : null}
            </div>
        </div>
    );
}
