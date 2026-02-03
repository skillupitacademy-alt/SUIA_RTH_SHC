'use client';

import React from 'react';
import { useFactory } from '@/context/FactoryContext';
import { QuestionCard } from './QuestionCard';
import {
    Trash2, Save, CheckCheck,
    RefreshCcw, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneratedQuestion } from '@/types/factory';

export function ReviewConsole() {
    const { stagedQuestions, updateQuestion, removeQuestion, clearStage } = useFactory();

    const handleDeleteAll = () => {
        if (confirm("Are you sure you want to clear all staged questions? This cannot be undone.")) {
            clearStage();
        }
    };

    const handleUpdate = (index: number, updates: Partial<GeneratedQuestion>) => {
        updateQuestion(index, updates);
    };

    const handleDelete = (index: number) => {
        removeQuestion(index);
    };

    // Calculate ready status 
    const readyCount = stagedQuestions.length;

    const [isSaving, setIsSaving] = React.useState(false);
    const { blueprint } = useFactory();

    const handleSave = async () => {
        if (!blueprint) {
            alert("No blueprint context found. Please return to Ingest.");
            return;
        }

        setIsSaving(true);
        try {
            // Import dynamically to avoid SSR issues if needed, or just use the global
            const { apiClient } = await import('@quiz/api-client');

            const payload = {
                questions: stagedQuestions,
                topicId: blueprint.topicId,
                subtopicId: blueprint.subtopicId
            };

            const result = await apiClient.admin.saveFactoryBatch(payload);

            if (result.success) {
                // Success!
                // We should probably show a summary toast or modal
                alert(`Success! Saved ${result.insertedCount} questions and created ${result.newSkillsCreated} new skills.`);

                // Clear the stage
                clearStage();

                // Optional: Redirect back or show confetti
                window.location.href = '/factory/question-generator';
            }
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save batch. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full space-y-8 pb-32">
            {/* STICKY MANAGEMENT HEADER */}
            <div className="sticky top-4 z-50 w-full">
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-4 flex items-center justify-between shadow-2xl shadow-slate-200/50">
                    <div className="flex items-center gap-6 px-4 border-r border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Review Progress</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-slate-900 tracking-tight">{readyCount}</span>
                                <span className="text-xs font-bold text-slate-400">/ {stagedQuestions.length}</span>
                                <div className="ml-2 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <CheckCheck size={10} /> Ready
                                </div>
                            </div>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-100" />

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Persistence Gateway</span>
                            <div className="text-[10px] font-bold text-[#FF4B91] flex items-center gap-1">
                                <Sparkles size={12} /> Staging Memory Active
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pr-2">
                        <button
                            className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#FF4B91] transition-all active:scale-95 shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSave}
                            disabled={isSaving || readyCount === 0}
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCcw size={14} className="animate-spin" /> Committing...
                                </>
                            ) : (
                                <>
                                    <Save size={14} /> Commit to Question Bank
                                </>
                            )}
                        </button>

                        <div className="w-[1px] h-8 bg-slate-100 mx-2" />

                        <button
                            onClick={() => window.location.href = '/factory/question-generator'}
                            className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            title="Reset Generation"
                        >
                            <RefreshCcw size={16} />
                        </button>

                        <button
                            onClick={handleDeleteAll}
                            className="p-3 rounded-xl bg-white border border-slate-200 text-rose-400 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95"
                            title="Clear Batch"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* VERTICAL STACK OF CARDS */}
            <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
                {stagedQuestions.map((q, idx) => (
                    <div
                        key={idx}
                        className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                        style={{ animationDelay: `${idx * 150}ms` }}
                    >
                        <QuestionCard
                            question={q}
                            index={idx}
                            onUpdate={(updates) => handleUpdate(idx, updates)}
                            onDelete={() => handleDelete(idx)}
                        />
                    </div>
                ))}
            </div>

            {/* EMPTY STATE RE-GUARD */}
            {stagedQuestions.length === 0 && (
                <div className="bg-white rounded-[2.5rem] p-24 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6 font-black italic">
                        CLEARED
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">Batch Empty</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium italic">
                        The staging area is empty. Please return to the Blueprint area to generate or ingest new questions.
                    </p>
                    <button
                        onClick={() => window.location.href = '/factory/question-generator'}
                        className="mt-8 px-8 py-3 rounded-2xl bg-[#FF4B91] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#FF4B91]/20 active:scale-95 transition-all"
                    >
                        Return to Ingest
                    </button>
                </div>
            )}
        </div>
    );
}
