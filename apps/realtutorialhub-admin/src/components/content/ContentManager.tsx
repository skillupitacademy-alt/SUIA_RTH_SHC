'use client';

import { apiClient } from '@quiz/api-client';
import { ExternalLink, FileText, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ErrorBanner } from '@/components/layout/ErrorBanner';
import { clientLogger } from '@/utils/clientLogger';

interface ContentItem {
    id: string;
    questionText: string;
    difficulty: string;
    type: string;
}

export function ContentManager() {
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const data = await apiClient.admin.getQuestions();
                const questions = Array.isArray(data.questions) ? data.questions : [];
                setContent(questions as ContentItem[]);
                setErrorMessage(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'unknown';
                clientLogger.error('Failed to fetch admin content', { error: message });
                setErrorMessage('Unable to load repository assets. Please retry or check your connection.');
            } finally {
                setLoading(false);
            }
        };
        void fetchContent();
    }, []);

    return (
        <div className="rounded-[3rem] border bg-background overflow-hidden shadow-sm">
            <div className="p-8 border-b flex items-center justify-between bg-muted/5">
                <h3 className="text-xl font-black tracking-tight">Enterprise Asset Repository</h3>
                <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">Repository Index</button>
            </div>
            {errorMessage != null ? (
                <div className="px-8 pt-4">
                    <ErrorBanner message={errorMessage} onClose={() => setErrorMessage(null)} />
                </div>
            ) : null}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-muted/10">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset Name</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Difficulty</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center font-bold text-muted-foreground animate-pulse">Syncing Repository...</td></tr>
                        ) : content.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center font-bold text-muted-foreground">No assets found in repository.</td></tr>
                        ) : content.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/5 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                            <FileText size={18} />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight truncate max-w-[200px]">{item.questionText}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm font-semibold capitalize">{item.difficulty}</td>
                                <td className="px-8 py-6 text-sm font-bold text-muted-foreground">{item.type}</td>
                                <td className="px-8 py-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500">
                                        Active
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                                            <ExternalLink size={16} />
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
