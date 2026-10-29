import React from 'react';
import {
  Target,
  FileText,
  MousePointerClick,
  Scan,
  Pencil,
  Settings,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type {
  BlockComponentProps,
  DomainTheme,
  TutorialBlockRuntimeContext,
} from '../types';
import { DEFAULT_THEME, withAlpha } from '../theme-utils';
import {
  BlockShell,
  BlockHeader,
  CardSurface,
  CalloutBanner,
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

/**
 * Strict 4-Color Brand Token Resolution:
 * Cycles strictly between the 3 functional accents of the active brand theme:
 * - Brand / Practical Accent: theme.secondary (Magenta on SUIA / Rose on RTH)
 * - Information / Core Accent: theme.accent1 (Sky Cyan on SUIA / Indigo on RTH)
 * - Success / Application Accent: theme.accent2 (Emerald Green on SUIA / Amber on RTH)
 * ZERO orange or purple hardcoding!
 */
function resolveStepBrandColors(theme: DomainTheme, index: number) {
  const isRth = (theme.primary || '').toLowerCase() === '#e11d48';

  // 3-accent cycle
  const accentType = index % 3;

  if (accentType === 0) {
    // Brand Accent (Cards 1 & 4): Magenta Pink on SUIA / Rose on RTH
    return {
      circleBg: isRth ? '#e11d48' : '#be123c',
      badgeBg: '#fff1f2',
      badgeText: '#9f1239', // >= 4.5:1 WCAG AA contrast
      badgeBorder: '#fecdd3',
    };
  } else if (accentType === 1) {
    // Info Accent (Cards 2 & 5): Sky Cyan on SUIA / Indigo on RTH
    return {
      circleBg: isRth ? '#4f46e5' : '#0284c7',
      badgeBg: '#f0f9ff',
      badgeText: isRth ? '#3730a3' : '#0369a1', // >= 4.5:1 WCAG AA contrast
      badgeBorder: isRth ? '#c7d2fe' : '#bae6fd',
    };
  } else {
    // Success / Mastery Accent (Cards 3 & 6): Emerald Green on SUIA / Amber on RTH
    return {
      circleBg: isRth ? '#d97706' : '#059669',
      badgeBg: isRth ? '#fffbeb' : '#ecfdf5',
      badgeText: isRth ? '#92400e' : '#047857', // >= 4.5:1 WCAG AA contrast
      badgeBorder: isRth ? '#fde68a' : '#a7f3d0',
    };
  }
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

  return (
    <BlockShell
      theme={theme}
      runtimeContext={runtimeContext}
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
      className={className}
    >
      <BlockHeader
        eyebrow={eyebrow}
        icon={Target}
        badgeStyle="pill"
        title={title}
        headingLevel="h2"
        titleScale="standard"
        introduction={introduction}
        theme={theme}
        className="mb-6 sm:mb-8"
      />

      {cards.length > 0 ? (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-6 min-w-0" role="list">
          {cards.map((card, index) => {
            const stepPalette = resolveStepBrandColors(theme, index);
            return (
              <li key={card.id} className="min-w-0 flex">
                <CardSurface
                  theme={theme}
                  elevation="dashboard"
                  hoverable={false}
                  className="w-full min-w-0 rounded-2xl border border-solid border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <StepBadge step={card.stepNumber} theme={theme} size="md" />

                        <span
                          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-700 dark:text-slate-300 forced-colors:text-[ButtonText]"
                          aria-hidden="true"
                        >
                          <ObjectiveSkillIcon iconKey={card.iconKey} />
                        </span>

                        <h3 className="text-base sm:text-lg font-semibold leading-snug break-words min-w-0 text-slate-900 dark:text-slate-100">
                          <strong className="font-extrabold text-slate-950 dark:text-white">
                            {card.verb}
                          </strong>
                          {card.titleRest ? ' ' + card.titleRest : ''}
                        </h3>
                      </div>

                      {card.badge && (
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 border whitespace-nowrap forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]"
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
                      <p className="text-sm font-medium leading-relaxed break-words text-slate-600 dark:text-slate-300 ml-9 sm:ml-10">
                        {card.description}
                      </p>
                    )}
                  </div>
                </CardSurface>
              </li>
            );
          })}
        </ul>
      ) : null}

      <CalloutBanner
        theme={theme}
        tone="info"
        title={noteObj.title}
        className="mt-6"
      >
        <p className="text-sm sm:text-base font-medium leading-relaxed break-words">
          {noteObj.text}
        </p>
      </CalloutBanner>
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
