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
import { withAlpha, DEFAULT_THEME } from '../theme-utils';
import {
  BlockShell,
  BlockHeader,
  CardSurface,
  CalloutBanner,
  StepBadge,
} from '../primitives';

export interface ObjectiveO1Item {
  id: string;
  text?: string;
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

const DEFAULT_ICONS = [
  'create',
  'access',
  'extract',
  'modify',
  'use',
  'explain',
];

function splitVerbAndRest(
  rawTitle: string,
  explicitVerb?: string
): { verb: string; titleRest: string } {
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
  return {
    verb: trimmed.slice(0, spaceIdx),
    titleRest: trimmed.slice(spaceIdx + 1).trim(),
  };
}

function normalizeObjectiveItems(
  content?: ObjectiveO1BlockContent
): NormalizedObjectiveCard[] {
  const rawList =
    Array.isArray(content?.objectives) && content.objectives.length > 0
      ? content.objectives
      : Array.isArray(content?.goals)
      ? content.goals
      : [];

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
        ? entry.text.trim()
        : '';

    if (!rawHeading) return;

    const rawDesc =
      typeof entry.description === 'string' && entry.description.trim().length > 0
        ? entry.description.trim()
        : typeof entry.title === 'string' &&
          typeof entry.text === 'string' &&
          entry.title.trim() !== entry.text.trim()
        ? entry.text.trim()
        : '';

    const parts = splitVerbAndRest(
      rawHeading,
      typeof entry.verb === 'string' ? entry.verb : undefined
    );

    const badgeText =
      typeof entry.badge === 'string' && entry.badge.trim().length > 0
        ? entry.badge.trim()
        : typeof entry.category === 'string' && entry.category.trim().length > 0
        ? entry.category.trim()
        : DEFAULT_BADGES[idx % DEFAULT_BADGES.length];

    const iconKey =
      typeof entry.icon === 'string' && entry.icon.trim().length > 0
        ? entry.icon.trim().toLowerCase()
        : parts.verb.toLowerCase() || DEFAULT_ICONS[idx % DEFAULT_ICONS.length];

    cards.push({
      id:
        typeof entry.id === 'string' && entry.id.trim().length > 0
          ? entry.id.trim()
          : 'obj-' + String(idx + 1),
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

function resolveCategoryPillClasses(index: number): string {
  const accentCycle = [
    'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700',
    'bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 border-sky-300 dark:border-sky-700',
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700',
  ];
  return accentCycle[index % accentCycle.length];
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
  const blockType = runtimeContext?.blockType ?? block.type ?? 'objective';
  const blockVersion = runtimeContext?.blockVersion ?? block.version ?? 'O1';

  const content = block.content;
  const eyebrow = content?.eyebrow?.trim() || 'LEARNING OBJECTIVES';
  const title = content?.title?.trim() || 'Skills You Will Develop in This Lesson';
  const introduction =
    content?.introduction?.trim() ||
    content?.subtitle?.trim() ||
    'By the end of this lesson, you will have the following practical skills:';
  const cards = normalizeObjectiveItems(content);

  const noteObj: ObjectiveO1Note =
    typeof content?.note === 'string' && content.note.trim().length > 0
      ? { title: 'Note', text: content.note.trim() }
      : content?.note &&
        typeof content.note === 'object' &&
        typeof content.note.text === 'string' &&
        content.note.text.trim().length > 0
      ? {
          title: content.note.title?.trim() || 'Note',
          text: content.note.text.trim(),
        }
      : {
          title: 'Note',
          text: 'These are observable, practical skills you will develop in this lesson. Each skill will be demonstrated with clear examples and hands-on practice.',
        };

  return (
    <BlockShell
      theme={theme}
      runtimeContext={runtimeContext}
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
      className={className}
    >
      <div className="mb-6 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <BlockHeader
              eyebrow={eyebrow}
              title={title}
              introduction={introduction}
              icon={Target}
              theme={theme}
              titleScale="hero"
              headingLevel="h1"
              showAccentBar={true}
            />
          </div>

          <span
            className="text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center px-3 py-1 rounded-xl border border-solid border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100 flex-shrink-0 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]"
            style={{ backgroundColor: withAlpha(primary, '14') }}
          >
            {blockVersion}
          </span>
        </div>
      </div>

      {cards.length > 0 ? (
        <ol
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6 min-w-0 list-none p-0 m-0"
          role="list"
        >
          {cards.map((card, index) => {
            const pillClasses = resolveCategoryPillClasses(index);
            return (
              <li key={card.id} className="min-w-0 flex">
                <CardSurface
                  theme={theme}
                  elevation="dashboard"
                  className="w-full min-w-0 rounded-2xl border border-solid border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl transition-colors flex flex-col justify-between forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas]"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <StepBadge
                        step={card.stepNumber}
                        theme={theme}
                        size="md"
                      />

                      <span
                        className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-xl border border-solid border-slate-400 dark:border-slate-600 text-slate-900 dark:text-slate-100 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas] forced-colors:text-[ButtonText]"
                        style={{ backgroundColor: withAlpha(primary, '18') }}
                        aria-hidden="true"
                      >
                        <ObjectiveSkillIcon iconKey={card.iconKey} />
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold leading-snug break-words min-w-0 text-slate-900 dark:text-slate-100">
                          <strong className="font-extrabold text-slate-900 dark:text-slate-100">
                            {card.verb}
                          </strong>
                          {card.titleRest ? ' ' + card.titleRest : ''}
                        </h2>

                        {card.badge ? (
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border border-solid forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas] ${pillClasses}`}
                          >
                            {card.badge}
                          </span>
                        ) : null}
                      </div>

                      {card.description ? (
                        <p className="text-sm sm:text-base font-medium leading-relaxed break-words text-slate-900 dark:text-slate-100">
                          {card.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardSurface>
              </li>
            );
          })}
        </ol>
      ) : (
        <ul className="space-y-2.5 mb-6 min-w-0 list-none p-0 m-0" role="list">
          <li className="min-w-0">
            <CardSurface
              theme={theme}
              elevation="subtle"
              className="w-full min-w-0 rounded-2xl border border-solid border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 text-sm sm:text-base font-medium leading-relaxed text-slate-900 dark:text-slate-100 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText]"
            >
              No learning objectives specified for this lesson.
            </CardSurface>
          </li>
        </ul>
      )}

      <CalloutBanner
        theme={theme}
        tone="info"
        title={noteObj.title}
        icon={Lightbulb}
        className="w-full min-w-0 rounded-2xl border border-solid border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-5 sm:p-6 shadow-xl forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:bg-[Canvas]"
      >
        <p className="text-sm sm:text-base font-medium leading-relaxed break-words text-slate-900 dark:text-slate-100">
          {noteObj.text}
        </p>
      </CalloutBanner>
    </BlockShell>
  );
}

export function ObjectiveO1Block({
  block,
  className = '',
  theme,
  runtimeContext,
}: BlockComponentProps) {
  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;
  const typedBlock = block as unknown as ObjectiveO1BlockData;
  const effectiveVersion =
    runtimeContext?.blockVersion ?? typedBlock?.version ?? 'O1';

  switch (effectiveVersion) {
    case 'O1':
      return (
        <ObjectiveO1View
          block={typedBlock}
          theme={activeTheme}
          className={className}
          runtimeContext={runtimeContext}
        />
      );
    default:
      throw new Error(
        `[ObjectiveBlock] Unsupported block version: ${String(effectiveVersion)}`
      );
  }
}

export const ObjectiveBlock = ObjectiveO1Block;
export { ObjectiveO1Block as default };
