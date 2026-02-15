import { ZLoader } from '@quiz/ui';
import { Archive, CornerDownRight,FileText, History, Lock, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArchiveViewerProps {
    path: string;
}

export function ArchiveViewer({ path }: ArchiveViewerProps) {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/admin/docs?path=${encodeURIComponent(path)}`);
                const data = await response.json();
                setContent(data.content);
            } catch (error) {
                console.error('Failed to fetch archive content:', error);
                setContent('# Error\nFailed to load the archived intelligence file.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [path]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <ZLoader size="lg" text="Accessing Historical Vault..." />
            </div>
        );
    }

    return (
        <div className="relative pb-20 animate-in fade-in duration-1000">
            {/* Archive Header */}
            <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 mb-16 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Archive size={120} />
                </div>
                <div className="flex items-center gap-3 mb-4">
                    <Lock size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Historical Record System</span>
                </div>
                <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase mb-4">
                    Intelligence Archive
                </h1>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                    <History size={14} />
                    <span>Reference Only // Read-Only Status // Immutable Audit Trail</span>
                </div>
            </div>

            {/* Markdown Content with "Aged" aesthetic */}
            <div className="prose prose-slate max-w-none prose-headings:text-[#1A1A1A] prose-headings:font-black prose-headings:tracking-tighter prose-p:text-slate-500 prose-p:font-bold prose-p:leading-relaxed px-4">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h2: ({ children }) => (
                            <div className="flex items-center gap-4 mt-16 mb-8">
                                <FileText size={20} className="text-slate-300" />
                                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight uppercase m-0">
                                    {children}
                                </h2>
                            </div>
                        ),
                        h3: ({ children }) => (
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.1em] mt-10 mb-4 flex items-center gap-3">
                                <CornerDownRight size={16} className="text-slate-300" />
                                {children}
                            </h3>
                        ),
                        ul: ({ children }) => (
                            <ul className="space-y-3 list-none p-0 my-8">
                                {children}
                            </ul>
                        ),
                        li: ({ children }) => (
                            <li className="flex items-start gap-4 p-5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white transition-colors">
                                <Share2 size={14} className="mt-1 text-slate-300 shrink-0" />
                                <div className="text-sm font-bold text-slate-600 leading-normal">{children}</div>
                            </li>
                        ),
                        blockquote: ({ children }) => (
                            <div className="my-10 p-8 bg-slate-100 border-l-4 border-slate-300 rounded-r-[2rem] text-slate-600 font-bold text-sm leading-relaxed">
                                {children}
                            </div>
                        ),
                        table: ({ children }) => (
                            <div className="overflow-x-auto my-12 bg-white border border-slate-100 rounded-[2rem] shadow-xl">
                                <table className="w-full text-left border-collapse m-0">{children}</table>
                            </div>
                        ),
                        thead: ({ children }) => <thead className="bg-slate-50 border-b border-slate-100">{children}</thead>,
                        th: ({ children }) => (
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</th>
                        ),
                        td: ({ children }) => (
                            <td className="px-8 py-4 text-xs font-bold text-slate-500 border-b border-slate-50">{children}</td>
                        )
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>

            <div className="p-12 border-t border-slate-100 text-center mt-20">
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
                    End of Intelligence Reel // No Further Directives // Vault Locked
                </p>
            </div>
        </div>
    );
}
