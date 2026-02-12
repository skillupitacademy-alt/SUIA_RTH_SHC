'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { ClipboardCheck, FileText, CheckCircle2 } from 'lucide-react';

export function BlueprintAuditBoard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getBlueprintMetrics();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch blueprint metrics", err);
            }
        };
        fetch();
    }, []);

    if (!stats) return null;

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">Blueprint Audit</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Enterprise Configuration & Compliance</p>
                </div>
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
                    <ClipboardCheck size={20} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-5 rounded-[1.5rem] bg-background border border-muted/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Blueprints</p>
                    <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{stats.total}</p>
                </div>
                <div className="p-5 rounded-[1.5rem] bg-background border border-muted/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Compliance Rate</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-black tracking-tighter text-green-500">{stats.complianceRate}</p>
                        <CheckCircle2 size={20} className="text-green-500" />
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-[2rem] bg-[#1A1A1A] text-white">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Standard Rule</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-[9px] font-black uppercase tracking-widest">Active</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/5">
                            <FileText size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-tight">{stats.standardDistribution} Distribution</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Simple / Inter / Expert</p>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div>
                        <p className="text-sm font-black tracking-tight">{stats.avgQuestions} Qs</p>
                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Avg per Blueprint</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
