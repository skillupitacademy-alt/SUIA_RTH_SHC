'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => {
    return [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  }, [password]);

  if (!password) {
    return null;
  }

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-cyan-400', 'bg-green-500'];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${index <= strength ? colors[strength] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">{labels[strength]}</p>
    </div>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand': 'skillup',
        },
        body: JSON.stringify({
          token,
          password,
          platform: 'skillup',
        }),
      });

      const payload = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? payload.message ?? 'Unable to reset password.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
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
                Set a new password and get back in.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-slate-500">
                Choose a strong password to secure your learner profile and continue where you left off.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-xl">
              <div className="mb-6 lg:hidden">
                <p className="section-kicker text-cyan-600">SkillUp recovery</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Reset password</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Choose a strong password for your account.
                </p>
              </div>

              <div className="surface-card rounded-[2.5rem] p-6 sm:p-8">
                {!token ? (
                  <div className="space-y-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-red-500/10 text-red-600 shadow-sm">
                      <Lock size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
                        Invalid reset link
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        We could not find a reset token in this link. Request a new one and try again.
                      </p>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600"
                    >
                      Request new reset link
                    </Link>
                  </div>
                ) : success ? (
                  <div className="space-y-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-600 shadow-sm">
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950 font-outfit">
                        Password updated
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Your password has been updated. Redirecting you to the login screen now.
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600"
                    >
                      Sign in now
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex items-center gap-3 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 px-4 py-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-sm">
                        <Lock size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Password reset</p>
                        <p className="mt-1 text-sm text-slate-600">Create a new secure password for your SkillUp account.</p>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="skillup-reset-password" className="block text-sm font-semibold text-slate-700">
                        New password
                      </label>
                      <div className="relative mt-2">
                        <input
                          id="skillup-reset-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          required
                          minLength={8}
                          placeholder="Minimum 8 characters"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <PasswordStrength password={password} />
                    </div>

                    <div>
                      <label htmlFor="skillup-reset-confirm" className="block text-sm font-semibold text-slate-700">
                        Confirm password
                      </label>
                      <div className="relative mt-2">
                        <input
                          id="skillup-reset-confirm"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirm}
                          onChange={(event) => setConfirm(event.target.value)}
                          required
                          placeholder="Repeat your password"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((current) => !current)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-slate-700"
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
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
                      {isSubmitting ? 'Resetting...' : 'Reset password'}
                    </button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
