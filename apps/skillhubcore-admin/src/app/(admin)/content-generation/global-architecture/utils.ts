/**
 * Utility functions for Global Architecture
 */

import { Layout, Zap, Brain, Edit2, Layers, Palette, Info, RotateCcw } from 'lucide-react';
import { getStrictSectionJsonTemplate } from '../../tools/prompt-generator/lib/prompt-templates';
import { NOTES_SUBSECTION_ALIASES } from './constants';

export const formatTitle = (str: string) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' Architecture', '')
    .replace(' Uiux', ' UI/UX');
};

export const getIconForComponent = (index: number) => {
  const icons = [Layout, Zap, Brain, Edit2, Layers, Palette, Info, RotateCcw];
  return icons[index % icons.length];
};

export const getColorForComponent = (index: number) => {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
    { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-50 text-orange-700' },
    { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700' },
    { bg: 'bg-pink-100', text: 'text-pink-600', badge: 'bg-pink-50 text-pink-700' },
    { bg: 'bg-teal-100', text: 'text-teal-600', badge: 'bg-teal-50 text-teal-700' },
    { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-50 text-purple-700' },
    { bg: 'bg-rose-100', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700' },
  ];
  return colors[index % colors.length];
};

export const getPromptSectionId = (sectionId: string) => 
  sectionId === 'reallife' ? 'real_life' : sectionId;

export const normalizePipelineSubsectionId = (sectionId: string, subsectionId: string | null) => {
  if (!subsectionId) return null;
  if (sectionId === 'notes') return NOTES_SUBSECTION_ALIASES[subsectionId] || subsectionId;
  return subsectionId;
};

export const getDefaultPipelineJson = (sectionId: string, subsectionId: string | null, subtopicName: string) => {
  const template = getStrictSectionJsonTemplate(getPromptSectionId(sectionId), subtopicName);
  const rootKey = Object.keys(template)[0];
  const rootValue = template[rootKey];
  const normalizedSubsectionId = normalizePipelineSubsectionId(sectionId, subsectionId);

  if (
    normalizedSubsectionId &&
    rootValue &&
    typeof rootValue === 'object' &&
    !Array.isArray(rootValue) &&
    normalizedSubsectionId in rootValue
  ) {
    return (rootValue as Record<string, unknown>)[normalizedSubsectionId];
  }

  return template;
};

export const htmlEscape = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const normalizeHexColor = (value: unknown, fallback: string) => {
  const raw = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
};

export const mixHexColors = (primary: string, secondary: string, secondaryRatio: number) => {
  const first = normalizeHexColor(primary, '#4f46e5').replace('#', '');
  const second = normalizeHexColor(secondary, '#10b981').replace('#', '');
  const firstRatio = 1 - secondaryRatio;
  const toChannel = (start: string, end: string) => {
    const mixed = Math.round(parseInt(start, 16) * firstRatio + parseInt(end, 16) * secondaryRatio);
    return mixed.toString(16).padStart(2, '0');
  };
  return `#${toChannel(first.slice(0, 2), second.slice(0, 2))}${toChannel(first.slice(2, 4), second.slice(2, 4))}${toChannel(first.slice(4, 6), second.slice(4, 6))}`;
};

export const asPreviewRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

export const firstPreviewText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
};

export const normalizePreviewContentForStrictSchema = (
  sectionId: string,
  subsectionId: string | null,
  content: unknown,
  fallback: unknown
) => {
  const normalizedSubsectionId = normalizePipelineSubsectionId(sectionId, subsectionId);
  const record = asPreviewRecord(content);

  if (sectionId === 'notes' && normalizedSubsectionId === 'concept_card') {
    const quickLook = Array.isArray(record.quickLook)
      ? record.quickLook.map((item) => String(item)).filter(Boolean)
      : [];

    return {
      heroTitle: firstPreviewText(record.heroTitle, record.title, 'Notes Overview'),
      heroSubtitle: firstPreviewText(record.heroSubtitle, record.description, 'A clear learner-facing notes introduction.'),
      quickLook: quickLook.length > 0 ? quickLook : ['Definition', 'Mechanics', 'Syntax', 'Examples'],
    };
  }

  return content || fallback;
};

export const buildStarterHtmlFromRenderer = (content: unknown, contract: Record<string, unknown> | null | undefined) => {
  const record = asPreviewRecord(content);
  const title = htmlEscape(record.title || record.headline || 'What is Python?');
  const description = htmlEscape(record.description || record.content || 'Clear overview of the selected learning topic.');
  const iconLabel = htmlEscape(record.iconLabel || record.badge || 'JS');
  const difficulty = htmlEscape(record.difficulty || record.level || 'Beginner');
  const topicsCount = htmlEscape(record.topicsCount || record.lessonsCount || 10);
  const lastUpdated = htmlEscape(record.lastUpdated || 'Today');
  const primary = htmlEscape(contract?.primary_color || '#4f46e5');
  const accent = htmlEscape(contract?.accent_color || contract?.primary_color_dark || '#10b981');
  const bg = htmlEscape(contract?.background_color || '#ffffff');
  const text = htmlEscape(contract?.text_color || '#0f172a');
  const border = htmlEscape(contract?.border_color || '#dbeafe');

  return `<section class="overflow-hidden rounded-3xl border p-8 shadow-xl" style="background:${bg}; border-color:${border}; color:${text};">
  <div class="space-y-7">
    <div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="rounded-full px-3 py-1 text-xs font-black text-white" style="background:${primary};">${iconLabel}</span>
        <span class="rounded-full border px-3 py-1 text-xs font-bold" style="border-color:${accent}; color:${accent};">${difficulty}</span>
      </div>
      <h1 class="text-4xl font-black leading-tight lg:text-5xl">${title}</h1>
      <p class="mt-4 max-w-2xl text-base font-semibold leading-7 text-slate-600">${description}</p>
      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border bg-white px-5 py-4 shadow-sm" style="border-color:${border};">
          <p class="text-2xl font-black" style="color:${primary};">${topicsCount}</p>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Learning blocks</p>
        </div>
        <div class="rounded-2xl border bg-white px-5 py-4 shadow-sm" style="border-color:${border};">
          <p class="text-2xl font-black" style="color:${primary};">${lastUpdated}</p>
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</p>
        </div>
      </div>
      <div class="mt-7 flex flex-wrap gap-3">
        <button class="rounded-full px-5 py-3 text-sm font-black text-white" style="background:${accent};">Start learning</button>
        <button class="rounded-full border bg-white px-5 py-3 text-sm font-black" style="border-color:${border}; color:${primary};">View roadmap</button>
      </div>
    </div>
  </div>
</section>`;
};
