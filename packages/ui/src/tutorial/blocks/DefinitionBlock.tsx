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

      {/* Key Characteristics */}
      {page.characteristics && page.characteristics.length > 0 && (
        <div className="my-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Key Characteristics
          </div>
          <ul className="space-y-3">
            {page.characteristics.map((char, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-indigo-500 text-base mt-0.5 flex-shrink-0">
                  {char.icon}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    {char.title}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {char.description}
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
