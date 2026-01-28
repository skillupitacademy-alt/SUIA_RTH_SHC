'use client';

import React, { useState, useEffect } from 'react';
import { DocCategory, DocFile } from '@/lib/docs-loader';
import { DocsTabs } from './DocsTabs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getDocContentAction } from '@/app/actions/docs';
import { GovernanceInventory } from './GovernanceInventory';
import { DocExplainer } from './DocExplainer';


interface DocsViewerProps {
    structure: Record<DocCategory, DocFile[]>;
}

export function DocsViewer({ structure }: DocsViewerProps) {
    const [activePath, setActivePath] = useState<string>('RADAR');
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        async function loadContent() {
            if (activePath === 'RADAR') {
                setContent('');
                setLoading(false);
                return;
            }

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
        <div className="flex flex-col gap-10">
            {/* Top Navigation Tier */}
            <DocsTabs
                structure={structure}
                onFileSelect={setActivePath}
                activePath={activePath}
            />

            {/* Content Tier - High-Fidelity Paper Sheet */}
            <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10 flex flex-col min-h-[800px]">
                <div className="bg-slate-50/50 border-b border-slate-100 px-10 py-6 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <span className="text-[#FF4B91] font-black text-[11px] uppercase tracking-[0.4em]">Governance_Target</span>
                            <span className="text-[#1A1A1A] font-bold text-sm tracking-tight">{activePath}</span>
                        </div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                            Authorized_Intel // Revision_v2.0 // AI_Flow_Active
                        </h4>
                    </div>
                    {loading && (
                        <div className="flex items-center gap-3 px-6 py-2.5 bg-[#FF4B91]/5 border border-[#FF4B91]/20 rounded-full">
                            <div className="w-2 h-2 bg-[#FF4B91] rounded-full animate-ping shadow-[0_0_10px_#FF4B91]" />
                            <span className="text-[10px] text-[#FF4B91] font-black uppercase tracking-widest">Decrypting_Stream</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[600px] space-y-8">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-slate-100 border-t-[#FF4B91] rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-3 h-3 bg-[#FF4B91] rounded-full animate-pulse" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-[11px] font-black tracking-[0.5em] uppercase animate-pulse">Synchronizing_Vault</p>
                        </div>
                    ) : (
                        <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 px-4">
                            {activePath === 'RADAR' ? (
                                <GovernanceInventory />
                            ) : (
                                <div className="max-w-4xl mx-auto">
                                    <DocExplainer filePath={activePath} />
                                    <MarkdownRenderer content={content} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
