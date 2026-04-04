import { NextResponse } from 'next/server';
import { TokenService } from '@quiz/auth';

import { resolveSkillHubCoreServiceUrl, setSkillHubCoreAuthCookies } from '@/lib/skillhubcore-auth-api';

type LoginBody = {
  email?: string;
  password?: string;
  portalIdentity?: 'admin' | 'super_admin';
};

type LoginResponseBody = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string;
    roles?: string[];
    platforms?: string[];
    subscriptions?: string[];
  };
  error?: string;
  message?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (email.length === 0 || password.length === 0) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const upstreamResponse = await fetch(`${resolveSkillHubCoreServiceUrl()}/auth/admin/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
      'x-portal-identity': 'super_admin',
    },
    body: JSON.stringify({
      email,
      password,
      portalIdentity: body.portalIdentity ?? 'super_admin',
    }),
    cache: 'no-store',
  });

  const payload = (await upstreamResponse.json().catch(() => null)) as LoginResponseBody | null;

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      { error: payload?.error ?? payload?.message ?? 'Login failed' },
      { status: upstreamResponse.status },
    );
  }

  const accessToken = typeof payload?.accessToken === 'string' ? payload.accessToken.trim() : '';
  const refreshToken = typeof payload?.refreshToken === 'string' ? payload.refreshToken.trim() : '';
  if (accessToken.length === 0 || refreshToken.length === 0) {
    return NextResponse.json({ error: 'Invalid auth response' }, { status: 502 });
  }

  const verified = await TokenService.verifySkillHubCoreJWT(accessToken);
  const hasAllowedRole = verified.roles.includes('admin') || verified.roles.includes('super_admin');
  if (hasAllowedRole === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const response = NextResponse.json({
    user: payload?.user ?? {
      id: verified.shadowUserId ?? verified.sub,
      email,
      roles: verified.roles,
      platforms: verified.platforms,
      subscriptions: verified.subscriptions,
    },
    expiresAt: TokenService.getExpiration(accessToken),
  });

  setSkillHubCoreAuthCookies(response, accessToken, refreshToken, TokenService.getExpiration(accessToken));
  return response;
}
