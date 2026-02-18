'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { Key, Shield, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

export function RBACGovernancePanel() {
    const [roles, setRoles] = useState<any[]>([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getRBACMetrics();
                setRoles(Array.isArray(data) ? data : []);
            } catch (err) {
                clientLogger.error('Failed to fetch RBAC metrics', { error: err instanceof Error ? err.message : 'unknown' });
            }
        };
        void fetch();
    }, []);

    if (roles.length === 0) return null;

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">RBAC Governance</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Privilege Allocation & Role distribution</p>
                </div>
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Shield size={24} />
                </div>
            </div>

            <div className="space-y-4">
                {roles.map((r) => (
                    <div key={r.role} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-muted/50 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${r.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                <UserCog size={18} />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">{r.role.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-black tracking-tighter text-[#1A1A1A]">{r.count}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Users<br />Assigned</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-muted-foreground/10">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-[#1A1A1A]/60">
                    <Key size={14} />
                    <span>Backend enforced least-privilege</span>
                </div>
            </div>
        </div>
    );
}
