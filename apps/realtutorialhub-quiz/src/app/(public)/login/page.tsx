'use client';

import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { getApiBase } from '@/utils/apiBase';
import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

const LOGIN_ENDPOINT = `${getApiBase()}/auth/login`;
type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
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

function readResponseMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authLogin = useAuthStore((s) => s.login);

  const toErrorMessage = (response: Response | null, payload: LoginResponse | null, fallback: string): string => {
    const candidate = readResponseMessage(payload?.error) ?? readResponseMessage(payload?.message) ?? readResponseMessage(payload?._error);
    if (candidate !== null) {
      return candidate;
    }

    if (response !== null && response.status === 401) {
      return 'Invalid credentials';
    }

    if (response !== null && response.status === 403) {
      return 'Access denied: this account is not permitted for this portal.';
    }

    return fallback;
  };

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
      });

      const formData = new FormData(e.currentTarget);
      const email = formData.get('email')?.toString() ?? '';
      const password = formData.get('password')?.toString() ?? '';

      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-identity': 'user',
        },
        body: JSON.stringify({
          email,
          password,
          platform: 'realtutorialhub',
        }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      clientLogger.warn('[AUTH_FLOW][LOGIN_PAGE][RESPONSE]', {
        step: 'response',
        ok: response.ok,
        status: response.status,
        hasAccessToken: typeof payload?.accessToken === 'string' && payload.accessToken.trim().length > 0,
      });

      if (!response.ok) {
        throw new Error(toErrorMessage(response, payload, 'Authentication failed'));
      }

      // Verify login succeeded — the API server already set httpOnly cookies
      // via Set-Cookie header (credentials: 'include' ensures the browser stores them).
      // We do NOT create client-side cookies to avoid scope conflicts.
      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      // Store user in auth store BEFORE redirecting — this eliminates the race
      // condition where AuthGuard calls GET /auth/me before cookies are ready.
      if (payload?.user) {
        authLogin({
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          isAdmin: payload.user.isAdmin ?? false,
          role: payload.user.role ?? 'user',
          onboarded: payload.user.onboarded ?? false,
        });
      }

      const safeRedirect =
        typeof redirectTarget === 'string' && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
          ? redirectTarget
          : '/dashboard';

      clientLogger.warn('[AUTH_FLOW][LOGIN_PAGE][REDIRECT]', {
        step: 'redirect',
        safeRedirect,
        rawRedirect: redirectTarget,
      });

      router.replace(safeRedirect);
    } catch (err: unknown) {
      clientLogger.error('[AUTH_FLOW][LOGIN_PAGE][ERROR]', {
        step: 'error',
        message: err instanceof Error ? err.message : 'Authentication failed',
      });
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-background border rounded-2xl shadow-sm">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-2 text-muted-foreground">Please enter your details to sign in</p>
      </div>

      {error && (
        <div className="p-3 text-sm font-medium bg-red-50 text-red-600 rounded-md border border-red-200">
          {error}
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
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <a href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 h-11 transition-all"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] overflow-hidden bg-white">
      <div className="hidden lg:flex flex-1 bg-slate-50 relative items-center justify-center text-[#1A1A1A] p-12 border-r border-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FF2D55]/10 text-[#FF2D55] mb-8">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-[#1A1A1A] font-outfit">
            Securing Your <span className="text-[#FF2D55]">Future</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed font-inter">
            Access our enterprise-grade assessments and tracking tools. Your path to professional mastery starts here.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <p className="text-3xl font-black text-[#1A1A1A]">100%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Secure Platform</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <p className="text-3xl font-black text-[#1A1A1A]">50k+</p>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">Active Learners</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
