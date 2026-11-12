import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface ExpectedLearner {
  originalUserId: string;
  roles: string[];
}

/** Reuse the identity handler's current account and persisted session checks. */
export async function requireCurrentLearnerSession(
  request: NextRequest,
  expected: ExpectedLearner,
): Promise<NextResponse | null> {
  const deny = (status: number, error: string) => NextResponse.json(
    { error }, { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
  const gateway = process.env.GATEWAY_URL?.trim().replace(/\/+$/, '');
  const secret = process.env.INTERNAL_GATEWAY_SECRET;
  if (!gateway || !secret) return deny(503, 'Authentication unavailable');

  try {
    const endpoint = `${gateway.endsWith('/api') ? gateway : `${gateway}/api`}/auth/me`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        cookie: request.headers.get('cookie') ?? '',
        'x-original-host': new URL(`http://${request.headers.get('host') ?? request.nextUrl.host}`).hostname,
        'x-internal-secret': secret,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(process.env.NODE_ENV === 'development' ? 15000 : 5000),
    });
    if (response.status === 401 || response.status === 404) return deny(401, 'Authentication required');
    if (response.status === 403) return deny(403, 'Access denied');
    if (!response.ok) return deny(503, 'Authentication unavailable');

    const body = await response.json() as { data?: { user?: { id?: unknown; roles?: unknown } }; user?: { id?: unknown; roles?: unknown } };
    const user = body.data?.user ?? body.user;
    if (!user || user.id !== expected.originalUserId || !Array.isArray(user.roles)) {
      return deny(401, 'Authentication required');
    }
    const normalizeRole = (role: string) => role.trim().toLowerCase() === 'user' ? 'student' : role.trim().toLowerCase();
    const currentRoles = user.roles.filter((role): role is string => typeof role === 'string').map(normalizeRole);
    if (expected.roles.length === 0 || !expected.roles.every(role => currentRoles.includes(normalizeRole(role)))) {
      return deny(403, 'Account permissions changed');
    }
    return null;
  } catch {
    return deny(503, 'Authentication unavailable');
  }
}
