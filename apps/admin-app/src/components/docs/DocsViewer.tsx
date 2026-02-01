'use client';

import React, { useState } from 'react';
import { DocCategory, DocFile } from '@/lib/docs-loader';
import { DocsTabs } from '@/components/docs/DocsTabs';
import { GovernanceInventory } from '@/components/docs/GovernanceInventory';
import { ConstitutionViewer } from '@/components/docs/ConstitutionViewer';
import { BrainLogViewer } from '@/components/docs/BrainLogViewer';
import { ManifestoViewer } from '@/components/docs/ManifestoViewer';
import { ArchitectureViewer } from '@/components/docs/ArchitectureViewer';
import { SpecViewer } from '@/components/docs/SpecViewer';
import { InfraViewer } from '@/components/docs/InfraViewer';
import { JourneyViewer } from '@/components/docs/JourneyViewer';
import { JourneyFlowViewer } from '@/components/docs/JourneyFlowViewer';
import { ArchiveViewer } from '@/components/docs/ArchiveViewer';
import { HealthViewer } from '@/components/docs/HealthViewer';
import { LogViewer } from '@/components/docs/LogViewer';
import { UniversalMarkdownViewer } from '@/components/docs/UniversalMarkdownViewer';

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
                        ) : activePath.includes('BRAIN_LOG_RESTRUCTURE.md') ? (
                            <BrainLogViewer />
                        ) : activePath.includes('PROJECT_MANIFESTO.md') ? (
                            <ManifestoViewer />
                        ) : activePath.includes('SYSTEM_ARCHITECTURE.md') ? (
                            <ArchitectureViewer />
                        ) : activePath.includes('ADMIN_PLATFORM_SPEC.md') ? (
                            <SpecViewer type="admin" />
                        ) : activePath.includes('CORE_PLATFORM_SPEC.md') ? (
                            <SpecViewer type="core" />
                        ) : activePath.includes('UX_BASELINE.md') ? (
                            <SpecViewer type="ux" />
                        ) : activePath.includes('INFRASTRUCTURE_SPEC.md') ? (
                            <InfraViewer />
                        ) : activePath.includes('README.md') && activePath.includes('pages') ? (
                            <JourneyViewer />
                        ) : activePath.includes('JOURNEY.md') || activePath.includes('_PAGE_TEMPLATE.md') ? (
                            <JourneyFlowViewer path={activePath} />
                        ) : activePath.includes('archive/') ? (
                            <ArchiveViewer path={activePath} />
                        ) : activePath.includes('CURRENT_STATE_REPORT.md') ? (
                            <HealthViewer />
                        ) : activePath.includes('TASK_HISTORY.md') ? (
                            <LogViewer type="history" />
                        ) : activePath.includes('CURRENT_TASK_LOG.md') ? (
                            <LogViewer type="current" />
                        ) : (
                            <UniversalMarkdownViewer path={activePath} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
