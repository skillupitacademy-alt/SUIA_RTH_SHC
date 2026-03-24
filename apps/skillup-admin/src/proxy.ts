import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? '/login';

const PUBLIC_PATHS = ['/api/healthz', '/login', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/me'];
const REQUIRED_ROLES = ['admin', 'super_admin'];

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
  response.headers.set('x-user-roles', payload.roles.join(','));
  response.headers.set('x-user-primary-role', payload.roles[0] ?? 'student');
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
  return payload.roles.some((role) => REQUIRED_ROLES.includes(role));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;

  if (PUBLIC_PATHS.includes(pathname)) {
    return user !== null
      ? addUserHeaders(NextResponse.next({ request: { headers: new Headers(request.headers) } }), user)
      : NextResponse.next();
  }

  if (user === null) {
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (hasRequiredRole(user) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const headers = new Headers(request.headers);
  headers.set('x-user-id', user.sub);
  headers.set('x-user-roles', user.roles.join(','));
  headers.set('x-user-primary-role', user.roles[0] ?? 'student');
  return addUserHeaders(NextResponse.next({ request: { headers } }), user);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
