'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { FileCheck, LucideIcon, ShieldAlert, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    subValue?: string;
    variant?: 'default' | 'alert';
}

export function MetricCard({ label, value, icon: Icon, subValue, variant = 'default' }: MetricCardProps) {
    return (
        <div className="p-8 rounded-[2.5rem] border bg-muted/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${variant === 'alert' ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
                        <Icon size={24} />
                    </div>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-4xl font-black">{value}</p>
                    {subValue !== undefined && subValue !== null && subValue !== '' ? <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-wide">{subValue}</p> : null}
                </div>
            </div>
        </div>
    );
}

export function AdminMetricsGrid() {
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await apiClient.admin.getMetrics();
                setMetrics(data);
            } catch (err) {
                clientLogger.error("Failed to fetch admin metrics", { error: err instanceof Error ? err.message : 'unknown' });
            }
        };
        void fetchMetrics();
    }, []);

    const stats = [
        { label: "Total Operators", value: metrics?.totalUsers ?? '...', icon: Users, subValue: "Active Platform Accounts" },
        { label: "Live Users", value: metrics?.liveUsers ?? '...', icon: Zap, subValue: "Currently Authenticated", variant: 'alert' as const },
        { label: "Exams Verified", value: metrics?.totalExams ?? '...', icon: FileCheck, subValue: "Total Attempts" },
        { label: "Asset Inventory", value: metrics?.totalQuestions ?? '...', icon: ShieldAlert, subValue: "Question Bank" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <MetricCard key={i} {...stat} />
            ))}
        </div>
    );
}
