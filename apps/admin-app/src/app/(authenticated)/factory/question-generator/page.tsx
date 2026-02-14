'use client';

import React, { useEffect, useState } from 'react';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { ContextSelector } from '@/components/factory/blueprint/ContextSelector';
import { SourceEditor } from '@/components/factory/blueprint/SourceEditor';
import { DistributionMatrix } from '@/components/factory/blueprint/DistributionMatrix';
import { PromptService } from '@/lib/factory/prompt-service';
import { toast } from 'sonner';

import { useFactory } from '@/context/FactoryContext';
import { JsonIngestBox } from '@/components/factory/ingest/JsonIngestBox';
import { RefreshCcw, ShieldCheck, Check, Copy } from 'lucide-react';
import { useDomains, useSubjects, useTopics, useSubtopics, useAllSkills } from '@/hooks/useAdminHierarchy';
import { useJobTracker } from '@/hooks/useJobTracker';
import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';

export default function QuestionFactoryPage() {
    return (
        <QuestionFactoryContent />
    );
}

function QuestionFactoryContent() {
    const { stagedQuestions, blueprint, setBlueprint, sourceCode, setSourceCode, resetFactory } = useFactory();
    const [isCopying, setIsCopying] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const { startJob } = useJobTracker();
    const [allowMockJobs, setAllowMockJobs] = useState(process.env.NODE_ENV !== 'production');

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            setAllowMockJobs(true);
            return;
        }
        if (typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__ === true) {
            setAllowMockJobs(true);
        }
    }, []);

    // Context resolution hooks for human-readable names
    const { data: domains } = useDomains();
    const { data: subjects } = useSubjects(blueprint.domainId);
    const { data: topics } = useTopics(blueprint.subjectId);
    const { data: subtopics } = useSubtopics(blueprint.topicId);

    // Taxonomy Governance: Fetch ALL skills for global selection
    const { data: globalSkills } = useAllSkills();

    const handleCopyPrompt = async () => {
        if (!blueprint.topicId) {
            toast.error("Please select a Topic first.");
            return;
        }
        if (!sourceCode.trim()) {
            toast.error("Please provide Source Code/Material.");
            return;
        }

        setIsCopying(true);
        try {
            // Resolve Names from IDs
            const domainName = domains?.find((d) => d.id === blueprint.domainId)?.name || "Target Domain";
            const subjectName = subjects?.find((s) => s.id === blueprint.subjectId)?.name || "Target Subject";
            const topicName = topics?.find((t) => t.id === blueprint.topicId)?.name || "Target Topic";
            const subtopicName = subtopics?.find((st) => st.id === blueprint.subtopicId)?.name;

            // TAXONOMY INJECTION: Cap at 200 for extreme safety
            const safeSkills = (globalSkills ?? []).slice(0, 200);

            const prompt = PromptService.generateTechnicalPrompt({
                sourceCode,
                counts: blueprint.counts,
                // Global skills already typed; fall back gracefully
                knownSkills: safeSkills.map((s) => s.name ?? ''),
                strictMode: blueprint.strictMode,
                context: {
                    domainName,
                    subjectName,
                    topicName,
                    subtopicName
                }
            });

            await navigator.clipboard.writeText(prompt);
            toast.success("Prompt Copied with Global Taxonomy!");
        } catch {
            toast.error("Failed to copy prompt.");
        } finally {
            setTimeout(() => setIsCopying(false), 1000);
        }
    };

    return (
        <FactoryLayout title="Question Factory" subtitle="Context-Aware Generator" backPath="/">
            <ZConfirmationDialog
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={() => resetFactory()}
                title="Reset Workspace?"
                description="This will wipe all selections, source material, and staging questions. This action is irreversible."
                variant="danger"
                confirmText="Reset Everything"
            />
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto p-8 space-y-8 pb-32">

                    {/* Header: Context & Blueprint (Adjacent) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* 1. Context Selection */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6 relative group">
                            <ContextSelector
                                selections={blueprint}
                                onChange={(f, v) => setBlueprint({ [f]: v })}
                            />

                            {/* Reset Escape Hatch */}
                            <button
                                onClick={() => setIsResetConfirmOpen(true)}
                                className="absolute top-8 right-8 p-3 rounded-xl bg-rose-50/50 hover:bg-rose-50 text-rose-300 hover:text-rose-500 transition-all opacity-40 hover:opacity-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-rose-100/50"
                                title="Reset Workspace"
                            >
                                <RefreshCcw size={14} />
                                <span className="hidden md:inline">Reset Workspace</span>
                            </button>
                        </div>

                        {/* 2. Distribution Matrix */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6">
                            <DistributionMatrix
                                counts={blueprint.counts}
                                onChange={(f, v) => setBlueprint({ counts: { ...blueprint.counts, [f]: v } })}
                            />
                        </div>
                    </div>

                    {/* 3. Source Truth (Full Width Workspace) */}
                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                        <div className="flex-1 flex flex-col">
                            <SourceEditor value={sourceCode} onChange={setSourceCode} />
                        </div>
                    </div>

                    {/* Phase 2: Ingest Container */}
                    <div className="bg-white rounded-[2.5rem] p-4 border border-slate-200 shadow-sm flex flex-col">
                        <JsonIngestBox />
                    </div>

                    {/* Phase 3: Review Console (Teaser for now) */}
                    {stagedQuestions.length > 0 && (
                        <div className="bg-white rounded-[2.5rem] p-12 border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 shadow-sm flex items-center justify-center mb-6 font-black">
                                PH3
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">Phase 3: Review Console</h3>
                            <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium">
                                Your questions have been parsed. Next, we will build the interactive review cards here.
                            </p>
                        </div>
                    )}

                    {/* Floating Action Console */}
                    <div className="sticky bottom-0 z-30 flex justify-center pt-8 pointer-events-none">
                        <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 w-full px-12 pointer-events-auto mb-4">
                            {/* Row 1: Centered Title */}
                            <div className="w-full flex justify-center">
                                <h4 className="text-xs font-black uppercase text-[#FF4B91] tracking-widest leading-none">Intelligence Phase</h4>
                            </div>

                            {/* Row 2: Full-width Centered Rail */}
                            <div className="w-full h-12 grid grid-cols-[1fr_auto_1fr] items-center">
                                <div /> {/* Left Rail Spacer */}
                                <div className="flex items-center gap-4">
                                    {/* Strict Mode Toggle: Executive White Aesthetic */}
                                    <button
                                        onClick={() => setBlueprint({ strictMode: !blueprint.strictMode })}
                                        className={`
                                            h-12 flex items-center gap-3 px-6 rounded-2xl border transition-all shadow-sm
                                            ${blueprint.strictMode
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-500/10'
                                                : 'bg-slate-50 border-slate-200 text-slate-400'
                                            }
                                        `}
                                        title={blueprint.strictMode ? "Taxonomy Check Enabled" : "Taxonomy Check Disabled"}
                                    >
                                        <ShieldCheck size={18} className={blueprint.strictMode ? 'animate-pulse' : ''} />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                                            {blueprint.strictMode ? "Strict" : "Legacy"}
                                        </span>
                                    </button>

                                    {/* Global Skills Badge: Emerald/Compact - Integrated into Group */}
                                    {globalSkills && globalSkills.length > 0 && (
                                        <div className="flex items-center gap-2 px-4 h-12 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                                {globalSkills.length} SKILLS
                                            </span>
                                        </div>
                                    )}

                                    {/* MOCK JOB TRIGGER: Resilience Test */}
                                    {allowMockJobs && (
                                        <button
                                            data-testid="mock-job-button"
                                            onClick={() => startJob('MOCK_JOB', { test: true })}
                                            className="h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all shadow-sm"
                                            title="Trigger Mock Background Job"
                                        >
                                            Mock Job
                                        </button>
                                    )}

                                    <button
                                        onClick={handleCopyPrompt}
                                        disabled={!blueprint.topicId || !sourceCode}
                                        className={`
                                            h-12 px-10 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all
                                            ${(!blueprint.topicId || !sourceCode)
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : 'bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white shadow-xl shadow-[#FF4B91]/30 active:scale-[0.98]'
                                            }
                                        `}
                                    >
                                        {isCopying ? <Check size={18} /> : <Copy size={18} />}
                                        <span className="whitespace-nowrap">{isCopying ? 'Copied' : 'Copy Smart Prompt'}</span>
                                    </button>
                                </div>
                                <div /> {/* Right Rail Spacer */}
                            </div>

                            {/* Row 3: Bottom-Right Helper Text */}
                            <div className="w-full flex justify-end">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Generate Surgical AI Prompt</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </FactoryLayout>
    );
}
