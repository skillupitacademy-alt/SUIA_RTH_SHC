'use client';
import {
    BookOpen,
    Clock, Edit2, Globe, Layers, Trash2
} from 'lucide-react';
import React from 'react';

import { cn, formatTimeAgo } from '@/lib/utils';
import { DomainSummary } from '@/types/review';

interface DomainReviewCardProps {
    domain: DomainSummary;
    index: number;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
    onDeleteRequest: (domain: DomainSummary) => void;
    onEditRequest: (domain: DomainSummary) => void;
}

export function DomainReviewCard({
    domain,
    index,
    isSelected = false,
    onSelect,
    onDeleteRequest,
    onEditRequest
}: DomainReviewCardProps) {
    const statusColors: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        inactive: 'bg-slate-50 text-slate-500 border-slate-100'
    };

    return (
        <div className={cn(
            "w-full bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all duration-500 overflow-hidden flex flex-col group relative",
            isSelected && "ring-2 ring-blue-500 border-transparent shadow-2xl bg-blue-500/[0.01]"
        )}>
            {/* SELECTION OVERLAY GLOW */}
            {isSelected === true ? <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none animate-in fade-in duration-500" /> : null}

            {/* Header Area: Status */}
            <div className="px-8 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-5">
                    {/* CHECKBOX SECTOR */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect?.(domain.id as string, e.target.checked)}
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-500 focus:ring-blue-500/20 cursor-pointer transition-all checked:border-blue-500"
                            aria-label={`Select domain ${domain.name as string ?? 'item'}`}
                        />
                    </div>

                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300",
                        isSelected === true ? "bg-blue-600 text-white border-blue-600 shadow-lg" : "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                        #{index + 1}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-slate-500">
                            <Layers size={10} className="text-slate-500" />
                            <span>Root Domain</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">DID: {domain.id as string}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5",
                        (domain.status != null && statusColors[domain.status as string] != null) ? statusColors[domain.status as string] : statusColors.active
                    )}>
                        <div className={cn("w-1 h-1 rounded-full", domain.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                        {domain.status as string}
                    </div>

                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => onEditRequest(domain)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-500 hover:border-blue-500/20 transition-all active:scale-95 shadow-sm"
                        title="Edit Domain"
                        aria-label={`Edit domain ${domain.name as string ?? ''}`}
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDeleteRequest(domain)}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
                        title="Delete Domain"
                        aria-label={`Delete domain ${domain.name as string ?? ''}`}
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
                            <div className="flex items-center gap-2 text-blue-600">
                                <Globe size={14} />
                                <span className="text-sm font-black uppercase tracking-tight">{domain.category != null && domain.category !== '' ? (domain.category as string) : 'General'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100 text-[10px] font-bold text-slate-500">
                        <Clock size={12} />
                        <span>Created {formatTimeAgo(domain.createdAt as string)}</span>
                    </div>
                </div>

                {/* Right: Content Column */}
                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-500 shadow-sm">
                                <Globe size={16} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-2">
                                    {domain.name as string}
                                </h3>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                                    {domain.description != null && domain.description !== '' ? (domain.description as string) : 'No formal definition provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats / Breadcrumbs */}
                    <div className="flex flex-wrap gap-3 pl-12">
                        <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                            <BookOpen size={12} className="text-slate-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subjects:</span>
                            <span className="text-xs font-bold text-slate-700">{(domain.subjectsCount != null && domain.subjectsCount !== 0) ? (domain.subjectsCount as number) : (domain.subjects?.length ?? 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
