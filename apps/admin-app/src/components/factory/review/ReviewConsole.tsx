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

import { toast } from 'sonner';
import { ZConfirmationDialog } from '@/components/ui/ZConfirmationDialog';

export function ReviewConsole() {
    const { stagedQuestions, updateQuestion, removeQuestion, removeBatch, clearStage, resetFactory } = useFactory();
    const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());

    // --- DIALOG STATES ---
    const [dialogConfig, setDialogConfig] = React.useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
        variant: 'info'
    });

    const openDialog = (config: Omit<typeof dialogConfig, 'isOpen'>) => {
        setDialogConfig({ ...config, isOpen: true });
    };

    const handleDeleteAll = () => {
        openDialog({
            title: "Clear All Questions?",
            description: "Are you sure you want to wipe the staging area? This action cannot be undone.",
            variant: 'danger',
            onConfirm: clearStage
        });
    };

    const handleUpdate = (index: number, updates: Partial<GeneratedQuestion>) => {
        updateQuestion(index, updates);
    };

    const handleDelete = (index: number) => {
        removeQuestion(index);
        // Clean up selection if needed
        if (selectedIndices.has(index)) {
            const next = new Set(selectedIndices);
            next.delete(index);
            setSelectedIndices(next);
        }
    };

    const handleBatchDelete = () => {
        if (selectedIndices.size === 0) return;
        openDialog({
            title: "Delete Selection?",
            description: `Are you sure you want to delete ${selectedIndices.size} selected questions?`,
            variant: 'danger',
            onConfirm: () => {
                removeBatch(Array.from(selectedIndices));
                setSelectedIndices(new Set());
            }
        });
    };

    const toggleSelect = (index: number, selected: boolean) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (selected) next.add(index);
            else next.delete(index);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIndices.size === stagedQuestions.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(stagedQuestions.map((_, i) => i)));
        }
    };

    // Calculate ready status 
    const readyCount = stagedQuestions.length;

    const [isSaving, setIsSaving] = React.useState(false);
    const [officialSkills, setOfficialSkills] = React.useState<any[]>([]);
    const [duplicateMap, setDuplicateMap] = React.useState<Map<number, string>>(new Map()); // Index -> Original ID
    const { blueprint } = useFactory();

    // Fetch existing skills on mount to prevent duplicates/typos
    React.useEffect(() => {
        const fetchSkills = async () => {
            if (!blueprint?.topicId) return;
            try {
                // Dynamically import to keep bundle small if needed
                const { apiClient } = await import('@quiz/api-client');
                const skills = await apiClient.admin.getTopicSkills(blueprint.topicId);
                setOfficialSkills(skills);
            } catch (err) {
                console.error("Failed to fetch existing skills context", err);
            }
        };
        fetchSkills();
    }, [blueprint?.topicId]);

    // Check for duplicates when staged questions change
    React.useEffect(() => {
        const checkDuplicates = async () => {
            if (!blueprint?.topicId || stagedQuestions.length === 0) {
                setDuplicateMap(new Map());
                return;
            }

            try {
                const { apiClient } = await import('@quiz/api-client');
                const result = await apiClient.admin.checkDuplicates({
                    questions: stagedQuestions.map(q => ({ questionText: q.questionText })),
                    topicId: blueprint.topicId
                });

                if (result.details && result.details.length > 0) {
                    const nextMap = new Map();
                    result.details.forEach((d: any) => nextMap.set(d.index, d.originalId));
                    setDuplicateMap(nextMap);
                } else {
                    setDuplicateMap(new Map());
                }
            } catch (error) {
                console.error("Duplicate check failed", error);
            }
        };

        // Debounce slightly to avoid rapid firing if questions are updated frequently
        const timer = setTimeout(checkDuplicates, 500);
        return () => clearTimeout(timer);
    }, [stagedQuestions, blueprint?.topicId]);

    const performCommit = async () => {
        setIsSaving(true);
        try {
            const { apiClient } = await import('@quiz/api-client');
            const payload = {
                questions: stagedQuestions,
                topicId: blueprint.topicId,
                subtopicId: blueprint.subtopicId
            };

            const result = await apiClient.admin.saveFactoryBatch(payload);

            if (result.success) {
                toast.success(`Success! Saved ${result.insertedCount} questions and created ${result.newSkillsCreated} new skills.`);
                resetFactory();
                window.location.href = '/factory/question-generator';
            }
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save batch. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (!blueprint.topicId) {
            toast.error("No blueprint context found (Missing Topic). Please return to Ingest.");
            return;
        }

        if (duplicateMap.size > 0) {
            openDialog({
                title: "Duplicates Detected",
                description: `Warning: ${duplicateMap.size} duplicate questions detected. Do you want to proceed and potentially create duplicates?`,
                variant: 'warning',
                onConfirm: performCommit
            });
            return;
        }

        performCommit();
    };

    return (
        <div className="w-full space-y-8 pb-32">
            <ZConfirmationDialog
                isOpen={dialogConfig.isOpen}
                onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={dialogConfig.onConfirm}
                title={dialogConfig.title}
                description={dialogConfig.description}
                variant={dialogConfig.variant}
            />
            {/* FLOATING SELECTION COMMAND BAR */}
            {selectedIndices.size > 0 && (
                <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-slate-900 text-white rounded-3xl py-3 px-8 flex items-center gap-6 shadow-2xl ring-4 ring-[#FF4B91]/10">
                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                            <div className="w-8 h-8 rounded-xl bg-[#FF4B91] flex items-center justify-center font-black text-sm">
                                {selectedIndices.size}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Selected</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleSelectAll}
                                className="text-[10px] font-black uppercase tracking-widest hover:text-[#FF4B91] transition-colors"
                            >
                                {selectedIndices.size === stagedQuestions.length ? 'Deselect All' : 'Select All'}
                            </button>

                            <button
                                onClick={handleBatchDelete}
                                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-500/20"
                            >
                                <Trash2 size={14} /> Delete Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            officialSkills={officialSkills}
                            isDuplicate={duplicateMap.has(idx)}
                            isSelected={selectedIndices.has(idx)}
                            onUpdate={(updates) => handleUpdate(idx, updates)}
                            onDelete={() => handleDelete(idx)}
                            onSelect={(selected) => toggleSelect(idx, selected)}
                        />
                    </div>
                ))}
            </div>

            {/* EMPTY STATE RE-GUARD */}
            {stagedQuestions.length === 0 && (
                <div className="bg-white rounded-[2.5rem] p-24 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mb-6 font-black">
                        CLEARED
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">Batch Empty</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-3 font-medium">
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
