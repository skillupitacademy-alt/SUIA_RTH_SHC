import React from 'react';
import type { ICalloutBlock, BlockComponentProps } from '../types';

export function CalloutBlock({ block, className = '' }: BlockComponentProps<ICalloutBlock>) {
  const { variant, title, text } = block.content;

  const getVariantStyles = () => {
    switch (variant) {
      case 'tip':
        return {
          container: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50 text-emerald-900 dark:text-emerald-200',
          badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
          icon: '💡',
          defaultTitle: 'Pro Tip',
        };
      case 'warning':
        return {
          container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/50 text-amber-900 dark:text-amber-200',
          badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
          icon: '⚠️',
          defaultTitle: 'Warning',
        };
      case 'important':
        return {
          container: 'bg-purple-50 dark:bg-purple-950/30 border-purple-500/50 text-purple-900 dark:text-purple-200',
          badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300',
          icon: '⭐',
          defaultTitle: 'Important',
        };
      case 'success':
        return {
          container: 'bg-teal-50 dark:bg-teal-950/30 border-teal-500/50 text-teal-900 dark:text-teal-200',
          badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300',
          icon: '✅',
          defaultTitle: 'Success',
        };
      case 'danger':
        return {
          container: 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/50 text-rose-900 dark:text-rose-200',
          badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300',
          icon: '🛑',
          defaultTitle: 'Danger',
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-500/50 text-blue-900 dark:text-blue-200',
          badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
          icon: 'ℹ️',
          defaultTitle: 'Note',
        };
    }
  };

  const { container, badge, icon, defaultTitle } = getVariantStyles();

  return (
    <aside
      id={block.id}
      role="note"
      aria-label={title || defaultTitle}
      className={`my-4 p-4 rounded-lg border-l-4 border ${container} shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 mb-1.5 font-semibold text-sm">
        <span aria-hidden="true">{icon}</span>
        <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold ${badge}`}>
          {title || defaultTitle}
        </span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap pl-6">
        {text}
      </div>
    </aside>
  );
}
