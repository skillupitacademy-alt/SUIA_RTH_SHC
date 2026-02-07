'use client';

import React, { useState } from 'react';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { ContextSelector } from '@/components/factory/blueprint/ContextSelector';
import { SourceEditor } from '@/components/factory/blueprint/SourceEditor';
import { DistributionMatrix } from '@/components/factory/blueprint/DistributionMatrix';
import { PromptService } from '@/lib/factory/prompt-service';
import { Copy, Check, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

import { FactoryProvider, useFactory } from '@/context/FactoryContext';
import { JsonIngestBox } from '@/components/factory/ingest/JsonIngestBox';
import { RefreshCcw, ShieldCheck } from 'lucide-react';
import { useDomains, useSubjects, useTopics, useSubtopics, useAllSkills } from '@/hooks/useAdminHierarchy';
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

    // Context resolution hooks for human-readable names
    const { data: domains } = useDomains();
    const { data: subjects } = useSubjects(blueprint.domainId);
    const { data: topics } = useTopics(blueprint.subjectId);
    const { data: subtopics } = useSubtopics(blueprint.topicId);

    // Taxonomy Governance: Fetch ALL skills for global selection
    const { data: globalSkills, loading: loadingSkills } = useAllSkills();

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
            const domainName = domains?.find((d: any) => d.id === blueprint.domainId)?.name || "Target Domain";
            const subjectName = subjects?.find((s: any) => s.id === blueprint.subjectId)?.name || "Target Subject";
            const topicName = topics?.find((t: any) => t.id === blueprint.topicId)?.name || "Target Topic";
            const subtopicName = subtopics?.find((st: any) => st.id === blueprint.subtopicId)?.name;

            // TAXONOMY INJECTION: Cap at 200 for extreme safety
            const safeSkills = globalSkills?.slice(0, 200) || [];

            const prompt = PromptService.generateTechnicalPrompt({
                sourceCode,
                counts: blueprint.counts,
                knownSkills: safeSkills.map((s: any) => s.name),
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
        } catch (err) {
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
                            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 shadow-sm flex items-center justify-center mb-6 font-black italic">
                                PH3
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">Phase 3: Review Console</h3>
                            <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium italic">
                                Your questions have been parsed. Next, we will build the interactive review cards here.
                            </p>
                        </div>
                    )}

                    {/* Floating Action Console */}
                    <div className="sticky bottom-0 z-30 flex justify-center pt-8 pointer-events-none">
                        <div className="bg-[#0A1128] border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl px-12 pointer-events-auto mb-4">
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-xs font-black uppercase text-[#FF4B91] tracking-widest italic leading-none">Intelligence Phase</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Generate Surgical AI Prompt</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {/* Strict Mode Toggle: Dark Navy Aesthetic */}
                                <button
                                    onClick={() => setBlueprint({ strictMode: !blueprint.strictMode })}
                                    className={`
                                        flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all shadow-sm
                                        ${blueprint.strictMode
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                            : 'bg-slate-900 border-slate-800 text-slate-500'
                                        }
                                    `}
                                    title={blueprint.strictMode ? "Taxonomy Check Enabled" : "Taxonomy Check Disabled"}
                                >
                                    <ShieldCheck size={18} className={blueprint.strictMode ? 'animate-pulse' : ''} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">
                                        {blueprint.strictMode ? "Strict" : "Legacy"}
                                    </span>
                                </button>

                                <div className="flex flex-col gap-2 flex-1 md:flex-none">
                                    {/* Global Skills Badge: Emerald/Compact */}
                                    {globalSkills && globalSkills.length > 0 && (
                                        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-full self-center md:self-end">
                                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">
                                                {globalSkills.length} GLOBAL SKILLS INJECTED
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleCopyPrompt}
                                        disabled={!blueprint.topicId || !sourceCode}
                                        className={`
                                            px-12 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all
                                            ${(!blueprint.topicId || !sourceCode)
                                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                                                : 'bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white shadow-xl shadow-[#FF4B91]/20 active:scale-[0.98]'
                                            }
                                        `}
                                    >
                                        {isCopying ? <Check size={18} /> : <Copy size={18} />}
                                        {isCopying ? 'Copied' : 'Copy Smart Prompt'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </FactoryLayout>
    );
}
