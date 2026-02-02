'use client';

import React, { useState } from 'react';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { ContextSelector } from '@/components/factory/blueprint/ContextSelector';
import { SourceEditor } from '@/components/factory/blueprint/SourceEditor';
import { DistributionMatrix } from '@/components/factory/blueprint/DistributionMatrix';
import { PromptService } from '@/lib/factory/prompt-service';
import { Copy, Check, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionFactoryPage() {
    const [selections, setSelections] = useState({ domainId: '', subjectId: '', topicId: '' });
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
            // Note: In a real app we would fetch names for IDs, but simplifying for Phase 1
            const prompt = PromptService.generateTechnicalPrompt({
                sourceCode,
                counts,
                context: {
                    domainName: "Selected Domain", // TODO: Fetch real names or pass from Selector
                    subjectName: "Selected Subject",
                    topicName: "Selected Topic"
                }
            });

            await navigator.clipboard.writeText(prompt);
            toast.success("Prompt Copied to Clipboard!");
        } catch (err) {
            toast.error("Failed to copy prompt.");
        } finally {
            setTimeout(() => setIsCopying(false), 1000); // UI feedback delay
        }
    };

    return (
        <FactoryLayout title="Question Factory" subtitle="Context-Aware Generator" backPath="/admin/dashboard">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto p-8 space-y-8">

                    {/* Header: Context & Blueprint (Adjacent) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 1. Context Selection */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">The Target</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">1. Define Scoping Context</p>
                            </div>
                            <ContextSelector
                                selections={selections}
                                onChange={(f, v) => setSelections(prev => ({ ...prev, [f]: v }))}
                            />
                        </div>

                        {/* 2. Distribution Matrix */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">The Volume</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">2. Difficulty Distribution</p>
                            </div>
                            <DistributionMatrix
                                counts={counts}
                                onChange={(f, v) => setCounts(prev => ({ ...prev, [f]: v }))}
                            />
                        </div>
                    </div>

                    {/* 3. Source Truth (Full Width Workspace) */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
                        <div className="flex-1 flex flex-col">
                            <SourceEditor value={sourceCode} onChange={setSourceCode} />
                        </div>
                    </div>

                    {/* Phase 2 Teaser (Ingest Container) */}
                    <div className="bg-slate-100/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-6">
                            <Play size={32} fill="currentColor" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Phase 2: Ingest & Review</h3>
                        <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium">
                            The Ingest Engine will be placed here. You will paste the AI results to trigger the semantic validator and review console.
                        </p>
                    </div>

                    {/* Floating Action Console */}
                    <div className="sticky bottom-8 z-30 flex justify-center pt-8">
                        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl px-10 border-t-white/50">
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest">Intelligence Action</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Generate Strict-Schema AI Prompt</p>
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button
                                    onClick={handleCopyPrompt}
                                    disabled={!selections.topicId || !sourceCode}
                                    className={`
                                        flex-1 md:flex-none px-10 py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all
                                        ${(!selections.topicId || !sourceCode)
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 active:scale-[0.98]'
                                        }
                                    `}
                                >
                                    {isCopying ? <Check size={18} /> : <Copy size={18} />}
                                    {isCopying ? 'Copied!' : 'Copy Smart Prompt'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </FactoryLayout>
    );
}
