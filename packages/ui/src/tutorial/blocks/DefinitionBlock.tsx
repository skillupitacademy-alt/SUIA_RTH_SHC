import React from 'react';
import type { IDefinitionBlock, BlockComponentProps } from '../types';

export function DefinitionBlock({ block, className = '' }: BlockComponentProps<IDefinitionBlock>) {
  const { term, definition, example } = block.content;

  return (
    <dl
      id={block.id}
      className={`my-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 shadow-sm ${className}`}
    >
      <dt className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <span className="text-indigo-500 font-serif text-lg">📖</span>
        <span>{term}</span>
      </dt>
      <dd className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300 pl-6">
        {definition}
      </dd>
      {example && (
        <dd className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs italic text-slate-500 dark:text-slate-400 pl-6">
          <span className="font-semibold not-italic text-slate-600 dark:text-slate-300">Example: </span>
          {example}
        </dd>
      )}
    </dl>
  );
}
