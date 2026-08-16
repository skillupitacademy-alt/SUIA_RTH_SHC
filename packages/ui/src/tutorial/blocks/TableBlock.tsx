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
      className={`my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}
    >
      <table className="w-full text-sm text-left text-slate-700 dark:text-slate-300 divide-y divide-slate-200 dark:divide-slate-800">
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
                  className={`px-4 py-3 ${getAlignmentClass(col.alignment)}`}
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
                    className={`px-4 py-3 whitespace-nowrap ${getAlignmentClass(col.alignment)}`}
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
