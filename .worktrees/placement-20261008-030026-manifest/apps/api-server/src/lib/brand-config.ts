import type { RequestBrand } from '@/lib/request-brand';

export interface BrandEmailConfig {
  displayName: string;
  primaryColor: string;
  accentLabel: string;
  welcomeHeadline: string;
  verificationMessage: string;
  passwordResetMessage: string;
  lockoutMessage: string;
  sender: string | undefined;
  userPortalUrl: string;
  verificationSuccessUrl: string;
}

const ensureUrl = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return typeof trimmed === 'string' && trimmed.length > 0 ? trimmed.replace(/\/+$/, '') : fallback;
};

const resolveSender = (preferred?: string, fallback?: string): string | undefined => {
  const preferredTrimmed = preferred?.trim();
  if (typeof preferredTrimmed === 'string' && preferredTrimmed.length > 0) {
    return preferredTrimmed;
  }

  const fallbackTrimmed = fallback?.trim();
  return typeof fallbackTrimmed === 'string' && fallbackTrimmed.length > 0 ? fallbackTrimmed : undefined;
};

export const getBrandConfig = (brand: RequestBrand): BrandEmailConfig => {
  if (brand === 'skillup') {
    const userPortalUrl = ensureUrl(process.env.NEXT_PUBLIC_USER_URL_SKILLUP, 'https://user.skillupitacademy.com');
    return {
      displayName: 'SkillUp IT Academy',
      primaryColor: '#0EA5E9',
      accentLabel: 'Faculty-led training',
      welcomeHeadline: 'Your faculty-guided SkillUp journey starts here.',
      verificationMessage: 'Verify your email to activate your classroom access, session updates, and faculty support.',
      passwordResetMessage: 'Use the secure link below to reset your SkillUp password and regain access to your courses.',
      lockoutMessage: 'Too many failed login attempts temporarily locked your SkillUp account. Wait for the lock to expire or contact faculty support.',
      sender: resolveSender(process.env.EMAIL_FROM_SKILLUP, process.env.EMAIL_FROM),
      userPortalUrl,
      verificationSuccessUrl: `${userPortalUrl}/verify-success`,
    };
  }

  const userPortalUrl = ensureUrl(process.env.NEXT_PUBLIC_USER_URL_RTH, 'https://user.realtutorialhub.com');
  return {
    displayName: 'Real Tutorial Hub',
    primaryColor: '#FF4B91',
    accentLabel: 'AI tutor companion',
    welcomeHeadline: 'Your AI-powered RTH learning experience is ready.',
    verificationMessage: 'Verify your email to unlock your AI tutor workspace, quiz history, and personalized learning paths.',
    passwordResetMessage: 'Use the secure link below to reset your Real Tutorial Hub password and get back to your AI tutor dashboard.',
    lockoutMessage: 'Too many failed login attempts temporarily locked your Real Tutorial Hub account. Wait for the lock to expire or contact support.',
    sender: resolveSender(process.env.EMAIL_FROM_RTH, process.env.EMAIL_FROM),
    userPortalUrl,
    verificationSuccessUrl: `${userPortalUrl}/verify-success`,
  };
};

export const buildBrandVerificationUrl = (token: string, brand: RequestBrand): string => {
  const config = getBrandConfig(brand);
  return `${config.userPortalUrl}/verify-email?token=${encodeURIComponent(token)}`;
};

export const buildBrandPasswordResetUrl = (token: string, brand: RequestBrand): string => {
  const config = getBrandConfig(brand);
  return `${config.userPortalUrl}/reset-password?token=${encodeURIComponent(token)}`;
};
