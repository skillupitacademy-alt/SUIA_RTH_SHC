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
  const primary = activeTheme.primary;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm',
    lg: 'w-9 h-9 sm:w-10 sm:h-10 text-sm sm:text-base font-bold',
  }[size];

  const variantStyles = {
    solid: {
      backgroundColor: primary,
      color: '#ffffff',
    },
    subtle: {
      backgroundColor: withAlpha(primary, '1a'),
      color: primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: primary,
      borderWidth: 2,
      color: primary,
    },
  }[variant];

  const combinedClass = [
    'rounded-full shrink-0 flex items-center justify-center font-extrabold shadow-sm',
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
