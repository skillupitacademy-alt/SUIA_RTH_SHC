import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? 'https://quiz.realtutorialhub.com/login';
const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;

const PUBLIC_PATHS = ['/', '/api/healthz'];
const PUBLIC_PREFIXES = ['/api/certificates/verify/'];
const PROTECTED_PREFIXES = ['/learn/', '/api/tutorial/', '/api/ai-tutor/', '/remediation/'];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || hasPrefix(pathname, PUBLIC_PREFIXES);
}

export function isProtectedRoute(pathname: string): boolean {
  return hasPrefix(pathname, PROTECTED_PREFIXES);
}

export function getAccessToken(request: NextRequest): string | undefined {
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

function hasValidGatewaySecret(request: NextRequest): boolean {
  if (typeof INTERNAL_GATEWAY_SECRET !== 'string' || INTERNAL_GATEWAY_SECRET.length === 0) {
    return true;
  }

  return request.headers.get('x-gateway-secret') === INTERNAL_GATEWAY_SECRET;
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

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (hasValidGatewaySecret(request) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;

  if (isProtectedRoute(pathname) && user === null) {
    return NextResponse.redirect(getLoginUrl(request, redirectPath));
  }

  if (user !== null) {
    const headers = new Headers(request.headers);
    headers.set('x-user-id', user.sub);
    return addUserHeaders(NextResponse.next({ request: { headers } }), user);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
