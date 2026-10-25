import React from 'react';
import type { BlockComponentProps, DomainTheme, TutorialBlockRuntimeContext } from '../types';
import { getThemeColor, withAlpha, DEFAULT_THEME } from '../theme-utils';
import type { ObjectiveO1BlockData } from '@quiz/types';

export function ObjectiveBlock({
  block,
  className = '',
  theme,
  runtimeContext,
}: BlockComponentProps) {
  const activeTheme: DomainTheme = theme ?? DEFAULT_THEME;

  switch (block.version) {
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
      throw new Error(`[ObjectiveBlock] Unsupported block version: ${String(block.version)}`);
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
      className={`tutorial-block objective-block objective-o1 p-6 rounded-xl border transition-all ${className}`}
      data-block-id={blockId}
      data-block-type={blockType}
      data-block-version={blockVersion}
      style={{
        backgroundColor: theme.slate?.[50] ?? getThemeColor(theme, 'slate', 50),
        borderColor: withAlpha(primary, '20'),
      }}
    >
      <header className="objective-header mb-4">
        {eyebrow && (
          <span 
            className="objective-eyebrow text-xs font-bold uppercase tracking-wider block mb-1"
            style={{ color: primary }}
          >
            {eyebrow}
          </span>
        )}
        {title && (
          <h2 
            className="objective-title text-2xl font-bold"
            style={{ color: secondary }}
          >
            {title}
          </h2>
        )}
      </header>

      {introduction && (
        <div className="objective-introduction mb-4">
          <p 
            className="text-sm font-medium"
            style={{ color: secondary }}
          >
            {introduction}
          </p>
        </div>
      )}

      <ul className="objective-list space-y-3" role="list">
        {objectives.map((obj, index) => (
          <li 
            key={obj.id ?? index}
            className="objective-item flex items-start gap-3 p-3 rounded-lg border shadow-sm"
            style={{ 
              backgroundColor: theme.slate?.[0] ?? '#ffffff',
              borderColor: withAlpha(primary, '15') 
            }}
          >
            <span
              className="objective-check flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ 
                backgroundColor: withAlpha(primary, '15'),
                color: primary 
              }}
              aria-hidden="true"
            >
              ✓
            </span>
            <span 
              className="objective-text text-sm leading-relaxed"
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
