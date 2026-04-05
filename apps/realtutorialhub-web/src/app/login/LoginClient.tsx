'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { resolveSharedLoginBrand } from '@quiz/config/src/brands';

import { getTutorialPortalBrandDefinition, withTutorialPortalBrand } from '@/lib/portal-brand';

type LoginResponse = {
  accessToken?: string;
  user?: {
    roles?: string[];
  };
  error?: string;
  message?: string;
  _error?: string;
};

const LOGIN_ENDPOINT = 'https://api.realtutorialhub.com/api/auth/login';
const ALLOWED_ROLES = new Set(['student', 'admin', 'super_admin', 'faculty']);

function normalizeRedirectTarget(rawTarget: string | null): string {
  if (typeof rawTarget === 'string' && rawTarget.startsWith('/') && rawTarget.startsWith('//') === false) {
    return rawTarget;
  }

  return '/';
}

function toErrorMessage(response: Response, payload: LoginResponse | null): string {
  const candidate = payload?.error ?? payload?.message ?? payload?._error;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  if (response.status === 401) return 'Invalid credentials';
  if (response.status === 403) return 'Access denied: this account is not permitted for this portal.';

  return 'Authentication failed';
}

export function LoginClient() {
  const searchParams = useSearchParams();
  const portalBrand = resolveSharedLoginBrand(searchParams.get('brand'));
  const brandDefinition = getTutorialPortalBrandDefinition(portalBrand);
  const redirectTarget = normalizeRedirectTarget(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const accentColor = portalBrand === 'skillup' ? '#f54a8d' : '#fb4b91';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'x-portal-identity': 'user',
          'x-brand': portalBrand,
        },
        body: JSON.stringify({
          email,
          password,
          platform: portalBrand,
        }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      if (response.ok === false) {
        throw new Error(toErrorMessage(response, payload));
      }

      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
      const roles = Array.isArray(payload?.user?.roles) ? payload.user.roles : [];

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      if (roles.some((role) => ALLOWED_ROLES.has(role)) === false) {
        throw new Error('Access denied: RealTutorialHub learner privileges required.');
      }

      window.location.replace(redirectTarget);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_28%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[36px] border border-rose-100 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,241,247,0.84))] p-10 shadow-[0_30px_80px_rgba(255,75,145,0.12)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>{brandDefinition.brandName} Access</p>
            <h1 className="mt-5 max-w-xl text-5xl font-black tracking-tight text-slate-950">
              {portalBrand === 'skillup'
                ? 'Continue learning with SkillUp identity on the shared tutorial engine.'
                : 'Continue learning with your tutorial workspace, notes, and remediation flows.'}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
              {portalBrand === 'skillup'
                ? 'The shared tutorial surface keeps SkillUp users on the correct brand path while using the common engine infrastructure.'
                : 'Sign in on the public learner host for guided practice, progress tracking, and account recovery on the same brand domain.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-rose-100 bg-white/80 p-6">
              <p className="text-3xl font-black text-slate-950">{portalBrand === 'skillup' ? 'Brand-aware' : 'Brand-bound'}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">{portalBrand === 'skillup' ? 'Shared engine with SkillUp identity' : 'Cookies and redirects stay on RTH'}</p>
            </div>
            <div className="rounded-[28px] border border-rose-100 bg-white/80 p-6">
              <p className="text-3xl font-black text-slate-950">{portalBrand === 'skillup' ? 'Shared' : 'Secure'}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-400">{portalBrand === 'skillup' ? 'Tutorial engine continuity' : 'HttpOnly auth with same-brand refresh'}</p>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[36px] border border-rose-100 bg-white p-8 shadow-[0_30px_80px_rgba(255,75,145,0.12)] sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>{brandDefinition.brandName}</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Welcome Back</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {portalBrand === 'skillup'
                  ? 'Authenticate to access the shared tutorial engine with your SkillUp learner identity.'
                  : 'Authenticate to access your RealTutorialHub learner portal.'}
              </p>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="rth-login-email" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  Email Address
                </label>
                <input
                  id="rth-login-email"
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="learner@example.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="rth-login-password" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Password
                  </label>
                  <Link href={withTutorialPortalBrand('/forgot-password', portalBrand)} className="text-sm font-bold text-rose-600 transition hover:text-rose-700">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="rth-login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-rose-500 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Authenticate'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-rose-50/60 px-5 py-4 text-sm text-slate-700">
              <span>Need to recover access?</span>
              <div className="flex flex-wrap gap-3">
                <Link href={withTutorialPortalBrand('/forgot-password', portalBrand)} className="font-bold text-rose-600 transition hover:text-rose-700">
                  Forgot password
                </Link>
                <Link href="/" className="font-bold text-slate-700 transition hover:text-slate-950">
                  Back to tutorials
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
