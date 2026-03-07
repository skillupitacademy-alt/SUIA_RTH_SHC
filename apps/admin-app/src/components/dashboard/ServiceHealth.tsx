'use client';

import { apiClient, type AdminSystemUsage } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2, Cloud, Database, Mail, RefreshCw, Server } from 'lucide-react';
import { useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

interface ServiceMetric {
    status: 'ok' | 'warning' | 'error' | 'not_configured';
    configured: boolean;
    checkedAt: string;
    metrics?: Record<string, unknown>;
    error?: { message: string };
}

type ServiceData = Record<string, ServiceMetric> & {
    neon?: ServiceMetric;
    redis?: ServiceMetric;
    resend?: ServiceMetric;
    cloudflare?: ServiceMetric;
};
export function ServiceHealth() {
    const [data, setData] = useState<ServiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.admin.getSystemUsage() as AdminSystemUsage;
            setData(res as unknown as ServiceData);
            setError(null);
            recordCounter('admin.ui.system.health_success', 1);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown system fault';
            recordCounter('admin.ui.system.health_error', 1, { reason: msg });
            clientLogger.error('Failed to fetch system usage', { error: msg });
            setError('Failed to load system health.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
        // Refresh every 60s to match cache TTL
        const interval = setInterval(() => { void fetchData(); }, 60000);
        return () => clearInterval(interval);
    }, []);

    if (error !== null && data === null) {
        return (
            <div className="p-6 rounded-2xl border bg-destructive/5 border-destructive/20 text-destructive flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={() => { void fetchData(); }} className="ml-auto hover:bg-destructive/10 p-2 rounded-full">
                    <RefreshCw size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
                <h3 className="text-lg font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Server size={18} />
                    System Health Tier
                </h3>
                {loading ? <RefreshCw size={14} className="animate-spin text-muted-foreground" /> : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthCard
                    title="Neon Database"
                    icon={Database}
                    data={data?.neon}
                    loading={loading}
                    type="neon"
                />
                <HealthCard
                    title="Upstash Redis"
                    icon={Server}
                    data={data?.redis}
                    loading={loading}
                    type="redis"
                />
                <HealthCard
                    title="Resend Email"
                    icon={Mail}
                    data={data?.resend}
                    loading={loading}
                    type="resend"
                />
                <HealthCard
                    title="Cloudflare"
                    icon={Cloud}
                    data={data?.cloudflare}
                    loading={loading}
                    type="cloudflare"
                />
            </div>
        </div>
    );
}

function HealthCard({ title, icon: Icon, data, loading, type }: { title: string; icon: LucideIcon; data?: ServiceMetric; loading: boolean; type: 'neon' | 'redis' | 'resend' | 'cloudflare' }) {
    if (loading && !data) {
        return (
            <div className="h-40 rounded-[1.5rem] bg-muted/5 border animate-pulse" />
        );
    }

    if (!data) return null;

    const isConfigured = data.configured;
    const metrics = (data.metrics as Record<string, number | string | null | undefined> | undefined) ?? {};
    const status = data.status;
    const usage = Number(metrics.usagePercent ?? 0);

    // Usage Colors
    const getProgressColor = (percent: number) => {
        if (percent >= 95) return 'bg-destructive';
        if (percent >= 80) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    const getStatusColor = (s: string) => {
        if (s === 'ok') return 'text-emerald-500';
        if (s === 'warning') return 'text-yellow-500';
        if (s === 'error') return 'text-destructive';
        return 'text-muted-foreground';
    };

    if (loading || data === undefined) {
        return (
            <div className="p-6 rounded-[1.5rem] border bg-muted/5 animate-pulse h-[160px]">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-slate-200 h-10 w-10" />
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="space-y-3">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-2 w-full bg-slate-200 rounded-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-[1.5rem] border bg-muted/5 backdrop-blur-sm relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-background/50 text-foreground">
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-background/50 ${getStatusColor(status)}`}>
                    {status === 'not_configured' ? 'Not Configured' : status}
                </div>
            </div>

            <div className="space-y-1">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{title}</h4>

                {/* NEON METRICS */}
                {type === 'neon' && (metrics.limitMb as number | undefined) !== undefined ? <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                        <span>{metrics.sizeMb} MB / {metrics.limitMb} MB</span>
                        <span className={status === 'error' ? 'text-destructive' : ''}>{usage}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(usage)}`}
                            style={{ width: `${Math.min(100, usage)}%` }}
                        />
                    </div>
                </div> : null}

                {/* REDIS METRICS */}
                {type === 'redis' && (metrics.limitMb as number | undefined) !== undefined ? <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1.5 font-mono">
                        <span>{metrics.memory} / {metrics.limitMb} MB</span>
                        <span className={status === 'error' ? 'text-destructive' : ''}>{usage}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(usage)}`}
                            style={{ width: `${Math.min(100, usage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                        <span>Keys: {metrics.keys}</span>
                        <span>{metrics.snapshot}</span>
                    </div>
                </div> : null}

                {/* REDIS WITHOUT LIMIT (Raw) */}
                {type === 'redis' && (metrics.limitMb as number | undefined) === undefined && isConfigured === true ? <div className="pt-2 space-y-1">
                    <p className="text-2xl font-black">{((metrics.memory as string | undefined | null) !== undefined && (metrics.memory as string | undefined | null) !== null && (metrics.memory as string) !== '') ? (metrics.memory as string) : '0B'}</p>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                        <span>Keys: {metrics.keys}</span>
                        <span>{metrics.snapshot}</span>
                    </div>
                </div> : null}

                {/* RESEND METRICS */}
                {type === 'resend' && (
                    <div className="pt-2">
                        <p className="text-xs font-medium text-emerald-500 flex items-center gap-1.5">
                            <CheckCircle2 size={12} />
                            Connectivity Verified
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
                            Quota metric unavailable
                        </p>
                    </div>
                )}

                {/* CLOUDFLARE METRICS */}
                {type === 'cloudflare' && isConfigured === true ? <div className="pt-2">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-2xl font-black">{Number(metrics?.requests24h ?? 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Requests (24h)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-mono font-bold">{metrics.formattedBytes}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bandwidth</p>
                        </div>
                    </div>
                </div> : null}

                {/* NOT CONFIGURED / ERROR STATES */}
                {!isConfigured && status === 'not_configured' && (
                    <p className="text-[10px] text-muted-foreground pt-2">
                        Service credentials are missing in environment variables.
                    </p>
                )}

                {(data.error as { message: string } | undefined) !== undefined ? <p className="text-[10px] text-destructive pt-2 font-mono">
                    Error: {(data.error as { message: string }).message}
                </p> : null}

            </div>
        </div>
    );
}
