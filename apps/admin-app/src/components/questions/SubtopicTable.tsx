'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { GitBranch, FolderTree } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SubtopicTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchSubtopics = async () => {
            try {
                const response = await apiClient.admin.getSubtopics(page, 20);
                setData(response.data);
                setTotalPages(response.totalPages);
            } catch (error) {
                console.error('Failed to fetch subtopics:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubtopics();
    }, [page]);

    if (isLoading) return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading Subtopics...</div>;

    return (
        <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-primary/5 bg-primary/5">
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[30%]">Subtopic</th>
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Parent Hierarchy</th>
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Depth</th>
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                    {data.map((item) => (
                        <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-500 flex items-center justify-center">
                                        <GitBranch size={16} />
                                    </div>
                                    <span className="font-bold text-[#1A1A1A]">{item.name}</span>
                                </div>
                            </td>
                            <td className="p-6">
                                <div className="flex flex-col text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <span className="uppercase text-[10px] font-black tracking-widest opacity-50">TOPIC</span>
                                        <span>{item.topic?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] opacity-70">
                                        {item.topic?.subject?.domain?.name} / {item.topic?.subject?.name}
                                    </div>
                                </div>
                            </td>
                            <td className="p-6">
                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                                    Lvl {item.depthLevel || 1}
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
    );
}
