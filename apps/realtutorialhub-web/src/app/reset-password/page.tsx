'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { resolveSharedLoginBrand } from '@quiz/config/src/brands';

import { getTutorialPortalBrandDefinition, withTutorialPortalBrand } from '@/lib/portal-brand';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL_RTH?.trim() ?? 'https://api.realtutorialhub.com/api').replace(/\/+$/, '');

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalBrand = resolveSharedLoginBrand(searchParams.get('brand'));
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const invalidBrand = portalBrand === undefined;
  if (invalidBrand) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_30%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-red-200 bg-white p-10 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Unsupported access link</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            This shared tutorial engine requires an explicit supported brand. Open it from the RealTutorialHub or SkillUp Start Learning page.
          </p>
        </div>
      </main>
    );
  }
  const brandDefinition = getTutorialPortalBrandDefinition(portalBrand);
  const accentColor = portalBrand === 'skillup' ? '#f54a8d' : '#fb4b91';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, brand: portalBrand }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string; error?: { message?: string } };
        throw new Error(payload.error?.message ?? payload.message ?? 'Unable to reset password.');
      }

      setSuccess(true);
      setTimeout(() => router.replace(withTutorialPortalBrand('/login', portalBrand!)), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_30%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-rose-100 bg-white p-10 shadow-[0_30px_80px_rgba(255,75,145,0.12)]">
        <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>{brandDefinition.brandName} Recovery</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Reset password</h1>
        {!token ? (
          <div className="mt-6">
            <p className="text-base leading-7 text-slate-600">This reset link is invalid or missing a token.</p>
            <Link href="/forgot-password" className="mt-6 inline-block rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600">
              Request a new link
            </Link>
          </div>
        ) : success ? (
          <div className="mt-6">
            <p className="text-base leading-7 text-slate-600">Your password has been updated. Redirecting to login.</p>
            <Link href={withTutorialPortalBrand('/login', portalBrand)} className="mt-6 inline-block rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600">
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
            <button type="submit" disabled={loading} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
