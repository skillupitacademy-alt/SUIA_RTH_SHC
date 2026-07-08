'use client';

import React from 'react';
import { Lightbulb, AlertTriangle, Star, Info } from 'lucide-react';
import { cn } from '../../ui/utils';

type CalloutType = 'tip' | 'interview' | 'warning' | 'info';

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutConfig: Record<CalloutType, {
  icon: React.ReactNode;
  classes: string;
  titleClass: string;
  defaultTitle: string;
}> = {
  tip: {
    icon: <Lightbulb className="w-4 h-4" />,
    classes: 'bg-sky-500/5 border-sky-500/20 dark:border-sky-500/30',
    titleClass: 'text-sky-600 dark:text-sky-400',
    defaultTitle: 'Pro Tip',
  },
  interview: {
    icon: <Star className="w-4 h-4" />,
    classes: 'bg-violet-500/5 border-violet-500/20 dark:border-violet-500/30',
    titleClass: 'text-violet-600 dark:text-violet-400',
    defaultTitle: 'FAANG Interview Tip',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    classes: 'bg-amber-500/5 border-amber-500/20 dark:border-amber-500/30',
    titleClass: 'text-amber-600 dark:text-amber-400',
    defaultTitle: 'Warning',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    classes: 'bg-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/30',
    titleClass: 'text-emerald-600 dark:text-emerald-400',
    defaultTitle: 'Note',
  },
};

export function Callout({ type, title, children, className }: CalloutProps) {
  const config = calloutConfig[type];

  return (
    <div
      className={cn(
        'my-5 flex gap-3 rounded-xl border px-4 py-3.5 not-prose',
        config.classes,
        className
      )}
      role="note"
    >
      <div className={cn('mt-0.5 shrink-0', config.titleClass)}>
        {config.icon}
      </div>
      <div className="space-y-1 min-w-0">
        <p className={cn('text-sm font-semibold', config.titleClass)}>
          {title ?? config.defaultTitle}
        </p>
        <div className="text-sm text-muted-foreground leading-relaxed [&>p]:m-0">
          {children}
        </div>
      </div>
    </div>
  );
}
