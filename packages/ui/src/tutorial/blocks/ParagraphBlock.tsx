import React from 'react';
import type { IParagraphBlock, BlockComponentProps } from '../types';

export function ParagraphBlock({ block, className = '', runtimeContext }: BlockComponentProps<IParagraphBlock>) {
  const { text } = block.content;

  // UBRC: Use runtimeContext if available, fallback to block fields
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'paragraph';

  return (
    <p
      id={blockId}
      data-block-id={blockId}
      data-block-type={blockType}
      className={`text-base leading-relaxed text-slate-700 dark:text-slate-300 my-3 ${className}`}
    >
      {text}
    </p>
  );
}
