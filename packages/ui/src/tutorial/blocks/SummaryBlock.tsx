import React from 'react';
import type { ISummaryBlock, BlockComponentProps } from '../types';

export function SummaryBlock({ block, className = '' }: BlockComponentProps<ISummaryBlock>) {
  const { title, points } = block.content;

  return (
    <section
      id={block.id}
      aria-label={title || 'Summary'}
      className={`my-4 p-5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm ${className}`}
      data-block-id={block.id}
      data-block-type="summary"
    >
      <div className="flex items-center gap-2 mb-3 font-bold text-base text-indigo-950 dark:text-indigo-200">
        <span>📌</span>
        <h3>{title || 'Key Takeaways & Summary'}</h3>
      </div>

      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-indigo-500 font-bold select-none">•</span>
            <span className="flex-1">{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
