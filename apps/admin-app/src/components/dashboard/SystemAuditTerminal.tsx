'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Terminal, Clock, User, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
        <div className="p-10 rounded-[3.5rem] border border-primary/10 bg-[#0C0C0C] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-[#FF4B91]/10 text-[#FF4B91]">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white">System Audit</h3>
                        <p className="text-xs font-bold text-[#FF4B91] uppercase tracking-[0.2em] mt-1 line-through opacity-80 decoration-2">Confidential_Access</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Stream_Active</span>
                </div>
            </div>

            <div className="space-y-3 font-mono text-[13px] max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {logs.map((log) => (
                    <div key={log.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-[#FF4B91]/30 transition-all group flex items-start gap-5">
                        <div className="pt-1">
                            <Clock size={14} className="text-[#FF4B91] opacity-60" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[#FF4B91] font-black uppercase tracking-widest">[{log.action}]</span>
                                <span className="text-white/40 text-[11px]">{formatDistanceToNow(new Date(log.createdAt))} ago</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <User size={12} className="opacity-40" />
                                <span className="font-bold">{log.user?.profile?.name || 'SYSTEM'}</span>
                                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/60">ID: {log.user?.id?.slice(0, 8) || 'ROOT'}</span>
                            </div>
                            {log.ip && (
                                <div className="flex items-center gap-3 text-white/40">
                                    <HardDrive size={12} />
                                    <span>IP: {log.ip}</span>
                                </div>
                            )}
                            {log.metadata && (
                                <div className="mt-2 p-3 rounded-xl bg-black/40 text-[11px] text-[#FF4B91]/80 break-all">
                                    {log.metadata}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 pt-10 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Status</span>
                        <span className="text-xs font-black text-green-500 uppercase tracking-tighter italic">Operational_Secure</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Encryption</span>
                        <span className="text-xs font-black text-white uppercase tracking-tighter italic">AES-256 GCM</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
