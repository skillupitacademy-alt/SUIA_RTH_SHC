'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { apiClient } from '@quiz/api-client';
import { ZLoader, ZPagination } from '@quiz/ui';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Globe, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

export function LiveSessionsList() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSessions = async (p: number) => {
        try {
            const data = await apiClient.admin.getLiveSessions(p, pageSize, debouncedSearch || undefined);
            const sessionsData = Array.isArray(data.sessions) ? data.sessions : [];
            setSessions(sessionsData);
            setMeta({
                page: data.page ?? 1,
                totalPages: data.totalPages ?? 1,
                total: data.total ?? sessionsData.length ?? 0
            });
        } catch (err) {
            clientLogger.error('Failed to fetch live sessions', { error: err instanceof Error ? err.message : 'unknown' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchSessions(page);
        const interval = setInterval(() => { void fetchSessions(page); }, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [page, pageSize, debouncedSearch]);

    if (isLoading && sessions.length === 0) {
        return (
            <div className="p-20">
                <ZLoader size="lg" text="Polling Live Traffic_" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-[#1A1A1A]">Governance Terminal</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Currently Authenticated Users</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-full xl:w-[300px]">
                            <input
                                type="text"
                                placeholder="SEARCH_SESSION_USER..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-white border border-primary/5 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-[#FF4B91]/10 outline-none shadow-sm"
                            />
                        </div>
                        <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-2 flex-shrink-0">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{meta.total} Online</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-8">
                    {(!Array.isArray(sessions) || sessions.length === 0) ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-[2rem] border-muted-foreground">
                            <Users className="mx-auto text-muted-foreground mb-4" size={56} />
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Active Sessions Detected</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="p-5 rounded-[1.75rem] bg-background border border-muted/50 hover:border-[#FF4B91]/30 transition-all group flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-[#FF4B91]/5 flex items-center justify-center text-[#FF4B91] font-black text-xl border border-[#FF4B91]/10">
                                        {(session.user?.profile?.name?.[0] ?? 'U')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-black tracking-tight text-[#1A1A1A]">{(session.user?.profile?.name ?? 'Unknown User')}</h4>
                                            {session.isAdmin === true ? <span className="px-2 py-0.5 rounded-md bg-[#FF4B91]/10 text-[#FF4B91] text-[9px] font-black uppercase tracking-widest">Master</span> : null}
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground">{session.user?.email ?? 'No Email'}</p>
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center gap-10 text-right">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Seen</p>
                                        <div className="flex items-center gap-2 justify-end text-sm font-bold text-[#1A1A1A]">
                                            <Clock size={14} className="text-[#FF4B91]" />
                                            {session.lastActiveAt ? formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true }) : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-muted-foreground/10" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry</p>
                                        <p className="text-sm font-bold text-[#1A1A1A]">{session.expiresAt ? new Date(session.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}</p>
                                    </div>
                                    <div className="w-px h-10 bg-muted-foreground/10" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            {session.status === 'active' ? (
                                                <>
                                                    <Globe size={14} className="text-green-500 animate-pulse" />
                                                    <span className="text-[11px] font-black text-green-600 uppercase tracking-widest">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={14} className="text-orange-500" />
                                                    <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">Idle</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <ZPagination
                    currentPage={page}
                    totalPages={meta.totalPages}
                    totalCount={meta.total}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            </div>
        </div>
    );
}
