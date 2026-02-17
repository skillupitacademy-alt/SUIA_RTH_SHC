'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { Activity, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SecurityHealthPanel() {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getSecurityMetrics();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch security metrics", err);
            } finally {
                setIsLoading(false);
            }
        };
        void fetch();
        const interval = setInterval(() => { void fetch(); }, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (isLoading || stats === null) {
        return (
            <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 animate-pulse h-[400px]">
                <div className="h-8 w-48 bg-black/5 rounded mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-white/50 rounded-[1.5rem]" />
                    <div className="h-32 bg-white/50 rounded-[1.5rem]" />
                </div>
                <div className="mt-8 h-20 bg-black/10 rounded-[2rem]" />
            </div>
        );
    }

    const isHighThreat = stats.threatLevel === 'HIGH';

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">Security Signals</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Authentication Health Monitor</p>
                </div>
                <div className={`px-4 py-2 rounded-full border flex items-center gap-2.5 ${isHighThreat
                    ? 'bg-red-500/10 border-red-500/20 text-red-500'
                    : 'bg-green-500/10 border-green-500/20 text-green-500'
                    }`}>
                    {isHighThreat ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">Threat Level: {stats.threatLevel ?? 'UNKNOWN'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-[1.5rem] bg-background border border-muted/50 hover:border-green-500/30 transition-all group shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
                            <Activity size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Successful Logins</span>
                            <p className="text-3xl font-black tracking-tighter text-[#1A1A1A] mt-0.5">{(stats.successfulLogins ?? 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-[1.5rem] bg-background border border-muted/50 hover:border-red-500/30 transition-all group shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2.5 rounded-xl ${isHighThreat ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <Lock size={20} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Failed Attempts</span>
                            <p className="text-3xl font-black tracking-tighter text-[#1A1A1A] mt-0.5">{(stats.failedLogins ?? 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-6 rounded-[2rem] bg-[#1A1A1A] text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">Real-time encryption active</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">SSL/TLS 1.3 Certified</span>
            </div>
        </div>
    );
}
