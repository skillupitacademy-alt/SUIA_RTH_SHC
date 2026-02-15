import { ZLoader } from '@quiz/ui';
import { Activity, CheckCircle2, ChevronRight, ListChecks, Map, Shield, Terminal } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface JourneyFlowViewerProps {
    path: string;
}

export function JourneyFlowViewer({ path }: JourneyFlowViewerProps) {
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
                console.error('Failed to fetch journey content:', error);
                setContent('# Error\nFailed to load the journey intelligence file.');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchContent();
    }, [path]);

    if (isLoading === true) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <ZLoader size="lg" text="Optimizing Journey Map..." />
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-20 animate-in fade-in duration-1000">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <div className="relative mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <Map size={18} className="text-[#FF4B91]" />
                                <span className="text-[10px] font-black text-[#FF4B91] uppercase tracking-[0.4em]">Operational Journey Contract</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                                {children}
                            </h1>
                            <div className="absolute -bottom-4 left-0 w-24 h-2 bg-[#FF4B91] rounded-full" />
                        </div>
                    ),
                    h2: ({ children }) => {
                        const childStr = children != null ? children.toString() : '';
                        const match = childStr.match(/^\d+/);
                        return (
                            <div className="flex items-center gap-4 mt-20 mb-10 group">
                                <div className="h-10 w-10 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center text-lg font-black shadow-xl group-hover:scale-110 transition-transform">
                                    {(match != null && match[0] != null) ? match[0] : '—'}
                                </div>
                                <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tight uppercase m-0 border-b-2 border-slate-100 pb-2 flex-1">
                                    {childStr.replace(/^\d+\.\s*/, '')}
                                </h2>
                            </div>
                        );
                    },
                    h3: ({ children }) => {
                        const childStr = children != null ? children.toString().toLowerCase() : '';
                        const icon = childStr.includes('purpose') ? <Shield size={14} /> :
                            childStr.includes('behavior') ? <Activity size={14} /> :
                                childStr.includes('verification') ? <ListChecks size={14} /> :
                                    <ChevronRight size={14} />;

                        return (
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mt-10 mb-6 flex items-center gap-3">
                                <div className="p-1.5 rounded-lg bg-slate-50 text-[#FF4B91] border border-slate-100">
                                    {icon}
                                </div>
                                {children}
                            </h3>
                        );
                    },
                    p: ({ children }) => {
                        const text = children != null ? children.toString() : '';
                        if (text !== '' && text.includes('**Path**:')) {
                            return (
                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl mb-8">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Source</span>
                                    <code className="text-[11px] font-bold text-[#FF4B91]">{text.replace('**Path**:', '').trim()}</code>
                                </div>
                            );
                        }
                        if (text !== '' && text.includes(':') && text.length < 150 && text.includes('\n') === false) {
                            const [key, ...valueParts] = text.split(':');
                            const value = (valueParts.length > 0) ? valueParts.join(':').trim() : '';
                            return (
                                <div className="group flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl mb-3 hover:shadow-lg hover:shadow-primary/5 transition-all">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{key}</span>
                                    <span className="text-[13px] font-bold text-slate-700">{value}</span>
                                </div>
                            );
                        }
                        return <p className="text-slate-600 font-medium leading-relaxed mb-6 pl-2">{children}</p>;
                    },
                    ul: ({ children }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10 pl-2">
                            {children}
                        </div>
                    ),
                    li: ({ children }) => {
                        return (
                            <div className="flex items-start gap-3 p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white transition-colors">
                                <div className="mt-1">
                                    <CheckCircle2 size={16} className="text-[#FF4B91]" />
                                </div>
                                <div className="text-xs font-bold text-slate-600 leading-normal">{children}</div>
                            </div>
                        );
                    },
                    code(props) {
                        const { children, className, ...rest } = props;
                        const match = /language-(\w+)/.exec(className != null && className !== '' ? className : '');

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

            <div className="p-12 border-2 border-dashed border-slate-100 rounded-[3rem] text-center mt-20">
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">
                    End of Operational Journey // 100% Visual Compliance // FAANG Engineering Standards
                </p>
            </div>
        </div>
    );
}
