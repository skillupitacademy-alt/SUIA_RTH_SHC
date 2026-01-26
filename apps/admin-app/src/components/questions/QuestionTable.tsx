'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { FileText, Layers, Hash, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuestionData {
    id: string;
    questionText: string;
    type: string;
    difficulty: string;
    status: string;
    createdAt: string;
    topic?: {
        name: string;
        subject?: {
            name: string;
            domain?: {
                name: string;
            }
        }
    };
}

export function QuestionTable() {
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const data = await apiClient.admin.getQuestions(page, 20);
                setQuestions(data.questions);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error('Failed to fetch questions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuestions();
    }, [page]);

    if (isLoading) {
        return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading Governance Matrix...</div>;
    }

    return (
        <div className="rounded-[2.5rem] border border-primary/10 bg-white/50 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-primary/5 bg-primary/5">
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground w-[40%]">Question & Hierarchy</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Difficulty</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="p-6 text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                        {questions.map((q) => (
                            <tr key={q.id} className="group hover:bg-primary/5 transition-colors">
                                <td className="p-6">
                                    <div className="space-y-1">
                                        <p className="font-bold text-[#1A1A1A] line-clamp-2 text-sm">{q.questionText}</p>
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                                            <span>{q.topic?.subject?.domain?.name || 'N/A'}</span>
                                            <span>/</span>
                                            <span>{q.topic?.subject?.name || 'N/A'}</span>
                                            <span>/</span>
                                            <span className="text-[#FF4B91]">{q.topic?.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-wider border border-gray-200">
                                        {q.type}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${q.difficulty === 'simple' ? 'bg-green-100 text-green-700 border-green-200' :
                                            q.difficulty === 'mean' || q.difficulty === 'intermediate' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                        }`}>
                                        {q.difficulty}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${q.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                        <span className="text-xs font-bold uppercase text-muted-foreground">{q.status}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <span className="text-xs font-medium text-muted-foreground">{formatDistanceToNow(new Date(q.createdAt))} ago</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-primary/5 flex items-center justify-between">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors"
                >
                    Previous
                </button>
                <span className="text-xs font-bold text-muted-foreground">Page {page} of {totalPages}</span>
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-widest disabled:opacity-50 hover:text-[#FF4B91] transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
