'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="w-full space-y-12">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => (
                        <div className="mb-20 animate-in fade-in slide-in-from-top-12 duration-1000">
                            <h1 className="text-7xl font-black text-[#1A1A1A] tracking-tighter uppercase italic border-l-[12px] border-[#FF4B91] pl-10 mb-2 leading-none" {...props} />
                            <div className="h-[2px] w-full bg-slate-100 mt-8" />
                        </div>
                    ),
                    h2: ({ node, ...props }) => (
                        <div className="flex items-center gap-6 mt-20 mb-10 group">
                            <div className="p-3 bg-[#FF4B91] rounded-2xl shadow-xl shadow-[#FF4B91]/20 group-hover:rotate-12 transition-transform">
                                <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                            </div>
                            <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic" {...props} />
                            <div className="flex-1 h-[1px] bg-slate-100" />
                        </div>
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-[11px] font-black text-slate-400 mt-12 mb-6 tracking-[0.4em] uppercase flex items-center gap-4 before:h-px before:w-8 before:bg-slate-200" {...props} />
                    ),
                    p: ({ children }) => {
                        const contentText = React.Children.toArray(children).reduce((acc: string, child: any) => {
                            if (typeof child === 'string') return acc + child;
                            if (child?.props?.children) return acc + (typeof child.props.children === 'string' ? child.props.children : '');
                            return acc;
                        }, '');

                        // Detect Key: Value pattern (e.g. **Scope**: All Agents)
                        if (contentText.includes(':')) {
                            const [key, ...rest] = contentText.split(':');
                            const val = rest.join(':').trim();
                            // Optional: Check if key is bold or uppercase
                            if (key.length < 40) {
                                return (
                                    <div className="flex items-center gap-8 py-6 px-10 border border-slate-100 bg-white rounded-3xl hover:border-[#FF4B91]/30 transition-all hover:translate-x-2 duration-500 mb-4 shadow-sm shadow-primary/5">
                                        <span className="w-1/3 max-w-[200px] text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4B91] flex-shrink-0">
                                            {key.replace(/\*/g, '').trim()}
                                        </span>
                                        <span className="text-lg font-bold text-slate-700 tracking-tight italic">
                                            {val}
                                        </span>
                                    </div>
                                );
                            }
                        }

                        return <p className="text-lg font-bold text-slate-500 leading-relaxed italic border-l-4 border-slate-100 pl-10 my-8 py-2">{children}</p>;
                    },
                    table: ({ node, ...props }) => (
                        <div className="my-12 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white shadow-primary/5 w-full">
                            <table className="w-full divide-y divide-slate-200" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-[#FF4B91]/5" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-10 py-6 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em] border-b-2 border-[#FF4B91]/10" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-10 py-6 text-[14px] font-black text-slate-600 border-b border-slate-50 group-hover:bg-slate-50/80 transition-colors" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }: any) => {
                        return !inline ? (
                            <div className="relative my-12 group">
                                <pre className="relative p-12 rounded-[3rem] bg-slate-50 border border-slate-100 overflow-x-auto shadow-2xl shadow-primary/5">
                                    <div className="absolute top-0 right-10 p-4">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Logic_Stream_V2</span>
                                    </div>
                                    <code className={cn("text-sm leading-relaxed font-mono text-[#FF4B91] font-bold block min-w-full font-mono", className)} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="bg-slate-100 text-[#FF4B91] px-2 py-1 rounded-lg text-[12px] font-black border border-slate-200" {...props}>
                                {children}
                            </code>
                        );
                    },
                    blockquote: ({ node, ...props }) => (
                        <div className="relative my-16 px-12 py-10 bg-[#FF4B91]/5 border-2 border-[#FF4B91]/20 rounded-[3rem] group overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FF4B91]/5 rounded-full blur-2xl" />
                            <div className="text-xl font-black text-slate-700 tracking-tight italic leading-relaxed">
                                {props.children}
                            </div>
                            <div className="mt-6 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#FF4B91]" />
                                <span className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.4em]">Critical_Conflict_Protocol</span>
                            </div>
                        </div>
                    ),
                    ul: ({ node, ...props }) => <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 my-12" {...props} />,
                    li: ({ node, ...props }) => (
                        <li className="flex items-center gap-6 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:border-[#FF4B91]/40 transition-all hover:-translate-y-1 duration-500 group">
                            <div className="w-3 h-3 rounded-full bg-[#FF4B91] flex-shrink-0 group-hover:scale-125 transition-transform shadow-lg shadow-[#FF4B91]/40" />
                            <div className="text-[15px] font-black text-slate-700 tracking-tight">{props.children}</div>
                        </li>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
