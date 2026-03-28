'use client';

import { AlertCircle, Check, Copy, Eye, FileJson2, Layers3, Minus, PencilLine, Plus, Sparkles, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { SelectField } from '@/components/entry/SelectionFields';
import { FactoryLayout } from '@/components/layout/FactoryLayout';
import { PageTitle } from '@/components/layout/PageTitle';
import { useDomains, useSubjects, useSubtopics, useTopics } from '@/hooks/useAdminHierarchy';
import { AssignmentSchema, type AssignmentSchemaType } from '@/lib/factory/assignment-schema';
import { TutorialPromptService } from '@/lib/factory/prompt-service';
import { cn } from '@/lib/utils';
import { useTutorialFactoryStore } from '@/store/tutorial-factory-store';

type TierKey = 'simple' | 'mixed' | 'intermediate' | 'expert';
type AssignmentEntry = AssignmentSchemaType['assignments'][number];

const TIERS: Array<{ key: TierKey; label: string; min: number; max: number; defaultValue: number; questionTypes: string[] }> = [
  { key: 'simple', label: 'Simple', min: 3, max: 5, defaultValue: 3, questionTypes: ['mcq'] },
  { key: 'mixed', label: 'Mixed', min: 6, max: 10, defaultValue: 6, questionTypes: ['mcq', 'short_answer'] },
  { key: 'intermediate', label: 'Intermediate', min: 8, max: 12, defaultValue: 8, questionTypes: ['mcq', 'short_answer', 'code'] },
  { key: 'expert', label: 'Expert', min: 12, max: 20, defaultValue: 12, questionTypes: ['mcq', 'short_answer', 'code', 'open_ended'] },
];

const TYPE_RULES: Record<TierKey, string[]> = {
  simple: ['mcq'],
  mixed: ['mcq', 'short_answer'],
  intermediate: ['mcq', 'short_answer', 'code'],
  expert: ['mcq', 'short_answer', 'code', 'open_ended'],
};

const DEFAULT_COUNTS = TIERS.reduce((acc, tier) => {
  acc[tier.key] = tier.defaultValue;
  return acc;
}, {} as Record<TierKey, number>);

type PublishedContentResponse = {
  data?: { content?: { layman?: { simpleExplanation?: string } } } | null;
  error?: string;
};

function formatTimestamp(value: string) {
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

function issueLabel(issue: { path: (string | number)[]; message: string }) {
  const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
  return `${path}: ${issue.message}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function AssignmentFactoryPage({ embedded = false }: { embedded?: boolean } = {}) {
  const selection = useTutorialFactoryStore((state) => state.selection);
  const setSelection = useTutorialFactoryStore((state) => state.setSelection);
  const [tierCounts, setTierCounts] = useState(DEFAULT_COUNTS);
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [sourceDirty, setSourceDirty] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<AssignmentEntry[]>([]);
  const [publishState, setPublishState] = useState<'draft' | 'published' | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingSource, setLoadingSource] = useState(false);

  const { data: domains, loading: loadingDomains } = useDomains();
  const { data: subjects, loading: loadingSubjects } = useSubjects(selection.domainId !== '' ? selection.domainId : undefined);
  const { data: topics, loading: loadingTopics } = useTopics(selection.subjectId !== '' ? selection.subjectId : undefined);
  const { data: subtopics, loading: loadingSubtopics } = useSubtopics(selection.topicId !== '' ? selection.topicId : undefined);

  const resolved = useMemo(() => ({
    domainName: domains.find((x) => x.id === selection.domainId)?.name ?? 'Selected Domain',
    subjectName: subjects.find((x) => x.id === selection.subjectId)?.name ?? 'Selected Subject',
    topicName: topics.find((x) => x.id === selection.topicId)?.name ?? 'Selected Topic',
    subtopicName: subtopics.find((x) => x.id === selection.subtopicId)?.name ?? 'Selected Subtopic',
  }), [domains, selection.domainId, selection.subjectId, selection.topicId, selection.subtopicId, subjects, subtopics, topics]);

  const selectionComplete = selection.domainId !== '' && selection.subjectId !== '' && selection.topicId !== '' && selection.subtopicId !== '';
  const expectedTotal = tierCounts.simple + tierCounts.mixed + tierCounts.intermediate + tierCounts.expert;
  const readOnly = embedded;

  useEffect(() => {
    if (selection.subtopicId === '') {
      setSourceMaterial('');
      setSourceDirty(false);
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoadingSource(true);
      try {
        const response = await fetch(`/api/tutorial/content/${encodeURIComponent(selection.subtopicId)}?difficulty=${encodeURIComponent(selection.difficulty)}`, { signal: controller.signal });
        const payload = await response.json().catch(() => null) as PublishedContentResponse | null;
        if (!response.ok) throw new Error(payload?.error ?? 'Failed to load published tutorial content.');
        if (!sourceDirty) setSourceMaterial(payload?.data?.content?.layman?.simpleExplanation ?? '');
      } catch (error) {
        if ((error as { name?: string } | null)?.name !== 'AbortError') {
          toast.error(error instanceof Error ? error.message : 'Failed to load published tutorial content.');
        }
      } finally {
        setLoadingSource(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [selection.difficulty, selection.subtopicId, sourceDirty]);

  const validation = useMemo(() => {
    if (rawJson.trim() === '') return { parsed: [] as AssignmentEntry[], errors: ['Paste assignment JSON before validating.'], valid: false };
    try {
      const parsed = AssignmentSchema.safeParse(JSON.parse(rawJson) as unknown);
      if (!parsed.success) return { parsed: [] as AssignmentEntry[], errors: parsed.error.issues.map(issueLabel), valid: false };
      const errors: string[] = [];
      if (parsed.data.assignments.length !== expectedTotal) errors.push(`assignments: expected ${expectedTotal} total questions from tier counts, received ${parsed.data.assignments.length}.`);
      let cursor = 0;
      for (const tier of TIERS) {
        const slice = parsed.data.assignments.slice(cursor, cursor + tierCounts[tier.key]);
        slice.forEach((assignment, index) => {
          if (!TYPE_RULES[tier.key].includes(assignment.question_type)) {
            errors.push(`assignments.${cursor + index}.question_type: ${assignment.question_type} is not allowed for the ${tier.label} tier.`);
          }
        });
        cursor += tierCounts[tier.key];
      }
      return { parsed: parsed.data.assignments, errors, valid: errors.length === 0 };
    } catch {
      return { parsed: [] as AssignmentEntry[], errors: ['Invalid JSON payload.'], valid: false };
    }
  }, [expectedTotal, rawJson, tierCounts]);

  const lineNumbers = useMemo(() => Array.from({ length: Math.max(rawJson.split(/\r?\n/).length, 1) }, (_, index) => index + 1), [rawJson]);

  const updateSelection = (field: 'domainId' | 'subjectId' | 'topicId' | 'subtopicId', value: string) => {
    if (readOnly) return;
    const next: Record<string, string> = { [field]: value };
    if (field === 'domainId') { next.subjectId = ''; next.topicId = ''; next.subtopicId = ''; }
    if (field === 'subjectId') { next.topicId = ''; next.subtopicId = ''; }
    if (field === 'topicId') { next.subtopicId = ''; }
    setSelection(next);
    setSourceDirty(false);
    setPreview([]);
    setPublishState('draft');
    setSavedDraftId(null);
  };

  const updateDifficulty = (value: TierKey) => {
    if (readOnly) return;
    setSelection({ difficulty: value });
    setPublishState('draft');
  };

  const updateCount = (tier: TierKey, delta: number) => {
    if (readOnly) return;
    setTierCounts((current) => {
      const config = TIERS.find((item) => item.key === tier);
      if (!config) return current;
      return { ...current, [tier]: clamp(current[tier] + delta, config.min, config.max) };
    });
    setPreview([]);
    setPublishState('draft');
  };

  const validate = () => {
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setPreview([]);
      setPublishState(null);
      toast.error('Assignment JSON still has validation issues.');
      return;
    }
    setValidationErrors([]);
    setPreview(validation.parsed);
    setPublishState('draft');
    toast.success(`Validated ${validation.parsed.length} assignments.`);
  };

  const generatePrompt = async () => {
    if (!selectionComplete) {
      toast.error('Select domain, subject, topic, subtopic, and difficulty first.');
      return;
    }
    const prompt = TutorialPromptService.generateAssignmentPrompt({
      context: resolved,
      difficulty: selection.difficulty,
      tierCounts,
      questionTypesByTier: TYPE_RULES,
      referenceAnswerGuidance: 'Use the pasted source material as the primary context. Keep reference_answer concise and self-check focused. Do not include pass/fail logic.',
    });
    const finalPrompt = sourceMaterial.trim() === '' ? prompt : `${prompt}\n\nSOURCE MATERIAL:\n${sourceMaterial.trim()}`;
    setGeneratedPrompt(finalPrompt);
    setPromptOpen(true);
    try { await navigator.clipboard.writeText(finalPrompt); toast.success('Assignment prompt copied to clipboard.'); } catch { toast.error('Assignment prompt generated, but clipboard copy failed.'); }
  };

  const persist = async (shouldPublish: boolean) => {
    if (!selectionComplete) return void toast.error('Select the full target context first.');
    if (!validation.valid) return void toast.error('Fix JSON validation errors before saving.');
    if (validation.parsed.length !== expectedTotal) return void toast.error('Assignment count does not match the configured tier volumes.');

    setSavingDraft(true);
    try {
      const draftResponse = await fetch('/api/tutorial/assignments/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId: selection.subtopicId, difficulty: selection.difficulty, assignments: validation.parsed }),
      });
      const draftPayload = await draftResponse.json().catch(() => null) as { draftId?: string; error?: string } | null;
      if (!draftResponse.ok) throw new Error(draftPayload?.error ?? 'Failed to save assignment draft.');
      setSavedDraftId(draftPayload?.draftId ?? null);
      setDraftSavedAt(new Date().toISOString());
      setPublishState('draft');
      if (shouldPublish) {
        setPublishing(true);
        try {
          const publishResponse = await fetch('/api/tutorial/assignments/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subtopicId: selection.subtopicId, difficulty: selection.difficulty }),
          });
          const publishPayload = await publishResponse.json().catch(() => null) as { publishedCount?: number; error?: string } | null;
          if (!publishResponse.ok) throw new Error(publishPayload?.error ?? 'Failed to publish assignments.');
          setPublishState('published');
          toast.success(`Assignments published${publishPayload?.publishedCount != null ? ` (${publishPayload.publishedCount})` : ''}.`);
        } finally {
          setPublishing(false);
        }
      } else {
        toast.success(draftPayload?.draftId != null ? `Draft saved (${draftPayload.draftId}).` : 'Draft saved.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save assignments.');
    } finally {
      setSavingDraft(false);
    }
  };

  const content = (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
      <div className="mx-auto max-w-[1600px] space-y-8 px-8 pb-32 pt-8">
        {!embedded ? (
          <div className="flex flex-col gap-6 border-b border-slate-200/70 pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3"><Sparkles size={20} className="text-[#FF4B91]" /><span className="text-xs font-black uppercase tracking-[0.3em] text-[#FF4B91]">Practice Builder</span></div>
              <PageTitle text="Assignment Factory" />
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500">Domain • Subject • Topic • Subtopic • Difficulty</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">Practice only</div>
          </div>
        ) : null}

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-6 w-1 rounded-full bg-[#FF4B91]" /><h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">1. Target Context</h3></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{readOnly ? 'Inherited from tutorial dashboard' : 'Editable'}</span></div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <SelectField label="Domain" value={selection.domainId} onChange={(value) => updateSelection('domainId', value)} options={domains} loading={loadingDomains} placeholder="Select Domain" active={selection.domainId !== ''} icon={<Layers3 size={14} />} disabled={readOnly} />
            <SelectField label="Subject" value={selection.subjectId} onChange={(value) => updateSelection('subjectId', value)} options={subjects} loading={loadingSubjects} placeholder="Select Subject" active={selection.subjectId !== ''} disabled={readOnly || selection.domainId === ''} />
            <SelectField label="Topic" value={selection.topicId} onChange={(value) => updateSelection('topicId', value)} options={topics} loading={loadingTopics} placeholder="Select Topic" active={selection.topicId !== ''} disabled={readOnly || selection.subjectId === ''} />
            <SelectField label="Subtopic" value={selection.subtopicId} onChange={(value) => updateSelection('subtopicId', value)} options={subtopics} loading={loadingSubtopics} placeholder="Select Subtopic" active={selection.subtopicId !== ''} disabled={readOnly || selection.topicId === ''} />
            <div className="flex flex-col gap-2"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Difficulty</span><div className="grid grid-cols-2 gap-2">{(['simple', 'mixed', 'intermediate', 'expert'] as const).map((value) => <button key={value} type="button" onClick={() => updateDifficulty(value)} disabled={readOnly} className={cn('rounded-2xl border px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all', selection.difficulty === value ? 'border-[#FF4B91] bg-[#FF4B91]/5 text-[#FF4B91]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50', readOnly ? 'cursor-not-allowed opacity-80' : '')}>{value}</button>)}</div></div>
          </div>
          <div className={cn('rounded-[1.75rem] border p-4', selectionComplete ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/60')}><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selection Status</p><p className="mt-2 text-sm font-bold text-slate-700">{selectionComplete ? 'Ready for prompt generation and draft creation.' : 'Select all 5 fields to unlock the factory.'}</p></div>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-6 w-1 rounded-full bg-[#FF4B91]" /><h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">2. Volume per Tier</h3></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Total {expectedTotal}</span></div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{TIERS.map((tier) => <div key={tier.key} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">{tier.label}</p><p className="mt-1 text-xs font-medium text-slate-500">{tier.min}-{tier.max} questions</p></div><div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{tier.questionTypes.join(' + ')}</div></div><div className="mt-4 flex items-center gap-3"><button type="button" onClick={() => updateCount(tier.key, -1)} disabled={readOnly || tierCounts[tier.key] <= tier.min} className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all', readOnly || tierCounts[tier.key] <= tier.min ? 'cursor-not-allowed border-slate-200 bg-white text-slate-300' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100')}><Minus size={14} /></button><div className="flex min-w-24 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-black tracking-tight text-[#1A1A1A]">{tierCounts[tier.key]}</div><button type="button" onClick={() => updateCount(tier.key, 1)} disabled={readOnly || tierCounts[tier.key] >= tier.max} className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all', readOnly || tierCounts[tier.key] >= tier.max ? 'cursor-not-allowed border-slate-200 bg-white text-slate-300' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100')}><Plus size={14} /></button><div className="flex flex-1 flex-wrap justify-end gap-2">{tier.questionTypes.map((type) => <span key={type} className="rounded-full bg-[#FF4B91]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4B91]">{type}</span>)}</div></div></div>)}</div>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="h-6 w-1 rounded-full bg-[#FF4B91]" /><h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">3. Source Material</h3></div><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{loadingSource ? 'Loading published content...' : 'Optional'}</span></div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/70 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Published layman explanation for the selected subtopic</p><textarea value={sourceMaterial} onChange={(event) => { setSourceMaterial(event.target.value); setSourceDirty(true); }} placeholder="Published content will appear here, or paste syllabus notes and reference material." className="mt-4 min-h-[220px] w-full resize-y rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-700 outline-none" /></div>
        </section>

        <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-3"><div className="h-6 w-1 rounded-full bg-[#FF4B91]" /><h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">4. JSON Payload Editor</h3></div><p className="mt-2 text-sm font-medium text-slate-500">Paste the AI-generated assignment JSON, validate it, preview it tier-by-tier, then save or publish.</p></div><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => { void generatePrompt(); }} className="h-11 rounded-2xl bg-[#FF4B91] px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-[#FF4B91]/20 hover:bg-[#FF4B91]/90"><FileJson2 size={16} className="mr-2 inline-block" />Generate Prompt</button><button type="button" onClick={() => { void validate(); }} className="h-11 rounded-2xl bg-slate-900 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/15 hover:bg-slate-800"><Upload size={16} className="mr-2 inline-block" />Process & Review</button></div></div>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><Eye size={14} className="text-[#FF4B91]" />JSON Payload Editor</div><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{lineNumbers.length} lines</span></div>
              <div className="grid grid-cols-[72px_minmax(0,1fr)]"><div className="select-none border-r border-slate-200 bg-slate-50 px-3 py-4 font-mono text-[11px] leading-6 text-slate-400">{lineNumbers.map((lineNumber) => <div key={lineNumber} className="pr-1 text-right">{lineNumber}</div>)}</div><textarea value={rawJson} onChange={(event) => { setRawJson(event.target.value); setPreview([]); setPublishState('draft'); }} placeholder='Paste {"assignments":[...]}' className="min-h-[420px] w-full resize-y bg-white px-5 py-4 font-mono text-[12px] leading-6 text-slate-800 outline-none" spellCheck={false} /></div>
            </div>
            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"><Check size={14} className={validation.valid ? 'text-emerald-600' : 'text-rose-600'} />Validation status</div><p className="mt-2 text-sm font-semibold text-slate-900">{validation.valid ? 'AssignmentSchema valid' : 'Schema or tier checks failed'}</p><p className="mt-2 text-xs text-slate-500">{validation.valid ? 'The payload matches the assignment schema and tier rules.' : 'Fix the issues below before saving or publishing.'}</p></div>
              <div className={cn('rounded-[1.75rem] border p-5', validationErrors.length > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50')}><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]"><AlertCircle size={14} className={validationErrors.length > 0 ? 'text-rose-500' : 'text-emerald-600'} />{validationErrors.length > 0 ? 'Field-level validation errors' : 'Validation passed'}</div>{validationErrors.length > 0 ? <ul className="mt-4 space-y-2 text-sm text-rose-700">{validationErrors.map((issue) => <li key={issue} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" /><span>{issue}</span></li>)}</ul> : <p className="mt-2 text-sm text-emerald-700">The JSON payload currently aligns with the selected tier volumes and question-type rules.</p>}</div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"><Sparkles size={14} className="text-[#FF4B91]" />Prompt helper</div><p className="mt-2 text-sm leading-6 text-slate-600">Generate the raw prompt, paste the AI response below, then use Process & Review to build the tiered preview.</p></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex items-center justify-between gap-4"><div><h4 className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">Preview by Tier</h4><p className="mt-1 text-xs text-slate-500">Assignments are grouped in the order your prompt asked for them.</p></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{preview.length} validated</span></div>
            {preview.length === 0 ? <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-12 text-center"><PencilLine className="mx-auto text-slate-300" size={40} /><h4 className="mt-4 text-sm font-black uppercase tracking-widest text-[#1A1A1A]">No Preview Yet</h4><p className="mt-2 text-sm text-slate-500">Validate the pasted JSON to render preview cards grouped by tier.</p></div> : <div className="grid gap-4 xl:grid-cols-2">{TIERS.map((tier, tierIndex) => { const start = TIERS.slice(0, tierIndex).reduce((sum, item) => sum + tierCounts[item.key], 0); const entries = preview.slice(start, start + tierCounts[tier.key]); return <div key={tier.key} className="rounded-[2rem] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-widest text-[#1A1A1A]">{tier.label}</p><p className="mt-1 text-xs text-slate-500">{entries.length} / {tierCounts[tier.key]} assignments</p></div><div className="flex flex-wrap justify-end gap-2">{TYPE_RULES[tier.key].map((type) => <span key={type} className="rounded-full bg-[#FF4B91]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4B91]">{type}</span>)}</div></div><div className="mt-4 grid gap-3">{entries.map((assignment, index) => <div key={`${tier.key}-${index}-${assignment.question}`} className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#FF4B91]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF4B91]">{assignment.question_type}</span><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">#{index + 1}</span></div><p className="text-sm font-bold leading-6 text-[#1A1A1A]">{assignment.question}</p><div className="space-y-2"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Hints</p><ul className="space-y-1 pl-4 text-sm text-slate-600 list-disc">{assignment.hints.length > 0 ? assignment.hints.map((hint) => <li key={hint}>{hint}</li>) : <li>No hints provided.</li>}</ul></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Reference Answer</p><p className="mt-2 text-sm text-emerald-900/80">{assignment.reference_answer}</p></div></div>)}</div>{entries.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No assignments mapped to this tier yet.</div> : null}</div>; })}</div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
            <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><Eye size={14} className="text-[#FF4B91]" />Publish gate</div><p className="mt-2 text-sm text-slate-500">Draft and publish actions remain locked until all tier counts are satisfied and the payload validates.</p></div>
            <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => { void generatePrompt(); }} className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm hover:bg-slate-100">Generate Prompt</button><button type="button" onClick={() => { void persist(false); }} disabled={!validation.valid || preview.length !== expectedTotal || savingDraft} className={cn('h-11 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest transition-all', !validation.valid || preview.length !== expectedTotal || savingDraft ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400' : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50')}>{savingDraft ? 'Saving...' : 'Save Draft'}</button><button type="button" onClick={() => { void persist(true); }} disabled={!validation.valid || preview.length !== expectedTotal || savingDraft || publishing} className={cn('h-11 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest transition-all', !validation.valid || preview.length !== expectedTotal || savingDraft || publishing ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400' : 'bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/25 hover:bg-[#FF4B91]/90')}>{publishing ? 'Publishing...' : 'Publish'}</button></div>
          </div>
          <div className="flex items-center justify-between gap-4 text-xs text-slate-500"><span className="font-medium">{publishState === 'published' ? 'Published' : 'Draft'} {savedDraftId != null ? `• Draft ${savedDraftId}` : ''}</span><span>{draftSavedAt != null ? `Saved ${formatTimestamp(draftSavedAt)}` : 'No draft saved yet'}</span></div>
        </section>

        {promptOpen ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"><div className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B91]">Prompt Ready</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#1A1A1A]">Assignment Factory prompt</h2></div><button type="button" onClick={() => setPromptOpen(false)} className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100">Close</button></div><div className="space-y-4 p-6"><textarea value={generatedPrompt} readOnly className="min-h-[420px] w-full resize-y rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 font-mono text-[12px] leading-6 text-slate-700 outline-none" /><div className="flex items-center justify-between gap-4"><p className="text-xs font-medium text-slate-500">The prompt is already copied to your clipboard.</p><div className="flex items-center gap-3"><button type="button" onClick={() => { void navigator.clipboard.writeText(generatedPrompt); toast.success('Prompt copied again.'); }} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm hover:bg-slate-50"><Copy size={16} className="mr-2 inline-block" />Copy Again</button><button type="button" onClick={() => setPromptOpen(false)} className="h-11 rounded-2xl bg-[#FF4B91] px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-[#FF4B91]/20 hover:bg-[#FF4B91]/90">Done</button></div></div></div></div></div> : null}
      </div>
    </div>
  );

  return embedded ? content : <FactoryLayout title="Assignment Factory" subtitle="Practice-Only Generator" backPath="/dashboard/tutorial">{content}</FactoryLayout>;
}
