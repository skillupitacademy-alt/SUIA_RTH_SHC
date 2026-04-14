'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand': 'skillup',
        },
        body: JSON.stringify({
          email,
          platform: 'skillup',
        }),
      });

      if (response.ok || response.status === 404) {
        setSubmitted(true);
        return;
      }

      const payload = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };

      throw new Error(payload.error?.message ?? payload.message ?? 'Unable to send reset email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setIsSubmitting(false);
    }
  }

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
              <p className="section-kicker text-cyan-600">SkillUp Recovery</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 font-outfit">
                Restore access without losing momentum.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-slate-500">
                Enter your email and we&apos;ll send reset instructions to your inbox.
                The process keeps your account protected and your progress intact.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-xl">
              <div className="mb-6 lg:hidden">
                <p className="section-kicker text-cyan-600">SkillUp recovery</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Forgot password</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  We&apos;ll send a password reset link if an account exists for your email.
                </p>
              </div>

              <div className="surface-card rounded-[2.5rem] p-6 sm:p-8">
                {submitted ? (
                  <div className="space-y-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-600 shadow-sm">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
                        Check your email
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        If an account exists for <span className="font-semibold text-slate-800">{email}</span>,
                        we sent password reset instructions.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-800">
                      Didn&apos;t receive it? Try resending from this page or check your spam folder.
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                      >
                        Send again
                      </button>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600"
                      >
                        Return to login
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center gap-3 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 px-4 py-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-sm">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Password reset</p>
                        <p className="mt-1 text-sm text-slate-600">We&apos;ll send a reset link to your inbox.</p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="skillup-forgot-email" className="block text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <input
                        id="skillup-forgot-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="student@example.com"
                        required
                        autoComplete="email"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                      />
                    </div>

                    {error ? (
                      <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600 hover:shadow-[0_16px_40px_rgba(14,165,233,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isSubmitting ? 'Sending...' : 'Send reset link'}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                      Remember your password?{' '}
                      <Link href="/login" className="font-bold text-cyan-700 transition hover:text-cyan-900">
                        Sign in instead
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
