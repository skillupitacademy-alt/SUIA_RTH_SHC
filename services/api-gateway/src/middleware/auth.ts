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
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)skillhubcore_accessToken=([^;]+)/);
  if (cookieMatch?.[1] !== undefined) {
    return decodeURIComponent(cookieMatch[1]);
  }

  const accessTokenMatch = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
  return accessTokenMatch?.[1] !== undefined ? decodeURIComponent(accessTokenMatch[1]) : undefined;
}

export function hasRequiredRole(payload: SkillHubCoreTokenPayload, requiredRole: 'admin'): boolean {
  return payload.roles.includes(requiredRole) || payload.roles.includes('super_admin');
}

export async function verifySkillHubCoreJWT(token: string, secret: string): Promise<SkillHubCoreTokenPayload> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    issuer: 'skillhubcore.in',
  });

  if (
    typeof payload.sub !== 'string' ||
    payload.sub.trim().length === 0 ||
    !Array.isArray((payload as { roles?: unknown }).roles) ||
    !Array.isArray((payload as { subscriptions?: unknown }).subscriptions)
  ) {
    throw new Error('Invalid SkillHubCore token payload');
  }

  return payload as unknown as SkillHubCoreTokenPayload;
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
    const payload = await verifySkillHubCoreJWT(token, env.JWT_SECRET);
    return { payload };
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
}
