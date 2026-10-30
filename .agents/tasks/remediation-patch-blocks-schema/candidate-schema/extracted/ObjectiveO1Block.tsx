import React from 'react';
import {
  Target,
  FileText,
  MousePointerClick,
  Scan,
  Pencil,
  Settings,
  CheckCircle2,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type {
  BlockComponentProps,
  DomainTheme,
  TutorialBlockRuntimeContext,
} from '../types';
import { getThemeColor, withAlpha, DEFAULT_THEME } from '../theme-utils';
import {
  BlockShell,
  CardSurface,
  StepBadge,
} from '../primitives';

export interface ObjectiveO1Item {
  id: string;
  text: string;
  verb?: string;
  title?: string;
  description?: string;
  badge?: string;
  category?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface ObjectiveO1Note {
  title?: string;
  text: string;
}

export interface ObjectiveO1BlockContent {
  eyebrow?: string;
  title?: string;
  titleHighlight?: string;
  introduction?: string;
  subtitle?: string;
  objectives: Array<ObjectiveO1Item>;
  goals?: Array<string | ObjectiveO1Item>;
  note?: string | ObjectiveO1Note;
  [key: string]: unknown;
}

export interface ObjectiveO1BlockData {
  id: string;
  type: string;
  version: string;
  content?: ObjectiveO1BlockContent;
  [key: string]: unknown;
}

interface NormalizedObjectiveCard {
  id: string;
  stepNumber: number;
  verb: string;
  titleRest: string;
  description: string;
  badge: string;
  iconKey: string;
}

const DEFAULT_BADGES = [
  'Practical Skill',
  'Core Skill',
  'Core Skill',
  'Practical Skill',
  'Practical Skill',
  'Understanding',
];

const DEFAULT_ICONS = ['create', 'access', 'extract', 'modify', 'use', 'explain'];

function splitVerbAndRest(rawTitle: string, explicitVerb?: string): { verb: string; titleRest: string } {
  const trimmed = rawTitle.trim();
  if (explicitVerb && explicitVerb.trim().length > 0) {
    const v = explicitVerb.trim();
    if (trimmed.toLowerCase().startsWith(v.toLowerCase())) {
      return { verb: v, titleRest: trimmed.slice(v.length).trim() };
    }
    return { verb: v, titleRest: trimmed };
  }
  const spaceIdx = trimmed.indexOf(' ');
  if (spaceIdx === -1) return { verb: trimmed, titleRest: '' };
  return { verb: trimmed.slice(0, spaceIdx), titleRest: trimmed.slice(spaceIdx + 1).trim() };
}

function normalizeObjectiveItems(content?: ObjectiveO1BlockContent): NormalizedObjectiveCard[] {
  const rawList = Array.isArray(content?.objectives) && content.objectives.length > 0
    ? content.objectives
    : Array.isArray(content?.goals) ? content.goals : [];

  const cards: NormalizedObjectiveCard[] = [];

  rawList.forEach((entry, idx) => {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed) return;
      const parts = splitVerbAndRest(trimmed);
      cards.push({
        id: 'obj-' + String(idx + 1),
        stepNumber: idx + 1,
        verb: parts.verb,
        titleRest: parts.titleRest,
        description: '',
        badge: DEFAULT_BADGES[idx % DEFAULT_BADGES.length],
        iconKey: DEFAULT_ICONS[idx % DEFAULT_ICONS.length],
      });
      return;
    }

    if (!entry || typeof entry !== 'object') return;

    const rawHeading =
      typeof entry.title === 'string' && entry.title.trim().length > 0
        ? entry.title.trim()
        : typeof entry.text === 'string' && entry.text.trim().length > 0
        ? entry.text.trim() : '';

    if (!rawHeading) return;

    const rawDesc =
      typeof entry.description === 'string' && entry.description.trim().length > 0
        ? entry.description.trim()
        : typeof entry.title === 'string' && typeof entry.text === 'string' && entry.title.trim() !== entry.text.trim()
        ? entry.text.trim() : '';

    const parts = splitVerbAndRest(rawHeading, typeof entry.verb === 'string' ? entry.verb : undefined);

    const badgeText =
      typeof entry.badge === 'string' && entry.badge.trim().length > 0
        ? entry.badge.trim()
        : typeof entry.category === 'string' && entry.category.trim().length > 0
        ? entry.category.trim() : DEFAULT_BADGES[idx % DEFAULT_BADGES.length];

    const iconKey =
      typeof entry.icon === 'string' && entry.icon.trim().length > 0
        ? entry.icon.trim().toLowerCase()
        : parts.verb.toLowerCase() || DEFAULT_ICONS[idx % DEFAULT_ICONS.length];

    cards.push({
      id: typeof entry.id === 'string' && entry.id.trim().length > 0 ? entry.id.trim() : 'obj-' + String(idx + 1),
      stepNumber: idx + 1,
      verb: parts.verb,
      titleRest: parts.titleRest,
      description: rawDesc,
      badge: badgeText,
      iconKey,
    });
  });

  return cards;
}

function resolveStepColors(theme: DomainTheme, index: number) {
  const colorPalette = [
    { circleBg: '#be123c', badgeBg: '#fef1f6', badgeText: '#9f1239', badgeBorder: '#fbcfe8' },
    { circleBg: '#1d4ed8', badgeBg: '#eff6ff', badgeText: '#1e3a8a', badgeBorder: '#bfdbfe' },
    { circleBg: '#047857', badgeBg: '#ecfdf5', badgeText: '#064e3b', badgeBorder: '#a7f3d0' },
    { circleBg: '#b45309', badgeBg: '#fffbeb', badgeText: '#78350f', badgeBorder: '#fde68a' },
    { circleBg: '#7e22ce', badgeBg: '#faf5ff', badgeText: '#581c87', badgeBorder: '#e9d5ff' },
    { circleBg: '#0f172a', badgeBg: '#f8fafc', badgeText: '#0f172a', badgeBorder: '#cbd5e1' },
  ];
  return colorPalette[index % colorPalette.length];
}

function ObjectiveSkillIcon({ iconKey }: { iconKey: string }) {
  switch (iconKey) {
    case 'create':
      return <FileText aria-hidden="true" className="h-5 w-5" />;
    case 'access':
      return <MousePointerClick aria-hidden="true" className="h-5 w-5" />;
    case 'extract':
      return <Scan aria-hidden="true" className="h-5 w-5" />;
    case 'modify':
      return <Pencil aria-hidden="true" className="h-5 w-5" />;
    case 'use':
      return <Settings aria-hidden="true" className="h-5 w-5" />;
    case 'explain':
      return <CheckCircle2 aria-hidden="true" className="h-5 w-5" />;
    default:
      return <Sparkles aria-hidden="true" className="h-5 w-5" />;
  }
}

function ObjectiveO1View({
  block,
  theme,
  className = '',
  runtimeContext,
}: {
  block: ObjectiveO1BlockData;
  theme: DomainTheme;
  className?: string;
  runtimeContext?: TutorialBlockRuntimeContext;
}) {
  const primary = theme.primary;
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'objective';
  const blockVersion = runtimeContext?.blockVersion ?? block.version ?? 'O1';

  const content = block.content;
  const eyebrow = content?.eyebrow?.trim() || 'LEARNING OBJECTIVES';
  const title = content?.title?.trim() || 'Skills You Will Develop in This Lesson';
  const introduction = content?.introduction?.trim() || 'By the end of this lesson, you will have the following practical skills:';
  const cards = normalizeObjectiveItems(content);

  const noteObj: ObjectiveO1Note = typeof content?.note === 'string' && content.note.trim().length > 0
    ? { title: 'Note', text: content.note.trim() }
    : content?.note && typeof content.note === 'object' && typeof content.note.text === 'string' && content.note.text.trim().length > 0
    ? { title: content.note.title?.trim() || 'Note', text: content.note.text.trim() }
    : {
        title: 'Note',
        text: 'These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice.',
      };

  const highlight = content?.titleHighlight?.trim() || (title.includes('Will Develop') ? 'Will Develop' : '');
  const highlightIdx = highlight ? title.indexOf(highlight) : -1;

  return (
    <BlockShell
      theme={theme}
      runtimeContext={runtimeContext}
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
      className={className}
    >
      <header className="mb-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div
            className="text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]"
          >
            <Target aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-pink-700 dark:text-pink-300" />
            <span>{eyebrow}</span>
          </div>

          <span
            className="text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center px-3 py-1 rounded-xl border border-pink-200 dark:border-pink-900/40 bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]"
          >
            {blockVersion}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight break-words text-slate-900 dark:text-slate-100">
          {highlightIdx !== -1 ? (
            <>
              {title.slice(0, highlightIdx)}
              <span
                className="underline decoration-4 underline-offset-4 font-extrabold text-slate-900 dark:text-slate-100"
                style={{ textDecorationColor: primary }}
              >
                {title.slice(highlightIdx, highlightIdx + highlight.length)}
              </span>
              {title.slice(highlightIdx + highlight.length)}
            </>
          ) : (
            title
          )}
        </h2>

        <div
          className="mb-4 mt-3 h-1 w-12 rounded-full border border-solid border-slate-700 dark:border-slate-300 forced-colors:!border-[ButtonText]"
          style={{ backgroundColor: primary }}
          aria-hidden="true"
        />

        <p className="text-base sm:text-lg font-medium leading-[1.7] max-w-3xl mb-6 break-words text-slate-700 dark:text-slate-300">
          {introduction}
        </p>
      </header>

      {cards.length > 0 ? (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6 min-w-0" role="list">
          {cards.map((card, index) => {
            const stepPalette = resolveStepColors(theme, index);
            return (
              <li key={card.id} className="min-w-0 flex">
                <CardSurface
                  theme={theme}
                  elevation="subtle"
                  className="w-full min-w-0 rounded-2xl border border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm transition-colors flex flex-col justify-between forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas]"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold text-white shadow-xs border border-white/20 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]"
                        style={{ backgroundColor: stepPalette.circleBg }}
                      >
                        {card.stepNumber}
                      </span>

                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl border border-dashed border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[ButtonText]"
                        aria-hidden="true"
                      >
                        <ObjectiveSkillIcon iconKey={card.iconKey} />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold leading-snug break-words min-w-0 text-slate-900 dark:text-slate-100">
                          <strong className="font-extrabold text-slate-950 dark:text-white">
                            {card.verb}
                          </strong>
                          {card.titleRest ? ' ' + card.titleRest : ''}
                        </h3>

                        {card.badge && (
                          <span
                            className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]"
                            style={{
                              backgroundColor: stepPalette.badgeBg,
                              color: stepPalette.badgeText,
                              borderColor: stepPalette.badgeBorder,
                            }}
                          >
                            {card.badge}
                          </span>
                        )}
                      </div>

                      {card.description && (
                        <p className="text-sm sm:text-base font-medium leading-relaxed break-words text-slate-600 dark:text-slate-300">
                          {card.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardSurface>
              </li>
            );
          })}
        </ul>
      ) : null}

      <CardSurface
        theme={theme}
        elevation="subtle"
        className="w-full min-w-0 rounded-2xl border border-solid border-sky-200 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-950/20 p-4 sm:p-5 shadow-sm forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas]"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <span
            className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl mt-0.5 border border-sky-300 dark:border-sky-800 bg-white dark:bg-sky-900 text-sky-700 dark:text-sky-300 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[ButtonText]"
            aria-hidden="true"
          >
            <Lightbulb aria-hidden="true" className="h-5 w-5" />
          </span>

          <div className="flex-1 min-w-0">
            {noteObj.title && (
              <div className="text-sm sm:text-base font-bold mb-1 break-words text-sky-950 dark:text-sky-100">
                {noteObj.title}
              </div>
            )}
            <p className="text-sm sm:text-base font-medium leading-relaxed break-words text-sky-900/90 dark:text-sky-200/90">
              {noteObj.text}
            </p>
          </div>
        </div>
      </CardSurface>
    </BlockShell>
  );
}

export function ObjectiveBlock({ block, className = '', theme, runtimeContext }: BlockComponentProps) {
  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;
  const typedBlock = block as unknown as ObjectiveO1BlockData;
  const effectiveVersion = runtimeContext?.blockVersion ?? typedBlock.version ?? 'O1';

  switch (effectiveVersion) {
    case 'O1':
      return <ObjectiveO1View block={typedBlock} theme={activeTheme} className={className} runtimeContext={runtimeContext} />;
    default:
      throw new Error('[ObjectiveBlock] Unsupported block version: ' + String(effectiveVersion));
  }
}

export const ObjectiveO1Block = ObjectiveBlock;
export { ObjectiveO1Block as default };
