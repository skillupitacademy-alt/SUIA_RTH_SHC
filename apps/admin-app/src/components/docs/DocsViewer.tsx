'use client';

import React, { useState, useEffect } from 'react';
import { DocCategory, DocFile } from '@/lib/docs-loader';
import { DocsTabs } from './DocsTabs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getDocContentAction } from '@/app/actions/docs';


interface DocsViewerProps {
    structure: Record<DocCategory, DocFile[]>;
}

export function DocsViewer({ structure }: DocsViewerProps) {
    const [activePath, setActivePath] = useState<string>('architecture/PROJECT_MANIFESTO.md');
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        async function loadContent() {
            setLoading(true);
            const result = await getDocContentAction(activePath);
            if (result.success && result.content !== undefined) {
                setContent(result.content);
            } else {
                setContent(`Error: ${result.error || 'Failed to load content'}`);
            }
            setLoading(false);
        }
        loadContent();
    }, [activePath]);

    return (
        <div className="flex flex-col gap-8">
            {/* Top Navigation Tier */}
            <DocsTabs
                structure={structure}
                onFileSelect={setActivePath}
                activePath={activePath}
            />

            {/* Content Tier */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col backdrop-blur-md min-h-[600px]">
                <div className="bg-slate-900/60 border-b border-slate-800 px-8 py-5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">Target_Path</span>
                            <span className="text-slate-200 font-mono text-xs">{activePath}</span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                            Authorized_Reference // Live_Sync: Active
                        </h4>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Deciphering...</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                                </div>
                            </div>
                            <p className="text-slate-500 text-[10px] font-black tracking-[0.4em] uppercase animate-pulse">Establishing_Nexus_Link</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <MarkdownRenderer content={content} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
