'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Layers, Globe, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DomainTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchDomains = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.admin.getDomains(page, 20, debouncedSearch || undefined);
                setData(response.data);
                setTotalPages(response.totalPages);
            } catch (error) {
                console.error('Failed to fetch domains:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDomains();
    }, [page, debouncedSearch]);

    return (
        <div className="space-y-4">
            {/* Search Bar - Discovery_Orchestrator Style */}
            <div className="bg-white/50 backdrop-blur-xl border border-primary/10 p-6 rounded-[2rem] shadow-xl relative overflow-hidden flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-500 shadow-sm border border-blue-100">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div className="relative flex-1 max-w-md group">
                        <input
                            type="text"
                            placeholder="SEARCH_DOMAINS..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-[11px] font-black tracking-widest text-[#1A1A1A] placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none border border-transparent shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="hidden md:block">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">Authority_Indexing_Active</p>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl min-h-[400px] relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Indexing_Matrix...</p>
                        </div>
                    </div>
                )}
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 bg-primary/5">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[30%]">Domain</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                        {data.map((item) => (
                            <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                            <Globe size={16} />
                                        </div>
                                        <span className="font-bold text-[#1A1A1A]">{item.name}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm font-medium text-muted-foreground">{item.category || '—'}</td>
                                <td className="p-6 text-xs text-muted-foreground max-w-xs truncate" title={item.description}>{item.description || '—'}</td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${item.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-6 text-right text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="p-6 border-t border-primary/5 flex items-center justify-between">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91]">Previous</button>
                    <span className="text-xs font-bold text-muted-foreground">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91]">Next</button>
                </div>
            </div>
        </div>
    );
}
