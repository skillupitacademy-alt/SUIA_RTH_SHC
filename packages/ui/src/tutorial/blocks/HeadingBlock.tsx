import React from 'react';
import type { IHeadingBlock, BlockComponentProps } from '../types';

export function HeadingBlock({ block, className = '' }: BlockComponentProps<IHeadingBlock>) {
  const { text, level } = block.content;

  const baseStyles = 'font-bold tracking-tight text-slate-900 dark:text-white my-3';

  switch (level) {
    case 1:
      return <h1 id={block.id} className={`text-3xl sm:text-4xl ${baseStyles} ${className}`}>{text}</h1>;
    case 2:
      return <h2 id={block.id} className={`text-2xl sm:text-3xl border-b border-slate-200 dark:border-slate-800 pb-2 ${baseStyles} ${className}`}>{text}</h2>;
    case 3:
      return <h3 id={block.id} className={`text-xl sm:text-2xl ${baseStyles} ${className}`}>{text}</h3>;
    case 4:
      return <h4 id={block.id} className={`text-lg sm:text-xl font-semibold ${baseStyles} ${className}`}>{text}</h4>;
    case 5:
      return <h5 id={block.id} className={`text-base font-semibold ${baseStyles} ${className}`}>{text}</h5>;
    case 6:
      return <h6 id={block.id} className={`text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 ${baseStyles} ${className}`}>{text}</h6>;
    default:
      return <h2 id={block.id} className={`text-2xl ${baseStyles} ${className}`}>{text}</h2>;
  }
}
