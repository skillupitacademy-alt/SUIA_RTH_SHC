import React from 'react';
import {
  Target,
  BookOpen,
  Lightbulb,
  Code2,
  Check,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';
import type {
  BlockComponentProps,
  DomainTheme,
  TutorialBlockRuntimeContext,
} from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';
import type {
  ObjectiveO2BlockData,
  ObjectiveO2ContentPayload,
  ObjectiveO2Item,
  ObjectiveO2StageKey,
} from '../types/objective-o2.schema';

export type {
  ObjectiveO2BlockData,
  ObjectiveO2ContentPayload as ObjectiveO2BlockContent,
  ObjectiveO2Item,
  ObjectiveO2StageKey,
} from '../types/objective-o2.schema';

interface NormalizedStageItem {
  id: string;
  text: string;
}

interface NormalizedStage {
  key: ObjectiveO2StageKey;
  number: string;
  label: string;
  description: string;
  items: NormalizedStageItem[];
}

const DEFAULT_STAGE_META: Record<
  ObjectiveO2StageKey,
  { number: string; label: string; description: string }
> = {
  know: {
    number: '01',
    label: 'Know',
    description:
      'Key terminology and facts you should be able to recognize and recall.',
  },
  understand: {
    number: '02',
    label: 'Understand',
    description: 'Concepts and relationships you should be able to explain.',
  },
  apply: {
    number: '03',
    label: 'Apply',
    description: 'Practical abilities you should be able to perform.',
  },
};

function normalizeO2Stages(content?: ObjectiveO2ContentPayload): NormalizedStage[] {
  const keys: ObjectiveO2StageKey[] = ['know', 'understand', 'apply'];

  const hasExplicitStages =
    Boolean(content?.stages) &&
    (content?.stages?.know !== undefined ||
      content?.stages?.understand !== undefined ||
      content?.stages?.apply !== undefined);

  if (hasExplicitStages && content?.stages) {
    return keys.map((key) => {
      const stageData = content.stages?.[key];
      const meta = DEFAULT_STAGE_META[key];
      const rawItems = Array.isArray(stageData?.items) ? stageData.items : [];

      const items: NormalizedStageItem[] = [];
      rawItems.forEach((item, idx) => {
        if (typeof item === 'string' && item.trim().length > 0) {
          items.push({ id: `${key}-item-${idx + 1}`, text: item });
        } else if (
          item &&
          typeof item === 'object' &&
          typeof item.text === 'string' &&
          item.text.trim().length > 0
        ) {
          items.push({
            id: item.id ? String(item.id) : `${key}-item-${idx + 1}`,
            text: item.text,
          });
        }
      });

      return {
        key,
        number: meta.number,
        label: stageData?.label || meta.label,
        description: stageData?.description || meta.description,
        items,
      };
    });
  }

  const rawObjectives = Array.isArray(content?.objectives)
    ? content.objectives
    : [];

  const buckets: Record<ObjectiveO2StageKey, NormalizedStageItem[]> = {
    know: [],
    understand: [],
    apply: [],
  };

  rawObjectives.forEach((obj, idx) => {
    if (!obj || typeof obj.text !== 'string' || obj.text.trim().length === 0) {
      return;
    }
    const itemId = obj.id ? String(obj.id) : `obj-${idx + 1}`;
    const itemText = obj.text;
    if (
      obj.stage === 'know' ||
      obj.stage === 'understand' ||
      obj.stage === 'apply'
    ) {
      buckets[obj.stage].push({ id: itemId, text: itemText });
    } else {
      const targetKey = keys[idx % 3];
      buckets[targetKey].push({ id: itemId, text: itemText });
    }
  });

  return keys.map((key) => {
    const meta = DEFAULT_STAGE_META[key];
    return {
      key,
      number: meta.number,
      label: meta.label,
      description: meta.description,
      items: buckets[key],
    };
  });
}

function StageIcon({ stageKey }: { stageKey: ObjectiveO2StageKey }) {
  switch (stageKey) {
    case 'know':
      return <BookOpen aria-hidden="true" className="h-4 w-4" />;
    case 'understand':
      return <Lightbulb aria-hidden="true" className="h-4 w-4" />;
    case 'apply':
      return <Code2 aria-hidden="true" className="h-4 w-4" />;
  }
}

import { BlockShell, BlockHeader } from '../primitives';

function ObjectiveO2View({
  block,
  theme,
  className = '',
  runtimeContext,
}: {
  block: ObjectiveO2BlockData;
  theme: DomainTheme;
  className?: string;
  runtimeContext?: TutorialBlockRuntimeContext;
}) {
  const primary = theme.primary;
  const secondary = theme.secondary;

  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'objective';
  const blockVersion = runtimeContext?.blockVersion ?? block.version ?? 'O2';

  const content = block.content;
  const eyebrow = content?.eyebrow || 'LEARNING OBJECTIVES';
  const title = content?.title || 'What You Will Learn';
  const introduction =
    content?.introduction ||
    'By the end of this lesson, you will know, understand, and be able to apply the following concepts.';

  const stages = normalizeO2Stages(content);

  return (
    <BlockShell
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
      theme={theme}
      className={className}
    >
      <BlockHeader
        eyebrow={eyebrow}
        icon={Target}
        title={title}
        headingLevel="h2"
        titleScale="hero"
        introduction={introduction}
        theme={theme}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.key}>
            <div
              data-stage={stage.key}
              className={`objective-stage objective-${stage.key} rounded-xl border border-t border-white/80 dark:border-white/10 p-4 sm:p-5 transition-all duration-300 shadow-xl hover:shadow-2xl -translate-y-1 hover:-translate-y-2.5 backdrop-blur-md cursor-pointer flex flex-col justify-between`}
              style={{
                backgroundColor: withAlpha(primary, '08'),
                borderColor: withAlpha(primary, '25'),
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs sm:text-sm font-bold"
                      style={{
                        backgroundColor: withAlpha(primary, '18'),
                        color: primary,
                      }}
                      aria-hidden="true"
                    >
                      {stage.number}
                    </span>

                    <h3
                      className="text-lg sm:text-xl font-bold tracking-tight"
                      style={{ color: primary }}
                    >
                      {stage.label}
                    </h3>
                  </div>

                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      backgroundColor: withAlpha(primary, '18'),
                      color: primary,
                    }}
                    aria-hidden="true"
                  >
                    <StageIcon stageKey={stage.key} />
                  </span>
                </div>

                <p
                  className="text-xs sm:text-sm font-medium leading-relaxed mb-4"
                  style={{ color: `${secondary}dd` }}
                >
                  {stage.description}
                </p>

                {stage.items.length > 0 ? (
                  <ul className="space-y-2.5" role="list">
                    {stage.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2.5 text-sm sm:text-base font-medium leading-relaxed"
                        style={{ color: secondary }}
                      >
                        <span
                          className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md mt-0.5"
                          style={{
                            backgroundColor: withAlpha(primary, '18'),
                            color: primary,
                          }}
                          aria-hidden="true"
                        >
                          <Check aria-hidden="true" className="h-3.5 w-3.5" />
                        </span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className="text-xs sm:text-sm italic"
                    style={{ color: `${secondary}99` }}
                  >
                    No objectives specified for this stage.
                  </p>
                )}
              </div>

              {index < stages.length - 1 && (
                <div
                  className="mt-4 pt-3 border-t flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: withAlpha(primary, '18'),
                    color: primary,
                  }}
                  aria-hidden="true"
                >
                  <span>Next: {stages[index + 1].label}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="hidden lg:inline-block h-3.5 w-3.5"
                  />
                  <ArrowDown
                    aria-hidden="true"
                    className="inline-block lg:hidden h-3.5 w-3.5"
                  />
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </BlockShell>
  );
}

export function ObjectiveO2Block({
  block,
  className = '',
  theme,
  runtimeContext,
}: BlockComponentProps) {
  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;
  const typedBlock = block as unknown as ObjectiveO2BlockData;

  if (typedBlock.version && typedBlock.version !== 'O2') {
    throw new Error(
      `[ObjectiveBlock] Unsupported block version: ${String(typedBlock.version)}`
    );
  }

  return (
    <ObjectiveO2View
      block={typedBlock}
      className={className}
      runtimeContext={runtimeContext}
      theme={activeTheme}
    />
  );
}

export const ObjectiveBlock = ObjectiveO2Block;
export { ObjectiveO2Block as default };
