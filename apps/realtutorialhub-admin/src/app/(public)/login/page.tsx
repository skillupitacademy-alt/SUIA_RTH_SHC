'use client';

import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { useAuthStore } from '@/store/auth-store';
import { getApiBase } from '@/utils/apiBase';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const authLogin = useAuthStore((s) => s.login);

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

      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-identity': 'admin',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          platform: 'realtutorialhub',
        }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      clientLogger.warn('[AUTH_FLOW][ADMIN_LOGIN_PAGE][RESPONSE]', {
        step: 'response',
        ok: response.ok,
        status: response.status,
        hasAccessToken: typeof payload?.accessToken === 'string' && payload.accessToken.trim().length > 0,
      });

      if (!response.ok) {
        const message =
          readResponseMessage(payload?.error) ??
          readResponseMessage(payload?.message) ??
          readResponseMessage(payload?._error) ??
          'Authentication failed';
        throw new Error(message);
      }

      // API server already set httpOnly cookies via Set-Cookie header.
      // We do NOT create client-side cookies to avoid scope conflicts.
      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      // Store user in auth store before redirect to prevent race condition
      if (payload?.user) {
        authLogin({
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          isAdmin: payload.user.isAdmin ?? false,
          role: payload.user.role ?? 'admin',
          onboarded: payload.user.onboarded ?? false,
        });
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

      {error ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-600">
          <ShieldCheck size={16} />
          {error}
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
          className="w-full inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-7 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
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
