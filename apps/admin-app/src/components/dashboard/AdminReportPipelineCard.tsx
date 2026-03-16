'use client';

import { apiClient } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    RefreshCw,
    Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { cn, formatTimeAgo } from '@/lib/utils';
import { clientLogger } from '@/utils/clientLogger';

interface ReportRow {
    id: string;
    attemptId: string;
    userId: string;
    status: string;
    errorStage: string | null;
    generationTimeMs: number | null;
    fileSizeKb: number | null;
    updatedAt: string;
}

interface ReportStats {
    byStatus: Record<string, number>;
    avgGenerationTimeMs: number | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    ready: { icon: <CheckCircle2 size={12} />, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    failed: { icon: <AlertTriangle size={12} />, color: 'text-rose-600', bg: 'bg-rose-500/10' },
    generating: { icon: <Loader2 size={12} className="animate-spin" />, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    pending: { icon: <Clock size={12} />, color: 'text-blue-600', bg: 'bg-blue-500/10' },
};

export function AdminReportPipelineCard() {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');
    const [retrying, setRetrying] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hasError = typeof error === 'string' && error.length > 0;

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const url = new URL('/admin/reports', 'http://local');
            if (filter.length > 0) url.searchParams.set('status', filter);
            url.searchParams.set('limit', '20');

            const data = await apiClient.client.get<{
                reports?: ReportRow[];
                stats?: ReportStats | null;
            }>(`${url.pathname}${url.search}`);
            setReports(data.reports ?? []);
            setStats(data.stats ?? null);

            if ((data.reports ?? []).length === 0) {
                recordCounter('admin.ui.reports.pipeline.empty', 1);
            } else {
                recordCounter('admin.ui.reports.pipeline.fetch_success', 1, { count: data.reports.length });
            }
        } catch (err) {
            recordCounter('admin.ui.reports.pipeline.fetch_error', 1, { reason: err instanceof Error ? err.message : 'unknown' });
            clientLogger.error('Failed to fetch report pipeline data', { error: err instanceof Error ? err.message : 'unknown' });
            setError('Unable to load report pipeline data. Please retry.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        void fetchReports();
    }, [fetchReports]);

    const handleRetry = async (attemptId: string) => {
        try {
            setRetrying(attemptId);
            await apiClient.client.post(`/admin/reports/${attemptId}/retry`, {});
            recordCounter('admin.ui.reports.pipeline.retry_success', 1, { attemptId });
            // Refresh after short delay
            setTimeout(() => {
                void fetchReports();
                setRetrying(null);
            }, 1500);
        } catch (err) {
            recordCounter('admin.ui.reports.pipeline.retry_error', 1, { attemptId, reason: err instanceof Error ? err.message : 'unknown' });
            clientLogger.error('Failed to retry report generation', { error: err instanceof Error ? err.message : 'unknown' });
            setError('Retry failed. Please check logs and try again.');
            setRetrying(null);
        }
    };

    const totalReports = stats !== null
        ? Object.values(stats.byStatus).reduce((a, b) => a + b, 0)
        : 0;

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBadge
                    label="Total"
                    value={totalReports}
                    icon={<FileText size={14} />}
                    color="text-slate-600"
                />
                <StatBadge
                    label="Ready"
                    value={stats?.byStatus.ready ?? 0}
                    icon={<CheckCircle2 size={14} />}
                    color="text-emerald-600"
                />
                <StatBadge
                    label="Failed"
                    value={stats?.byStatus.failed ?? 0}
                    icon={<AlertTriangle size={14} />}
                    color="text-rose-600"
                />
                <StatBadge
                    label="Avg Gen"
                    value={stats?.avgGenerationTimeMs !== null && stats?.avgGenerationTimeMs !== undefined
                        ? `${(stats.avgGenerationTimeMs / 1000).toFixed(1)}s`
                        : '—'}
                    icon={<Zap size={14} />}
                    color="text-amber-600"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {['', 'failed', 'generating', 'pending', 'ready'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all',
                            filter === s
                                ? 'bg-[#1A1A1A] text-white'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        )}
                    >
                        {s.length > 0 ? s : 'All'}
                    </button>
                ))}

                <button
                    onClick={() => void fetchReports()}
                    disabled={loading}
                    className="ml-auto p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Reports Table */}
            {hasError ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold">
                    {error}
                </div>
            ) : null}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Attempt</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Stage/Error</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Gen Time</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Updated</th>
                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && reports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                                    <Loader2 size={16} className="animate-spin inline mr-2" />
                                    Loading...
                                </td>
                            </tr>
                        ) : reports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                                    No reports found
                                </td>
                            </tr>
                        ) : (
                            reports.map((r) => {
                                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                                const canRetry = r.status === 'failed' || r.status === 'generating';

                                return (
                                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-[10px] text-slate-600">
                                                {r.attemptId.slice(0, 8)}…
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest',
                                                cfg.bg, cfg.color
                                            )}>
                                                {cfg.icon}
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] text-slate-500 max-w-[180px] truncate block">
                                                {r.errorStage ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[10px] font-mono text-slate-600">
                                            {r.generationTimeMs !== null ? `${(r.generationTimeMs / 1000).toFixed(1)}s` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-[10px] text-slate-500">
                                            {formatTimeAgo(r.updatedAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {canRetry ? (
                                                <button
                                                    onClick={() => void handleRetry(r.attemptId)}
                                                    disabled={retrying === r.attemptId}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                                                >
                                                    <RefreshCw size={10} className={retrying === r.attemptId ? 'animate-spin' : ''} />
                                                    Retry
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatBadge({ label, value, icon, color }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className={cn('flex items-center gap-1.5 mb-1', color)}>
                {icon}
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
            </div>
            <p className="text-lg font-black text-[#1A1A1A]">{value}</p>
        </div>
    );
}
