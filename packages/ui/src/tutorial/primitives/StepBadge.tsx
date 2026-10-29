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
 * Resolves the step circle color strictly from the 4 brand tokens:
 * - Steps 1, 4, 7... -> Brand Accent (Magenta Pink #be123c on SUIA / Rose Red #e11d48 on RTH)
 * - Steps 2, 5, 8... -> Info Accent (Sky Cyan #0284c7 on SUIA / Indigo Blue #4f46e5 on RTH)
 * - Steps 3, 6, 9... -> Success Accent (Emerald Green #059669 on SUIA / Amber Warm #d97706 on RTH)
 * Provides 100% uniform numbering across I1, C1, D1, S1, and O1 blocks!
 */
export function getStepBrandColor(theme: DomainTheme, stepValue: number | string): string {
  const isRth = (theme.primary || '').toLowerCase() === '#e11d48';
  const num = typeof stepValue === 'number' ? stepValue : parseInt(String(stepValue), 10);

  if (isNaN(num) || num <= 0) {
    return isRth ? theme.primary : '#be123c';
  }

  const cycleIndex = (num - 1) % 3;
  if (cycleIndex === 0) {
    return isRth ? '#e11d48' : '#be123c';
  } else if (cycleIndex === 1) {
    return isRth ? '#4f46e5' : '#0284c7';
  } else {
    return isRth ? '#d97706' : '#059669';
  }
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
