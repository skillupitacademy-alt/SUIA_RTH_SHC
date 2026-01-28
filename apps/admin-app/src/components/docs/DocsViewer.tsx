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
        <div className="flex h-[calc(100vh-160px)] gap-6 p-2">
            {/* Sidebar Navigation */}
            <div className="w-80 h-full flex-shrink-0">
                <DocsTabs
                    structure={structure}
                    onFileSelect={setActivePath}
                    activePath={activePath}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-full bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col backdrop-blur-sm">
                <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-tighter">Path:</span>
                        <span className="text-slate-200 font-mono text-xs">{activePath}</span>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Updating...</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Deciphering Terminal...</p>
                        </div>
                    ) : (
                        <MarkdownRenderer content={content} />
                    )}
                </div>
            </div>
        </div>
    );
}
