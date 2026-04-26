'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, MailX, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Verification token is missing.');
      return;
    }

    async function verifyEmail() {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-brand': 'skillup',
          },
          credentials: 'include',
          body: JSON.stringify({
            token,
            platform: 'skillup',
          }),
        });

        if (response.ok) {
          const payload = (await response.json()) as { redirectUrl?: string };
          const redirectUrl = payload.redirectUrl;
          if (typeof redirectUrl === 'string' && redirectUrl.length > 0) {
            window.location.assign(redirectUrl);
            return;
          }
          setStatus('success');
          return;
        }

        const payload = (await response.json()) as {
          error?: { message?: string };
          message?: string;
        };

        throw new Error(payload.error?.message ?? payload.message ?? 'Verification failed.');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'This link is invalid or has expired.');
      }
    }

    void verifyEmail();
  }, [token]);

  return (
    <main className="surface-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1440px] items-center px-6 py-10 lg:px-8">
        <section className="surface-panel grid w-full overflow-hidden rounded-[3rem] lg:grid-cols-[1fr_1fr]">
          <div className="relative hidden min-h-[760px] items-center justify-center border-r border-slate-200/80 bg-[linear-gradient(to_right,rgba(255,255,255,0.36),rgba(255,255,255,0.12)),radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_34%)] p-12 lg:flex">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-10 max-w-xl">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-600 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <p className="section-kicker text-cyan-600">SkillUp Verification</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 font-outfit">
                Confirm your email and unlock your account.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-slate-500">
                Verified accounts can sign in, recover access, and receive portal updates without interruption.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-xl">
              <div className="mb-6 lg:hidden">
                <p className="section-kicker text-cyan-600">SkillUp verification</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Verify email</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  We&apos;re checking your verification link now.
                </p>
              </div>

              <div className="surface-card rounded-[2.5rem] p-6 sm:p-8">
                {status === 'loading' ? (
                  <div className="space-y-6 text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-500" />
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
                        Verifying your email
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">Please wait a moment while we confirm your account.</p>
                    </div>
                  </div>
                ) : status === 'success' ? (
                  <div className="space-y-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-600 shadow-sm">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
                        Email verified
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Your email address has been verified. You can now sign in to SkillUp.
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600"
                    >
                      Continue to login
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-red-500/10 text-red-600 shadow-sm">
                      <MailX size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
                        Verification failed
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {error ?? 'This link is invalid or has expired.'}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600"
                      >
                        Back to login
                      </Link>
                      <Link
                        href="/forgot-password"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                      >
                        Request new link
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
