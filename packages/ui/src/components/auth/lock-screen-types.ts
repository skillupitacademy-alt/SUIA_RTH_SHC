import type { ReactNode } from 'react';

export type BrandThemeMode = 'theme-a' | 'theme-b' | 'skillhubcore' | 'skillup' | 'realtutorialhub';

export interface LockScreenThemeTokens {
  overlayBg?: string;
  cardBg?: string;
  cardBorder?: string;
  iconContainerGradient?: string;
  iconShadow?: string;
  badgeBg?: string;
  badgeBorder?: string;
  primaryButtonGradient?: string;
  primaryButtonShadow?: string;
  focusRing?: string;
  inputBg?: string;
  inputBorder?: string;
  inputPlaceholder?: string;
  accentText?: string;
}

export interface SharedAdminLockScreenUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
}

export interface SharedAdminLockScreenProps {
  /** Whether the administrative terminal is currently locked */
  isLocked: boolean;
  /** Active user identity details */
  user: SharedAdminLockScreenUser | null | undefined;
  /** Application / brand display name */
  brandName?: string;
  /** Primary headline for the locked terminal */
  brandTitle?: string;
  /** Security protocol or audit subtitle */
  brandSubtitle?: string;
  /** Optional custom brand logo or icon replacement */
  customIcon?: ReactNode;
  /** Active theme preset name ('theme-a', 'theme-b', 'skillhubcore', 'skillup') */
  theme?: BrandThemeMode;
  /** Optional granular theme token overrides */
  themeTokens?: LockScreenThemeTokens;
  /** Re-authentication callback; receives the submitted password */
  onUnlock: (password: string) => Promise<void> | void;
  /** Action when user clicks "Switch Account" */
  onSwitchAccount: () => void;
  /** Action when user clicks "Log out securely" (defaults to onSwitchAccount) */
  onLogout?: () => void;
  /** Controlled loading state (if managed externally) */
  isLoading?: boolean;
  /** Controlled error message (if managed externally) */
  error?: string | null;
  /** Accessible label for the password field */
  passwordLabel?: string;
  /** Placeholder for the password field */
  passwordPlaceholder?: string;
  /** Optional container CSS class name */
  className?: string;
}

