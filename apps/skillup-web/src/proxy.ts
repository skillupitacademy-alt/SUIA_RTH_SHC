import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@quiz/auth';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';

const PUBLIC_PATHS = ['/', '/programs', '/api/healthz', '/verify', '/login', '/register'];
const PROTECTED_PATHS = ['/student', '/dashboard', '/profile'];
const OVERRIDE_ROLES = ['admin', 'super_admin', 'faculty'];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || hasPrefix(pathname, ['/verify']);
}

function isProtectedRoute(pathname: string): boolean {
  return hasPrefix(pathname, PROTECTED_PATHS);
}

function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;
}

function getLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    LOGIN_URL.startsWith('http://') || LOGIN_URL.startsWith('https://')
      ? new URL(LOGIN_URL)
      : new URL(LOGIN_URL, request.url);
  loginUrl.searchParams.set('reason', 'session_expired');
  loginUrl.searchParams.set('redirect', redirectPath);
  return loginUrl;
}

type UserPayload = { sub: string; roles: string[] };

type VerifiedTokenPayload = {
  sub?: string;
  userId?: string;
  roles?: string[];
};

function getTokenUserId(payload: VerifiedTokenPayload): string | null {
  return payload.sub ?? payload.userId ?? null;
}

function addUserHeaders(response: NextResponse, payload: UserPayload): NextResponse {
  response.headers.set('x-user-id', payload.sub);
  return response;
}

async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getAccessToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const userId = getTokenUserId(payload);
    if (userId === null) {
      return null;
    }
    return { sub: userId, roles: payload.roles ?? [] };
  } catch {
    return null;
  }
}

function hasRequiredRole(payload: UserPayload): boolean {
  return payload.roles.includes('student') || payload.roles.some((role) => OVERRIDE_ROLES.includes(role));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;

  if (isProtectedRoute(pathname) && user === null) {
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (isPublicRoute(pathname)) {
    return user !== null
      ? addUserHeaders(NextResponse.next({ request: { headers: new Headers(request.headers) } }), user)
      : NextResponse.next();
  }

  if (isProtectedRoute(pathname)) {
    if (user !== null && hasRequiredRole(user) === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const headers = new Headers(request.headers);
    if (user !== null) {
      headers.set('x-user-id', user.sub);
    }

    return user !== null
      ? addUserHeaders(NextResponse.next({ request: { headers } }), user)
      : NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
