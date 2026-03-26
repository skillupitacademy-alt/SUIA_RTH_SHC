'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const [message, setMessage] = useState<string | null>(
    searchParams.get('reason') === 'session_expired' ? 'Your session expired. Sign in again to continue.' : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      const payload = (await response.json()) as { message?: string; error?: { message?: string } };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? payload.message ?? 'Unable to sign in.');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="skillup-email" className="block text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="skillup-email"
          value={formState.email}
          onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-cyan-300"
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
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-cyan-300"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </div>

      {message ? (
        <p className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
