'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Activity, Clock, CheckCircle2, XCircle, Globe } from 'lucide-react';

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
        fetch();
    }, []);

    if (!stats) return null;

    return (
        <div className="p-10 rounded-[3.5rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm h-full">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Exam Activity</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Engagement & Outcome Metrics</p>
                </div>
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                    <Activity size={24} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="p-6 rounded-[2rem] bg-background border border-muted/50">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <Activity size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Started</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{stats.started}</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-background border border-muted/50">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Completed</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-green-500">{stats.completed}</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-background border border-muted/50">
                    <div className="flex items-center gap-2 mb-2 text-red-500">
                        <XCircle size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Abandoned</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-red-500">{stats.abandoned}</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-background border border-muted/50">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                        <Clock size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Avg Time</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{stats.avgCompletionTimeMinutes}</p>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">min</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1A1A1A] opacity-60 flex items-center gap-2">
                    <Globe size={14} />
                    Activity by Domain
                </h4>
                <div className="space-y-3">
                    {stats.byDomain?.map((d: any) => (
                        <div key={d.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-muted/20">
                            <span className="text-xs font-bold uppercase tracking-wider">{d.name}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black italic">{d.count}</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Exams</span>
                            </div>
                        </div>
                    ))}
                    {(!stats.byDomain || stats.byDomain.length === 0) && (
                        <p className="text-[10px] font-bold text-muted-foreground italic">No domain activity recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
