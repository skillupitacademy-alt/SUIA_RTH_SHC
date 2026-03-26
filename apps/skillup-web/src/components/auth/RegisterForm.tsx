'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.realtutorialhub.com/api').replace(/\/+$/, '');

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
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          password: formState.password,
        }),
      });

      const payload = (await response.json()) as { message?: string; error?: { message?: string } };

      if (!response.ok) {
        throw new Error(payload.error?.message ?? payload.message ?? 'Unable to create your account.');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="skillup-full-name" className="block text-sm font-semibold text-slate-700">
          Full name
        </label>
        <input
          id="skillup-full-name"
          value={formState.name}
          onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
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
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
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
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          required
        />
      </div>

      {message ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="status">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
