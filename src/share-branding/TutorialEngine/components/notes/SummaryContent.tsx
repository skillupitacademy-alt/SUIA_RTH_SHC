'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

type SummaryData = NonNullable<SubtopicNotesViewData['mainContent']['summary']>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getAssetSrc(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (isRecord(value)) {
    if (value.type === 'inline_svg' && typeof value.dataUri === 'string') {
      return value.dataUri;
    }
    if (typeof value.url === 'string') {
      return value.url;
    }
  }

  return null;
}

function getAssetAlt(value: unknown, fallback = ''): string {
  if (isRecord(value) && typeof value.alt === 'string' && value.alt.trim().length > 0) {
    return value.alt;
  }
  return fallback;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function SummaryContent({ data, title }: { data?: SummaryData; title: string }) {
  const brand = useBrand();
  if (!data) return null;

  const masteryRecap = isRecord(data.masteryRecapCard) ? data.masteryRecapCard : {};
  const nextStepPanel = isRecord(data.nextStepPanel) ? data.nextStepPanel : {};
  const takeaways = records(data.keyTakeawayGrid);
  const checklist = records(data.revisionChecklist);
  const actions = strings(nextStepPanel.actions);
  const heroAssetSrc = getAssetSrc(masteryRecap.heroAsset);
  const heroAssetAlt = getAssetAlt(masteryRecap.heroAsset, `${title} summary illustration`);

  return (
    <div className="min-w-0 space-y-8 pb-20">
      <section className="rounded-[32px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 shadow-xl sm:p-10">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Icons.FileCheck2 size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Summary</p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {text(data.title, `${title} Summary`)}
            </h1>
            <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-800">
              {text(data.description, `Review the most important points from ${title}.`)}
            </p>
          </div>
          {heroAssetSrc ? (
            <div className="sm:ml-auto sm:w-[16rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroAssetSrc} alt={heroAssetAlt} className="w-full rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm" />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <Icons.Target size={22} className="text-emerald-700" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-950">
            {text(masteryRecap.headline, 'What You Should Know Now')}
          </h2>
        </div>
        <p className="break-words text-[15px] font-medium leading-7 text-slate-800">
          {text(masteryRecap.recap, text(masteryRecap.content, 'You have completed the core learning path for this concept.'))}
        </p>
        {text(masteryRecap.confidenceSignal) ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-950">{text(masteryRecap.confidenceSignal)}</p>
          </div>
        ) : null}
      </section>

      {takeaways.length > 0 ? (
        <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.Grid2X2Check size={22} className="text-blue-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">Key Takeaways</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {takeaways.map((item, index) => (
              <article key={text(item.id, `takeaway-${index}`)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-950">{text(item.title, `Takeaway ${index + 1}`)}</p>
                <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-700">{text(item.description)}</p>
                {text(item.importance) ? (
                  <p className="mt-3 break-words text-xs font-bold uppercase tracking-wider text-blue-800">{text(item.importance)}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {checklist.length > 0 ? (
        <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.ListChecks size={22} className="text-indigo-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">Revision Checklist</h2>
          </div>
          <div className="space-y-3">
            {checklist.map((item, index) => (
              <div key={text(item.id, `check-${index}`)} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Icons.CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
                <p className="break-words text-sm font-medium text-slate-800">{text(item.item, text(item.title))}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[32px] border border-amber-100 bg-amber-50 p-5 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <Icons.ArrowRightCircle size={22} className="text-amber-800" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-950">{text(nextStepPanel.title, 'Recommended Next Step')}</h2>
        </div>
        <p className="break-words text-sm font-medium leading-6 text-slate-800">
          {text(nextStepPanel.description, 'Move to the next practice or project section to apply this concept.')}
        </p>
        {actions.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {actions.map((action, index) => (
              <li key={index} className="flex items-start gap-3 text-sm font-bold text-amber-950">
                <Icons.ChevronRight size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="break-words">{action}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
