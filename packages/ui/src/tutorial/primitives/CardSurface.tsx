import React from 'react';
import type { DomainTheme } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';

export interface CardSurfaceProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  theme?: DomainTheme;
  variant?: 'default' | 'muted' | 'accent' | 'highlight';
  elevation?: 'dashboard' | 'elevated' | 'subtle' | 'flat';
  hoverable?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}

/**
 * Universal Card Surface - Generic UBA Container Primitive
 * 
 * Provides consistent rounded-2xl boundaries, borders, elevation,
 * and dual-brand subtle surface backgrounds.
 * 
 * Inspired by the elevated platform dashboard aesthetic:
 * - Layered elevation shadows (shadow-xl / shadow-2xl)
 * - Subtle top rim highlight (border-t border-white/80 dark:border-white/10)
 * - Translucent glassmorphism (backdrop-blur-md)
 * - Micro-interaction lift transform (-translate-y-1 hover:-translate-y-2.5 transition-all duration-300)
 */
export function CardSurface({
  children,
  theme,
  variant = 'default',
  elevation = 'dashboard',
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

  const elevationClasses: Record<string, string> = {
    dashboard: 'shadow-xl hover:shadow-2xl border-t border-white/80 dark:border-white/10 motion-safe:-translate-y-1 motion-safe:hover:-translate-y-2.5 motion-reduce:transform-none transition-all duration-300 ease-out backdrop-blur-md bg-white/85 dark:bg-slate-900/85',
    elevated: 'shadow-md hover:shadow-xl border-t border-white/60 dark:border-white/10 motion-safe:-translate-y-0.5 motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none transition-all duration-300 ease-out backdrop-blur-sm bg-white/90 dark:bg-slate-900/90',
    subtle: 'shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800',
    flat: 'shadow-none bg-white dark:bg-slate-800',
  };

  const activeElevationClass = elevationClasses[elevation] ?? elevationClasses.dashboard;
  const hoverClass = hoverable
    ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
    : '';

  const combinedClass = [
    'rounded-2xl border p-5 sm:p-6 dark:border-slate-700',
    activeElevationClass,
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
