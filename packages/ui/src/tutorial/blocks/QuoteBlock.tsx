import React from 'react';
import type { IQuoteBlock, BlockComponentProps } from '../types';

export function QuoteBlock({ block, className = '' }: BlockComponentProps<IQuoteBlock>) {
  const { text, attribution, source } = block.content;

  return (
    <figure
      id={block.id}
      data-block-id={block.id}
      data-block-type="quote"
      className={`my-6 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 shadow-sm ${className}`}
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
