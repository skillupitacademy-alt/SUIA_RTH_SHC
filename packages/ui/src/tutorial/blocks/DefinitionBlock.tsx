import React from 'react';
import type { IDefinitionBlock, BlockComponentProps } from '../types';

/**
 * Definition Block - Version Router
 * Routes to version-specific implementation based on block.version
 */
export function DefinitionBlock({ 
  block, 
  className = '' 
}: BlockComponentProps<IDefinitionBlock>) {
  // Explicit version check
  if (!block.version) {
    throw new Error(
      `[DefinitionBlock] Missing version field for block ${block.id}`
    );
  }

  // Version routing
  switch (block.version) {
    case 'D1':
      return <DefinitionD1View block={block} className={className} />;
    default:
      throw new Error(
        `[DefinitionBlock] Unsupported Definition version: ${block.version}`
      );
  }
}

/**
 * Definition D1 View
 * Renders Definition D1 using page.* structure
 * 
 * Layout preserves researched Definition UI/UX:
 * - Category label (learner-facing content, not hierarchy)
 * - Title
 * - Intro paragraph
 * - Definition card
 * - Explanation paragraphs
 * - Code example
 * - Key characteristics list
 * - Key takeaway
 */
function DefinitionD1View({ 
  block, 
  className = '' 
}: { 
  block: IDefinitionBlock; 
  className?: string;
}) {
  const { page } = block.content;

  return (
    <article
      id={block.id}
      className={`my-6 p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 shadow-sm ${className}`}
    >
      {/* Category - learner-facing label */}
      {page.category && (
        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">
          {page.category}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
        <span className="text-indigo-500 text-lg">📖</span>
        <span>{page.title}</span>
      </h3>

      {/* Intro */}
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
        {page.intro}
      </p>

      {/* Definition Card */}
      <div className="my-4 p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Definition
          </span>
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          {page.definition}
        </p>
      </div>

      {/* Explanation paragraphs */}
      {page.explanation && page.explanation.length > 0 && (
        <div className="my-4 space-y-3">
          {page.explanation.map((paragraph, index) => (
            <p 
              key={index} 
              className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {/* Code Example */}
      {page.example && page.example.code && (
        <div className="my-4 rounded-lg overflow-hidden border border-slate-700/60 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
            {page.example.language}
          </div>
          <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-slate-100">
            <code className={`language-${page.example.language}`}>
              {page.example.code}
            </code>
          </pre>
        </div>
      )}

      {/* Key Characteristics - Responsive Grid (1 col mobile, 2 col tablet, 3-4 col desktop) */}
      {page.characteristics && page.characteristics.length > 0 && (
        <div className="my-6">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <span>✨</span>
            <span>Key Characteristics</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 w-full">
            {page.characteristics.map((char, index) => (
              <div 
                key={index} 
                className="flex flex-col rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-sm font-bold shrink-0">
                    {char.icon || '○'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words flex-1">
                    {char.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words flex-1">
                  {char.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaway */}
      {page.takeaway && (
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💡</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Key Takeaway
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {page.takeaway}
          </p>
        </div>
      )}
    </article>
  );
}
