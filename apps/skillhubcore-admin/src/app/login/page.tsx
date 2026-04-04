'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

function normalizeRedirectTarget(rawTarget: string | null): string {
  if (typeof rawTarget === 'string' && rawTarget.startsWith('/') && rawTarget.startsWith('//') === false) {
    return rawTarget;
  }

  return '/dashboard';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = normalizeRedirectTarget(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          portalIdentity: 'super_admin',
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Authentication failed');
      }

      router.replace(redirectTarget);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-[#1A1A1A]">SkillHubCore Admin</h2>
        <p className="text-sm text-slate-500">Authenticate to access the shared services governance terminal.</p>
      </div>

      {error.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="super-admin@skillhubcore.in"
          autoComplete="username"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-[#1A1A1A] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Authenticating...' : 'Authenticate'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB] px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200/70 bg-white/95 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur-[20px]">
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-slate-200/80" />
              <div className="h-4 w-72 animate-pulse rounded bg-slate-200/70" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200/70" />
              <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200/70" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
