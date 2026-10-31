import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';

const PUBLIC_PATHS = ['/api/healthz', '/login', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/me'];
const REQUIRED_ROLES = ['faculty', 'super_admin'];

export type FacultyBrand = 'realtutorialhub' | 'skillup';

function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
}

function getLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    LOGIN_URL.startsWith('http://') || LOGIN_URL.startsWith('https://')
      ? new URL(LOGIN_URL)
      : new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  return loginUrl;
}

export type UserPayload = {
  sub: string;
  roles: string[];
  shadowUserId: string;
  originalUserId: string;
  brand: FacultyBrand;
};

export type VerifiedTokenPayload = {
  sub?: string;
  userId?: string;
  originalUserId?: string;
  shadowUserId?: string;
  roles?: string[];
  brand?: string;
};

function getTokenIds(payload: VerifiedTokenPayload): { originalUserId: string; shadowUserId: string } | null {
  const originalUserId = payload.originalUserId ?? payload.userId ?? null;
  if (originalUserId === null || originalUserId.trim().length === 0) {
    return null;
  }

  const shadowUserId = payload.shadowUserId ?? payload.userId ?? null;
  if (shadowUserId === null || shadowUserId.trim().length === 0) {
    return null;
  }
  return { originalUserId, shadowUserId };
}

function getVerifiedBrand(payload: VerifiedTokenPayload): FacultyBrand | null {
  if (payload.brand === 'realtutorialhub' || payload.brand === 'skillup') {
    return payload.brand;
  }
  return null;
}

export function stripClientHeaders(headers: Headers): Headers {
  const stripped = new Headers(headers);
  stripped.delete('x-user-id');
  stripped.delete('x-shadow-user-id');
  stripped.delete('x-original-user-id');
  stripped.delete('x-brand');
  stripped.delete('x-platform');
  stripped.delete('x-user-roles');
  stripped.delete('x-gateway-secret');
  stripped.delete('x-internal-secret');
  return stripped;
}

export function addUserHeaders(response: NextResponse, payload: UserPayload): NextResponse {
  response.headers.set('x-user-id', payload.shadowUserId);
  response.headers.set('x-shadow-user-id', payload.shadowUserId);
  response.headers.set('x-original-user-id', payload.originalUserId);
  response.headers.set('x-brand', payload.brand);
  response.headers.set('x-platform', payload.brand);
  if (payload.roles.length > 0) {
    response.headers.set('x-user-roles', payload.roles.join(','));
  }
  return response;
}

export async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getAccessToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const userIds = getTokenIds(payload as VerifiedTokenPayload);
    if (userIds === null) {
      return null;
    }
    const brand = getVerifiedBrand(payload as VerifiedTokenPayload);
    if (brand === null) {
      return null;
    }
    return {
      sub: userIds.shadowUserId,
      roles: payload.roles ?? [],
      shadowUserId: userIds.shadowUserId,
      originalUserId: userIds.originalUserId,
      brand,
    };
  } catch {
    return null;
  }
}

export function hasRequiredRole(payload: UserPayload): boolean {
  return payload.roles.some((role) => REQUIRED_ROLES.includes(role));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;
  const strippedHeaders = stripClientHeaders(request.headers);

  if (PUBLIC_PATHS.includes(pathname)) {
    if (user !== null) {
      strippedHeaders.set('x-user-id', user.shadowUserId);
      strippedHeaders.set('x-shadow-user-id', user.shadowUserId);
      strippedHeaders.set('x-original-user-id', user.originalUserId);
      strippedHeaders.set('x-brand', user.brand);
      strippedHeaders.set('x-platform', user.brand);
      if (user.roles.length > 0) {
        strippedHeaders.set('x-user-roles', user.roles.join(','));
      }
      return addUserHeaders(NextResponse.next({ request: { headers: strippedHeaders } }), user);
    }
    return NextResponse.next({ request: { headers: strippedHeaders } });
  }

  if (user === null) {
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (hasRequiredRole(user) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  strippedHeaders.set('x-user-id', user.shadowUserId);
  strippedHeaders.set('x-shadow-user-id', user.shadowUserId);
  strippedHeaders.set('x-original-user-id', user.originalUserId);
  strippedHeaders.set('x-brand', user.brand);
  strippedHeaders.set('x-platform', user.brand);
  if (user.roles.length > 0) {
    strippedHeaders.set('x-user-roles', user.roles.join(','));
  }
  return addUserHeaders(NextResponse.next({ request: { headers: strippedHeaders } }), user);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
