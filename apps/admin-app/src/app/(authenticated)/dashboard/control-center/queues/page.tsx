'use client';

import { apiClient } from '@quiz/api-client';
import { ZSkeleton } from '@quiz/ui';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    ListRestart,
    RefreshCcw,
    Trash2,
    XCircle
} from 'lucide-react';
import { type ReactNode,useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { cn } from '@/lib/utils';

interface QueueStat {
    id: string;
    queueName: string;
    displayName: string;
    status: 'online' | 'error';
    counts: Record<string, number> | null;
    lastFailed: Array<{
        id: string;
        name: string;
        failedReason: string;
        finishedOn: string | null;
        data: Record<string, unknown>;
    }>;
}

export default function QueuesPage() {
    const [data, setData] = useState<{ queues: QueueStat[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchStats = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const res = await apiClient.admin.getQueueStats();
            setData(res);
            setError(null);
        } catch (err) {
            setError('Failed to load queue statistics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!autoRefresh) return;
        const timer = setInterval(() => {
            void fetchStats(true);
        }, 10000);
        return () => clearInterval(timer);
    }, [autoRefresh, fetchStats]);

    const handleAction = async (queueId: string, jobId: string, action: 'retry' | 'discard' | 'promote') => {
        const promise = apiClient.admin.jobs.performJobAction(queueId, jobId, action);

        toast.promise(promise, {
            loading: `Executing ${action}...`,
            success: `Job ${action} successful`,
            error: `Failed to ${action} job`
        });

        try {
            await promise;
            void fetchStats(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !data) {
        return (
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6">
                <ZSkeleton className="h-12 w-1/3 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <ZSkeleton key={i} className="h-64 rounded-[2rem]" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <DashboardPageHeader
                    title="Job Queues"
                    description="Real-time background process monitoring and health status"
                    icon={<Activity className="text-[#FF4B91]" size={20} />}
                />
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start md:self-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Auto-Refresh</span>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                            autoRefresh ? "bg-[#FF4B91]" : "bg-slate-200"
                        )}
                    >
                        <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            autoRefresh ? "translate-x-6" : "translate-x-1"
                        )} />
                    </button>
                    <button
                        onClick={() => void fetchStats()}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
                        title="Refresh Now"
                    >
                        <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {error !== null ? (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] text-rose-600 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p className="font-semibold">{error}</p>
                    <button onClick={() => void fetchStats()} className="ml-auto underline font-bold">Retry</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.queues.map((q) => (
                        <div key={q.id} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-outfit font-black tracking-tight">{q.displayName}</h3>
                                    <p className="text-xs font-inter font-bold opacity-40 uppercase tracking-widest">{q.queueName}</p>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                    q.status === 'online' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                )}>
                                    {q.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <StatItem
                                    label="Waiting"
                                    value={q.counts?.wait ?? 0}
                                    icon={<Clock size={16} className="text-amber-500" />}
                                    color="amber"
                                />
                                <StatItem
                                    label="Active"
                                    value={q.counts?.active ?? 0}
                                    icon={<RefreshCcw size={16} className="text-blue-500" />}
                                    color="blue"
                                />
                                <StatItem
                                    label="Completed"
                                    value={q.counts?.completed ?? 0}
                                    icon={<CheckCircle2 size={16} className="text-emerald-500" />}
                                    color="emerald"
                                />
                                <StatItem
                                    label="Failed"
                                    value={q.counts?.failed ?? 0}
                                    icon={<XCircle size={16} className="text-rose-500" />}
                                    color="rose"
                                />
                            </div>

                            {q.lastFailed.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Failures</p>
                                        {q.id === 'dead' && <span className="text-[10px] font-black text-[#FF4B91] animate-pulse">DLQ NEEDS ATTENTION</span>}
                                    </div>
                                    {q.lastFailed.map(f => (
                                        <div key={f.id} className="p-4 rounded-3xl bg-slate-50 border border-slate-100 group/failure relative">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="font-extrabold text-slate-900 text-xs line-clamp-1 flex-1">{f.failedReason}</div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/failure:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            void handleAction(q.id, f.id, 'retry');
                                                        }}
                                                        className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                                                        title="Retry Job"
                                                    >
                                                        <ListRestart size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            void handleAction(q.id, f.id, 'discard');
                                                        }}
                                                        className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
                                                        title="Discard Job"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-[10px] opacity-40 font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                                                Job {f.id.slice(0, 8)} • {f.finishedOn !== null ? new Date(f.finishedOn).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatItem({ label, value, icon, color }: { label: string; value: number; icon: ReactNode; color: string }) {
    const colors: Record<string, string> = {
        amber: "from-amber-500/10 to-transparent",
        blue: "from-blue-500/10 to-transparent",
        emerald: "from-emerald-500/10 to-transparent",
        rose: "from-rose-500/10 to-transparent",
    };

    return (
        <div className={cn("p-4 rounded-3xl border border-slate-100 bg-gradient-to-br transition-all group-hover:scale-[1.02]", colors[color])}>
            <div className="flex items-center gap-2 mb-2 opacity-60">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-outfit font-black tracking-tighter">{value.toLocaleString()}</div>
        </div>
    );
}

