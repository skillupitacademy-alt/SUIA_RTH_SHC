/**
 * Theme Utilities - Semantic Color Access with Fallbacks
 * 
 * Provides safe access to theme semantic colors with Tailwind defaults.
 * Used by blocks to avoid hardcoded hex values.
 */

import type { DomainTheme } from './types';

// Tailwind default color palette (used as fallbacks)
const TAILWIND_COLORS = {
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
} as const;

type ColorScale = keyof typeof TAILWIND_COLORS;
type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/**
 * Get a semantic color from theme with Tailwind fallback
 * 
 * @example
 * getThemeColor(theme, 'slate', 50) // Returns theme.slate?.[50] || '#f8fafc'
 */
export function getThemeColor(
  theme: DomainTheme | undefined,
  scale: ColorScale,
  shade: ColorShade
): string {
  // Try theme first
  const themeScale = theme?.[scale];
  if (themeScale && typeof themeScale === 'object' && shade in themeScale) {
    const color = (themeScale as Record<number, string>)[shade];
    if (color) return color;
  }
  
  // Fall back to Tailwind default
  const tailwindScale = TAILWIND_COLORS[scale];
  if (tailwindScale && shade in tailwindScale) {
    return (tailwindScale as Record<number, string>)[shade] || '#000000';
  }
  
  return '#000000';
}

/**
 * Create color with alpha transparency
 * 
 * @example
 * withAlpha('#3b82f6', '14') // Returns '#3b82f614'
 * withAlpha('#3b82f6', '0d') // Returns '#3b82f60d'
 */
export function withAlpha(hex: string, alphaHex: string): string {
  return `${hex}${alphaHex}`;
}

/**
 * Default theme for blocks when theme prop is not provided
 * Uses Tailwind blue as primary
 */
export const DEFAULT_THEME: DomainTheme = {
  primary: TAILWIND_COLORS.blue[500],
  primaryDark: TAILWIND_COLORS.blue[800],
  secondary: TAILWIND_COLORS.slate[900],
  slate: TAILWIND_COLORS.slate,
  gray: TAILWIND_COLORS.gray,
  blue: TAILWIND_COLORS.blue,
  emerald: TAILWIND_COLORS.emerald,
  amber: TAILWIND_COLORS.amber,
  rose: TAILWIND_COLORS.rose,
  teal: TAILWIND_COLORS.teal,
};
