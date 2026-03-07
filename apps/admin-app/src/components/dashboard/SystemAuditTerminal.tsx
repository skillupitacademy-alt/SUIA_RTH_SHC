'use client';

import { apiClient, type AdminAuditLog } from '@quiz/api-client';
import { recordCounter } from '@quiz/observability';
import { formatDistanceToNow } from 'date-fns';
import { Clock, HardDrive, Terminal, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

export function SystemAuditTerminal() {
    type AuditLog = {
        id: string;
        action?: string;
        createdAt?: string;
        ip?: string;
        metadata?: string;
        user?: { id?: string; profile?: { name?: string } };
    };
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                setError(null);
                const data = await apiClient.admin.getAuditLogs();
                const normalizedData = Array.isArray(data)
                    ? (data as AdminAuditLog[]).map((log) => {
                        const metadataString = log.metadata != null ? JSON.stringify(log.metadata) : '';
                        const userObj: AuditLog['user'] | undefined =
                            typeof log.userId === 'string' && log.userId.trim() !== ''
                                ? { id: log.userId }
                                : (log as { user?: AuditLog['user'] }).user;
                        return {
                            id: log.id,
                            action: log.action,
                            createdAt: typeof log.createdAt === 'string' ? log.createdAt : undefined,
                            ip: log.ipAddress ?? '',
                            metadata: metadataString,
                            user: userObj,
                        };
                    }) as AuditLog[]
                    : [];
                setLogs(normalizedData);
                if (normalizedData.length === 0) {
                    recordCounter('admin.ui.audit.empty', 1);
                } else {
                    recordCounter('admin.ui.audit.fetch_success', 1, { count: normalizedData.length });
                }
            } catch (err) {
                recordCounter('admin.ui.audit.fetch_error', 1, { reason: err instanceof Error ? err.message : 'unknown' });
                clientLogger.error('Failed to fetch audit logs', { error: err instanceof Error ? err.message : 'unknown' });
                setError('Unable to load audit stream.');
            } finally {
                setIsLoading(false);
            }
        };
        void fetch();
        const interval = setInterval(() => { void fetch(); }, 30000);
        return () => clearInterval(interval);
    }, []);

    const hasError = typeof error === 'string' && error.length > 0;

    if (hasError) {
        return (
            <div className="p-8 rounded-[2rem] border border-rose-100 bg-white text-rose-600 text-sm font-semibold">
                {error}
            </div>
        );
    }

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
                {logs.map((log) => {
                    const actorName = typeof log.user?.profile?.name === 'string' && log.user.profile.name.trim().length > 0
                        ? log.user.profile.name
                        : 'SYSTEM';
                    const actorId = typeof log.user?.id === 'string' && log.user.id.trim().length > 0
                        ? log.user.id.slice(0, 8)
                        : 'ROOT';
                    const ip = typeof log.ip === 'string' ? log.ip.trim() : '';
                    const metadata = typeof log.metadata === 'string' ? log.metadata.trim() : '';

                    return (
                        <div key={log.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#FF4B91]/30 transition-all group flex items-start gap-4">
                            <div className="pt-1">
                                <Clock size={14} className="text-[#FF4B91] opacity-60" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#FF4B91] font-black uppercase tracking-widest">[{log.action}]</span>
                                    <span className="text-slate-400 text-[11px]">
                                        {typeof log.createdAt === 'string' && log.createdAt.trim().length > 0
                                            ? `${formatDistanceToNow(new Date(log.createdAt))} ago`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <User size={12} className="opacity-40" />
                                    <span className="font-bold">{actorName}</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-200 text-[10px] text-slate-500">ID: {actorId}</span>
                                </div>
                                {ip.length > 0 ? (
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <HardDrive size={12} />
                                        <span>IP: {ip}</span>
                                    </div>
                                ) : null}
                                {metadata.length > 0 ? (
                                    <div className="mt-2 p-3 rounded-xl bg-slate-900/5 text-[11px] text-[#FF4B91]/80 break-all">
                                        {metadata}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    );
                })}
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
