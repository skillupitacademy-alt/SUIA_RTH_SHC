import { TokenService, type SkillHubCoreTokenPayload } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

const SKILLHUBCORE_LOGIN_URL =
  process.env.SKILLHUBCORE_LOGIN_URL ??
  process.env.NEXT_PUBLIC_SKILLHUBCORE_LOGIN_URL ??
  '/login';

const PUBLIC_PATHS = ['/api/healthz', '/login', '/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/me'];
const REQUIRED_ROLES = ['super_admin'];

function getSkillHubCoreToken(request: NextRequest): string | undefined {
  return request.cookies.get('skillhubcore_accessToken')?.value;
}

function getSkillHubCoreLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    SKILLHUBCORE_LOGIN_URL.startsWith('http://') || SKILLHUBCORE_LOGIN_URL.startsWith('https://')
      ? new URL(SKILLHUBCORE_LOGIN_URL)
      : new URL(SKILLHUBCORE_LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  return loginUrl;
}

type VerifiedSkillHubCoreUser = SkillHubCoreTokenPayload & {
  shadowUserId: string;
  originalUserId: string;
};

function addUserHeaders(response: NextResponse, payload: VerifiedSkillHubCoreUser): NextResponse {
  response.headers.set('x-user-id', payload.shadowUserId);
  response.headers.set('x-skillhubcore-user-id', payload.shadowUserId);
  response.headers.set('x-shadow-user-id', payload.shadowUserId);
  response.headers.set('x-original-user-id', payload.originalUserId);
  return response;
}

async function resolveUser(request: NextRequest): Promise<VerifiedSkillHubCoreUser | null> {
  const token = getSkillHubCoreToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    const payload = await TokenService.verifySkillHubCoreJWT(token);
    if (
      typeof payload.shadowUserId !== 'string' ||
      payload.shadowUserId.trim().length === 0 ||
      typeof payload.originalUserId !== 'string' ||
      payload.originalUserId.trim().length === 0
    ) {
      return null;
    }

    return payload as VerifiedSkillHubCoreUser;
  } catch {
    return null;
  }
}

function hasRequiredRole(payload: VerifiedSkillHubCoreUser): boolean {
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
    return NextResponse.redirect(getSkillHubCoreLoginUrl(request, redirectPath));
  }

  if (hasRequiredRole(user) === false) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const headers = new Headers(request.headers);
  headers.set('x-user-id', user.shadowUserId);
  headers.set('x-skillhubcore-user-id', user.shadowUserId);
  headers.set('x-shadow-user-id', user.shadowUserId);
  headers.set('x-original-user-id', user.originalUserId);
  return addUserHeaders(NextResponse.next({ request: { headers } }), user);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
