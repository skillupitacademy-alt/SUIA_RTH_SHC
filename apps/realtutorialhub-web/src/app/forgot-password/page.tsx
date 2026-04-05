'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { resolveSharedLoginBrand } from '@quiz/config/src/brands';

import { getTutorialPortalBrandDefinition, withTutorialPortalBrand } from '@/lib/portal-brand';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL_RTH?.trim() ?? 'https://api.realtutorialhub.com/api').replace(/\/+$/, '');

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const portalBrand = resolveSharedLoginBrand(searchParams.get('brand'));
  const brandDefinition = getTutorialPortalBrandDefinition(portalBrand);
  const accentColor = portalBrand === 'skillup' ? '#f54a8d' : '#fb4b91';
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, brand: portalBrand }),
      });
    } finally {
      setSubmitted(true);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_30%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-rose-100 bg-white p-10 shadow-[0_30px_80px_rgba(255,75,145,0.12)]">
        <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>{brandDefinition.brandName} Recovery</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Forgot password</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {submitted ? `If an account exists for ${email}, we sent a reset link.` : 'Enter your email and we will send a secure reset link.'}
        </p>
        {submitted ? (
          <div className="mt-8 flex gap-3">
            <button type="button" onClick={() => setSubmitted(false)} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-700">
              Send again
            </button>
            <Link href={withTutorialPortalBrand('/login', portalBrand)} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="learner@example.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <button type="submit" disabled={loading} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
