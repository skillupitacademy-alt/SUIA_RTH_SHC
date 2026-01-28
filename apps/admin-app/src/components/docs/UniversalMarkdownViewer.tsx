'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Shield, ChevronRight, AlertOctagon, Info, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UniversalMarkdownViewerProps {
    path: string;
}

export function UniversalMarkdownViewer({ path }: UniversalMarkdownViewerProps) {
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
                console.error('Failed to fetch doc content:', error);
                setContent('# Error\nFailed to load the requested intelligence file.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [path]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="w-16 h-16 border-4 border-slate-100 border-t-[#FF4B91] rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Decrypting_Intelligence_Stream...</p>
            </div>
        );
    }

    return (
        <div className="prose prose-slate max-w-none prose-headings:text-[#1A1A1A] prose-headings:font-black prose-headings:tracking-tighter prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed prose-strong:text-[#1A1A1A] prose-strong:font-black animate-in fade-in duration-1000">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <div className="relative mb-12">
                            <h1 className="text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tighter italic uppercase border-b-8 border-[#FF4B91]/10 pb-4">
                                {children}
                            </h1>
                            <div className="absolute -bottom-2 left-0 w-24 h-2 bg-[#FF4B91] rounded-full" />
                        </div>
                    ),
                    h2: ({ children }) => (
                        <div className="flex items-center gap-4 mt-16 mb-8">
                            <div className="h-8 w-1.5 bg-[#FF4B91] rounded-full animate-pulse" />
                            <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight uppercase m-0">
                                {children}
                            </h2>
                        </div>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-[0.2em] mt-10 mb-4 flex items-center gap-3">
                            <ChevronRight size={18} className="text-[#FF4B91]" />
                            {children}
                        </h3>
                    ),
                    p: ({ children }) => {
                        // Check for Key: Value patterns
                        const text = children?.toString();
                        if (text && text.includes(':') && text.length < 150 && !text.includes('\n')) {
                            const [key, ...valueParts] = text.split(':');
                            const value = valueParts.join(':').trim();
                            return (
                                <div className="group flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl mb-4 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</span>
                                    <span className="text-sm font-black text-[#1A1A1A] text-right">{value}</span>
                                </div>
                            );
                        }
                        return <p className="leading-relaxed mb-6">{children}</p>;
                    },
                    blockquote: ({ children }) => (
                        <div className="my-10 p-8 bg-[#FF4B91]/5 border border-[#FF4B91]/20 rounded-[2rem] relative overflow-hidden shadow-xl shadow-[#FF4B91]/5">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF4B91] to-purple-500" />
                            <div className="flex gap-4">
                                <AlertOctagon className="text-[#FF4B91] shrink-0" size={24} />
                                <div>
                                    <p className="text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em] mb-3">Critical Conflict Protocol</p>
                                    <div className="text-slate-700 font-bold italic text-sm leading-relaxed">{children}</div>
                                </div>
                            </div>
                        </div>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-12 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-primary/5">
                            <table className="w-full text-left border-collapse m-0">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-slate-50/50 border-b border-slate-100">{children}</thead>,
                    th: ({ children }) => (
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{children}</th>
                    ),
                    td: ({ children }) => (
                        <td className="px-8 py-5 text-sm font-bold text-slate-600 border-b border-slate-50">{children}</td>
                    ),
                    code(props) {
                        const { children, className, node, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');

                        if (!match) {
                            return (
                                <code className="bg-slate-100 text-[#FF4B91] px-2 py-0.5 rounded-md font-bold text-xs" {...rest}>
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <div className="bg-[#1A1A1A] p-8 rounded-[2rem] my-8 shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20"><Terminal size={32} className="text-[#FF4B91]" /></div>
                                <code className="text-slate-300 font-mono text-sm leading-relaxed block overflow-x-auto whitespace-pre" {...rest}>
                                    {children}
                                </code>
                            </div>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
