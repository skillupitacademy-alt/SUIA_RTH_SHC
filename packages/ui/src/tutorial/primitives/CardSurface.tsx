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
 * 3-Tier Elevation Contract:
 * - Tier 1: Interactive modules (hoverable=true): hover lift, deeper shadow, cursor-pointer, tabIndex=0
 * - Tier 2: Static editorial highlights (hoverable=false): resting elevation, no misleading hover movement
 * - Tier 3: Subtle/flat containers (elevation="subtle" | "flat"): minimal or no shadow
 * 
 * Accessibility Guidelines:
 * - Non-text contrast (SC 1.4.11 Level AA): explicit perimeter border + forced-colors support
 * - Motion safety (SC 2.3.3 Level AAA): motion-safe transitions and motion-reduce:transform-none / transition-none
 * - Focus visible (SC 2.4.7 Level AA): tabIndex=0 and focus-visible ring on interactive cards
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
  tabIndex,
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

  const restingElevationClasses: Record<string, string> = {
    dashboard: 'shadow-xl border-t border-white/80 dark:border-white/10 backdrop-blur-md bg-white/85 dark:bg-slate-900/85',
    elevated: 'shadow-md border-t border-white/60 dark:border-white/10 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90',
    subtle: 'shadow-sm bg-white dark:bg-slate-800',
    flat: 'shadow-none bg-white dark:bg-slate-800',
  };

  const interactiveElevationClasses: Record<string, string> = {
    dashboard: 'hover:shadow-2xl motion-safe:-translate-y-1 motion-safe:hover:-translate-y-2.5 motion-reduce:transform-none motion-reduce:transition-none transition-all duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    elevated: 'hover:shadow-xl motion-safe:-translate-y-0.5 motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none transition-all duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    subtle: 'hover:shadow-md motion-reduce:transition-none transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    flat: 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  };

  const isInteractive = Boolean(hoverable || rest.onClick);
  const activeRestingClass = restingElevationClasses[elevation] ?? restingElevationClasses.dashboard;
  const activeInteractiveClass = isInteractive
    ? (interactiveElevationClasses[elevation] ?? interactiveElevationClasses.dashboard)
    : '';

  const combinedClass = [
    'rounded-2xl border p-5 sm:p-6 dark:border-slate-700 forced-colors:border-[ButtonBorder]',
    activeRestingClass,
    activeInteractiveClass,
    className,
  ].filter(Boolean).join(' ');

  const effectiveRole = rest.role ?? (isInteractive ? 'button' : undefined);
  const effectiveTabIndex = isInteractive && tabIndex === undefined ? 0 : tabIndex;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (rest.onKeyDown) {
      rest.onKeyDown(e);
      if (e.defaultPrevented) return;
    }
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (rest.onClick) {
        (rest.onClick as unknown as (e: React.SyntheticEvent) => void)(e);
      }
    }
  };

  return (
    <Component
      role={effectiveRole}
      className={combinedClass}
      style={{ ...variantStyles[variant], ...style }}
      tabIndex={effectiveTabIndex}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </Component>
  );
}

