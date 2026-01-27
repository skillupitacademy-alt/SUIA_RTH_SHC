'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Award, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SkillTable() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchSkills = async () => {
            try {
                const response = await apiClient.admin.getSkills(page, 20);
                setData(response.data);
                setTotalPages(response.totalPages);
            } catch (error) {
                console.error('Failed to fetch skills:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSkills();
    }, [page]);

    if (isLoading) return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading Skills...</div>;

    return (
        <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-primary/5 bg-primary/5">
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[40%]">Skill Name</th>
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Category</th>
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                        <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                    {data.map((item) => (
                        <tr key={item.id} className="group hover:bg-primary/5 transition-colors">
                            <td className="p-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-yellow-50 text-yellow-500 flex items-center justify-center">
                                        <Award size={16} />
                                    </div>
                                    <span className="font-bold text-[#1A1A1A]">{item.name}</span>
                                </div>
                            </td>
                            <td className="p-6 text-sm font-medium text-muted-foreground">{item.category || 'General'}</td>
                            <td className="p-6">
                                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                                    {item.mappingType || 'N/A'}
                                </span>
                            </td>
                            <td className="p-6 text-right text-xs text-muted-foreground">
                                {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : '—'}
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
        </div >
    );
}
