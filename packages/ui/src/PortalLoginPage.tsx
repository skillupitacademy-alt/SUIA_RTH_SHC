'use client';

import { Button } from './Button';
import { Input } from './Input';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const DEFAULT_LOGIN_ENDPOINT = `${(process.env.NEXT_PUBLIC_API_URL ?? 'https://api.realtutorialhub.com').replace(/\/+$/, '').replace(/\/api$/i, '')}/auth/login`;

export type PortalIdentity = 'admin' | 'faculty' | 'super_admin';
export type LoginPlatform = 'realtutorialhub' | 'skillup' | 'both';

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

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    roles?: string[];
    email?: string;
    id?: string;
  };
  error?: string;
  message?: string;
  _error?: string;
};

function decodeJwtExpiry(token: string): string | null {
  try {
    const [, payload] = token.split('.');
    if (payload === undefined) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(padded));
    if (typeof parsed.exp !== 'number') return null;

    return new Date(parsed.exp * 1000).toISOString();
  } catch {
    return null;
  }
}

function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const explicit = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim();
  if (explicit !== undefined && explicit.length > 0) {
    return explicit.startsWith('.') ? explicit : `.${explicit}`;
  }

  const { hostname } = window.location;
  if (hostname === 'localhost' || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return undefined;
  }

  const segments = hostname.split('.');
  if (segments.length < 3) {
    return undefined;
  }

  return `.${segments.slice(-2).join('.')}`;
}

function setClientCookie(name: string, value: string, expiresAt: string | null): void {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'SameSite=Lax'];
  const cookieDomain = getCookieDomain();

  if (cookieDomain !== undefined) {
    parts.push(`Domain=${cookieDomain}`);
  }

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure');
  }

  if (expiresAt !== null && expiresAt !== '') {
    parts.push(`expires=${new Date(expiresAt).toUTCString()}`);
  }

  document.cookie = parts.join('; ');
}

function normalizeRedirectTarget(rawTarget: string | null): string {
  if (typeof rawTarget === 'string' && rawTarget.startsWith('/') && !rawTarget.startsWith('//')) {
    return rawTarget;
  }

  return '/';
}

function toErrorMessage(response: Response | null, payload: LoginResponse | null, fallback: string): string {
  const candidate = payload?.error ?? payload?.message ?? payload?._error;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }

  if (response !== null && response.status === 401) {
    return 'Invalid credentials';
  }

  if (response !== null && response.status === 403) {
    return 'Access denied: this account is not permitted for this portal.';
  }

  return fallback;
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
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'x-portal-identity': portalIdentity,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          platform,
        }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;

      if (!response.ok) {
        throw new Error(toErrorMessage(response, payload, 'Authentication failed'));
      }

      // API server already set httpOnly cookies via Set-Cookie header.
      // We do NOT create client-side cookies to avoid scope conflicts.
      const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
      const roles = Array.isArray(payload?.user?.roles) ? payload?.user?.roles ?? [] : [];

      if (accessToken.length === 0) {
        throw new Error('Authentication failed: missing access token.');
      }

      if (roles.some((role) => allowedRoles.includes(role)) === false) {
        throw new Error(`Access denied: ${portalName} privileges required.`);
      }

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
