'use client';

import React, { useState } from 'react';
import { DocCategory, DocFile } from '@/lib/docs-loader';
import { DocsTabs } from './DocsTabs';
import { GovernanceInventory } from './GovernanceInventory';
import { ConstitutionViewer } from './ConstitutionViewer';

interface DocsViewerProps {
    structure: Record<DocCategory, DocFile[]>;
}

export function DocsViewer({ structure }: DocsViewerProps) {
    const [activePath, setActivePath] = useState<string>('RADAR');

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
                </div>

                <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
                    <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000 px-4">
                        {activePath === 'RADAR' ? (
                            <GovernanceInventory />
                        ) : activePath.includes('AGENT_CONSTITUTION.md') ? (
                            <ConstitutionViewer />
                        ) : (
                            <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-center">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Content Display Disabled by Protocol</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
