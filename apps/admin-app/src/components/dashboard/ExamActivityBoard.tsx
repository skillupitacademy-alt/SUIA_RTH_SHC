'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { Activity, CheckCircle2, Clock, Globe, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ZTooltip } from '@/components/ui/ZTooltip';

export function ExamActivityBoard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getExamActivity();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch exam activity", err);
            }
        };
        void fetch();
    }, []);

    if (stats === null) {
        return (
            <div className="p-12 flex items-center justify-center bg-white border border-primary/10 rounded-[2rem]">
                <ZLoader text="Fetching activity stream..." />
            </div>
        );
    }

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-white backdrop-blur-md shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">Exam Activity</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Engagement & Outcome Metrics</p>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
                    <Activity size={24} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <ZTooltip content="Total exams initiated in this period.">
                    <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 cursor-help">
                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                            <Activity size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Started</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{stats.started}</p>
                    </div>
                </ZTooltip>

                <ZTooltip content="Exams fully completed and submitted.">
                    <div className="p-5 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 cursor-help">
                        <div className="flex items-center gap-2 mb-2 text-emerald-600">
                            <CheckCircle2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-emerald-700">{stats.completed}</p>
                    </div>
                </ZTooltip>

                <ZTooltip content="Exams started but not completed.">
                    <div className="p-5 rounded-[1.5rem] bg-rose-50 border border-rose-100 cursor-help">
                        <div className="flex items-center gap-2 mb-2 text-rose-600">
                            <XCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Abandoned</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-rose-700">{stats.abandoned}</p>
                    </div>
                </ZTooltip>

                <div className="p-5 rounded-[1.5rem] bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Avg Time</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black tracking-tighter text-blue-900">{stats.avgCompletionTimeMinutes}</p>
                        <span className="text-[10px] font-bold text-blue-400 uppercase">min</span>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Globe size={16} />
                    Activity by Domain
                </h4>
                <div className="space-y-3">
                    {Array.isArray(stats.byDomain) && stats.byDomain.map((d: any) => (
                        <div key={d.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{d.name ?? 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-[#1A1A1A]">{d.count ?? 0}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exams</span>
                            </div>
                        </div>
                    ))}
                    {(!Array.isArray(stats.byDomain) || stats.byDomain.length === 0) && (
                        <p className="text-xs font-bold text-slate-400">No domain activity recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
