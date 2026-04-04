import { TokenService, type UserTokenPayload } from '@quiz/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ROLES = new Set(['student', 'admin', 'super_admin', 'faculty']);

type StudentAuthResult =
  | {
      ok: true;
      userId: string;
      payload: UserTokenPayload;
    }
  | {
      ok: false;
      response: NextResponse;
    };

function getRequestToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get('accessToken')?.value;
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice('Bearer '.length).trim();
    if (bearerToken.length > 0) {
      return bearerToken;
    }
  }

  return null;
}

function getPayloadRoles(payload: UserTokenPayload): string[] {
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    return payload.roles.filter((role): role is string => typeof role === 'string' && role.trim().length > 0);
  }

  if (typeof payload.role === 'string' && payload.role.trim().length > 0) {
    return [payload.role.trim()];
  }

  return [];
}

function hasSkillupAccess(payload: UserTokenPayload): boolean {
  if (payload.brand === 'skillup') {
    return true;
  }

  return Array.isArray(payload.platforms) && payload.platforms.includes('skillup');
}

export async function requireStudentAuth(request: NextRequest): Promise<StudentAuthResult> {
  const token = getRequestToken(request);
  if (token === null) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    const roles = getPayloadRoles(payload);
    const userId =
      typeof payload.shadowUserId === 'string' && payload.shadowUserId.trim().length > 0
        ? payload.shadowUserId.trim()
        : typeof payload.userId === 'string' && payload.userId.trim().length > 0
          ? payload.userId.trim()
          : null;

    if (userId === null || hasSkillupAccess(payload) === false) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    if (roles.some((role) => ALLOWED_ROLES.has(role)) === false) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    return { ok: true, userId, payload };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
}
