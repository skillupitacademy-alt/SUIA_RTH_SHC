import { jwtVerify } from 'jose';

import type { GatewayBindings } from '@/types';
import type { SkillHubCoreTokenPayload } from '@/types';

function getTokenFromHeaders(request: Request): string | undefined {
  const authorization = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    const bearerToken = authorization.slice(7).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
  if (cookieMatch?.[1] !== undefined) {
    return decodeURIComponent(cookieMatch[1]);
  }

  const accessTokenMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
  return accessTokenMatch?.[1] !== undefined ? decodeURIComponent(accessTokenMatch[1]) : undefined;
}

export function hasRequiredRole(payload: SkillHubCoreTokenPayload, requiredRole: 'admin'): boolean {
  return payload.roles.includes(requiredRole) || payload.roles.includes('super_admin');
}

export async function verifyAccessToken(token: string, secret: string): Promise<SkillHubCoreTokenPayload> {
  // Do NOT require issuer — quiz-api-server tokens do not set one.
  // SkillHubCore tokens may have issuer='skillhubcore.in', but that's optional now.
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

  const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
  // quiz-api-server stores userId in a custom claim; fall back to sub
  const userId = typeof (payload as any).userId === 'string' ? (payload as any).userId : sub;

  if (userId.length === 0) {
    throw new Error('Invalid token payload: missing user identifier');
  }

  // Build a compatible payload shape — quiz tokens may not have roles/subscriptions
  const roles = Array.isArray((payload as any).roles) ? (payload as any).roles : ['user'];
  const subscriptions = Array.isArray((payload as any).subscriptions) ? (payload as any).subscriptions : [];

  return {
    ...payload,
    sub: userId,
    roles,
    subscriptions,
  } as unknown as SkillHubCoreTokenPayload;
}

export async function authenticateRequest(
  request: Request,
  env: GatewayBindings,
): Promise<{ payload: SkillHubCoreTokenPayload } | Response> {
  const token = getTokenFromHeaders(request);
  if (token === undefined || token.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const payload = await verifyAccessToken(token, env.JWT_SECRET);
    return { payload };
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
}
