'use client';

import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { getApiBase } from '@/utils/apiBase';

const LOGIN_ENDPOINT = `${getApiBase()}/auth/login`;

function decodeJwtExpiry(token: string): string | null {
  try {
    const [, payload] = token.split('.');
    if (payload === undefined) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(padded));
    if (typeof parsed.exp !== 'number') return null;

    return new Date(parsed.exp * 1000).toISOString();
  } catch {
    return null;
  }
}

function setClientCookie(name: string, value: string, expiresAt: string | null): void {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax'];

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }

  if (expiresAt !== null && expiresAt !== '') {
    parts.push(`expires=${new Date(expiresAt).toUTCString()}`);
  }

  document.cookie = parts.join('; ');
}

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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

      if (!response.ok) {
        const message =
          readResponseMessage(payload?.error) ??
          readResponseMessage(payload?.message) ??
          readResponseMessage(payload?._error) ??
          'Authentication failed';
        throw new Error(message);
      }

      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
      const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      const accessExpiry = decodeJwtExpiry(accessToken);
      const refreshExpiry = refreshToken.length > 0 ? decodeJwtExpiry(refreshToken) : null;

      setClientCookie('skillhubcore_accessToken', accessToken, accessExpiry);
      setClientCookie('accessToken', accessToken, accessExpiry);

      if (refreshToken.length > 0) {
        setClientCookie('skillhubcore_refreshToken', refreshToken, refreshExpiry);
        setClientCookie('refreshToken', refreshToken, refreshExpiry);
      }

      router.replace('/dashboard');
    } catch (err: unknown) {
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
