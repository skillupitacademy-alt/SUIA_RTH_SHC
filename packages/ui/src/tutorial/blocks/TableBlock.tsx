import React from 'react';
import type { ITableBlock, BlockComponentProps } from '../types';

export function TableBlock({ block, className = '' }: BlockComponentProps<ITableBlock>) {
  const { columns, rows, hasHeader = true, caption } = block.content;

  const getAlignmentClass = (alignment?: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div
      id={block.id}
      data-block-id={block.id}
      data-block-type="table"
      className={`my-4 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
    >
      <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
        {caption && <div className="p-3 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">{caption}</div>}
        {rows.map((row) => (
          <dl key={row.id} className="space-y-3 p-4">
            {columns.map((col) => {
              const cell = row.cells.find((c) => c.columnId === col.id);
              return <div key={col.id} className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{col.label}</dt><dd className={`mt-1 break-words text-sm text-slate-700 dark:text-slate-300 ${getAlignmentClass(col.alignment)}`}>{cell?.value || '—'}</dd></div>;
            })}
          </dl>
        ))}
      </div>
      <table className="hidden md:table w-full table-fixed text-sm text-left text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800">
        {caption && (
          <caption className="p-3 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 text-left border-b border-slate-200 dark:border-slate-800">
            {caption}
          </caption>
        )}

        {hasHeader && (
          <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={`break-words px-4 py-3 ${getAlignmentClass(col.alignment)}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        )}

        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-slate-50/75 dark:hover:bg-slate-900/50 transition-colors"
            >
              {columns.map((col) => {
                const cell = row.cells.find((c) => c.columnId === col.id);
                return (
                  <td
                    key={col.id}
                    className={`break-words px-4 py-3 ${getAlignmentClass(col.alignment)}`}
                  >
                    {cell ? cell.value : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
