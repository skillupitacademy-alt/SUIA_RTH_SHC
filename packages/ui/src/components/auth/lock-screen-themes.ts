import type { BrandThemeMode, LockScreenThemeTokens } from './lock-screen-types';

export const LOCK_SCREEN_THEMES: Record<BrandThemeMode, Required<LockScreenThemeTokens>> = {
  'theme-a': {
    overlayBg: 'bg-[#1A1A1A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E]',
    iconShadow: 'shadow-2xl shadow-pink-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#1A1A1A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E]',
    primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    focusRing: 'focus:ring-[#FF4B91]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-pink-400',
  },
  'theme-b': {
    overlayBg: 'bg-[#0B132B]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#06283D] to-[#D03F00]',
    iconShadow: 'shadow-2xl shadow-orange-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#0B132B]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#D03F00] to-[#FF7043]',
    primaryButtonShadow: 'shadow-lg shadow-orange-500/25',
    focusRing: 'focus:ring-[#D03F00]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-orange-400',
  },
  'realtutorialhub': {
    overlayBg: 'bg-[#1A1A1A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E]',
    iconShadow: 'shadow-2xl shadow-pink-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#1A1A1A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E]',
    primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    focusRing: 'focus:ring-[#FF4B91]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-pink-400',
  },
  'skillhubcore': {
    overlayBg: 'bg-[#0F172A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#F54A8D] to-[#133382]',
    iconShadow: 'shadow-2xl shadow-pink-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#0F172A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#F54A8D] to-[#FF8E9E]',
    primaryButtonShadow: 'shadow-lg shadow-pink-500/20',
    focusRing: 'focus:ring-[#F54A8D]/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-pink-400',
  },
  'skillup': {
    overlayBg: 'bg-[#0F172A]/95 backdrop-blur-xl',
    cardBg: 'bg-white/5',
    cardBorder: 'border-white/10',
    iconContainerGradient: 'bg-gradient-to-br from-[#0891B2] to-[#0284C7]',
    iconShadow: 'shadow-2xl shadow-cyan-500/20',
    badgeBg: 'bg-emerald-500 text-white',
    badgeBorder: 'border-[#0F172A]',
    primaryButtonGradient: 'bg-gradient-to-r from-[#0891B2] to-[#06B6D4]',
    primaryButtonShadow: 'shadow-lg shadow-cyan-500/25',
    focusRing: 'focus:ring-cyan-500/40',
    inputBg: 'bg-white/10',
    inputBorder: 'border-white/20',
    inputPlaceholder: 'placeholder:text-slate-400',
    accentText: 'text-cyan-400',
  },
};

/**
 * Resolves effective theme tokens by merging the brand/theme preset with any explicit overrides.
 */
export function resolveLockScreenTheme(
  themeMode?: BrandThemeMode,
  overrides?: LockScreenThemeTokens
): Required<LockScreenThemeTokens> {
  const baseMode = themeMode && LOCK_SCREEN_THEMES[themeMode] ? themeMode : 'theme-a';
  const baseTokens = LOCK_SCREEN_THEMES[baseMode];

  if (!overrides) {
    return baseTokens;
  }

  return {
    overlayBg: overrides.overlayBg ?? baseTokens.overlayBg,
    cardBg: overrides.cardBg ?? baseTokens.cardBg,
    cardBorder: overrides.cardBorder ?? baseTokens.cardBorder,
    iconContainerGradient: overrides.iconContainerGradient ?? baseTokens.iconContainerGradient,
    iconShadow: overrides.iconShadow ?? baseTokens.iconShadow,
    badgeBg: overrides.badgeBg ?? baseTokens.badgeBg,
    badgeBorder: overrides.badgeBorder ?? baseTokens.badgeBorder,
    primaryButtonGradient: overrides.primaryButtonGradient ?? baseTokens.primaryButtonGradient,
    primaryButtonShadow: overrides.primaryButtonShadow ?? baseTokens.primaryButtonShadow,
    focusRing: overrides.focusRing ?? baseTokens.focusRing,
    inputBg: overrides.inputBg ?? baseTokens.inputBg,
    inputBorder: overrides.inputBorder ?? baseTokens.inputBorder,
    inputPlaceholder: overrides.inputPlaceholder ?? baseTokens.inputPlaceholder,
    accentText: overrides.accentText ?? baseTokens.accentText,
  };
}

