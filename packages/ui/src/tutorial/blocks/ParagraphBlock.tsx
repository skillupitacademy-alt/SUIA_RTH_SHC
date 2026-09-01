import React from 'react';
import type { IParagraphBlock, BlockComponentProps } from '../types';

export function ParagraphBlock({ block, className = '' }: BlockComponentProps<IParagraphBlock>) {
  const { text } = block.content;

  return (
    <p
      id={block.id}
      data-block-id={block.id}
      data-block-type="paragraph"
      className={`text-base leading-relaxed text-slate-700 dark:text-slate-300 my-3 ${className}`}
    >
      {text}
    </p>
  );
}
