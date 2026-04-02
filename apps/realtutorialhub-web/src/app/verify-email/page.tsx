'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL_RTH?.trim() ?? 'https://api.realtutorialhub.com/api').replace(/\/+$/, '');

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token.length === 0) {
      setStatus('error');
      setError('Verification token is missing.');
      return;
    }

    async function verify() {
      try {
        const response = await fetch(`${API_BASE}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, brand: 'realtutorialhub' }),
        });

        const payload = (await response.json()) as { redirectUrl?: string; message?: string; error?: { message?: string } };
        if (!response.ok) {
          throw new Error(payload.error?.message ?? payload.message ?? 'Verification failed.');
        }

        setStatus('success');
        const redirectUrl = payload.redirectUrl;
        if (typeof redirectUrl === 'string' && redirectUrl.length > 0) {
          window.location.assign(redirectUrl);
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed.');
      }
    }

    void verify();
  }, [token]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_30%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-rose-100 bg-white p-10 shadow-[0_30px_80px_rgba(255,75,145,0.12)]">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-rose-500">Real Tutorial Hub</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Verify your email</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {status === 'loading' ? 'We are confirming your email now.' : status === 'success' ? 'Your email is verified. Redirecting you now.' : error ?? 'Verification failed.'}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="https://user.realtutorialhub.com/login" className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600">
            Go to login
          </Link>
          <Link href="/forgot-password" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-700">
            Need a new link
          </Link>
        </div>
      </div>
    </main>
  );
}
