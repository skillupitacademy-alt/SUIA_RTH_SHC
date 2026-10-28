import React from 'react';
import type { DomainTheme } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';

export interface SyntaxPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: React.ReactNode;
  text?: React.ReactNode;
  children?: React.ReactNode;
  theme?: DomainTheme;
  variant?: 'primary' | 'muted' | 'outline';
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Universal Syntax Pill - Generic UBA Code & Verb Tag Primitive
 * 
 * Standardizes syntax badges, action verb tags, and keyword indicators
 * used in Code explanation, Objective O3 skills, and Definition metadata.
 */
export function SyntaxPill({
  label,
  text,
  children,
  theme,
  variant = 'primary',
  className = '',
  icon: Icon,
  style,
  ...rest
}: SyntaxPillProps) {
  const activeTheme = theme ?? DEFAULT_THEME;
  const primary = activeTheme.primary;
  const primaryDark = activeTheme.primaryDark ?? primary;

  const content = label ?? text ?? children;

  const variantStyles = {
    primary: {
      backgroundColor: withAlpha(primary, '14'),
      color: primaryDark,
    },
    muted: {
      backgroundColor: '#f1f5f9',
      color: '#334155',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: withAlpha(primary, '40'),
      borderWidth: 1,
      color: primary,
    },
  }[variant];

  const combinedClass = [
    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold leading-snug tracking-tight',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={combinedClass}
      style={{ ...variantStyles, ...style }}
      {...rest}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span>{content}</span>
    </span>
  );
}
