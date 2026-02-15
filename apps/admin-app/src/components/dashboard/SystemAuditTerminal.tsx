'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiClient } from '@quiz/api-client';
import { formatDistanceToNow } from 'date-fns';
import { Clock, HardDrive,Terminal, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export function SystemAuditTerminal() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getAuditLogs();
                setLogs(data);
            } catch (err) {
                console.error("Failed to fetch audit logs", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
        const interval = setInterval(fetch, 30000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading && logs.length === 0) return null;

    return (
        <div className="p-8 rounded-[2rem] border border-primary/10 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91]">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">System Audit</h3>
                        <p className="text-[10px] font-bold text-[#FF4B91] uppercase tracking-[0.2em] mt-0.5 opacity-80 decoration-2">Confidential Access</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Stream Active</span>
                </div>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                {logs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#FF4B91]/30 transition-all group flex items-start gap-4">
                        <div className="pt-1">
                            <Clock size={14} className="text-[#FF4B91] opacity-60" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[#FF4B91] font-black uppercase tracking-widest">[{log.action}]</span>
                                <span className="text-slate-400 text-[11px]">{formatDistanceToNow(new Date(log.createdAt))} ago</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <User size={12} className="opacity-40" />
                                <span className="font-bold">{log.user?.profile?.name || 'SYSTEM'}</span>
                                <span className="px-2 py-0.5 rounded bg-slate-200 text-[10px] text-slate-500">ID: {log.user?.id?.slice(0, 8) || 'ROOT'}</span>
                            </div>
                            {log.ip && (
                                <div className="flex items-center gap-3 text-slate-400">
                                    <HardDrive size={12} />
                                    <span>IP: {log.ip}</span>
                                </div>
                            )}
                            {log.metadata && (
                                <div className="mt-2 p-3 rounded-xl bg-slate-900/5 text-[11px] text-[#FF4B91]/80 break-all">
                                    {log.metadata}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
                        <span className="text-xs font-black text-green-500 uppercase tracking-tighter">Operational Secure</span>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Encryption</span>
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">AES-256 GCM</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
