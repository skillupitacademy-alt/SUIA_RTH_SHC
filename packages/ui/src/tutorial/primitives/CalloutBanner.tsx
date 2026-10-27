import React from 'react';
import type { DomainTheme } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';
import { Sparkles, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface CalloutBannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children: React.ReactNode;
  theme?: DomainTheme;
  title?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'takeaway' | 'info' | 'warning' | 'success';
  tone?: 'takeaway' | 'info' | 'warning' | 'success';
  className?: string;
}

/**
 * Universal Callout Banner - Generic UBA Takeaway & Highlight Primitive
 * 
 * Standardizes key takeaways, revision callouts, and important notices
 * with a prominent left accent border and harmonized surface background.
 */
export function CalloutBanner({
  children,
  theme,
  title,
  icon: CustomIcon,
  variant,
  tone,
  className = '',
  style,
  ...rest
}: CalloutBannerProps) {
  const activeTheme = theme ?? DEFAULT_THEME;
  const primary = activeTheme.primary;
  const secondary = activeTheme.secondary;

  const resolvedVariant = tone ?? variant ?? 'takeaway';

  const defaultIcons = {
    takeaway: Sparkles,
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
  };

  const IconComponent = CustomIcon ?? defaultIcons[resolvedVariant];

  const variantStyles = {
    takeaway: {
      backgroundColor: withAlpha(primary, '08'),
      borderLeftColor: primary,
    },
    info: {
      backgroundColor: '#f0f9ff',
      borderLeftColor: '#0284c7',
    },
    warning: {
      backgroundColor: '#fffbeb',
      borderLeftColor: '#f59e0b',
    },
    success: {
      backgroundColor: '#f0fdf4',
      borderLeftColor: '#10b981',
    },
  }[resolvedVariant];

  const combinedClass = [
    'rounded-xl border border-slate-200/80 border-l-4 p-4 sm:p-5 shadow-sm dark:bg-slate-800/80 dark:border-slate-700 flex items-start gap-3.5',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClass}
      style={{ ...variantStyles, ...style }}
      {...rest}
    >
      {IconComponent && (
        <span className="shrink-0 mt-0.5" style={{ color: resolvedVariant === 'takeaway' ? primary : undefined }}>
          <IconComponent className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <h4 className="text-sm sm:text-base font-bold mb-1" style={{ color: secondary }}>
            {title}
          </h4>
        )}
        <div className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
