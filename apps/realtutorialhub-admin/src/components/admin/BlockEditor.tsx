'use client';

import { type ContentBlockType, type ContentImage, type TutorialContentJSON,TutorialContentSchema } from '@quiz/types';
import { CheckCircle2, ChevronDown, ChevronRight, ImagePlus, Plus, Save, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { ContentVersionEntry, ContentVersionHistory } from './ContentVersionHistory';

export type { ContentVersionEntry } from './ContentVersionHistory';

interface BlockEditorProps {
    initialContent: TutorialContentJSON;
    initialVersions?: ContentVersionEntry[];
    subtopicName?: string;
    domainName?: string;
    domainSlug?: string;
    initialActiveBlock?: ContentBlockType;
}

interface StatusState {
    tone: 'neutral' | 'success' | 'warning' | 'error';
    text: string;
}

const BLOCK_ORDER: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

const BLOCK_LABELS: Record<ContentBlockType, string> = {
    notes: 'Notes',
    layman: 'Layman',
    real_life: 'Real Life',
    technical: 'Technical',
    code: 'Code',
    ai_tutor: 'AI Tutor',
};

const BLOCK_HELPERS: Record<ContentBlockType, string> = {
    notes: 'Short reference notes that help the learner orient quickly.',
    layman: 'Beginner-first explanation with examples and a relatable story.',
    real_life: 'Scenario-driven framing that maps the idea to a real-world workflow.',
    technical: 'Precise explanation with terminology, bullets, and a practical tip.',
    code: 'Executable example with steps and a short outcome note.',
    ai_tutor: 'Chat-ready prompts and answers for follow-up learning.',
};

const SVG_KEYS_BY_DOMAIN: Record<string, Array<{ key: string; label: string }>> = {
    'full-stack': [
        { key: 'promise-chain', label: 'Promise Chain' },
        { key: 'async-await-flow', label: 'Async/Await Flow' },
        { key: 'event-loop', label: 'Event Loop' },
        { key: 'react-component-tree', label: 'React Component Tree' },
        { key: 'http-request-cycle', label: 'HTTP Request Cycle' },
        { key: 'css-box-model', label: 'CSS Box Model' },
        { key: 'git-branch-flow', label: 'Git Branch Flow' },
        { key: 'rest-api-diagram', label: 'REST API Diagram' },
    ],
};

const DEFAULT_IMAGE_BY_BLOCK: Record<Exclude<ContentBlockType, 'ai_tutor'>, ContentImage> = {
    notes: {
        type: 'svg_standard',
        svgKey: 'promise-chain',
        url: null,
        alt: 'Promise lifecycle diagram showing pending, fulfilled, and rejected states.',
        caption: 'Promise lifecycle',
        position: 'bottom',
        width: 200,
    },
    layman: {
        type: 'svg_standard',
        svgKey: 'promise-chain',
        url: null,
        alt: 'Promise state transitions showing pending moving to fulfilled or rejected.',
        caption: 'Promise lifecycle',
        position: 'right',
        width: 180,
    },
    real_life: {
        type: 'svg_standard',
        svgKey: 'async-await-flow',
        url: null,
        alt: 'Async await execution flow shown as a simple process diagram.',
        caption: null,
        position: 'right',
        width: 140,
    },
    technical: {
        type: 'svg_standard',
        svgKey: 'promise-chain',
        url: null,
        alt: 'Technical diagram of promise chaining with then and catch handlers.',
        caption: 'Promise chaining pattern',
        position: 'bottom',
        width: 600,
    },
    code: {
        type: 'svg_standard',
        svgKey: 'promise-chain',
        url: null,
        alt: 'Illustration used to explain the code result of a promise example.',
        caption: null,
        position: 'bottom',
        width: 600,
    },
};

function cloneContent(content: TutorialContentJSON): TutorialContentJSON {
    return JSON.parse(JSON.stringify(content)) as TutorialContentJSON;
}

function buildValidationErrors(content: TutorialContentJSON) {
    const parsed = TutorialContentSchema.safeParse(content);
    if (parsed.success) return {};

    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
        const key = issue.path.map((part) => String(part)).join('.');
        if (errors[key] == null) {
            errors[key] = issue.message;
        }
    }
    return errors;
}

function getPreviewSummary(content: TutorialContentJSON, block: ContentBlockType) {
    switch (block) {
        case 'notes':
            return content.notes.markdown.slice(0, 180);
        case 'layman':
            return content.layman.simpleExplanation.slice(0, 180);
        case 'real_life':
            return content.real_life.scenario.slice(0, 180);
        case 'technical':
            return content.technical.markdown.slice(0, 180);
        case 'code':
            return content.code.intro.slice(0, 180);
        case 'ai_tutor':
            return content.ai_tutor.greeting.slice(0, 180);
        default:
            return '';
    }
}

function ensureArrayItem<T>(items: T[], fallback: T): T[] {
    return items.length > 0 ? items : [fallback];
}

export function BlockEditor({
    initialContent,
    initialVersions,
    subtopicName = 'JavaScript Promises',
    domainName = 'Full Stack',
    domainSlug = 'full-stack',
    initialActiveBlock = 'layman',
}: BlockEditorProps) {
    const seededVersions = useMemo<ContentVersionEntry[]>(() => {
        if (initialVersions != null && initialVersions.length > 0) return initialVersions;

        const now = new Date();
        return [
            {
                id: 'seed-v1',
                version: 1,
                savedBy: 'Neon seed',
                savedAt: now.toISOString(),
                status: 'published',
                note: 'Imported from the seeded tutorial database.',
                content: cloneContent(initialContent),
            },
        ];
    }, [initialContent, initialVersions]);

    const [content, setContent] = useState<TutorialContentJSON>(cloneContent(initialContent));
    const [versions, setVersions] = useState<ContentVersionEntry[]>(seededVersions);
    const [activeBlock, setActiveBlock] = useState<ContentBlockType>(initialActiveBlock);
    const [status, setStatus] = useState<StatusState>({ tone: 'neutral', text: 'Ready for review.' });

    useEffect(() => {
        setContent(cloneContent(initialContent));
    }, [initialContent]);

    useEffect(() => {
        setVersions(seededVersions);
    }, [seededVersions]);

    const validationErrors = useMemo(() => buildValidationErrors(content), [content]);
    const isValid = Object.keys(validationErrors).length === 0;
    const publishReady = [
        content.notes.markdown,
        content.layman.simpleExplanation,
        content.real_life.scenario,
        content.technical.markdown,
        content.code.code,
        content.ai_tutor.greeting,
    ].every((value) => value.trim().length > 10) && content.ai_tutor.qa_pairs.length >= 3;
    const currentVersionId = versions[0]?.id ?? 'seed-v1';
    const currentVersion = versions[0];
    const svgOptions = SVG_KEYS_BY_DOMAIN[domainSlug] ?? SVG_KEYS_BY_DOMAIN['full-stack'];

    const updateContent = <K extends keyof TutorialContentJSON>(
        block: K,
        updater: (value: TutorialContentJSON[K]) => TutorialContentJSON[K],
    ) => {
        setContent((prev) => ({
            ...prev,
            [block]: updater(prev[block]),
        }));
    };

    const commitVersion = (statusType: 'draft' | 'published') => {
        if (!isValid) {
            setStatus({
                tone: 'error',
                text: 'Fix validation errors before saving this tutorial content.',
            });
            return;
        }

        const nextVersion = (versions[0]?.version ?? 0) + 1;
        const savedAt = new Date().toISOString();
        const snapshot = cloneContent(content);

        setVersions((prev) => [
            {
                id: crypto.randomUUID(),
                version: nextVersion,
                savedBy: 'Admin UI',
                savedAt,
                status: statusType,
                note: statusType === 'published'
                    ? 'Published locally and queued for indexing.'
                    : 'Saved locally as a draft snapshot.',
                content: snapshot,
            },
            ...prev,
        ]);

        setStatus({
            tone: 'success',
            text: statusType === 'published'
                ? 'Published locally. Vector indexing will be wired in the next backend step.'
                : 'Draft saved locally.',
        });

        setContent(snapshot);
    };

    const restoreVersion = (versionId: string) => {
        const version = versions.find((item) => item.id === versionId);
        if (version == null) return;

        const restored = version.content ?? initialVersions?.find((item) => item.id === versionId)?.content ?? content;
        setContent(cloneContent(restored));
        setActiveBlock('layman');
        setStatus({
            tone: 'warning',
            text: `Restored version ${version.version}. Review the fields before publishing again.`,
        });
    };

    const renderTextField = (
        label: string,
        value: string,
        onChange: (next: string) => void,
        errorPath?: string,
        rows = 4,
        placeholder?: string,
    ) => {
        const error = errorPath != null ? validationErrors[errorPath] : undefined;

        return (
            <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className={cn(
                        'w-full rounded-2xl border px-4 py-3 text-sm leading-6 outline-none transition-colors',
                        error != null ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-indigo-300'
                    )}
                />
                {error != null ? <span className="text-[11px] font-medium text-rose-600">{error}</span> : null}
            </label>
        );
    };

    const renderInputField = (
        label: string,
        value: string,
        onChange: (next: string) => void,
        errorPath?: string,
        placeholder?: string,
    ) => {
        const error = errorPath != null ? validationErrors[errorPath] : undefined;

        return (
            <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
                <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(
                        'h-11 rounded-2xl border px-4 text-sm outline-none transition-colors',
                        error != null ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white focus:border-indigo-300'
                    )}
                />
                {error != null ? <span className="text-[11px] font-medium text-rose-600">{error}</span> : null}
            </label>
        );
    };

    const renderImagePanel = (block: Exclude<ContentBlockType, 'ai_tutor'>, image: ContentImage | null) => {
        const enabled = image != null;
        const defaultImage = DEFAULT_IMAGE_BY_BLOCK[block];
        const selectImage = (next: ContentImage | null) => updateContent(block, (value) => ({ ...value, image: next } as TutorialContentJSON[typeof block]));

        return (
            <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Image support</p>
                        <p className="mt-1 text-[11px] font-medium text-slate-500">Prompt 19 image panel for {BLOCK_LABELS[block]}.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => selectImage(enabled ? null : defaultImage)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                            enabled
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-[#FF4B91]/30 hover:text-[#FF4B91]'
                        )}
                    >
                        <ImagePlus size={12} />
                        {enabled ? 'Remove image' : 'Add image'}
                    </button>
                </div>

                {enabled ? (
                    <div className="mt-4 grid gap-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => selectImage({
                                    ...(image ?? defaultImage),
                                    type: 'svg_standard',
                                    svgKey: svgOptions[0]?.key ?? 'promise-chain',
                                    url: null,
                                })}
                                className={cn(
                                    'rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all',
                                    image?.type === 'svg_standard'
                                        ? 'border-[#FF4B91]/20 bg-[#FF4B91]/5 text-[#FF4B91]'
                                        : 'border-slate-200 bg-white text-slate-700'
                                )}
                            >
                                Standard SVG
                                <span className="mt-1 block text-[10px] font-medium text-slate-500">Named illustration from code.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => selectImage({
                                    ...(image ?? defaultImage),
                                    type: 'r2_custom',
                                    svgKey: null,
                                    url: image?.url ?? `https://cdn.realtutorialhub.com/content/${domainSlug}/${block}/placeholder.webp`,
                                })}
                                className={cn(
                                    'rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all',
                                    image?.type === 'r2_custom'
                                        ? 'border-[#FF4B91]/20 bg-[#FF4B91]/5 text-[#FF4B91]'
                                        : 'border-slate-200 bg-white text-slate-700'
                                )}
                            >
                                Custom Upload
                                <span className="mt-1 block text-[10px] font-medium text-slate-500">CDN URL placeholder for the future R2 flow.</span>
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {image?.type === 'svg_standard' ? (
                                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                    SVG key
                                    <select
                                        value={image.svgKey ?? svgOptions[0]?.key ?? 'promise-chain'}
                                        onChange={(e) => selectImage({
                                            ...image,
                                            svgKey: e.target.value,
                                            url: null,
                                        })}
                                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FF4B91]/30"
                                    >
                                        {svgOptions.map((option) => (
                                            <option key={option.key} value={option.key}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                    Upload file
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file == null) return;
                                            const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
                                            selectImage({
                                                ...(image ?? defaultImage),
                                                type: 'r2_custom',
                                                svgKey: null,
                                                url: `https://cdn.realtutorialhub.com/content/${domainSlug}/${block}/${Date.now()}-${safeName}`,
                                            });
                                        }}
                                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#FF4B91] file:px-3 file:py-1.5 file:text-xs file:font-black file:uppercase file:tracking-[0.18em] file:text-white"
                                    />
                                </label>
                            )}

                            {renderInputField(
                                'Alt text',
                                image.alt,
                                (next) => selectImage({ ...image, alt: next }),
                                `${block}.image.alt`,
                                'Describe the image for accessibility'
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                Caption
                                <input
                                    value={image.caption ?? ''}
                                    onChange={(e) => selectImage({ ...image, caption: e.target.value })}
                                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FF4B91]/30"
                                />
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                Position
                                <select
                                    value={image.position}
                                    onChange={(e) => selectImage({ ...image, position: e.target.value as ContentImage['position'] })}
                                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FF4B91]/30"
                                >
                                    <option value="right">Right</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="inline">Inline</option>
                                </select>
                            </label>
                            <label className="grid gap-2 text-sm font-semibold text-slate-700">
                                Width (px)
                                <input
                                    type="number"
                                    min={50}
                                    max={1200}
                                    value={image.width}
                                    onChange={(e) => selectImage({ ...image, width: Number(e.target.value) || 200 })}
                                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#FF4B91]/30"
                                />
                            </label>
                        </div>

                        <div className="rounded-2xl border border-dashed border-[#FF4B91]/20 bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Preview</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">{image.type === 'svg_standard' ? image.svgKey : 'R2 custom upload'}</p>
                                </div>
                                <span className="rounded-full bg-[#FF4B91]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4B91]">
                                    {image.position}
                                </span>
                            </div>
                            <p className="mt-3 break-all text-[12px] leading-6 text-slate-600">
                                {image.type === 'svg_standard'
                                    ? `SVG key: ${image.svgKey ?? 'not selected'}`
                                    : `CDN URL: ${image.url ?? 'pending upload'}`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                        Image panel is disabled for this block. Toggle it on to add either an SVG illustration or a CDN-backed upload placeholder.
                    </div>
                )}
            </div>
        );
    };

    const renderBlockEditor = () => {
        if (activeBlock === 'notes') {
            return (
                <div className="grid gap-5">
                    {renderTextField('Markdown', content.notes.markdown, (next) => updateContent('notes', (current) => ({ ...current, markdown: next })), 'notes.markdown', 6, 'Short notes markdown...')}
                    {renderImagePanel('notes', content.notes.image ?? null)}
                </div>
            );
        }

        if (activeBlock === 'layman') {
            return (
                <div className="grid gap-5">
                    {renderTextField('Simple explanation', content.layman.simpleExplanation, (next) => updateContent('layman', (current) => ({ ...current, simpleExplanation: next })), 'layman.simpleExplanation', 5, 'Beginner-friendly explanation...')}
                    {renderTextField('Analogy or story', content.layman.analogyOrStory, (next) => updateContent('layman', (current) => ({ ...current, analogyOrStory: next })), 'layman.analogyOrStory', 3, 'A short story or analogy...')}
                    <div className="grid gap-4 md:grid-cols-2">
                        {renderInputField('Example 1 - company', content.layman.example1.company, (next) => updateContent('layman', (current) => ({ ...current, example1: { ...current.example1, company: next } })), 'layman.example1.company', 'Zomato')}
                        {renderInputField('Example 2 - company', content.layman.example2.company, (next) => updateContent('layman', (current) => ({ ...current, example2: { ...current.example2, company: next } })), 'layman.example2.company', 'Uber')}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {renderTextField('Example 1 - content', content.layman.example1.content, (next) => updateContent('layman', (current) => ({ ...current, example1: { ...current.example1, content: next } })), 'layman.example1.content', 4, 'How this works in real life...')}
                        {renderTextField('Example 2 - content', content.layman.example2.content, (next) => updateContent('layman', (current) => ({ ...current, example2: { ...current.example2, content: next } })), 'layman.example2.content', 4, 'Another company example...')}
                    </div>
                    {renderImagePanel('layman', content.layman.image ?? null)}
                </div>
            );
        }

        if (activeBlock === 'real_life') {
            return (
                <div className="grid gap-5">
                    {renderTextField('Title', content.real_life.title, (next) => updateContent('real_life', (current) => ({ ...current, title: next })), 'real_life.title', 2, 'Scenario title...')}
                    {renderTextField('Scenario', content.real_life.scenario, (next) => updateContent('real_life', (current) => ({ ...current, scenario: next })), 'real_life.scenario', 5, 'Tell the story in plain language...')}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bullets</p>
                                <p className="text-[11px] text-slate-500 mt-1">Use short labels with one clear detail.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateContent('real_life', (current) => ({ ...current, bullets: [...current.bullets, { label: '', detail: '' }] }))}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700"
                            >
                                <Plus size={12} />
                                Add bullet
                            </button>
                        </div>
                        <div className="mt-4 grid gap-4">
                            {content.real_life.bullets.map((bullet, index) => (
                                <div key={`${index}-real-life`} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-[180px_1fr_auto]">
                                    {renderInputField(`Label ${index + 1}`, bullet.label, (next) => updateContent('real_life', (current) => ({
                                        ...current,
                                        bullets: current.bullets.map((item, itemIndex) => (itemIndex === index ? { ...item, label: next } : item)),
                                    })), `real_life.bullets.${index}.label`, 'Label')}
                                    {renderInputField(`Detail ${index + 1}`, bullet.detail, (next) => updateContent('real_life', (current) => ({
                                        ...current,
                                        bullets: current.bullets.map((item, itemIndex) => (itemIndex === index ? { ...item, detail: next } : item)),
                                    })), `real_life.bullets.${index}.detail`, 'Detail')}
                                    <button
                                        type="button"
                                        onClick={() => updateContent('real_life', (current) => ({
                                            ...current,
                                            bullets: current.bullets.length > 1 ? current.bullets.filter((_, itemIndex) => itemIndex !== index) : current.bullets,
                                        }))}
                                        className="self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {renderTextField('Tip', content.real_life.tip, (next) => updateContent('real_life', (current) => ({ ...current, tip: next })), 'real_life.tip', 3, 'A concise learning tip...')}
                    {renderImagePanel('real_life', content.real_life.image ?? null)}
                </div>
            );
        }

        if (activeBlock === 'technical') {
            return (
                <div className="grid gap-5">
                    {renderTextField('Markdown', content.technical.markdown, (next) => updateContent('technical', (current) => ({ ...current, markdown: next })), 'technical.markdown', 6, 'Technical explanation markdown...')}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Bullets</p>
                                <p className="text-[11px] text-slate-500 mt-1">Explain the mechanics with precise terms.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateContent('technical', (current) => ({ ...current, bullets: [...current.bullets, { term: '', detail: '' }] }))}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700"
                            >
                                <Plus size={12} />
                                Add bullet
                            </button>
                        </div>
                        <div className="mt-4 grid gap-4">
                            {content.technical.bullets.map((bullet, index) => (
                                <div key={`${index}-technical`} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-[180px_1fr_auto]">
                                    {renderInputField(`Term ${index + 1}`, bullet.term, (next) => updateContent('technical', (current) => ({
                                        ...current,
                                        bullets: current.bullets.map((item, itemIndex) => (itemIndex === index ? { ...item, term: next } : item)),
                                    })), `technical.bullets.${index}.term`, 'Term')}
                                    {renderInputField(`Detail ${index + 1}`, bullet.detail, (next) => updateContent('technical', (current) => ({
                                        ...current,
                                        bullets: current.bullets.map((item, itemIndex) => (itemIndex === index ? { ...item, detail: next } : item)),
                                    })), `technical.bullets.${index}.detail`, 'Detail')}
                                    <button
                                        type="button"
                                        onClick={() => updateContent('technical', (current) => ({
                                            ...current,
                                            bullets: current.bullets.length > 1 ? current.bullets.filter((_, itemIndex) => itemIndex !== index) : current.bullets,
                                        }))}
                                        className="self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {renderTextField('Tip', content.technical.tip, (next) => updateContent('technical', (current) => ({ ...current, tip: next })), 'technical.tip', 3, 'Technical tip...')}
                    {renderImagePanel('technical', content.technical.image ?? null)}
                </div>
            );
        }

        if (activeBlock === 'code') {
            return (
                <div className="grid gap-5">
                    <label className="grid gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Language</span>
                        <select
                            value={content.code.language}
                            onChange={(e) => updateContent('code', (current) => ({ ...current, language: e.target.value as TutorialContentJSON['code']['language'] }))}
                            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-indigo-300"
                        >
                            {['javascript', 'typescript', 'python', 'sql', 'scala', 'java', 'bash'].map((language) => (
                                <option key={language} value={language}>
                                    {language}
                                </option>
                            ))}
                        </select>
                    </label>
                    {renderTextField('Intro', content.code.intro, (next) => updateContent('code', (current) => ({ ...current, intro: next })), 'code.intro', 3, 'Short introduction to the code sample...')}
                    {renderTextField('Code', content.code.code, (next) => updateContent('code', (current) => ({ ...current, code: next })), 'code.code', 8, 'Write the code sample here...')}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Steps</p>
                                <p className="text-[11px] text-slate-500 mt-1">Keep each step short and actionable.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updateContent('code', (current) => ({ ...current, steps: [...current.steps, ''] }))}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700"
                            >
                                <Plus size={12} />
                                Add step
                            </button>
                        </div>
                        <div className="mt-4 grid gap-3">
                            {content.code.steps.map((step, index) => (
                                <div key={`${index}-code`} className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-black text-slate-700">
                                        {index + 1}
                                    </span>
                                    <input
                                        value={step}
                                        onChange={(e) => updateContent('code', (current) => ({
                                            ...current,
                                            steps: current.steps.map((item, itemIndex) => (itemIndex === index ? e.target.value : item)),
                                        }))}
                                        className={cn(
                                            'h-11 flex-1 rounded-xl border px-3 text-sm outline-none',
                                            validationErrors[`code.steps.${index}`] != null ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => updateContent('code', (current) => ({
                                            ...current,
                                            steps: current.steps.length > 1 ? current.steps.filter((_, itemIndex) => itemIndex !== index) : current.steps,
                                        }))}
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {renderImagePanel('code', content.code.image ?? null)}
                </div>
            );
        }

        return (
            <div className="grid gap-5">
                {renderTextField('Greeting', content.ai_tutor.greeting, (next) => updateContent('ai_tutor', (current) => ({ ...current, greeting: next })), 'ai_tutor.greeting', 3, 'Friendly tutor greeting...')}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Q&A pairs</p>
                            <p className="text-[11px] text-slate-500 mt-1">At least 3 pairs are required.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => updateContent('ai_tutor', (current) => ({ ...current, qa_pairs: [...current.qa_pairs, { question: '', answer: '' }] }))}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700"
                        >
                            <Plus size={12} />
                            Add pair
                        </button>
                    </div>
                    <div className="mt-4 grid gap-4">
                        {ensureArrayItem(content.ai_tutor.qa_pairs, { question: '', answer: '' }).map((pair, index) => (
                            <div key={`${index}-ai-tutor`} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-[1fr_1fr_auto]">
                                {renderInputField(`Question ${index + 1}`, pair.question, (next) => updateContent('ai_tutor', (current) => ({
                                    ...current,
                                    qa_pairs: current.qa_pairs.map((item, itemIndex) => (itemIndex === index ? { ...item, question: next } : item)),
                                })), `ai_tutor.qa_pairs.${index}.question`, 'Question')}
                                {renderInputField(`Answer ${index + 1}`, pair.answer, (next) => updateContent('ai_tutor', (current) => ({
                                    ...current,
                                    qa_pairs: current.qa_pairs.map((item, itemIndex) => (itemIndex === index ? { ...item, answer: next } : item)),
                                })), `ai_tutor.qa_pairs.${index}.answer`, 'Answer')}
                                <button
                                    type="button"
                                    onClick={() => updateContent('ai_tutor', (current) => ({
                                        ...current,
                                        qa_pairs: current.qa_pairs.length > 3 ? current.qa_pairs.filter((_, itemIndex) => itemIndex !== index) : current.qa_pairs,
                                    }))}
                                    className="self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const statusClass = {
        neutral: 'border-slate-200 bg-white text-slate-700',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        warning: 'border-amber-200 bg-amber-50 text-amber-800',
        error: 'border-rose-200 bg-rose-50 text-rose-800',
    }[status.tone];

        return (
            <section className="overflow-hidden rounded-[3rem] border border-white/40 bg-white/60 shadow-sm backdrop-blur-2xl">
            <div className="border-b border-slate-100 bg-white/75 px-8 py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Tutorial Content Management</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight uppercase text-[#1A1A1A]">Tutorial Block Editor</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            {domainName} / {subtopicName} - content is prefilled from the seeded Neon snapshot.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Current version</div>
                            <div className="text-sm font-black text-slate-900">v{currentVersion?.version ?? 1}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => commitVersion('draft')}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 transition-colors hover:border-[#FF4B91]/30 hover:text-[#FF4B91]"
                        >
                            <Save size={14} />
                            Save as Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => commitVersion('published')}
                            disabled={!publishReady}
                            title={publishReady ? 'Publish tutorial content' : 'Complete all 6 blocks before publishing'}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-2xl border border-[#FF4B91]/20 bg-[#FF4B91] px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#ff3382]',
                                !publishReady ? 'cursor-not-allowed opacity-50 hover:bg-[#FF4B91]' : ''
                            )}
                        >
                            <Sparkles size={14} />
                            Publish
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
                <aside className="border-b border-slate-200 bg-white/50 p-5 lg:border-b-0 lg:border-r">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Validation</p>
                        <div className="mt-2 flex items-center gap-2">
                            <CheckCircle2 size={16} className={isValid ? 'text-emerald-600' : 'text-rose-600'} />
                            <span className="text-sm font-semibold text-slate-900">{isValid ? 'TutorialContentSchema valid' : 'Schema errors detected'}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            Validation runs on the client before any save or publish action.
                        </p>
                    </div>

                    <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Content Blocks</p>
                        <div className="mt-3 grid gap-2">
                            {BLOCK_ORDER.map((block) => {
                                const hasError = Object.keys(validationErrors).some((path) => path.startsWith(`${block}.`));
                                const isActive = activeBlock === block;
                                return (
                                    <button
                                        key={block}
                                        type="button"
                                        onClick={() => setActiveBlock(block)}
                                        className={cn(
                                            'flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all',
                                            isActive
                                                ? 'border-[#FF4B91]/20 bg-[#FF4B91]/5 text-[#FF4B91]'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-[#FF4B91]/25 hover:text-[#FF4B91]',
                                            hasError ? 'ring-1 ring-rose-200' : ''
                                        )}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black">{BLOCK_LABELS[block]}</span>
                                                {block === 'ai_tutor' ? <Wand2 size={12} /> : null}
                                            </div>
                                            <p className="mt-1 text-[11px] leading-5 text-slate-500">{BLOCK_HELPERS[block]}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {hasError ? <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-rose-700">Fix</span> : null}
                                            {isActive ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Field Preview</p>
                        <div className="mt-3 grid gap-2">
                            <div className="rounded-2xl bg-slate-50 p-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Active block</div>
                                <div className="mt-1 text-sm font-black text-slate-900">{BLOCK_LABELS[activeBlock]}</div>
                            </div>
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3">
                                <p className="text-[11px] font-medium leading-5 text-slate-600">{getPreviewSummary(content, activeBlock)}</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="border-b border-slate-200 bg-white/55 p-6 lg:border-b-0 lg:border-r">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Editing</p>
                            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">{BLOCK_LABELS[activeBlock]}</h3>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                            {BLOCK_HELPERS[activeBlock]}
                        </span>
                    </div>

                    <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                        {renderBlockEditor()}
                    </div>

                    <div className={cn('mt-5 rounded-[1.4rem] border px-4 py-3 text-sm font-medium', statusClass)}>
                        {status.text}
                    </div>
                </main>

                <aside className="bg-white/50 p-5">
                    <ContentVersionHistory
                        versions={versions}
                        currentVersionId={currentVersionId}
                        onRestore={restoreVersion}
                    />

                    <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Checkpoint notes</p>
                        <div className="mt-3 grid gap-2 text-[12px] leading-6 text-slate-600">
                            <p>
                                <span className="font-bold text-slate-800">Save as Draft</span> keeps the current content state local and adds a version snapshot.
                            </p>
                            <p>
                                <span className="font-bold text-slate-800">Publish</span> does the same and marks the snapshot as ready for future vector indexing.
                            </p>
                            <p>
                                <span className="font-bold text-slate-800">Image panels</span> support both SVG placeholders and CDN URL previews for the T8 flow.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </section>
    );
}
