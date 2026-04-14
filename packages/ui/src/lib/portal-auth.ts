import type { PortalIdentity } from '@quiz/types';

export type LoginPlatform = 'realtutorialhub' | 'skillup';

export interface LoginPortalSessionParams {
  email: string;
  password: string;
  platform: LoginPlatform;
  portalIdentity: PortalIdentity;
  portalName: string;
  allowedRoles: string[];
  loginEndpoint?: string;
}

interface LoginPortalSessionResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    isAdmin?: boolean;
    role?: string;
    onboarded?: boolean;
  };
  expiresAt: string | null;
}

const DEFAULT_LOGIN_ENDPOINT = '/api/auth/login';

/**
 * Shared portal login function. Sends credentials to the BFF login endpoint
 * with `credentials: 'include'` for cookie-based auth. Used by PortalLoginPage
 * and AdminLockScreen.
 */
export async function loginPortalSession({
  email,
  password,
  platform,
  portalIdentity,
  portalName,
  allowedRoles,
  loginEndpoint = DEFAULT_LOGIN_ENDPOINT,
}: LoginPortalSessionParams): Promise<LoginPortalSessionResponse> {
  const response = await fetch(loginEndpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-platform': platform,
    },
    body: JSON.stringify({
      email,
      password,
      platform,
      portalIdentity,
      portalName,
      allowedRoles,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; user?: LoginPortalSessionResponse['user']; expiresAt?: string | null }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Authentication failed');
  }

  return {
    user: payload?.user ?? { id: '', email },
    expiresAt: payload?.expiresAt ?? null,
  };
}

// Re-export from auth-portal for backwards compatibility
export { getAuthCookieName } from './auth-portal';
