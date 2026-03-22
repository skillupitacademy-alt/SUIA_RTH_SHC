'use client';

import { Check, Copy, FileJson, LayoutPanelTop, PencilLine, Sparkles, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ContextSelector } from '@/components/factory/blueprint/ContextSelector';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { useDomains, useSubjects, useSubtopics, useTopics } from '@/hooks/useAdminHierarchy';
import { AssignmentSchema, type AssignmentSchemaType } from '@/lib/factory/assignment-schema';
import { TutorialPromptService } from '@/lib/factory/prompt-service';
import { cn } from '@/lib/utils';

type AssignmentDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';

type AssignmentEntry = AssignmentSchemaType['assignments'][number];

const DIFFICULTIES: Array<{ key: AssignmentDifficulty; label: string; description: string }> = [
    { key: 'simple', label: 'Simple', description: '3-5 MCQ practice questions' },
    { key: 'mixed', label: 'Mixed', description: '6-10 MCQ + short answers' },
    { key: 'intermediate', label: 'Intermediate', description: '8-12 mixed practice items' },
    { key: 'expert', label: 'Expert', description: '12-20 advanced practice items' },
];

export default function AssignmentFactoryPage() {
    const [selections, setSelections] = useState({
        domainId: '',
        subjectId: '',
        topicId: '',
        subtopicId: '',
    });
    const [difficulty, setDifficulty] = useState<AssignmentDifficulty>('simple');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [rawJson, setRawJson] = useState('');
    const [assignmentPreview, setAssignmentPreview] = useState<AssignmentEntry[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [isCopying, setIsCopying] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
    const [publishState, setPublishState] = useState<'draft' | 'published' | null>(null);

    const { data: domains } = useDomains();
    const { data: subjects } = useSubjects(selections.domainId !== '' ? selections.domainId : undefined);
    const { data: topics } = useTopics(selections.subjectId !== '' ? selections.subjectId : undefined);
    const { data: subtopics } = useSubtopics(selections.topicId !== '' ? selections.topicId : undefined);

    const resolvedNames = useMemo(() => {
        const domainName = domains?.find((d) => d.id === selections.domainId)?.name ?? 'Selected Domain';
        const subjectName = subjects?.find((s) => s.id === selections.subjectId)?.name ?? 'Selected Subject';
        const topicName = topics?.find((t) => t.id === selections.topicId)?.name ?? 'Selected Topic';
        const subtopicName = subtopics?.find((st) => st.id === selections.subtopicId)?.name ?? 'Selected Subtopic';

        return { domainName, subjectName, topicName, subtopicName };
    }, [domains, selections.domainId, selections.subjectId, selections.topicId, selections.subtopicId, subjects, subtopics, topics]);

    const canGenerate = selections.domainId !== '' && selections.subjectId !== '' && selections.topicId !== '' && selections.subtopicId !== '';

    const generatePrompt = async () => {
        if (!canGenerate) {
            toast.error('Select domain, subject, topic, and subtopic first.');
            return;
        }

        const prompt = TutorialPromptService.generateAssignmentPrompt({
            context: {
                domainName: resolvedNames.domainName,
                subjectName: resolvedNames.subjectName,
                topicName: resolvedNames.topicName,
                subtopicName: resolvedNames.subtopicName,
            },
            difficulty,
        });

        setGeneratedPrompt(prompt);
        setIsCopying(false);
        toast.success('Assignment prompt generated.');
    };

    const copyPrompt = async () => {
        if (generatedPrompt.trim() === '') {
            await generatePrompt();
            return;
        }

        try {
            await navigator.clipboard.writeText(generatedPrompt);
            setIsCopying(true);
            toast.success('Assignment prompt copied.');
        } catch {
            toast.error('Failed to copy prompt.');
        }
    };

    const ingestJson = () => {
        if (rawJson.trim() === '') {
            toast.error('Paste assignment JSON first.');
            return;
        }

        try {
            const parsed = JSON.parse(rawJson) as unknown;
            const validation = AssignmentSchema.safeParse(parsed);

            if (!validation.success) {
                const errors = validation.error.issues.map((issue) => {
                    const path = issue.path.join('.');
                    return path !== '' ? `${path}: ${issue.message}` : issue.message;
                });
                setValidationErrors(errors);
                setAssignmentPreview([]);
                setPublishState(null);
                toast.error('Assignment JSON failed validation.');
                return;
            }

            setValidationErrors([]);
            setAssignmentPreview(validation.data.assignments);
            setPublishState('draft');
            toast.success(`Validated ${validation.data.assignments.length} assignments.`);
        } catch {
            setValidationErrors(['Invalid JSON payload.']);
            setAssignmentPreview([]);
            setPublishState(null);
            toast.error('Invalid JSON payload.');
        }
    };

    const saveDraft = () => {
        if (assignmentPreview.length === 0) {
            toast.error('Validate assignments before saving a draft.');
            return;
        }

        const now = new Date().toISOString();
        setDraftSavedAt(now);
        setPublishState('draft');
        toast.success('Draft saved.');
    };

    const publishAssignments = () => {
        if (assignmentPreview.length === 0) {
            toast.error('Validate assignments before publishing.');
            return;
        }

        setPublishState('published');
        toast.success('Assignments published for the selected subtopic.');
    };

    return (
        <FactoryLayout title="Assignment Factory" subtitle="Practice-Only Generator" backPath="/dashboard/content">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto p-8 space-y-8 pb-32">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-primary/5">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <LayoutPanelTop size={20} className="text-[#FF4B91]" />
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Practice Builder</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">Assignment Factory</h1>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
                                Domain • Topic • Tier • Self-check only
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 text-right">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                <Sparkles size={14} className="text-[#FF4B91]" />
                                Practice only
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6 relative group h-full min-h-[420px]">
                            <ContextSelector
                                selections={selections}
                                onChange={(field, value) => setSelections((prev) => ({ ...prev, [field]: value }))}
                            />
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6 h-full">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    2. Difficulty Tier
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DIFFICULTIES.map((option) => {
                                    const active = difficulty === option.key;
                                    return (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setDifficulty(option.key)}
                                            className={cn(
                                                'rounded-[1.75rem] border p-5 text-left transition-all',
                                                active
                                                    ? 'border-[#FF4B91] bg-[#FF4B91]/5 shadow-lg shadow-[#FF4B91]/10'
                                                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className={cn('text-sm font-black uppercase tracking-widest', active ? 'text-[#FF4B91]' : 'text-[#1A1A1A]')}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{option.description}</p>
                                                </div>
                                                {active ? <Check size={18} className="text-[#FF4B91]" /> : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col gap-6 min-h-[520px]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">3. Prompt Workspace</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                        Generate the external AI prompt with tier-specific rules and self-check references.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { void generatePrompt(); }}
                                    className="h-12 px-6 rounded-2xl bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-[#FF4B91]/20 flex items-center gap-3"
                                >
                                    <FileJson size={16} />
                                    Generate Prompt
                                </button>
                            </div>

                            <textarea
                                value={generatedPrompt}
                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                readOnly={generatedPrompt === ''}
                                placeholder={canGenerate ? 'Click Generate Prompt to create the assignment prompt...' : 'Select domain, subject, topic, and subtopic first.'}
                                className="flex-1 min-h-[420px] rounded-[2rem] border border-slate-200 bg-slate-50/70 p-6 text-sm font-mono text-slate-700 outline-none resize-none leading-6"
                            />

                            <div className="flex items-center justify-between gap-4">
                                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400">
                                    Prompt includes JSON shape, tier counts, and self-check rules.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { void copyPrompt(); }}
                                    disabled={generatedPrompt.trim() === ''}
                                    className={cn(
                                        'h-11 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all',
                                        generatedPrompt.trim() === ''
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                    )}
                                >
                                    {isCopying ? <Check size={14} /> : <Copy size={14} />}
                                    {isCopying ? 'Copied' : 'Copy Prompt'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex flex-col gap-6 min-h-[520px]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">4. JSON Ingest</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                        Paste the external AI response and validate it before preview and publish.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { void ingestJson(); }}
                                    className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-slate-900/15 flex items-center gap-3"
                                >
                                    <Upload size={16} />
                                    Validate JSON
                                </button>
                            </div>

                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                placeholder='Paste {"assignments":[...]} JSON here'
                                className="flex-1 min-h-[280px] rounded-[2rem] border border-slate-200 bg-slate-50/70 p-6 text-sm font-mono text-slate-700 outline-none resize-none leading-6"
                                spellCheck={false}
                            />

                            {validationErrors.length > 0 ? (
                                <div className="rounded-[1.75rem] border border-rose-100 bg-rose-50/60 p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Validation Errors</p>
                                    <ul className="space-y-1 text-xs text-rose-600">
                                        {validationErrors.map((error) => (
                                            <li key={error}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        5. Assignment Preview
                                    </h3>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mt-2">
                                    Reference answers are stored for self-check only. No scoring or pass/fail logic.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    'px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.18em]',
                                    publishState === 'published'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                                )}>
                                    {publishState === 'published' ? 'Published' : 'Draft'}
                                </span>
                                {draftSavedAt !== null ? (
                                    <span className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.18em] bg-slate-50 text-slate-500 border border-slate-200">
                                        Saved {new Date(draftSavedAt).toLocaleString()}
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        {assignmentPreview.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
                                <PencilLine className="mx-auto text-slate-300" size={40} />
                                <h4 className="mt-4 text-sm font-black uppercase tracking-widest text-[#1A1A1A]">No Preview Yet</h4>
                                <p className="mt-2 text-sm text-slate-500">
                                    Validate the pasted JSON to render preview cards for each assignment.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {assignmentPreview.map((assignment, index) => (
                                    <div key={`${assignment.question}-${index}`} className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="px-3 py-1 rounded-full bg-[#FF4B91]/10 text-[#FF4B91] text-[10px] font-black uppercase tracking-[0.18em]">
                                                {assignment.question_type}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-[#1A1A1A] leading-6">{assignment.question}</p>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Hints</p>
                                            <ul className="list-disc pl-4 text-sm text-slate-600 space-y-1">
                                                {assignment.hints.length > 0 ? assignment.hints.map((hint) => (
                                                    <li key={hint}>{hint}</li>
                                                )) : <li>No hints provided.</li>}
                                            </ul>
                                        </div>
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Reference Answer</p>
                                            <p className="mt-2 text-sm text-emerald-900/80">{assignment.reference_answer}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sticky bottom-0 z-30 flex justify-center pt-8 pointer-events-none">
                        <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 w-full px-12 pointer-events-auto mb-4">
                            <div className="w-full flex justify-center">
                                <h4 className="text-xs font-black uppercase text-[#FF4B91] tracking-widest leading-none">Assignment Phase</h4>
                            </div>

                            <div className="w-full h-12 grid grid-cols-[1fr_auto_1fr] items-center">
                                <div />
                                <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { void generatePrompt(); }}
                                        className="h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all shadow-sm"
                                    >
                                        Generate Prompt
                                    </button>

                                    <button
                                        type="button"
                                        onClick={saveDraft}
                                        className="h-12 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all shadow-sm"
                                    >
                                        Save Draft
                                    </button>

                                    <button
                                        type="button"
                                        onClick={publishAssignments}
                                        className="h-12 px-10 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white shadow-xl shadow-[#FF4B91]/30 active:scale-[0.98]"
                                    >
                                        <Check size={18} />
                                        <span className="whitespace-nowrap">Publish Assignments</span>
                                    </button>
                                </div>
                                <div />
                            </div>

                            <div className="w-full flex justify-end">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    Practice only. Reference answers remain self-check only.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FactoryLayout>
    );
}
