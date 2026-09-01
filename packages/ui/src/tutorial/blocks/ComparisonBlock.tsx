import React from 'react';
import type { IComparisonBlock, BlockComponentProps } from '../types';

export function ComparisonBlock({ block, className = '' }: BlockComponentProps<IComparisonBlock>) {
  const { title, entities, features, recommendation, notes } = block.content;

  return (
    <section
      id={block.id}
      data-block-id={block.id}
      data-block-type="comparison"
      aria-label={title || 'Comparison'}
      className={`my-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3 font-bold text-base text-slate-900 dark:text-white">
          <span>⚖️</span>
          <h3>{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400">
                Feature / Metric
              </th>
              {entities.map((entity, idx) => (
                <th key={idx} scope="col" className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                  {entity}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {features.map((feature, fIdx) => (
              <tr key={fIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap bg-slate-50/50 dark:bg-slate-900/20">
                  {feature.name}
                </td>
                {entities.map((_, eIdx) => (
                  <td key={eIdx} className="px-4 py-2.5 whitespace-pre-wrap">
                    {feature.values[eIdx] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recommendation && (
        <div className="mt-3 p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200">
          <span className="font-bold">💡 Recommendation: </span>
          {recommendation}
        </div>
      )}

      {notes && (
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
          <span>Note: </span>
          {notes}
        </div>
      )}
    </section>
  );
}
