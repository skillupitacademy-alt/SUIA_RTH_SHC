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

export default function QuestionFactoryPage() {
    return (
        <FactoryProvider>
            <QuestionFactoryContent />
        </FactoryProvider>
    );
}

function QuestionFactoryContent() {
    const { stagedQuestions } = useFactory();
    const [selections, setSelections] = useState({ domainId: '', subjectId: '', topicId: '', subtopicId: '' });
    const [sourceCode, setSourceCode] = useState('');
    const [counts, setCounts] = useState({ simple: 2, intermediate: 5, expert: 3 });
    const [isCopying, setIsCopying] = useState(false);

    const handleCopyPrompt = async () => {
        if (!selections.topicId) {
            toast.error("Please select a Topic first.");
            return;
        }
        if (!sourceCode.trim()) {
            toast.error("Please provide Source Code/Material.");
            return;
        }

        setIsCopying(true);
        try {
            const prompt = PromptService.generateTechnicalPrompt({
                sourceCode,
                counts,
                context: {
                    domainName: "Target Domain",
                    subjectName: "Target Subject",
                    topicName: "Target Topic",
                    subtopicName: selections.subtopicId ? "Target Sub-topic" : undefined
                }
            });

            await navigator.clipboard.writeText(prompt);
            toast.success("Prompt Copied to Clipboard!");
        } catch (err) {
            toast.error("Failed to copy prompt.");
        } finally {
            setTimeout(() => setIsCopying(false), 1000);
        }
    };

    return (
        <FactoryLayout title="Question Factory" subtitle="Context-Aware Generator" backPath="/admin/dashboard">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto p-8 space-y-8 pb-32">

                    {/* Header: Context & Blueprint (Adjacent) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* 1. Context Selection */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6">
                            <ContextSelector
                                selections={selections}
                                onChange={(f, v) => setSelections(prev => ({ ...prev, [f]: v }))}
                            />
                        </div>

                        {/* 2. Distribution Matrix */}
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6">
                            <DistributionMatrix
                                counts={counts}
                                onChange={(f, v) => setCounts(prev => ({ ...prev, [f]: v }))}
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
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl px-12 pointer-events-auto mb-4">
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-xs font-black uppercase text-[#FF4B91] tracking-widest italic">Intelligence Phase</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Generate Surgical AI Prompt</p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={handleCopyPrompt}
                                    disabled={!selections.topicId || !sourceCode}
                                    className={`
                                        flex-1 md:flex-none px-12 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all
                                        ${(!selections.topicId || !sourceCode)
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            : 'bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white shadow-xl shadow-[#FF4B91]/10 active:scale-[0.98]'
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
        </FactoryLayout>
    );
}
