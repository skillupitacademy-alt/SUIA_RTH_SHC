import React from 'react';
import type { IListBlock, BlockComponentProps } from '../types';
import type { ListItem } from '@quiz/types';

function renderListItem(item: ListItem, index: number, style: 'ordered' | 'unordered'): React.ReactNode {
  return (
    <li key={index} className="my-1 text-slate-700 dark:text-slate-300">
      <span>{item.text}</span>
      {item.children && item.children.length > 0 && (
        style === 'ordered' ? (
          <ol className="list-decimal list-inside pl-6 my-1 space-y-1">
            {item.children.map((child, cIdx) => renderListItem(child, cIdx, style))}
          </ol>
        ) : (
          <ul className="list-disc list-inside pl-6 my-1 space-y-1">
            {item.children.map((child, cIdx) => renderListItem(child, cIdx, style))}
          </ul>
        )
      )}
    </li>
  );
}

export function ListBlock({ block, className = '', runtimeContext }: BlockComponentProps<IListBlock>) {
  const { style, items } = block.content;

  // UBRC: Use runtimeContext if available, fallback to block fields
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'list';

  if (style === 'ordered') {
    return (
      <ol
        id={blockId}
        data-block-id={blockId}
        data-block-type={blockType}
        className={`list-decimal list-inside space-y-1.5 my-3 pl-2 text-slate-700 dark:text-slate-300 ${className}`}
      >
        {items.map((item, index) => renderListItem(item, index, style))}
      </ol>
    );
  }

  return (
    <ul
      id={blockId}
      data-block-id={blockId}
      data-block-type={blockType}
      className={`list-disc list-inside space-y-1.5 my-3 pl-2 text-slate-700 dark:text-slate-300 ${className}`}
    >
      {items.map((item, index) => renderListItem(item, index, style))}
    </ul>
  );
}
