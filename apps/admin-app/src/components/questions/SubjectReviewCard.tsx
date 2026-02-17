'use client';
import {
    BookOpen, Clock, Edit2, Layers,
    Trash2
} from 'lucide-react';
import React from 'react';

import { cn, formatTimeAgo } from '@/lib/utils';
import { SubjectSummary } from '@/types/review';

interface SubjectReviewCardProps {
    subject: SubjectSummary & {
        domain?: { name?: string };
        status?: string;
        description?: string;
        createdAt?: string;
    };
    index: number;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onDeleteRequest: (subject: SubjectReviewCardProps['subject']) => void;
    onEditRequest: (subject: SubjectReviewCardProps['subject']) => void;
}

export function SubjectReviewCard({
    subject,
    index,
    isSelected = false,
    onSelect,
    onDeleteRequest,
    onEditRequest
}: SubjectReviewCardProps) {
    const statusColors: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-slate-50 text-slate-500 border-slate-100'
    };

    return (
        <div className={cn(
            "w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-purple-500/20 transition-all duration-500 overflow-hidden flex flex-col group relative",
            isSelected && "ring-2 ring-purple-500 border-transparent shadow-2xl bg-purple-500/[0.01]"
        )}>
            {/* SELECTION OVERLAY GLOW */}
            {isSelected === true ? <div className="absolute inset-0 bg-purple-500/[0.02] pointer-events-none animate-in fade-in duration-500" /> : null}

            {/* Header Area: Status */}
            <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-5">
                    {/* CHECKBOX SECTOR */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect?.(subject.id as string, e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-purple-500 focus:ring-purple-500/20 cursor-pointer transition-all checked:border-purple-500"
                            aria-label={`Select subject ${subject.name as string ?? 'item'}`}
                        />
                    </div>

                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300",
                        isSelected === true ? "bg-indigo-600 text-white border-indigo-600 shadow-lg" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                    )}>
                        #{index + 1}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <Layers size={10} className="text-slate-500" />
                            <span>{(subject.domain?.name != null && subject.domain.name !== '') ? (subject.domain.name as string) : 'Unlinked'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">SID: {subject.id as string}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                        (subject.status != null && statusColors[subject.status as string] != null) ? statusColors[subject.status as string] : statusColors.active
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", subject.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                        {subject.status as string}
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => onEditRequest(subject)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-purple-500 hover:border-purple-500/20 transition-all active:scale-95 shadow-sm"
                        title="Edit Subject"
                        aria-label={`Edit subject ${subject.name as string ?? ''}`}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDeleteRequest(subject)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                        title="Delete Subject"
                        aria-label={`Delete subject ${subject.name as string ?? ''}`}
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
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hierarchy Root</h4>
                            <div className="flex items-center gap-2 text-purple-600">
                                <Layers size={14} />
                                <span className="text-sm font-black uppercase tracking-tight">{(subject.domain?.name != null && subject.domain.name !== '') ? (subject.domain.name as string) : 'Unlinked'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100 text-[10px] font-bold text-slate-500">
                        <Clock size={12} />
                        <span>Created {formatTimeAgo(subject.createdAt as string)}</span>
                    </div>
                </div>

                {/* Right: Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-xl bg-purple-50 text-purple-500 shadow-sm">
                                <BookOpen size={16} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">
                                    {subject.name as string}
                                </h3>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                                    {(subject.description != null && subject.description !== '') ? (subject.description as string) : 'No formal definition provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Breadcrumbs */}
                    <div className="flex flex-wrap gap-3 pl-12">
                        <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Topics:</span>
                            <span className="text-xs font-bold text-slate-700">{subject.topicsCount ?? 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
