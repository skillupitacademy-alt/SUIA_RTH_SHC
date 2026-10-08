import { TokenService, type SkillHubCoreTokenPayload } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';

type VerifiedPlacementUser = SkillHubCoreTokenPayload & {
  shadowUserId: string;
  originalUserId: string;
};

function getSkillHubCoreToken(request: NextRequest): string | undefined {
  return request.cookies.get('skillhubcore_accessToken')?.value;
}

function addUserHeaders(response: NextResponse, payload: VerifiedPlacementUser): NextResponse {
  response.headers.set('x-user-id', payload.shadowUserId);
  response.headers.set('x-shadow-user-id', payload.shadowUserId);
  response.headers.set('x-original-user-id', payload.originalUserId);
  response.headers.set('x-portal-identity', 'user');
  if (typeof payload.brand === 'string' && payload.brand.length > 0) {
    response.headers.set('x-brand', payload.brand);
    response.headers.set('x-platform', payload.brand);
  }
  return response;
}

async function resolveUser(request: NextRequest): Promise<VerifiedPlacementUser | null> {
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

    return payload as VerifiedPlacementUser;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const user = await resolveUser(request);
  if (user === null) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  headers.set('x-user-id', user.shadowUserId);
  headers.set('x-shadow-user-id', user.shadowUserId);
  headers.set('x-original-user-id', user.originalUserId);
  headers.set('x-portal-identity', 'user');
  if (typeof user.brand === 'string' && user.brand.length > 0) {
    headers.set('x-brand', user.brand);
    headers.set('x-platform', user.brand);
  }

  return addUserHeaders(NextResponse.next({ request: { headers } }), user);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
