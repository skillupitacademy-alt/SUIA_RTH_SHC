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
            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">

                {/* Left Panel: Blueprint Controls (40%) */}
                <div className="w-full lg:w-[450px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar p-8 flex flex-col gap-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            The Blueprint
                        </h2>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Define the scope, difficulty distribution, and context for your exam batch.
                            The AI will strictly adhere to these constraints.
                        </p>
                    </div>

                    <ContextSelector selections={selections} onChange={(f, v) => setSelections(prev => ({ ...prev, [f]: v }))} />

                    <div className="h-px bg-slate-100" />

                    <DistributionMatrix counts={counts} onChange={(f, v) => setCounts(prev => ({ ...prev, [f]: v }))} />

                    <div className="mt-auto pt-8">
                        <button
                            onClick={handleCopyPrompt}
                            disabled={!selections.topicId || !sourceCode}
                            className={`
                                w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all
                                ${(!selections.topicId || !sourceCode)
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 active:scale-[0.98]'
                                }
                            `}
                        >
                            {isCopying ? <Check size={18} /> : <Copy size={18} />}
                            {isCopying ? 'Copied!' : 'Copy Smart Prompt'}
                        </button>
                        <p className="text-[9px] text-center text-slate-400 mt-3 font-medium">
                            Use this prompt in ChatGPT / Claude / DeepSeek
                        </p>
                    </div>
                </div>

                {/* Right Panel: Source Material (60%) */}
                <div className="flex-1 bg-slate-50/50 flex flex-col min-w-0">
                    <div className="flex-1 p-8 overflow-hidden flex flex-col">
                        <SourceEditor value={sourceCode} onChange={setSourceCode} />
                    </div>

                    {/* Phase 2 Teaser (Ingest Box Placeholder) */}
                    <div className="h-24 border-t border-slate-200 bg-white p-6 flex items-center justify-between opacity-50 grayscale pointer-events-none select-none">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                <Play size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-slate-400">Phase 2: Ingest</h4>
                                <p className="text-[10px] text-slate-300">Run the factory to process results...</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </FactoryLayout>
    );
}
