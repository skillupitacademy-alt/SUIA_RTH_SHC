import React from 'react';
import type { IQuoteBlock, BlockComponentProps } from '../types';

export function QuoteBlock({ block, className = '' }: BlockComponentProps<IQuoteBlock>) {
  const { text, attribution, source } = block.content;

  return (
    <figure
      id={block.id}
      data-block-id={block.id}
      data-block-type="quote"
      className={`my-4 p-4 rounded-lg border-l-4 border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/30 ${className}`}
    >
      <blockquote className="text-base italic leading-relaxed text-slate-800 dark:text-slate-200">
        <p>"{text}"</p>
      </blockquote>

      {(attribution || source) && (
        <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 justify-end">
          <span>—</span>
          {attribution && <span className="font-semibold text-slate-700 dark:text-slate-300">{attribution}</span>}
          {source && <cite className="not-italic text-slate-500 dark:text-slate-400">({source})</cite>}
        </figcaption>
      )}
    </figure>
  );
}
