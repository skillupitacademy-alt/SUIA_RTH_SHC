'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus2 } from 'lucide-react';

import { useSkillupAuthStore } from '@/store/auth-store';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.skillupitacademy.com/api').replace(/\/+$/, '');

type FormState = {
  name: string;
  email: string;
  password: string;
};

export function RegisterForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>({ name: '', email: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authLogin = useSkillupAuthStore((state) => state.login);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-identity': 'user',
          'x-brand': 'skillup',
        },
        body: JSON.stringify({
          name: formState.name,
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
        throw new Error(payload.error?.message ?? payload.message ?? 'Unable to create your account.');
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

      router.replace('/student');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-[1.5rem] border border-cyan-100 bg-cyan-50/70 px-4 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-sm">
          <UserPlus2 size={20} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Create profile</p>
          <p className="mt-1 text-sm text-slate-600">Register for the SkillUp learner portal.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="skillup-full-name" className="block text-sm font-semibold text-slate-700">
            Full name
          </label>
          <input
            id="skillup-full-name"
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            type="text"
            placeholder="Aarav Patel"
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="skillup-email" className="block text-sm font-semibold text-slate-700">
            Email
          </label>
          <input
            id="skillup-email"
            value={formState.email}
            onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
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
          <input
            id="skillup-password"
            value={formState.password}
            onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {message ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600 hover:shadow-[0_16px_40px_rgba(14,165,233,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
