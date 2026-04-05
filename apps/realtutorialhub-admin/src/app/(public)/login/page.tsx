'use client';

import { apiClient } from '@quiz/api-client';
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

const PORTAL_BRAND = 'realtutorialhub' as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const authLogin = useAuthStore((s) => s.login);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);
  const setAccessDenied = useAuthStore((s) => s.setAccessDenied);
  const loginReason = searchParams.get('reason');
  const loginNotice =
    loginReason === 'access_denied'
      ? 'Access denied: this account is not permitted for this portal.'
      : loginReason === 'session_expired'
        ? 'Your session expired. Please sign in again to continue.'
        : null;

  useEffect(() => {
    setSessionExpired(false);
    setAccessDenied(false);
    if (typeof window !== 'undefined') {
      delete (window as Window & { __authRedirecting?: boolean }).__authRedirecting;
    }
  }, [setAccessDenied, setSessionExpired]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectTarget = new URLSearchParams(window.location.search).get('redirect');
      clientLogger.warn('[AUTH_FLOW][ADMIN_LOGIN_PAGE][SUBMIT]', {
        step: 'submit',
        hasRedirect: typeof redirectTarget === 'string',
        path: window.location.pathname,
      });

      const payload = await apiClient.admin.login(formData.email, formData.password, PORTAL_BRAND);

      clientLogger.warn('[AUTH_FLOW][ADMIN_LOGIN_PAGE][RESPONSE]', {
        step: 'response',
        ok: true,
        status: 200,
        hasAccessToken: typeof payload?.accessToken === 'string' && payload.accessToken.trim().length > 0,
      });
      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      if (payload.user !== null && payload.user !== undefined) {
        authLogin({
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          isAdmin: payload.user.isAdmin ?? false,
          role: payload.user.role ?? 'admin',
          onboarded: payload.user.onboarded ?? false,
        }, payload.expiresAt ?? null);
      }

      const safeRedirect =
        typeof redirectTarget === 'string' && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')
          ? redirectTarget
          : '/';

      clientLogger.warn('[AUTH_FLOW][ADMIN_LOGIN_PAGE][REDIRECT]', {
        step: 'redirect',
        safeRedirect,
        rawRedirect: redirectTarget ?? null,
      });

      router.replace(safeRedirect);
    } catch (err: unknown) {
      clientLogger.error('[AUTH_FLOW][ADMIN_LOGIN_PAGE][ERROR]', {
        step: 'error',
        message: err instanceof Error ? err.message : 'Authentication failed',
      });
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#1A1A1A]">Welcome Back</h2>
        <p className="text-sm text-muted-foreground">Authenticate to access the governance terminal.</p>
      </div>

      {error || loginNotice ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-600">
          <ShieldCheck size={16} />
          {error || loginNotice}
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6" autoComplete="off">
        <div className="space-y-2">
          <label
            className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
            htmlFor="admin-login-email"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 z-10 h-5 w-5 text-slate-400" />
            <input
              type="email"
              required
              id="admin-login-email"
              name="email"
              autoComplete="username"
              className="pl-12 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="admin@quizplatform.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label
              className="text-[10px] font-black uppercase tracking-widest text-slate-400"
              htmlFor="admin-login-password"
            >
              Password
            </label>
            <a href="/forgot-password" className="text-sm font-medium text-[#FF4B91] hover:underline">
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 z-10 h-5 w-5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={1}
              id="admin-login-password"
              name="password"
              autoComplete="current-password"
              className="pl-12 flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

        <button
          type="submit"
          disabled={loading}
          className="block w-full py-4 rounded-xl bg-[#FF4B91] text-white font-black tracking-wide shadow-lg shadow-[#FF4B91]/25 hover:scale-[1.02] active:scale-95 transition-all text-center"
        >
          {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
        </button>
      </form>

      <div className="mt-8 border-t pt-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Restricted Access System v1.0.4
        </p>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-slate-400">
          Unauthorized access attempts are logged and reported.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
