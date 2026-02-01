'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Users, Clock, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ZLoader } from '@/components/ui/ZLoader';

export function LiveSessionsList() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({ page: 1, totalPages: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchSessions = async (p: number) => {
        try {
            const data = await apiClient.admin.getLiveSessions(p, 10, debouncedSearch || undefined);
            setSessions(data.sessions);
            setMeta({
                page: data.page,
                totalPages: data.totalPages,
                total: data.total
            });
        } catch (err) {
            console.error("Failed to fetch live sessions", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions(page);
        const interval = setInterval(() => fetchSessions(page), 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [page, debouncedSearch]);

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
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Governance Terminal</h3>
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
                    {sessions.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-[2rem] border-muted-foreground/10">
                            <Users className="mx-auto text-muted-foreground/20 mb-4" size={56} />
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Active Sessions Detected</p>
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="p-5 rounded-[1.75rem] bg-background border border-muted/50 hover:border-[#FF4B91]/30 transition-all group flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-[#FF4B91]/5 flex items-center justify-center text-[#FF4B91] font-black text-xl border border-[#FF4B91]/10">
                                        {session.user.profile?.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-black tracking-tight text-[#1A1A1A]">{session.user.profile?.name || 'Unknown User'}</h4>
                                            {session.isAdmin && (
                                                <span className="px-2 py-0.5 rounded-md bg-[#FF4B91]/10 text-[#FF4B91] text-[9px] font-black uppercase tracking-widest">Master</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground">{session.user.email}</p>
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center gap-10 text-right">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Seen</p>
                                        <div className="flex items-center gap-2 justify-end text-sm font-bold text-[#1A1A1A]">
                                            <Clock size={14} className="text-[#FF4B91]" />
                                            {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-muted-foreground/10" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expiry</p>
                                        <p className="text-sm font-bold text-[#1A1A1A]">{new Date(session.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
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

                {/* Pagination Controls */}
                {meta.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-muted-foreground/5">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Page {page} of {meta.totalPages} <span className="mx-2">•</span> {meta.total} Total Sessions
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-6 py-2 rounded-xl bg-background border font-black text-[10px] uppercase tracking-widest hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                                className="px-6 py-2 rounded-xl bg-[#1A1A1A] text-white font-black text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
