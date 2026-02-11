'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Database, Server, Mail, Cloud, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceMetric {
    status: 'ok' | 'warning' | 'error' | 'not_configured';
    configured: boolean;
    checkedAt: string;
    metrics?: any;
    error?: { message: string };
}

interface ServiceData {
    neon: ServiceMetric;
    redis: ServiceMetric;
    resend: ServiceMetric;
    cloudflare: ServiceMetric;
}

export function ServiceHealth() {
    const [data, setData] = useState<ServiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.admin.getSystemUsage();
            setData(res);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch system usage:', err);
            setError('Failed to load system health.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Refresh every 60s to match cache TTL
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (error && !data) {
        return (
            <div className="p-6 rounded-2xl border bg-destructive/5 border-destructive/20 text-destructive flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={fetchData} className="ml-auto hover:bg-destructive/10 p-2 rounded-full">
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
                {loading && <RefreshCw size={14} className="animate-spin text-muted-foreground" />}
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

function HealthCard({ title, icon: Icon, data, loading, type }: { title: string, icon: any, data?: ServiceMetric, loading: boolean, type: 'neon' | 'redis' | 'resend' | 'cloudflare' }) {
    if (loading && !data) {
        return (
            <div className="h-40 rounded-[1.5rem] bg-muted/5 border animate-pulse" />
        );
    }

    if (!data) return null;

    const isConfigured = data.configured;
    const metrics = data.metrics || {};
    const status = data.status;

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

    const StatusIcon = status === 'ok' ? CheckCircle2 : status === 'not_configured' ? AlertCircle : XCircle;

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
                {type === 'neon' && metrics.limitMb && (
                    <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1.5 font-mono">
                            <span>{metrics.sizeMb} MB / {metrics.limitMb} MB</span>
                            <span className={status === 'error' ? 'text-destructive' : ''}>{metrics.usagePercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics.usagePercent)}`}
                                style={{ width: `${Math.min(100, metrics.usagePercent)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* REDIS METRICS */}
                {type === 'redis' && metrics.limitMb && (
                    <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1.5 font-mono">
                            <span>{metrics.memory} / {metrics.limitMb} MB</span>
                            <span className={status === 'error' ? 'text-destructive' : ''}>{metrics.usagePercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted/20 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(metrics.usagePercent)}`}
                                style={{ width: `${Math.min(100, metrics.usagePercent)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                            <span>Keys: {metrics.keys}</span>
                            <span>{metrics.snapshot}</span>
                        </div>
                    </div>
                )}

                {/* REDIS WITHOUT LIMIT (Raw) */}
                {type === 'redis' && !metrics.limitMb && isConfigured && (
                    <div className="pt-2 space-y-1">
                        <p className="text-2xl font-black">{metrics.memory || '0B'}</p>
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span>Keys: {metrics.keys}</span>
                            <span>{metrics.snapshot}</span>
                        </div>
                    </div>
                )}

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
                {type === 'cloudflare' && isConfigured && (
                    <div className="pt-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-2xl font-black">{metrics.requests24h?.toLocaleString()}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Requests (24h)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-mono font-bold">{metrics.formattedBytes}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bandwidth</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* NOT CONFIGURED / ERROR STATES */}
                {!isConfigured && status === 'not_configured' && (
                    <p className="text-[10px] text-muted-foreground pt-2">
                        Service credentials are missing in environment variables.
                    </p>
                )}

                {data.error && (
                    <p className="text-[10px] text-destructive pt-2 font-mono">
                        Error: {data.error.message}
                    </p>
                )}

            </div>
        </div>
    );
}
