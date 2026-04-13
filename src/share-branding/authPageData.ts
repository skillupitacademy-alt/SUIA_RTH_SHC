import { BrandConfig } from './brandConfig';

export interface AuthTextBlock {
  title: string;
  description: string;
}

export interface AuthSocialProvider {
  id: string;
  label: string;
}

export interface AuthViewData {
  logoAriaLabel: string;
  showcaseTitle: string;
  showcaseDescription: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPasswordCta: string;
  socialDividerLabel: string;
  socialProviders: AuthSocialProvider[];
  modes: {
    login: AuthTextBlock & { submitLabel: string; switchPrompt: string; switchAction: string };
    signup: AuthTextBlock & { submitLabel: string; switchPrompt: string; switchAction: string };
    forgot_password: AuthTextBlock & { submitLabel: string; switchPrompt: string; switchAction: string };
  };
}

export interface AuthApiResponse {
  showcaseTitle: string;
  showcaseDescription: string;
  fields: {
    fullNameLabel: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
  };
  forgotPasswordCta: string;
  socialDividerLabel: string;
  socialProviders: AuthSocialProvider[];
  modes: AuthViewData['modes'];
}

export function mapAuthApiToViewData(api: AuthApiResponse, brand: BrandConfig): AuthViewData {
  return {
    logoAriaLabel: `${brand.name} authentication`,
    showcaseTitle: api.showcaseTitle,
    showcaseDescription: api.showcaseDescription,
    fullNameLabel: api.fields.fullNameLabel,
    fullNamePlaceholder: api.fields.fullNamePlaceholder,
    emailLabel: api.fields.emailLabel,
    emailPlaceholder: api.fields.emailPlaceholder,
    passwordLabel: api.fields.passwordLabel,
    passwordPlaceholder: api.fields.passwordPlaceholder,
    forgotPasswordCta: api.forgotPasswordCta,
    socialDividerLabel: api.socialDividerLabel,
    socialProviders: api.socialProviders,
    modes: api.modes,
  };
}

function buildAuthApiResponse(brand: BrandConfig): AuthApiResponse {
  return {
    showcaseTitle: `${brand.tutorLabel} is ready`,
    showcaseDescription: `Interactive guidance powered by your ${brand.tutorContextLabel.replace(/^.+? /, '').toLowerCase()}.`,
    fields: {
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
    },
    forgotPasswordCta: 'Forgot?',
    socialDividerLabel: 'Or continue with',
    socialProviders: [
      { id: 'google', label: 'Google' },
      { id: 'github', label: 'GitHub' },
    ],
    modes: {
      login: {
        title: 'Welcome back',
        description: 'Enter your credentials to access your account',
        submitLabel: 'Sign In',
        switchPrompt: "Don't have an account?",
        switchAction: 'Sign up for free',
      },
      signup: {
        title: 'Get started',
        description: 'Start your journey towards mastery today',
        submitLabel: 'Create Account',
        switchPrompt: 'Already have an account?',
        switchAction: 'Sign in here',
      },
      forgot_password: {
        title: 'Reset password',
        description: 'Enter your email to receive a reset link.',
        submitLabel: 'Send Reset Link',
        switchPrompt: 'Remember your password?',
        switchAction: 'Back to login',
      },
    },
  };
}

export function getAuthPageData(brand: BrandConfig): AuthViewData {
  const apiResponse = buildAuthApiResponse(brand);
  return mapAuthApiToViewData(apiResponse, brand);
}

export async function loadAuthPageData(brand: BrandConfig): Promise<AuthViewData> {
  return getAuthPageData(brand);
}
