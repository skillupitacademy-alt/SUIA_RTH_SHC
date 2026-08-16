import React from 'react';
import type { IExampleBlock, BlockComponentProps } from '../types';

export function ExampleBlock({ block, className = '' }: BlockComponentProps<IExampleBlock>) {
  const { title, explanation, code, codeLanguage, expectedOutput, notes } = block.content;

  return (
    <section
      id={block.id}
      aria-label={title || 'Example'}
      className={`my-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 mb-2 font-bold text-sm text-slate-900 dark:text-white">
        <span className="text-emerald-500 font-mono">⚡</span>
        <span>{title || 'Example Walkthrough'}</span>
      </div>

      {explanation && (
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-3">
          {explanation}
        </p>
      )}

      {code && (
        <div className="my-3 rounded border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden text-xs font-mono">
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 flex justify-between">
            <span>{codeLanguage || 'code'}</span>
          </div>
          <pre className="p-3 overflow-x-auto whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {expectedOutput && (
        <div className="my-2 p-3 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Expected Output:</div>
          <pre className="whitespace-pre-wrap">{expectedOutput}</pre>
        </div>
      )}

      {notes && (
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Note: </span>
          {notes}
        </div>
      )}
    </section>
  );
}
