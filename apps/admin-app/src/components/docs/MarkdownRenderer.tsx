'use client';

import ReactLeaf from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    return (
        <div className="prose prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-table:border prose-table:border-slate-700 prose-th:bg-slate-800 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-800">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-blue-400 mt-8 mb-4 border-b border-blue-900/50 pb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-slate-200 mt-6 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-medium text-slate-300 mt-4 mb-2" {...props} />,
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 border border-slate-700 rounded-lg shadow-xl">
                            <table className="min-w-full divide-y divide-slate-700 bg-slate-900/50" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-slate-800/50" {...props} />,
                    th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider border-b border-slate-700" {...props} />,
                    td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-400 border-b border-slate-800" {...props} />,
                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto my-4 shadow-inner">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code className="bg-slate-800 px-1 rounded text-pink-400 text-sm" {...props}>
                                {children}
                            </code>
                        );
                    },
                    blockquote: ({ node, ...props }) => (
                        <div className="border-l-4 border-blue-500 bg-blue-500/10 p-4 my-4 rounded-r-lg italic" {...props} />
                    ),
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 my-4 text-slate-400" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 my-4 text-slate-400" {...props} />,
                    li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
