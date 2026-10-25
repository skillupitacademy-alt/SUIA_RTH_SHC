import React from 'react';
import { Target, Check } from 'lucide-react';
import type { BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';
import type { ObjectiveO1BlockData } from '@quiz/types';

export function ObjectiveBlock({
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
  const blockVersion = runtimeContext?.blockVersion ?? block.version;

  const content = block.content;
  const eyebrow = content?.eyebrow ?? 'LEARNING OBJECTIVES';
  const title = content?.title ?? 'What You Will Learn';
  const introduction = content?.introduction ?? 'By the end of this lesson, you will be able to:';
  const objectives = content?.objectives ?? [];

  return (
    <article
      className={`w-full bg-white dark:bg-slate-900 px-[5%] py-8 sm:py-10 transition-colors ${className}`}
      data-block-id={blockId}
      data-block-type={blockType}
      data-block-version={blockVersion}
      style={{ color: secondary }}
    >
      <header className="mb-6">
        {eyebrow && (
          <div 
            className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ 
              color: primary, 
              backgroundColor: withAlpha(primary, '14') 
            }}
          >
            <Target className="h-4 w-4" />
            <span>{eyebrow}</span>
          </div>
        )}
        {title && (
          <h2 
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight"
            style={{ color: secondary }}
          >
            {title}
          </h2>
        )}
        <div 
          className="mb-4 mt-3 h-1 w-12 rounded-full" 
          style={{ backgroundColor: primary }} 
        />
        {introduction && (
          <p 
            className="text-base sm:text-lg font-medium leading-[1.7] max-w-3xl"
            style={{ color: `${secondary}dd` }}
          >
            {introduction}
          </p>
        )}
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
        {objectives.map((obj, index) => (
          <li 
            key={obj.id ?? index}
            className="flex items-start gap-3.5 p-4 sm:p-5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md"
            style={{ 
              backgroundColor: withAlpha(primary, '08'),
              borderColor: withAlpha(primary, '25') 
            }}
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
          </li>
        ))}
      </ul>
    </article>
  );
}

export const ObjectiveO1Block = ObjectiveBlock;
export default ObjectiveBlock;

