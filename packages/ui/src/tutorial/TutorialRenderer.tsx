import React from 'react';
import type { TutorialRendererProps } from './types';
import { TutorialBlockRenderer } from './TutorialBlockRenderer';

export function TutorialRenderer({
  document,
  sectionType,
  theme,
  className = '',
}: TutorialRendererProps) {
  if (!document || !document.blocks || document.blocks.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`my-8 p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${className}`}
      >
        <div className="text-3xl mb-2">📝</div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No tutorial content is available yet.
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {sectionType
            ? `Content for the "${sectionType}" section is currently being composed.`
            : 'Check back shortly for published learning content.'}
        </p>
      </div>
    );
  }

  return (
    <article
      className={`tutorial-renderer flex flex-col space-y-4 max-w-4xl w-full mx-auto text-slate-900 dark:text-slate-100 ${className}`}
      data-schema-version={document.schemaVersion}
    >
      {document.blocks.map((block, index) => (
        <TutorialBlockRenderer
          key={block.id || `block-${index}`}
          block={block}
          depth={0}
          theme={theme}
        />
      ))}
    </article>
  );
}
