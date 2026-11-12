'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, Network } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { sanitizeRedirectUrl } from '@/lib/sanitize-redirect';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const { login } = useAuthStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isHydrated || isLoading) return;
    setError('');
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email')?.toString().trim() ?? '';
    const password = formData.get('password')?.toString() ?? '';

    try {
      console.log('[SHC_LOGIN] Starting login process...');
      
      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand': 'skillhubcore',
        },
        body: JSON.stringify({
          email,
          password,
          platform: 'skillhubcore',
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const messages: Record<number, string> = {
          401: 'Invalid email or password.',
          403: 'Access is not permitted for this account.',
          429: 'Too many sign-in attempts. Try again later.',
        };
        setError(messages[response.status] ?? 'Authentication service is unavailable. Try again.');
        return;
      }

      const data = await response.json();
      console.log('[SHC_LOGIN] Login successful, updating auth store...');

      // Update Zustand auth store
      login({
        id: data.user.id,
        name: data.user.email, // SHC admins don't have separate names
        email: data.user.email,
        isAdmin: data.user.isAdmin,
        role: data.user.role,
        onboarded: true, // SHC admins are always onboarded
      });

      console.log('[SHC_LOGIN] Auth store updated, redirecting to dashboard...');

      // Redirect to dashboard or validated internal redirect target
      const redirectTarget = sanitizeRedirectUrl(searchParams.get('redirect') ?? searchParams.get('returnTo'));
      router.push(redirectTarget);
    } catch {
      console.error('[SHC_LOGIN] Authentication request failed');
      setError('Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      {/* Background decoration */}
      <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-pink-500 opacity-10 blur-[100px]" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-orange-500 opacity-10 blur-[100px]" />

      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg">
              <Network size={32} className="text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
              SkillHubCore Admin
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Infrastructure Management Console
            </p>
          </div>

          {/* Login Form */}
          <form method="post" action="/login" onSubmit={handleSubmit} className="space-y-4">
            <noscript>
              <p className="text-sm text-slate-700">Enable JavaScript to sign in securely.</p>
            </noscript>
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="ml-1 text-sm font-bold text-slate-900">
                Email Address
              </label>
              <div className="group relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                <input
                  id="email"
                  name="email"
                  disabled={!isHydrated}
                  type="email"
                  placeholder="admin@skillhubcore.in"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="ml-1 text-sm font-bold text-slate-900">
                Password
              </label>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-pink-500" />
                <input
                  id="password"
                  name="password"
                  disabled={!isHydrated}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 font-semibold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-pink-500 focus:bg-white focus:ring-4 focus:ring-pink-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isHydrated || isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Console</span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs font-medium text-slate-600">
              SkillHubCore Infrastructure Admin v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

