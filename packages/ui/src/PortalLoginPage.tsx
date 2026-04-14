'use client';

import { Button } from './Button';
import { Input } from './Input';
import type { PortalIdentity } from '@quiz/types';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { loginPortalSession, type LoginPlatform } from './lib/portal-auth';

const DEFAULT_LOGIN_ENDPOINT = '/api/auth/login';

export interface PortalLoginPageProps {
  title: string;
  description: string;
  portalIdentity: PortalIdentity;
  platform: LoginPlatform;
  allowedRoles: string[];
  portalName: string;
  footerTitle?: string;
  footerSubtitle?: string;
  loginEndpoint?: string;
}

function normalizeRedirectTarget(rawTarget: string | null): string {
  if (typeof rawTarget === 'string' && rawTarget.startsWith('/') && !rawTarget.startsWith('//')) {
    return rawTarget;
  }

  return '/';
}

export function PortalLoginPage({
  title,
  description,
  portalIdentity,
  platform,
  allowedRoles,
  portalName,
  footerTitle = 'Restricted Access System v1.0.4',
  footerSubtitle = 'Unauthorized access attempts are logged and reported.',
  loginEndpoint = DEFAULT_LOGIN_ENDPOINT,
}: PortalLoginPageProps) {
  const searchParams = useSearchParams();
  const redirectTarget = normalizeRedirectTarget(searchParams.get('redirect'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginPortalSession({
        email: formData.email,
        password: formData.password,
        platform,
        portalIdentity,
        portalName,
        allowedRoles,
        loginEndpoint,
      });

      window.location.replace(redirectTarget);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#1A1A1A]">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-600">
          <ShieldCheck size={16} />
          {error}
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6" autoComplete="off">
        <div className="space-y-2">
          <label
            className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
            htmlFor={`${portalIdentity}-login-email`}
          >
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 z-10 h-5 w-5 text-slate-400" />
            <Input
              type="email"
              required
              id={`${portalIdentity}-login-email`}
              name="username"
              autoComplete="username"
              className="pl-12"
              placeholder="admin@quizplatform.com"
              value={formData.email}
              onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
            htmlFor={`${portalIdentity}-login-password`}
          >
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-4 z-10 h-5 w-5 text-slate-400" />
            <Input
              type="password"
              required
              minLength={1}
              id={`${portalIdentity}-login-password`}
              name="password"
              autoComplete="current-password"
              className="pl-12"
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl py-7 shadow-lg shadow-primary/25"
        >
          {isLoading ? (
            <>
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              AUTHENTICATING...
            </>
          ) : (
            'AUTHENTICATE'
          )}
        </Button>
      </form>

      <div className="mt-8 border-t pt-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{footerTitle}</p>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-widest text-slate-400">{footerSubtitle}</p>
      </div>
    </div>
  );
}
