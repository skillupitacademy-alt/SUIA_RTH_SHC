'use client';

import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-slate max-w-none 
            prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter
            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:font-medium
            prose-table:border-separate prose-table:border-spacing-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => (
                        <h1 className="text-5xl font-black text-[#1A1A1A] mt-16 mb-8 border-l-8 border-[#FF4B91] pl-6 italic" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-black text-[#1A1A1A] mt-12 mb-6 flex items-center gap-4 py-3 bg-slate-50 border-y border-slate-200 px-4 rounded-xl" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3 className="text-lg font-black text-slate-400 mt-10 mb-4 tracking-[0.3em]" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                        <div className="my-10 border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl bg-white shadow-primary/5">
                            <table className="min-w-full divide-y divide-slate-200" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => (
                        <thead className="bg-[#FF4B91]/5" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                        <th className="px-8 py-5 text-left text-[11px] font-black text-[#FF4B91] uppercase tracking-[0.3em] border-b-2 border-[#FF4B91]/10" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                        <td className="px-8 py-5 text-[14px] font-semibold text-slate-600 border-b border-slate-100 group-hover:bg-slate-50 transition-colors" {...props} />
                    ),
                    code: ({ node, inline, className, children, ...props }: any) => {
                        return !inline ? (
                            <div className="relative my-8 group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-100 rounded-3xl blur opacity-25" />
                                <pre className="relative p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 overflow-x-auto shadow-2xl shadow-primary/5">
                                    <code className={cn("text-xs leading-relaxed font-mono text-[#FF4B91] font-bold", className)} {...props}>
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
                        <blockquote className="border-l-8 border-[#FF4B91] bg-slate-50 p-10 my-10 rounded-3xl italic text-slate-500 font-bold" {...props} />
                    ),
                    ul: ({ node, ...props }) => <ul className="list-none space-y-4 my-8" {...props} />,
                    li: ({ node, ...props }) => (
                        <li className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#FF4B91]/30 transition-all group">
                            <div className="w-2 h-2 rounded-full bg-[#FF4B91] mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                            <div className="text-[14px] font-medium text-slate-600 leading-relaxed">{props.children}</div>
                        </li>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
