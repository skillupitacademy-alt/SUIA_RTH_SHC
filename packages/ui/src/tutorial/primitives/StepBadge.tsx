import React from 'react';
import type { DomainTheme } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';

export interface StepBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  step: number | string;
  theme?: DomainTheme;
  variant?: 'solid' | 'subtle' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Resolves each step from the active theme's semantic accent tokens. The
 * fallback chain keeps older callers functional without identifying a brand
 * from a particular hex value.
 */
export function getStepBrandColor(theme: DomainTheme, stepValue: number | string): string {
  const num = typeof stepValue === 'number' ? stepValue : parseInt(String(stepValue), 10);
  const accentCycle = [
    theme.stepAccent1 ?? theme.secondary,
    theme.stepAccent2 ?? theme.accent1 ?? theme.primary,
    theme.stepAccent3 ?? theme.accent2 ?? theme.primaryDark ?? theme.primary,
  ];

  if (isNaN(num) || num <= 0) {
    return accentCycle[0];
  }

  return accentCycle[(num - 1) % accentCycle.length];
}

/**
 * Universal Step Badge - Generic UBA Numbering Primitive
 * 
 * Standardizes circular step numbers (1..N, 01..03) used across
 * Code walkthroughs, Objective stages, Execution traces, and Task flows.
 */
export function StepBadge({
  step,
  theme,
  variant = 'solid',
  size = 'md',
  className = '',
  style,
  ...rest
}: StepBadgeProps) {
  const activeTheme = theme ?? DEFAULT_THEME;
  const stepColor = getStepBrandColor(activeTheme, step);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base font-bold',
  }[size];

  const variantStyles = {
    solid: {
      backgroundColor: stepColor,
      color: '#ffffff',
    },
    subtle: {
      backgroundColor: withAlpha(stepColor, '1a'),
      color: stepColor,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: stepColor,
      borderWidth: 2,
      color: stepColor,
    },
  }[variant];

  const combinedClass = [
    'rounded-full shrink-0 flex items-center justify-center font-extrabold shadow-sm border border-white/20 forced-colors:!border-2 forced-colors:!border-solid forced-colors:!border-[ButtonText] forced-colors:text-[CanvasText] forced-colors:bg-[Canvas]',
    sizeClasses,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={combinedClass}
      style={{ ...variantStyles, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {step}
    </span>
  );
}
