import React from 'react';
import type { DomainTheme } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';

export interface CardSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  theme?: DomainTheme;
  variant?: 'default' | 'muted' | 'accent' | 'highlight';
  hoverable?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}

/**
 * Universal Card Surface - Generic UBA Container Primitive
 * 
 * Provides consistent rounded-2xl boundaries, borders, elevation,
 * and dual-brand subtle surface backgrounds.
 */
export function CardSurface({
  children,
  theme,
  variant = 'default',
  hoverable = false,
  className = '',
  style,
  as = 'div',
  ...rest
}: CardSurfaceProps) {
  const Component = as as React.ElementType;
  const activeTheme = theme ?? DEFAULT_THEME;
  const primary = activeTheme.primary;

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
    },
    muted: {
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0',
    },
    accent: {
      backgroundColor: withAlpha(primary, '08'),
      borderColor: withAlpha(primary, '25'),
    },
    highlight: {
      backgroundColor: withAlpha(primary, '0d'),
      borderColor: withAlpha(primary, '50'),
    },
  };

  const hoverClass = hoverable
    ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200'
    : '';

  const combinedClass = [
    'rounded-2xl border p-5 sm:p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700',
    hoverClass,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component
      className={combinedClass}
      style={{ ...variantStyles[variant], ...style }}
      {...rest}
    >
      {children}
    </Component>
  );
}
