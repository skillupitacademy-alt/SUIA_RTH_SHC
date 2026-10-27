import React from 'react';
import type { DomainTheme } from '../types';
import { withAlpha, DEFAULT_THEME } from '../theme-utils';

export interface BlockHeaderProps {
  eyebrow?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  title?: React.ReactNode;
  headingLevel?: 'h1' | 'h2' | 'h3';
  titleScale?: 'hero' | 'standard' | 'compact';
  showAccentBar?: boolean;
  introduction?: React.ReactNode;
  theme?: DomainTheme;
  className?: string;
  badgeStyle?: 'pill' | 'box';
  children?: React.ReactNode;
}

/**
 * Universal Block Header - Generic UBA Header Stack Primitive
 * 
 * Standardizes the 4 universal header components:
 * 1. Eyebrow badge with icon
 * 2. Title with flexible heading level (h1/h2) and fluid typography
 * 3. Theme-colored accent divider bar
 * 4. Introduction / subtitle paragraph
 */
export function BlockHeader({
  eyebrow,
  icon: Icon,
  title,
  headingLevel: HeadingTag = 'h1',
  titleScale = 'hero',
  showAccentBar = true,
  introduction,
  theme,
  className = '',
  badgeStyle = 'pill',
  children,
}: BlockHeaderProps) {
  const activeTheme = theme ?? DEFAULT_THEME;
  const primary = activeTheme.primary;
  const secondary = activeTheme.secondary;

  const titleClasses = {
    hero: 'text-[clamp(34px,4vw,52px)] font-extrabold leading-[1.1] tracking-[-1.1px]',
    standard: 'text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight',
    compact: 'text-xl sm:text-2xl font-bold tracking-tight leading-snug',
  }[titleScale];

  return (
    <header className={`mb-6 sm:mb-8 w-full ${className}`.trim()}>
      {eyebrow && (
        <div className="mb-3.5 flex items-center gap-2">
          {badgeStyle === 'pill' ? (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                color: primary,
                backgroundColor: withAlpha(primary, '14'),
              }}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
              <span>{eyebrow}</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2.5 rounded-md px-2.5 py-1 text-sm font-extrabold leading-snug"
              style={{
                color: primary,
                backgroundColor: withAlpha(primary, '14'),
              }}
            >
              {Icon && (
                <span
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border"
                  style={{ borderColor: primary }}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              )}
              <span>{eyebrow}</span>
            </div>
          )}
        </div>
      )}

      {title && (
        <HeadingTag
          className={titleClasses}
          style={{ color: secondary }}
        >
          {title}
        </HeadingTag>
      )}

      {showAccentBar && (
        <div
          data-testid="block-header-divider"
          className="mb-4 mt-3 h-1 w-12 rounded-full"
          style={{ backgroundColor: primary }}
          aria-hidden="true"
        />
      )}

      {introduction && (
        <p
          className="text-base sm:text-lg font-medium leading-[1.7] max-w-3xl"
          style={{ color: withAlpha(secondary, 'dd') }}
        >
          {introduction}
        </p>
      )}

      {children}
    </header>
  );
}
