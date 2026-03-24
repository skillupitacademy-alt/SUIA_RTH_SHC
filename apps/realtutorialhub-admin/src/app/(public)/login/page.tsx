'use client';

import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent,useState } from 'react';

const LOGIN_ENDPOINT = 'https://api.skillhubcore.in/auth/login';

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
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#1A1A1A]">Welcome Back</h2>
        <p className="text-sm text-muted-foreground">Authenticate to access the governance terminal.</p>
      </div>

      {error ? (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold flex items-center gap-2">
          <ShieldCheck size={16} />
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6" autoComplete="off">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1" htmlFor="admin-login-email">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400 h-5 w-5 z-10" />
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
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="admin-login-password">
              Password
            </label>
            <a href="/forgot-password" className="text-sm font-medium text-[#FF4B91] hover:underline">
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400 h-5 w-5 z-10" />
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
          className="w-full py-7 shadow-lg shadow-primary/25 rounded-2xl inline-flex items-center justify-center bg-primary px-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90"
        >
          {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Restricted Access System v1.0.4</p>
        <p className="mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
          Unauthorized access attempts are logged and reported.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-6 py-12">
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col justify-center min-h-[720px] rounded-[2rem] border border-slate-200/70 bg-white/80 p-12 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-[20px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF4B91] text-white shadow-lg shadow-[#FF4B91]/25">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Quiz Platform</p>
                <h1 className="text-4xl font-extrabold tracking-tight text-[#1A1A1A]">Secure Governance</h1>
              </div>
            </div>

            <div className="max-w-xl space-y-6">
              <p className="text-2xl font-semibold leading-tight text-slate-700">
                Authorized personnel only. Secure access to the governance terminal is strictly audited.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-4xl font-black text-slate-900">100%</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Audit Coverage</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-4xl font-black text-slate-900">24/7</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Monitoring</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-auto pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-400">
              System ID: RH-9011-GC // Secure Layer V1
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
