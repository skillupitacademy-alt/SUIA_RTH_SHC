'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { TrendingUp,UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export function UserAnalyticsPanel() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getUserMetrics();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch user metrics", err);
            }
        };
        fetch();
    }, []);

    if (!stats) {
        return (
            <div className="p-12 flex items-center justify-center bg-muted/5 border border-primary/10 rounded-[2rem]">
                <ZLoader text="Accessing User Matrix..." />
            </div>
        );
    }

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">User Insights</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Growth & Account Verification</p>
                </div>
                <div className="px-5 py-2.5 rounded-full bg-[#FF4B91]/10 border border-[#FF4B91]/20 text-[#FF4B91] flex items-center gap-3">
                    <TrendingUp size={18} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Scalable Growth Path</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-6 rounded-[1.5rem] bg-background border border-muted/50 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Users</span>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{stats.total.toLocaleString()}</p>
                    </div>
                </div>

                <div className="p-6 rounded-[1.5rem] bg-background border border-muted/50 shadow-sm group">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                            <UserCheck size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verified Accounts</span>
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{stats.verified.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-[1.25rem] bg-muted/20 border border-muted-foreground/5 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">New Today</p>
                    <p className="text-xl font-black text-[#1A1A1A]">+{stats.newToday}</p>
                </div>
                <div className="p-4 rounded-[1.25rem] bg-red-500/5 border border-red-500/10 text-center">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Locked Accounts</p>
                    <p className="text-xl font-black text-red-600">{stats.lockedCount}</p>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-muted-foreground/10">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-muted-foreground">Verification Rate</span>
                    <span className="text-[#FF4B91]">{Math.round((stats.verified / stats.total) * 100)}%</span>
                </div>
                <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E]"
                        style={{ width: `${(stats.verified / stats.total) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
