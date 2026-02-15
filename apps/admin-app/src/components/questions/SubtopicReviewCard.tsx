'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
ArrowRight,
BookOpen,
Clock,     Edit3, ExternalLink, GitBranch,     Hash, Layers, Target, Trash2} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { cn, formatTimeAgo } from '@/lib/utils';

interface SubtopicReviewCardProps {
    subtopic: any;
    index: number;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onDeleteRequest: (subtopic: any) => void;
    onEditRequest: (subtopic: any) => void;
}

export function SubtopicReviewCard({
    subtopic,
    index,
    isSelected = false,
    onSelect,
    onDeleteRequest,
    onEditRequest
}: SubtopicReviewCardProps) {
    const statusColors: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-slate-50 text-slate-500 border-slate-100'
    };

    return (
        <div className={cn(
            "w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-teal-500/20 transition-all duration-500 overflow-hidden flex flex-col group relative",
            isSelected && "ring-2 ring-teal-500 border-transparent shadow-2xl bg-teal-500/[0.01]"
        )}>
            {/* SELECTION OVERLAY GLOW */}
            {isSelected && (
                <div className="absolute inset-0 bg-teal-500/[0.02] pointer-events-none animate-in fade-in duration-500" />
            )}

            {/* Header Area: Hierarchy & Status */}
            <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-5">
                    {/* CHECKBOX SECTOR */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect?.(subtopic.id, e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-teal-500 focus:ring-teal-500/20 cursor-pointer transition-all checked:border-teal-500"
                        />
                    </div>

                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300",
                        isSelected ? "bg-teal-600 text-white border-teal-600 shadow-lg" : "bg-teal-50 text-teal-600 border-teal-100"
                    )}>
                        #{index + 1}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <Layers size={10} className="text-slate-500" />
                            <span>{subtopic.topic?.subject?.domain?.name || 'N/A'}</span>
                            <span className="opacity-30">/</span>
                            <BookOpen size={10} className="text-slate-500" />
                            <span>{subtopic.topic?.subject?.name || 'N/A'}</span>
                            <span className="opacity-30">/</span>
                            <Hash size={10} className="text-teal-500" />
                            <span className="text-teal-600 font-black">{subtopic.topic?.name || 'N/A'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">SID: {subtopic.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                        statusColors[subtopic.status] || statusColors.active
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", subtopic.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                        {subtopic.status}
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => onEditRequest(subtopic)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-teal-500 hover:border-teal-500/20 transition-all active:scale-95 shadow-sm"
                        title="Edit Subtopic"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={() => onDeleteRequest(subtopic)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                        title="Delete Subtopic"
                    >
                        <Trash2 size={14} />
                    </button>
                    <Link
                        href={`/admin/reports?subtopicId=${subtopic.id}`}
                        className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-teal-500 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                        title="View Subtopic Report"
                    >
                        <ExternalLink size={14} />
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8 flex gap-8">
                {/* Left: Metadata Column */}
                <div className="w-64 flex-shrink-0 space-y-4">
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Execution Depth</h4>
                            <div className="flex items-center gap-2">
                                <Target size={14} className="text-teal-500" />
                                <span className="text-sm font-black text-slate-700">D-Lvl: {subtopic.depthLevel || 1}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-slate-200 pt-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sort Sequence</h4>
                            <div className="flex items-center gap-2">
                                <ArrowRight size={14} className="text-slate-600" />
                                <span className="text-sm font-black text-slate-700">Order: {subtopic.order || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100 text-[10px] font-bold text-slate-500">
                        <Clock size={12} />
                        <span>Created {formatTimeAgo(subtopic.createdAt)}</span>
                    </div>
                </div>

                {/* Right: Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-xl bg-teal-50 text-teal-500 shadow-sm">
                                <GitBranch size={16} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">
                                    {subtopic.name}
                                </h3>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                                    {subtopic.description || 'No structural definition provided for this leaf node.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-3 pl-12">
                        <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Questions:</span>
                            <span className="text-xs font-bold text-slate-700">{subtopic.questionsCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
