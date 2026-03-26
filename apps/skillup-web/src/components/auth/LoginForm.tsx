'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

import { useSkillupAuthStore } from '@/store/auth-store';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.realtutorialhub.com/api').replace(/\/+$/, '');

type FormState = {
  email: string;
  password: string;
};

function getDestination(redirectParam: string | null): string {
  if (typeof redirectParam === 'string' && redirectParam.startsWith('/')) {
    return redirectParam;
  }

  return '/student';
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(
    searchParams.get('reason') === 'session_expired' ? 'Your session expired. Sign in again to continue.' : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authLogin = useSkillupAuthStore((state) => state.login);

  const redirectTo = getDestination(searchParams.get('redirect'));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-identity': 'user',
        },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
          platform: 'skillup',
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        error?: { message?: string };
        user?: {
          id: string;
          email: string;
          name?: string;
          isAdmin?: boolean;
          role?: string;
          onboarded?: boolean;
        };
        expiresAt?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? payload.message ?? 'Unable to sign in.');
      }

      if (payload.user) {
        authLogin({
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          isAdmin: payload.user.isAdmin ?? false,
          role: payload.user.role ?? 'user',
          onboarded: payload.user.onboarded ?? false,
        }, payload.expiresAt ?? null);
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-sm">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Secure entry</p>
          <p className="mt-1 text-sm text-slate-600">Sign in with your SkillUp learner credentials.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="skillup-email" className="block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            id="skillup-email"
            value={formState.email}
            onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            type="email"
            placeholder="student@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="skillup-password" className="block text-sm font-semibold text-slate-700">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="skillup-password"
              value={formState.password}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
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
        </div>
      </div>

      {message ? (
        <p className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600 hover:shadow-[0_16px_40px_rgba(14,165,233,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
