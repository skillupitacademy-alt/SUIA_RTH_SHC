'use client';

import React from 'react';
import { useJobTracker } from '@/hooks/useJobTracker';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function JobStatusBadge() {
    const { jobs, clearJob, isPolling } = useJobTracker();
    const [isOpen, setIsOpen] = React.useState(false);

    const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');

    if (jobs.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all shadow-sm",
                    activeJobs.length > 0
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-500/10"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                )}
            >
                {activeJobs.length > 0 ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <CheckCircle2 size={16} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {activeJobs.length > 0 ? `${activeJobs.length} Processing` : 'Tasks Complete'}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-4 right-0 w-80 bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="alpha-terminal !tracking-[0.2em] text-[#FF4B91]">Active Tasks</h4>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-[#1A1A1A]">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {jobs.map(job => (
                            <div key={job.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group relative">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-outfit font-black text-xs text-[#1A1A1A] truncate mb-1">
                                            {job.type.replace(/_/g, ' ')}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {job.status === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                                            {job.status === 'processing' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                            {job.status === 'completed' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                            {job.status === 'failed' && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                                            <span className="alpha-terminal text-[10px] text-slate-400">
                                                {job.status}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => clearJob(job.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                                {job.status === 'failed' && job.error && (
                                    <p className="mt-2 p-2 rounded-xl bg-red-50 text-[10px] text-red-600 font-medium">
                                        {job.error}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>

                    {!isPolling && activeJobs.length === 0 && (
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
                            All jobs synced
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
