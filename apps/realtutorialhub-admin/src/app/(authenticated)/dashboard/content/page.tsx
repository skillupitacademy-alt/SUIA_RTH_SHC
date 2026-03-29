'use client';

import { type TutorialContentJSON, TutorialContentSchema } from '@quiz/types';
import {
    AlertCircle,
    Bookmark,
    BookOpenText,
    Box,
    Check,
    Copy,
    Eye,
    FileJson2,
    Layers3,
    PencilLine,
    Save,
    Sparkles,
    Target,
    Upload,
    WandSparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';

import { BlockEditor } from '@/components/admin/BlockEditor';
import { SelectField } from '@/components/entry/SelectionFields';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { useDomains, useSubjects, useSubtopics, useTopics } from '@/hooks/useAdminHierarchy';
import { JsonValidator } from '@/lib/factory/json-validator';
import { TutorialPromptService } from '@/lib/factory/prompt-service';
import { cn } from '@/lib/utils';
import { useTutorialFactoryStore } from '@/store/tutorial-factory-store';

type ContentDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';
type PublishState = 'draft' | 'published';
type BlockKey = keyof TutorialContentJSON;

type ContextSelection = {
    domainId: string;
    subjectId: string;
    topicId: string;
    subtopicId: string;
};

type ValidationState = {
    parsedContent: TutorialContentJSON | null;
    isValid: boolean;
    errors: string[];
};

type BlockStatus = 'published' | 'draft' | 'missing';

type ContentPayload = {
    subtopicId: string;
    difficulty: ContentDifficulty;
    content: TutorialContentJSON;
    language: string;
    isPublished: boolean;
    generatedByAi: boolean;
};

const DIFFICULTIES: Array<{ key: ContentDifficulty; label: string; description: string }> = [
    { key: 'simple', label: 'Simple', description: 'Friendly, concise, first-pass review' },
    { key: 'mixed', label: 'Mixed', description: 'Balanced depth with practical detail' },
    { key: 'intermediate', label: 'Intermediate', description: 'Deeper mechanics and edge cases' },
    { key: 'expert', label: 'Expert', description: 'Architecture, tradeoffs, and precision' },
];

const BLOCK_DEFINITIONS: Array<{ key: BlockKey; label: string; description: string }> = [
    { key: 'notes', label: 'Notes', description: 'Teacher notes and overview' },
    { key: 'layman', label: 'Layman', description: 'Relatable explanations and analogies' },
    { key: 'real_life', label: 'Real Life', description: 'Practical scenario and workflow' },
    { key: 'technical', label: 'Technical', description: 'Definitions and precise mechanics' },
    { key: 'code', label: 'Code', description: 'Runnable example and steps' },
    { key: 'ai_tutor', label: 'AI Tutor', description: 'Conversational guidance and QA' },
];

const DEFAULT_CONTENT: TutorialContentJSON = {
    notes: {
        markdown:
            'Promises represent the eventual result of an asynchronous operation. They allow code to stay readable while waiting for work that finishes later, such as network calls, timers, or queued tasks.',
        image: null,
    },
    layman: {
        simpleExplanation:
            'A promise is like ordering food at a restaurant. You get a receipt now, but the meal arrives later. The receipt means the restaurant has committed to give you the result.',
        analogyOrStory:
            'Think of a taxi booking: the app confirms the ride request immediately, then updates you when a driver accepts and arrives.',
        example1: {
            company: 'Uber',
            content: 'A rider books a cab, and the app confirms the request before the driver is assigned.',
        },
        example2: {
            company: 'Zomato',
            content: 'A food order is accepted instantly while the restaurant prepares the meal in the background.',
        },
        image: null,
    },
    real_life: {
        title: 'Ordering food through an app',
        scenario:
            'The app accepts the order immediately, the kitchen works in the background, and the rider delivers later. The user sees progress without the app freezing.',
        bullets: [
            { label: 'Order placed', detail: 'The request is confirmed right away.' },
            { label: 'Preparation', detail: 'The backend works while the UI stays responsive.' },
            { label: 'Delivery', detail: 'The final result is returned when work is done.' },
        ],
        tip: 'Use promises when a result arrives later but the app should stay responsive.',
        image: null,
    },
    technical: {
        markdown:
            'A promise is an object that represents the eventual completion or failure of an asynchronous operation. It can be pending, fulfilled, or rejected. Async and await are built on top of promises.',
        bullets: [
            { term: 'Pending', detail: 'The task has started but not finished yet.' },
            { term: 'Fulfilled', detail: 'The task completed successfully with a value.' },
            { term: 'Rejected', detail: 'The task failed with an error reason.' },
        ],
        tip: 'Use catch for shared error handling and await for readable control flow.',
        image: null,
    },
    code: {
        language: 'javascript',
        intro: 'This example shows a promise resolving and an async function awaiting it.',
        code:
            "function fetchOrderStatus() {\n  return new Promise((resolve) => {\n    setTimeout(() => resolve('Delivered'), 500);\n  });\n}\n\nasync function showStatus() {\n  const status = await fetchOrderStatus();\n  console.log(status);\n}\n\nshowStatus();",
        steps: [
            'Create a promise that resolves after a small delay.',
            'Await the promise inside an async function.',
            'Use the resolved value once it becomes available.',
        ],
        image: null,
    },
    ai_tutor: {
        greeting: 'Let us review how promises work in JavaScript.',
        qa_pairs: [
            { question: 'What problem do promises solve?', answer: 'They let JavaScript handle results that arrive later without freezing the app.' },
            { question: 'What is the difference between fulfilled and rejected?', answer: 'Fulfilled means success, rejected means the task failed.' },
            { question: 'Why use async and await?', answer: 'They make promise-based code easier to read while keeping the same async behavior.' },
        ],
    },
};

function titleCaseStatus(status: BlockStatus) {
    return status === 'published' ? 'Published' : status === 'draft' ? 'Draft' : 'Missing';
}

function toIssueLabel(issue: { path: (string | number)[]; message: string }) {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
    return `${path}: ${issue.message}`;
}

type ContentFactoryPageProps = {
    embedded?: boolean;
};

export default function ContentFactoryPage({ embedded = false }: ContentFactoryPageProps = {}) {
    const selection = useTutorialFactoryStore(
        useShallow((state) => ({
            domainId: state.selection.domainId,
            subjectId: state.selection.subjectId,
            topicId: state.selection.topicId,
            subtopicId: state.selection.subtopicId,
        }))
    );
    const difficulty = useTutorialFactoryStore((state) => state.selection.difficulty);
    const setFactorySelection = useTutorialFactoryStore((state) => state.setSelection);
    const [sourceMaterial, setSourceMaterial] = useState(
        'Source material is optional. Paste syllabus notes, a textbook excerpt, or working notes here.'
    );
    const [rawJson, setRawJson] = useState(() => JSON.stringify(DEFAULT_CONTENT, null, 2));
    const [publishState, setPublishState] = useState<PublishState>('draft');
    const [savedContentId, setSavedContentId] = useState<string | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<BlockKey | null>(null);
    const [promptText, setPromptText] = useState('');
    const [lastValidatedAt, setLastValidatedAt] = useState<string | null>(null);

    const { data: domains, loading: loadingDomains } = useDomains();
    const { data: subjects, loading: loadingSubjects } = useSubjects(selection.domainId !== '' ? selection.domainId : undefined);
    const { data: topics, loading: loadingTopics } = useTopics(selection.subjectId !== '' ? selection.subjectId : undefined);
    const { data: subtopics, loading: loadingSubtopics } = useSubtopics(selection.topicId !== '' ? selection.topicId : undefined);

    const resolvedContext = useMemo(() => {
        const domainName = domains.find((item) => item.id === selection.domainId)?.name ?? 'Selected Domain';
        const subjectName = subjects.find((item) => item.id === selection.subjectId)?.name ?? 'Selected Subject';
        const topicName = topics.find((item) => item.id === selection.topicId)?.name ?? 'Selected Topic';
        const subtopicName = subtopics.find((item) => item.id === selection.subtopicId)?.name ?? 'Selected Subtopic';
        return { domainName, subjectName, topicName, subtopicName };
    }, [domains, selection.domainId, selection.subjectId, selection.topicId, selection.subtopicId, subjects, subtopics, topics]);

    const resolvedDomainSlug = useMemo(() => {
        return domains.find((item) => item.id === selection.domainId)?.slug ?? 'full-stack';
    }, [domains, selection.domainId]);

    const validation = useMemo<ValidationState>(() => {
        if (rawJson.trim() === '') {
            return {
                parsedContent: null,
                isValid: false,
                errors: ['Paste AI-generated JSON before validating.'],
            };
        }

        try {
            const { cleaned } = JsonValidator.cleanJson(rawJson);
            const parsed = JSON.parse(cleaned) as unknown;
            const result = TutorialContentSchema.safeParse(parsed);
            if (result.success) {
                return {
                    parsedContent: result.data,
                    isValid: true,
                    errors: [],
                };
            }

            return {
                parsedContent: null,
                isValid: false,
                errors: result.error.issues.map(toIssueLabel),
            };
        } catch (error) {
            return {
                parsedContent: null,
                isValid: false,
                errors: [error instanceof Error ? error.message : 'Invalid JSON payload.'],
            };
        }
    }, [rawJson]);

    const lineNumbers = useMemo(() => {
        const count = Math.max(rawJson.split(/\r?\n/).length, 1);
        return Array.from({ length: count }, (_, index) => index + 1);
    }, [rawJson]);

    const previewContent = validation.parsedContent;
    const activeContent = previewContent ?? DEFAULT_CONTENT;
    const selectionComplete = selection.domainId !== '' && selection.subjectId !== '' && selection.topicId !== '' && selection.subtopicId !== '';
    const canPersist = selectionComplete && validation.isValid && validation.parsedContent !== null;

    const blockStatus = (key: BlockKey): BlockStatus => {
        if (validation.parsedContent == null || validation.parsedContent[key] == null) {
            return 'missing';
        }
        return publishState === 'published' ? 'published' : 'draft';
    };

    const validateNow = () => {
        if (validation.isValid) {
            toast.success('Content JSON validated successfully.');
        } else {
            toast.error('Content JSON still has validation issues.');
        }
        setLastValidatedAt(new Date().toISOString());
    };

    const buildPrompt = () => {
        const basePrompt = TutorialPromptService.generateContentPrompt({
            context: resolvedContext,
            difficulty,
        });

        const sourceSection = sourceMaterial.trim() === ''
            ? ''
            : `\n\nREFERENCE MATERIAL:\n${sourceMaterial.trim()}`;

        return `${basePrompt}${sourceSection}`.trim();
    };

    const generatePrompt = async () => {
        if (selectionComplete === false) {
            toast.error('Select domain, subject, topic, subtopic, and difficulty first.');
            return;
        }

        const prompt = buildPrompt();
        setPromptText(prompt);
        setIsPromptModalOpen(true);

        try {
            await navigator.clipboard.writeText(prompt);
            toast.success('Prompt copied to clipboard.');
        } catch {
            toast.error('Prompt generated, but clipboard copy failed.');
        }
    };

    const updateSelection = (field: keyof ContextSelection, value: string) => {
        const next: Partial<ContextSelection> = { [field]: value } as Partial<ContextSelection>;
        if (field === 'domainId') {
            next.subjectId = '';
            next.topicId = '';
            next.subtopicId = '';
        }
        if (field === 'subjectId') {
            next.topicId = '';
            next.subtopicId = '';
        }
        if (field === 'topicId') {
            next.subtopicId = '';
        }
        setFactorySelection(next);
        setSavedContentId(null);
        setPublishState('draft');
    };

    const updateDifficulty = (nextDifficulty: ContentDifficulty) => {
        setFactorySelection({ difficulty: nextDifficulty });
        setSavedContentId(null);
        setPublishState('draft');
    };

    const updateRawJson = (value: string) => {
        setRawJson(value);
        setPublishState('draft');
    };

    const persistContent = async (shouldPublish: boolean) => {
        if (selectionComplete === false) {
            toast.error('Select the full target context first.');
            return;
        }
        if (validation.parsedContent == null || validation.isValid === false) {
            toast.error('Fix JSON validation errors before saving.');
            return;
        }

        const payload: ContentPayload = {
            subtopicId: selection.subtopicId,
            difficulty,
            content: validation.parsedContent,
            language: 'en',
            isPublished: false,
            generatedByAi: true,
        };

        const hasExistingContent = savedContentId !== null;

        setIsSavingDraft(true);
        try {
            const saveResponse = await fetch(hasExistingContent ? `/api/tutorial/content/${savedContentId}` : '/api/tutorial/content', {
                method: hasExistingContent ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const savePayload = await saveResponse.json().catch(() => null) as { data?: { id?: string }; error?: string } | null;
            if (saveResponse.ok === false) {
                throw new Error(savePayload?.error ?? 'Failed to save tutorial content.');
            }

            const contentId = savePayload?.data?.id ?? savedContentId;
            if (contentId == null) {
                throw new Error('Tutorial content id missing after save.');
            }
            setSavedContentId(contentId);

            if (shouldPublish === true) {
                setIsPublishing(true);
                try {
                    const publishResponse = await fetch(`/api/tutorial/content/${contentId}/publish`, {
                        method: 'POST',
                    });
                    const publishPayload = await publishResponse.json().catch(() => null) as { error?: string } | null;
                    if (publishResponse.ok === false) {
                        throw new Error(publishPayload?.error ?? 'Failed to publish tutorial content.');
                    }

                    setPublishState('published');
                    toast.success('Tutorial content published.');
                } finally {
                    setIsPublishing(false);
                }
            } else {
                setPublishState('draft');
                toast.success(hasExistingContent ? 'Draft updated.' : 'Draft saved.');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save tutorial content.');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const _body = (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
            <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/70">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <WandSparkles size={20} className="text-[#FF4B91]" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Canonical Content Builder</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-[#1A1A1A]">Content Factory</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                Domain • Subject • Topic • Subtopic • Difficulty
              </p>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-right">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                            <Sparkles size={14} className="text-[#FF4B91]" />
                            QBF-aligned content flow
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                            <Eye size={14} className={publishState === 'published' ? 'text-emerald-500' : 'text-amber-500'} />
                            {publishState === 'published' ? 'Published' : 'Draft workspace'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6 h-full">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                1. Target Context
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <SelectField
                                label="Domain"
                                value={selection.domainId}
                                onChange={(value) => updateSelection('domainId', value)}
                                options={domains}
                                loading={loadingDomains}
                                placeholder="Select Domain"
                                active={selection.domainId !== ''}
                                icon={<Layers3 className="w-3 h-3" />}
                                hideCreate={true}
                            />
                            <SelectField
                                label="Subject"
                                value={selection.subjectId}
                                onChange={(value) => updateSelection('subjectId', value)}
                                options={subjects}
                                loading={loadingSubjects}
                                disabled={selection.domainId === ''}
                                placeholder="Select Subject"
                                active={selection.domainId !== ''}
                                icon={<Box className="w-3 h-3" />}
                                hideCreate={true}
                            />
                            <SelectField
                                label="Topic"
                                value={selection.topicId}
                                onChange={(value) => updateSelection('topicId', value)}
                                options={topics}
                                loading={loadingTopics}
                                disabled={selection.subjectId === ''}
                                placeholder="Select Topic"
                                active={selection.subjectId !== ''}
                                icon={<BookOpenText className="w-3 h-3" />}
                                hideCreate={true}
                            />
                            <SelectField
                                label="Subtopic"
                                value={selection.subtopicId}
                                onChange={(value) => updateSelection('subtopicId', value)}
                                options={subtopics}
                                loading={loadingSubtopics}
                                disabled={selection.topicId === ''}
                                placeholder="Select Subtopic"
                                active={selection.topicId !== ''}
                                icon={<Target className="w-3 h-3" />}
                                hideCreate={true}
                            />
                        </div>

                        {selectionComplete === false ? (
                            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-amber-700">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <AlertCircle size={14} />
                                    Context incomplete
                                </div>
                                <p className="mt-2 text-sm">
                                    Select Domain, Subject, Topic, Subtopic, and Difficulty before generating prompts.
                                </p>
                            </div>
                        ) : null}
                    </section>
                    {/* truncated */}
                </div>
            </div>
        </div>
    );

    return (
        <FactoryLayout title="Tutorial Content Factory" subtitle="Unified content workspace" backPath="/dashboard">
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <div className="max-w-[1600px] mx-auto p-8 space-y-8 pb-32">
                    {!embedded && (
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200/70">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <WandSparkles size={20} className="text-[#FF4B91]" />
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Canonical Content Builder</span>
                            </div>
                            <PageTitle text="Content Factory" />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">
                                Domain • Subject • Topic • Subtopic • Difficulty
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 text-right">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                <Sparkles size={14} className="text-[#FF4B91]" />
                                QBF-aligned content flow
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                <Eye size={14} className={publishState === 'published' ? 'text-emerald-500' : 'text-amber-500'} />
                                {publishState === 'published' ? 'Published' : 'Draft workspace'}
                            </div>
                        </div>
                    </div>
                )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6 h-full">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    1. Target Context
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <SelectField
                                    label="Domain"
                                    value={selection.domainId}
                                    onChange={(value) => updateSelection('domainId', value)}
                                    options={domains}
                                    loading={loadingDomains}
                                    placeholder="Select Domain"
                                    active={selection.domainId !== ''}
                                    icon={<Layers3 className="w-3 h-3" />}
                                    hideCreate={true}
                                />
                                <SelectField
                                    label="Subject"
                                    value={selection.subjectId}
                                    onChange={(value) => updateSelection('subjectId', value)}
                                    options={subjects}
                                    loading={loadingSubjects}
                                    disabled={selection.domainId === ''}
                                    placeholder="Select Subject"
                                    active={selection.subjectId !== ''}
                                    icon={<Box className="w-3 h-3" />}
                                    hideCreate={true}
                                />
                                <SelectField
                                    label="Topic"
                                    value={selection.topicId}
                                    onChange={(value) => updateSelection('topicId', value)}
                                    options={topics}
                                    loading={loadingTopics}
                                    disabled={selection.subjectId === ''}
                                    placeholder="Select Topic"
                                    active={selection.topicId !== ''}
                                    icon={<Bookmark className="w-3 h-3" />}
                                    hideCreate={true}
                                />
                                <SelectField
                                    label="Subtopic"
                                    value={selection.subtopicId}
                                    onChange={(value) => updateSelection('subtopicId', value)}
                                    options={subtopics}
                                    loading={loadingSubtopics}
                                    disabled={selection.topicId === ''}
                                    placeholder="Select Subtopic"
                                    active={selection.subtopicId !== ''}
                                    icon={<Target className="w-3 h-3" />}
                                    hideCreate={true}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {DIFFICULTIES.map((item) => {
                                    const active = difficulty === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => updateDifficulty(item.key)}
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
                                                        {item.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{item.description}</p>
                                                </div>
                                                {active ? <Check size={18} className="text-[#FF4B91]" /> : null}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectionComplete === false ? (
                                <div className="flex items-center gap-3 text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50/80 p-4 rounded-2xl border border-amber-100/70">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Select Domain {'>'} Subject {'>'} Topic {'>'} Subtopic {'>'} Difficulty to unlock prompt generation.
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100/70">
                                    <Check className="w-4 h-4 shrink-0" />
                                    Context calibrated and ready for prompt generation.
                                </div>
                            )}
                        </section>

                        <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6 h-full">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    2. Block Status
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {BLOCK_DEFINITIONS.map((block) => {
                                    const status = blockStatus(block.key);
                                    const statusTone = status === 'published'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : status === 'draft'
                                            ? 'bg-[#FF4B91]/5 text-[#FF4B91] border-[#FF4B91]/15'
                                            : 'bg-slate-50 text-slate-400 border-slate-200';

                                    return (
                                        <div key={block.key} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">{block.label}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{block.description}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border', statusTone)}>
                                                        {titleCaseStatus(status)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingBlock(block.key)}
                                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 hover:border-[#FF4B91]/30 hover:text-[#FF4B91] transition-colors"
                                                    >
                                                        <PencilLine size={12} />
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <BookOpenText size={14} className="text-[#FF4B91]" />
                                    Requirement
                                </div>
                                <p className="mt-3 text-sm text-slate-600 leading-7">
                                    All 6 blocks are mandatory before publish is allowed. Missing blocks are shown in grey, draft blocks in pink, and published blocks in green.
                                </p>
                            </div>
                        </section>
                    </div>
                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                3. Source Material
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
                            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-4">
                                <textarea
                                    value={sourceMaterial}
                                    onChange={(event) => {
                                        setSourceMaterial(event.target.value);
                                        setPublishState('draft');
                                    }}
                                    placeholder="Paste syllabus notes, lesson plan text, code samples, or textbook excerpts here."
                                    className="w-full min-h-[220px] resize-y rounded-[1.25rem] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 shadow-sm outline-none transition focus:border-[#FF4B91] focus:ring-4 focus:ring-[#FF4B91]/10"
                                />
                            </div>

                            <div className="rounded-[1.75rem] border border-slate-200 bg-[#FF4B91]/5 p-5 h-full">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B91]">
                                    <FileJson2 size={14} />
                                    Prompt notes
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    Source material is optional. If present, it is appended to the generated content prompt so the AI copy/paste workflow has the latest reference material.
                                </p>
                                <div className="mt-5 rounded-2xl border border-[#FF4B91]/15 bg-white p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last validation</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-700">
                                        {lastValidatedAt != null ? new Date(lastValidatedAt).toLocaleString() : 'Not validated yet'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col gap-8">
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-1 bg-[#FF4B91] rounded-full" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                4. Content Editor
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-5 flex flex-col gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <WandSparkles size={14} className="text-[#FF4B91]" />
                                    Prompt generation
                                </div>
                                <p className="text-sm leading-7 text-slate-600">
                                    Generate a copy-ready prompt that embeds the locked content schema and the selected tutorial context.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { void generatePrompt(); }}
                                    disabled={selectionComplete === false}
                                    className={cn(
                                        'mt-auto h-12 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[11px] transition-all',
                                        selectionComplete === false
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            : 'bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white shadow-xl shadow-[#FF4B91]/30 active:scale-[0.98]'
                                    )}
                                >
                                    <Copy size={18} />
                                    <span>Generate Prompt</span>
                                </button>
                            </div>

                            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-5 xl:col-span-2 flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <PencilLine size={14} className="text-[#FF4B91]" />
                                        JSON payload editor
                                    </div>
                                    <button
                                        type="button"
                                        onClick={validateNow}
                                        className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Process & Review
                                    </button>
                                </div>

                                <div className="grid grid-cols-[72px_minmax(0,1fr)] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                                    <div className="bg-slate-50 border-r border-slate-200 px-3 py-4 font-mono text-[11px] leading-6 text-slate-400 select-none">
                                        {lineNumbers.map((lineNumber) => (
                                            <div key={lineNumber} className="text-right pr-1">
                                                {lineNumber}
                                            </div>
                                        ))}
                                    </div>
                                    <textarea
                                        value={rawJson}
                                        onChange={(event) => {
                                            updateRawJson(event.target.value);
                                        }}
                                        placeholder="Paste AI-generated tutorial content JSON here."
                                        className="min-h-[420px] w-full resize-y bg-white px-5 py-4 font-mono text-[12px] leading-6 text-slate-800 outline-none"
                                        spellCheck={false}
                                    />
                                </div>

                                {validation.errors.length > 0 ? (
                                    <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-5">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                                            <AlertCircle size={14} />
                                            Field-level validation errors
                                        </div>
                                        <ul className="mt-4 space-y-2 text-sm text-rose-700">
                                            {validation.errors.map((issue) => (
                                                <li key={issue} className="flex gap-2">
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                                    <span>{issue}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                                            <Check size={14} />
                                            Validation passed
                                        </div>
                                        <p className="mt-2 text-sm">
                                            The JSON payload currently matches the locked tutorial content schema.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/50 p-5">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <Eye size={14} className="text-[#FF4B91]" />
                                        Preview + publish
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600 leading-7">
                                        Review the 6 blocks below before saving a draft or publishing the content.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { void persistContent(false); }}
                                        disabled={canPersist === false || isSavingDraft === true}
                                        className={cn(
                                            'h-11 px-5 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all',
                                            canPersist === false || isSavingDraft === true
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                                        )}
                                    >
                                        <Save size={16} />
                                        <span>{isSavingDraft === true ? 'Saving...' : 'Save Draft'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { void persistContent(true); }}
                                        disabled={canPersist === false || isSavingDraft === true || isPublishing === true}
                                        className={cn(
                                            'h-11 px-5 rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px] transition-all',
                                            canPersist === false || isSavingDraft === true || isPublishing === true
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : 'bg-[#FF4B91] hover:bg-[#FF4B91]/90 text-white shadow-xl shadow-[#FF4B91]/25 active:scale-[0.98]'
                                        )}
                                    >
                                        <Upload size={16} />
                                        <span>{isPublishing === true ? 'Publishing...' : 'Publish'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {BLOCK_DEFINITIONS.map((block) => {
                                    const status = blockStatus(block.key);
                                    const data = previewContent?.[block.key] as unknown;

                                    return (
                                        <article
                                            key={block.key}
                                            className={cn(
                                                'rounded-[1.5rem] border p-5 shadow-sm',
                                                status === 'published'
                                                    ? 'border-emerald-200 bg-emerald-50/70'
                                                    : status === 'draft'
                                                        ? 'border-[#FF4B91]/15 bg-[#FF4B91]/5'
                                                        : 'border-slate-200 bg-white'
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">{block.label}</h4>
                                                <span
                                                    className={cn(
                                                        'text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border',
                                                        status === 'published'
                                                            ? 'text-emerald-600 border-emerald-200 bg-white'
                                                            : status === 'draft'
                                                                ? 'text-[#FF4B91] border-[#FF4B91]/20 bg-white'
                                                                : 'text-slate-400 border-slate-200 bg-white'
                                                    )}
                                                >
                                                    {titleCaseStatus(status)}
                                                </span>
                                            </div>

                                            <p className="mt-3 text-xs text-slate-500 leading-6">
                                                {block.description}
                                            </p>

                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                                {block.key === 'notes' && typeof data === 'object' && data != null ? (
                                                    <p className="text-sm text-slate-700 leading-7">
                                                        {(data as TutorialContentJSON['notes']).markdown.slice(0, 140)}
                                                        {(data as TutorialContentJSON['notes']).markdown.length > 140 ? '...' : ''}
                                                    </p>
                                                ) : null}

                                                {block.key === 'layman' && typeof data === 'object' && data != null ? (
                                                    <div className="space-y-2 text-sm text-slate-700">
                                                        <p className="font-semibold">{(data as TutorialContentJSON['layman']).simpleExplanation.slice(0, 120)}...</p>
                                                        <p className="text-slate-500">
                                                            {(data as TutorialContentJSON['layman']).example1.company} / {(data as TutorialContentJSON['layman']).example2.company}
                                                        </p>
                                                    </div>
                                                ) : null}

                                                {block.key === 'real_life' && typeof data === 'object' && data != null ? (
                                                    <div className="space-y-2 text-sm text-slate-700">
                                                        <p className="font-semibold">{(data as TutorialContentJSON['real_life']).title}</p>
                                                        <p className="text-slate-500">{(data as TutorialContentJSON['real_life']).bullets[0]?.label ?? 'Workflow'}</p>
                                                    </div>
                                                ) : null}

                                                {block.key === 'technical' && typeof data === 'object' && data != null ? (
                                                    <div className="space-y-2 text-sm text-slate-700">
                                                        <p className="font-semibold">{(data as TutorialContentJSON['technical']).bullets.length} technical bullets</p>
                                                        <p className="text-slate-500">{(data as TutorialContentJSON['technical']).tip}</p>
                                                    </div>
                                                ) : null}

                                                {block.key === 'code' && typeof data === 'object' && data != null ? (
                                                    <div className="space-y-2 text-sm text-slate-700">
                                                        <p className="font-semibold">{(data as TutorialContentJSON['code']).language.toUpperCase()}</p>
                                                        <p className="text-slate-500">{(data as TutorialContentJSON['code']).steps.length} guided steps</p>
                                                    </div>
                                                ) : null}

                                                {block.key === 'ai_tutor' && typeof data === 'object' && data != null ? (
                                                    <div className="space-y-2 text-sm text-slate-700">
                                                        <p className="font-semibold">{(data as TutorialContentJSON['ai_tutor']).greeting}</p>
                                                        <p className="text-slate-500">{(data as TutorialContentJSON['ai_tutor']).qa_pairs.length} tutor prompts</p>
                                                    </div>
                                                ) : null}

                                                {status === 'missing' ? (
                                                    <p className="text-sm text-slate-400 leading-7">
                                                        This block is not present in the current payload.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                    {isPromptModalOpen === true ? (
                        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4">
                            <div className="w-full max-w-4xl rounded-[2rem] bg-white border border-slate-200 shadow-2xl overflow-hidden">
                                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B91]">Prompt Ready</p>
                                        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1A1A1A]">Content Factory prompt</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsPromptModalOpen(false)}
                                        className="h-10 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <textarea
                                        value={promptText}
                                        readOnly
                                        className="w-full min-h-[420px] resize-y rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 font-mono text-[12px] leading-6 text-slate-700 outline-none"
                                    />

                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-xs font-medium text-slate-500">
                                            The prompt is already copied to your clipboard.
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    void navigator.clipboard.writeText(promptText);
                                                    toast.success('Prompt copied again.');
                                                }}
                                                className="h-11 px-5 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                <Copy size={16} className="inline-block mr-2" />
                                                Copy Again
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsPromptModalOpen(false)}
                                                className="h-11 px-5 rounded-2xl bg-[#FF4B91] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF4B91]/90 transition-all shadow-xl shadow-[#FF4B91]/20"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {editingBlock != null ? (
                        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
                            <div className="mx-auto max-w-[1500px]">
                                <div className="mb-4 flex items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-4 shadow-xl">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#FF4B91]">Block editor</p>
                                        <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-[#1A1A1A]">
                                            {BLOCK_DEFINITIONS.find((block) => block.key === editingBlock)?.label ?? 'Content'} editor
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEditingBlock(null)}
                                        className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>

                                <BlockEditor
                                    initialContent={activeContent}
                                    initialActiveBlock={editingBlock}
                                    subtopicName={resolvedContext.subtopicName}
                                    domainName={resolvedContext.domainName}
                                    domainSlug={resolvedDomainSlug}
                                />
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </FactoryLayout>
    );
}
