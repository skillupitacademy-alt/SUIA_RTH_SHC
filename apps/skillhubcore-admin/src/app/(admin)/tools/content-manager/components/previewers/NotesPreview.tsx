'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, Code2, Grid2X2, Sparkles } from 'lucide-react';

interface NotesPreviewProps {
  subsection: string;
  content: any;
}

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {};

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

function PreviewBlock({ subsection, content }: NotesPreviewProps) {
  const data = asRecord(content);

  switch (subsection) {
    case 'concept_card':
      return (
        <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-xl">
          <div className="mb-4 flex flex-wrap gap-2">
            {asArray<string>(data.quickLook).map((item) => (
              <span key={item} className="rounded-full bg-pink-500/15 px-3 py-1 text-[10px] font-black uppercase text-pink-300">{item}</span>
            ))}
          </div>
          <h3 className="text-3xl font-black text-white">{asString(data.heroTitle, 'What is Python?')}</h3>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">{asString(data.heroSubtitle, 'A clear learner-facing introduction.')}</p>
        </div>
      );

    case 'definition_block':
      return (
        <div className="rounded-3xl border border-blue-500/20 bg-slate-900 p-6 shadow-xl">
          <span className="rounded-full bg-blue-500/15 px-3 py-1 text-[10px] font-black uppercase text-blue-300">{asString(data.badge, 'Core Concept')}</span>
          <h3 className="mt-4 text-2xl font-black text-white">{asString(data.headline, 'Definition')}</h3>
          <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">{asString(data.definition, 'Canonical definition text.')}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase text-slate-500">Simple Explanation</p>
              <p className="mt-1 text-xs font-semibold leading-6 text-slate-300">{asString(data.simpleExplanation, 'Simple explanation.')}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-4">
              <p className="text-[10px] font-black uppercase text-emerald-300">Why It Matters</p>
              <p className="mt-1 text-xs font-semibold leading-6 text-slate-300">{asString(data.whyItMatters, 'Why this matters.')}</p>
            </div>
          </div>
        </div>
      );

    case 'component_grid': {
      const mechanics = asArray<Record<string, unknown>>(data.mechanics);
      return (
        <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <Grid2X2 className="text-pink-400" size={22} />
            <h3 className="text-2xl font-black text-white">{asString(data.panelTitle, 'How it works')}</h3>
          </div>
          <p className="text-sm font-semibold leading-7 text-slate-300">{asString(data.description, 'Mechanics explanation.')}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {mechanics.map((item, index) => (
              <div key={asString(item.id, String(index))} className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500 text-xs font-black text-white">{index + 1}</span>
                <p className="mt-3 font-black text-white">{asString(item.label, 'Mechanic')}</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">{asString(item.detail, 'Detail')}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'syntax_block':
      return (
        <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <Code2 className="text-emerald-300" size={22} />
            <h3 className="text-2xl font-black text-white">{asString(data.title, 'Syntax structure')}</h3>
          </div>
          <pre className="overflow-auto rounded-2xl bg-black p-4 text-xs text-emerald-200"><code>{asString(data.codeSnippet, 'print(\"Hello\")')}</code></pre>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {asArray<Record<string, unknown>>(data.breakdown).map((item, index) => (
              <div key={index} className="rounded-2xl bg-white/5 p-4">
                <p className="font-black text-indigo-200">{asString(item.part, 'Part')}</p>
                <p className="mt-1 text-xs leading-6 text-slate-300">{asString(item.explanation, 'Explanation')}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'example_panel':
      return (
        <div className="rounded-3xl border border-purple-500/20 bg-slate-900 p-6 shadow-xl">
          <h3 className="text-2xl font-black text-white">{asString(data.title, 'Key components')}</h3>
          <p className="mt-2 text-sm font-semibold leading-7 text-slate-300">{asString(data.description, 'Practical examples and components.')}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {asArray<Record<string, unknown>>(data.components).map((item, index) => (
              <div key={asString(item.id, String(index))} className="rounded-2xl bg-purple-500/10 p-4">
                <p className="font-black text-white">{asString(item.title, 'Component')}</p>
                <p className="mt-1 text-xs leading-6 text-slate-300">{asString(item.description, 'Description')}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'practice_card':
      return (
        <div className="rounded-3xl border border-emerald-500/20 bg-slate-900 p-6 shadow-xl">
          <h3 className="text-2xl font-black text-white">{asString(data.title, 'Best practices')}</h3>
          <div className="mt-4 space-y-3">
            {asArray<Record<string, unknown>>(data.practices).map((item, index) => (
              <div key={asString(item.id, String(index))} className="flex gap-3 rounded-2xl bg-emerald-500/10 p-4">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={18} />
                <div>
                  <p className="font-black text-white">{asString(item.label, 'Practice')}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-300">{asString(item.tip, 'Tip')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'warning_faq':
      return (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-950/30 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="text-amber-300" size={22} />
            <h3 className="text-2xl font-black text-white">{asString(data.title, 'Common mistakes')}</h3>
          </div>
          <div className="space-y-3">
            {asArray<Record<string, unknown>>(data.mistakes).map((item, index) => (
              <div key={asString(item.id, String(index))} className="rounded-2xl bg-slate-900/70 p-4">
                <p className="font-black text-amber-200">{asString(item.mistake, 'Mistake')}</p>
                <p className="mt-1 text-xs leading-6 text-slate-300">{asString(item.fix, 'Fix')}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'summary_card':
      return (
        <div className="rounded-3xl border border-indigo-500/20 bg-slate-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="text-indigo-300" size={22} />
            <h3 className="text-2xl font-black text-white">{asString(data.summaryTitle, 'Quick summary')}</h3>
          </div>
          <p className="text-sm font-semibold leading-7 text-slate-300">{asString(data.conceptDiagramDescription, 'Visual summary description.')}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {asArray<string>(data.keyTakeaways).map((item, index) => (
              <div key={index} className="rounded-2xl bg-indigo-500/10 p-4 text-xs font-bold leading-6 text-slate-200">{item}</div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700">
          <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">{subsection} Subsection Detail</span>
          <pre className="mt-3 overflow-auto bg-slate-900 rounded-lg p-3 text-[10px] text-slate-300 max-h-[300px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
  }
}

export function NotesPreview({ subsection, content }: NotesPreviewProps) {
  if (!subsection) {
    const full = asRecord(content);
    const order = [
      'concept_card',
      'definition_block',
      'component_grid',
      'syntax_block',
      'example_panel',
      'practice_card',
      'warning_faq',
      'summary_card',
    ];

    return (
      <div className="space-y-6">
        <div className="bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase text-pink-500 tracking-wider">
            <BookOpen size={16} /> Canonical Notes Section Preview
          </h4>
        </div>
        {order.filter((key) => key in full).map((key) => (
          <PreviewBlock key={key} subsection={key} content={full[key]} />
        ))}
      </div>
    );
  }

  return <PreviewBlock subsection={subsection} content={content} />;
}
