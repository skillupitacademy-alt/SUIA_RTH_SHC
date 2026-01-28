'use client';

import ReactMarkdown from 'react-markdown';

import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-invert max-w-none prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-800 prose-table:border-separate prose-table:border-spacing-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-4xl font-black text-blue-400 mt-12 mb-6 border-b-2 border-blue-900/30 pb-4 uppercase tracking-tight italic" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-black text-slate-100 mt-10 mb-4 flex items-center gap-3 before:content-[''] before:w-1.5 before:h-6 before:bg-blue-600 before:rounded-full uppercase tracking-tight" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-blue-300/80 mt-8 mb-3 uppercase tracking-[0.2em]" {...props} />,
                    table: ({ node, ...props }) => (
                        <div className="my-10 border-2 border-slate-800 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-slate-950/20 backdrop-blur-sm">
                            <table className="min-w-full divide-y div-slate-800" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-slate-900/80" {...props} />,
                    th: ({ node, ...props }) => <th className="px-6 py-5 text-left text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-b border-slate-800" {...props} />,
                    td: ({ node, ...props }) => <td className="px-6 py-5 text-[13px] font-medium text-slate-400 border-b border-slate-800/50 group-hover:text-slate-200 transition-colors" {...props} />,
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <pre className="relative p-6 rounded-2xl bg-[#0a0a0f] border border-slate-800 overflow-x-auto my-6 shadow-2xl">
                                    <code className={cn("text-sm leading-relaxed font-mono", className)} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md text-[11px] font-bold border border-blue-500/20" {...props}>
                                {children}
                            </code>
                        );
                    },
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-600 bg-blue-600/5 p-8 my-8 rounded-r-3xl italic text-slate-300 shadow-inner" {...props} />
                    ),
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-3 my-6 text-slate-400 font-medium" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-3 my-6 text-slate-400 font-medium" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-2 marker:text-blue-500" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
