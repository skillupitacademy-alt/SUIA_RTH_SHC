import { NextRequest, NextResponse } from 'next/server';
import { TokenService, type SkillHubCoreTokenPayload } from '@quiz/auth';

const SKILLHUBCORE_LOGIN_URL =
  process.env.SKILLHUBCORE_LOGIN_URL ??
  process.env.NEXT_PUBLIC_SKILLHUBCORE_LOGIN_URL ??
  '/login';

const PUBLIC_PATHS = ['/', '/programs', '/api/healthz', '/verify'];
const STUDENT_PATHS = ['/student'];
const OVERRIDE_ROLES = ['admin', 'super_admin', 'faculty'];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || hasPrefix(pathname, ['/verify']);
}

function isStudentRoute(pathname: string): boolean {
  return hasPrefix(pathname, STUDENT_PATHS);
}

function getSkillHubCoreToken(request: NextRequest): string | undefined {
  return request.cookies.get('skillhubcore_accessToken')?.value ?? request.cookies.get('accessToken')?.value;
}

function getSkillHubCoreLoginUrl(request: NextRequest, redirectPath: string): URL {
  const loginUrl =
    SKILLHUBCORE_LOGIN_URL.startsWith('http://') || SKILLHUBCORE_LOGIN_URL.startsWith('https://')
      ? new URL(SKILLHUBCORE_LOGIN_URL)
      : new URL(SKILLHUBCORE_LOGIN_URL, request.url);
  loginUrl.searchParams.set('redirect', redirectPath);
  return loginUrl;
}

function addUserHeaders(response: NextResponse, payload: SkillHubCoreTokenPayload): NextResponse {
  response.headers.set('x-user-id', payload.sub);
  response.headers.set('x-skillhubcore-user-id', payload.sub);
  return response;
}

async function resolveUser(request: NextRequest): Promise<SkillHubCoreTokenPayload | null> {
  const token = getSkillHubCoreToken(request);
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  try {
    return await TokenService.verifySkillHubCoreJWT(token);
  } catch {
    return null;
  }
}

function hasRequiredRole(payload: SkillHubCoreTokenPayload): boolean {
  return payload.roles.includes('student') || payload.roles.some((role) => OVERRIDE_ROLES.includes(role));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = await resolveUser(request);
  const redirectPath = `${pathname}${search}`;

  if (isStudentRoute(pathname) && user === null) {
    return NextResponse.redirect(getSkillHubCoreLoginUrl(request, redirectPath));
  }

  if (isPublicRoute(pathname)) {
    return user !== null
      ? addUserHeaders(NextResponse.next({ request: { headers: new Headers(request.headers) } }), user)
      : NextResponse.next();
  }

  if (isStudentRoute(pathname)) {
    if (user !== null && hasRequiredRole(user) === false) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const headers = new Headers(request.headers);
    if (user !== null) {
      headers.set('x-user-id', user.sub);
      headers.set('x-skillhubcore-user-id', user.sub);
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
