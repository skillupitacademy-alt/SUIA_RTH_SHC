import React from 'react';
import { Target, Check } from 'lucide-react';
import type { BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';
import type { ObjectiveO1BlockData } from '@quiz/types';

export function ObjectiveO1Block({
  block,
  className = '',
  theme,
  runtimeContext,
}: BlockComponentProps) {
  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;

  const version = 'version' in block ? (block as any).version : undefined;
  switch (version) {
    case 'O1':
      return (
        <ObjectiveO1View
          block={block as unknown as ObjectiveO1BlockData}
          theme={activeTheme}
          className={className}
          runtimeContext={runtimeContext}
        />
      );
    default:
      throw new Error(`[ObjectiveBlock] Unsupported block version: ${String(version)}`);
  }
}

export const ObjectiveBlock = ObjectiveO1Block;
export { ObjectiveO1Block as default };

import { BlockShell, BlockHeader, CardSurface } from '../primitives';

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
  const secondary = theme.secondary;

  // UBRC: Runtime context fallback
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'objective';
  const blockVersion = runtimeContext?.blockVersion ?? block.version ?? 'O1';

  const content = block.content;
  const eyebrow = content?.eyebrow ?? 'LEARNING OBJECTIVES';
  const title = content?.title ?? 'What You Will Learn';
  const introduction = content?.introduction ?? 'By the end of this lesson, you will be able to:';
  const objectives = content?.objectives ?? [];

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

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
        {objectives.map((obj, index) => (
          <CardSurface
            as="li"
            key={obj.id ?? index}
            theme={theme}
            variant="accent"
            elevation="dashboard"
            hoverable={false}
            className="flex items-start gap-3.5 p-4 sm:p-5"
          >
            <span
              className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg mt-0.5"
              style={{ 
                backgroundColor: withAlpha(primary, '18'),
                color: primary 
              }}
              aria-hidden="true"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
            </span>
            <span 
              className="text-sm sm:text-base font-medium leading-relaxed"
              style={{ color: secondary }}
            >
              {obj.text}
            </span>
          </CardSurface>
        ))}
      </ul>
    </BlockShell>
  );
}

export const ObjectiveO1Block = ObjectiveBlock;
export default ObjectiveBlock;

