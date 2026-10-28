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
 * DESIGN SYSTEM RULE (NO LEFT-SIDE BORDER ALLOWED):
 * Key takeaways, tips, and callout containers must NEVER use an asymmetrical left-side border (`border-l-*`).
 * Instead, they MUST use an elevated, symmetric card container:
 * - Uniform corner radius (`rounded-2xl`)
 * - Subtle perimeter border (`border`)
 * - Stable resting elevation (Tier 2 focal container with shadow-xl backdrop-blur-md, without misleading hover jumps)
 * - 4-color brand token consumption (`primary`, `secondary`, `accent1`, `accent2`)
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
  const accent1 = activeTheme.accent1 || '#0284c7';
  const accent2 = activeTheme.accent2 || '#10b981';

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
      borderColor: withAlpha(primary, '2e'),
      iconColor: primary,
    },
    info: {
      backgroundColor: withAlpha(accent1, '0a'),
      borderColor: withAlpha(accent1, '33'),
      iconColor: accent1,
    },
    warning: {
      backgroundColor: withAlpha(activeTheme.accent2 ? activeTheme.accent2 : '#f59e0b', '0e'),
      borderColor: withAlpha(activeTheme.accent2 ? activeTheme.accent2 : '#f59e0b', '3d'),
      iconColor: activeTheme.accent2 ? activeTheme.accent2 : '#d97706',
    },
    success: {
      backgroundColor: withAlpha(accent2, '0c'),
      borderColor: withAlpha(accent2, '38'),
      iconColor: accent2,
    },
  }[resolvedVariant];

  const combinedClass = [
    'rounded-2xl border border-t border-white/80 dark:border-white/10 p-5 sm:p-6 shadow-xl backdrop-blur-md dark:bg-slate-800/90 flex items-start gap-3.5 sm:gap-4 forced-colors:border-[ButtonBorder]',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={combinedClass}
      style={{
        backgroundColor: variantStyles.backgroundColor,
        borderColor: variantStyles.borderColor,
        ...style,
      }}
      {...rest}
    >
      {IconComponent && (
        <span
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl shadow-xs mt-0.5"
          style={{
            backgroundColor: withAlpha(variantStyles.iconColor, '18'),
            color: variantStyles.iconColor,
          }}
        >
          <IconComponent className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <h4 className="text-base sm:text-lg font-bold mb-1.5 leading-snug" style={{ color: secondary }}>
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
