'use client';

import { apiClient } from '@quiz/api-client';
import { resolveSharedLoginBrand } from '@quiz/config/src/brands';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';
import { getQuizPortalBrandDefinition, withQuizPortalBrand } from '@/lib/portal-brand';

type LoginResponse = {
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    isAdmin?: boolean;
    role?: string;
    onboarded?: boolean;
  };
  message?: string;
  error?: string;
  _error?: string;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalBrand = resolveSharedLoginBrand(searchParams.get('brand'));
  const loginReason = searchParams.get('reason');
  const loginNotice =
    loginReason === 'access_denied'
      ? 'Access denied: this account is not permitted for this portal.'
      : loginReason === 'session_expired'
        ? 'Your session expired. Please sign in again to continue.'
        : null;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authLogin = useAuthStore((s) => s.login);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const redirectTarget = searchParams.get('redirect');
      clientLogger.warn('[AUTH_FLOW][LOGIN_PAGE][SUBMIT]', {
        step: 'submit',
        hasRedirect: typeof redirectTarget === 'string',
        path: window.location.pathname,
        brand: portalBrand,
      });

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email')?.toString() ?? '';
      const password = formData.get('password')?.toString() ?? '';

      apiClient.client.setPortalIdentity('user');
      const payload = await apiClient.auth.login(email, password, portalBrand) as LoginResponse;

      clientLogger.warn('[AUTH_FLOW][LOGIN_PAGE][RESPONSE]', {
        step: 'response',
        ok: true,
        status: 200,
        hasAccessToken: typeof payload?.accessToken === 'string' && payload.accessToken.trim().length > 0,
        brand: portalBrand,
      });

      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      if (payload?.user) {
        authLogin({
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          isAdmin: payload.user.isAdmin ?? false,
          role: payload.user.role ?? 'user',
          onboarded: payload.user.onboarded ?? false,
        }, null);
      }

      const safeRedirect =
        typeof redirectTarget === 'string' && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
          ? redirectTarget
          : '/dashboard';

      clientLogger.warn('[AUTH_FLOW][LOGIN_PAGE][REDIRECT]', {
        step: 'redirect',
        safeRedirect,
        rawRedirect: redirectTarget,
        brand: portalBrand,
      });

      router.replace(safeRedirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      const normalizedMessage =
        message === 'Forbidden'
          ? 'Access denied: this account is not permitted for this portal.'
          : message;

      clientLogger.error('[AUTH_FLOW][LOGIN_PAGE][ERROR]', {
        step: 'error',
        message: normalizedMessage,
        brand: portalBrand,
      });
      setError(normalizedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-2xl border bg-background p-8 shadow-sm">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-2 text-muted-foreground">Please enter your details to sign in</p>
      </div>

      {(loginNotice || error) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
          {error ?? loginNotice}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={(event) => void handleSubmit(event)} autoComplete="off">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="username"
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium leading-none" htmlFor="password">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                minLength={1}
                autoComplete="current-password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <label htmlFor="remember" className="text-sm font-medium leading-none">
              Remember me
            </label>
          </div>
          <a href={withQuizPortalBrand('/forgot-password', portalBrand)} className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow transition-all hover:bg-primary/90"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
        </button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <a href={withQuizPortalBrand('/signup', portalBrand)} className="font-bold text-primary hover:underline">
          Create an account
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const portalBrand = resolveSharedLoginBrand(searchParams.get('brand'));
  const brandDefinition = getQuizPortalBrandDefinition(portalBrand);
  const accentColor = portalBrand === 'skillup' ? '#f54a8d' : '#FF2D55';

  return (
    <div className="flex min-h-[calc(100vh-64px)] overflow-hidden bg-white">
      <div className="relative hidden flex-1 items-center justify-center border-r border-slate-100 bg-slate-50 p-12 text-[#1A1A1A] lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 max-w-lg">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}>
            <ShieldCheck size={32} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>{brandDefinition.brandName}</p>
          <h1 className="mb-6 mt-4 text-5xl font-extrabold tracking-tight text-[#1A1A1A] font-outfit">
            {portalBrand === 'skillup' ? 'Continue into the shared exam engine.' : 'Securing Your '}
            <span style={{ color: accentColor }}>{portalBrand === 'skillup' ? 'SkillUp Flow' : 'Future'}</span>
          </h1>
          <p className="font-inter text-xl leading-relaxed text-slate-500">
            {portalBrand === 'skillup'
              ? 'Authenticate with your SkillUp identity to enter the common exam surface while preserving the correct brand context for the rest of the journey.'
              : 'Access our enterprise-grade assessments and tracking tools. Your path to professional mastery starts here.'}
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-3xl font-black text-[#1A1A1A]">{portalBrand === 'skillup' ? 'Brand' : '100%'}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{portalBrand === 'skillup' ? 'SkillUp context' : 'Secure Platform'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-3xl font-black text-[#1A1A1A]">{portalBrand === 'skillup' ? 'Shared' : '50k+'}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{portalBrand === 'skillup' ? 'Exam engine' : 'Active Learners'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
