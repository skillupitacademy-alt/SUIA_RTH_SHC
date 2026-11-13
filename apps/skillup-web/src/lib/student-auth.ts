import { TokenService, type UserTokenPayload } from '@quiz/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

// 🔥 CRITICAL FIX: All roles must be lowercase to prevent security bypass
const ALLOWED_ROLES = new Set(['student', 'admin', 'super_admin', 'faculty']);

type StudentAuthFailure = { ok: false; response: NextResponse };
type LearnerIdentity = {
  ok: true;
  learnerUserId: string;
  peoplePersonId: string | null;
  payload: UserTokenPayload;
};
type PeopleIdentity = LearnerIdentity & {
  peoplePersonId: string;
  /** @deprecated PeopleDB primary key only. Use peoplePersonId explicitly. */
  userId: string;
};
type StudentAuthResult = LearnerIdentity | PeopleIdentity | StudentAuthFailure;
const personIdSchema = z.string().uuid();

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
  let roles: string[] = [];
  
  if (Array.isArray(payload.roles) && payload.roles.length > 0) {
    roles = payload.roles.filter((role): role is string => 
      typeof role === 'string' && role.trim().length > 0
    );
  } else if (typeof payload.role === 'string' && payload.role.trim().length > 0) {
    roles = [payload.role.trim()];
  }
  
  // 🔥 CRITICAL: Normalize roles to prevent security bypass
  // This is the ONLY place in SkillUp auth where normalization happens
  const normalizedRoles = roles.map(role => role.toLowerCase().trim());
  
  // 📊 SECURITY AUDIT: Log role normalization violations (dev only)
  const hadMixedCase = roles.some(role => role !== role.toLowerCase());
  if (hadMixedCase && process.env.NODE_ENV !== 'production') {
    // console.warn('⚠️ SECURITY: Role normalization in SkillUp auth', JSON.stringify({
    //   tag: 'SKILLUP_ROLE_NORMALIZATION',
    //   original: roles,
    //   normalized: normalizedRoles,
    //   timestamp: new Date().toISOString(),
    // }));
  }
  
  return normalizedRoles;
}

function hasSkillupAccess(payload: UserTokenPayload): boolean {
  // Membership in multiple brands does not change the scope of this access token.
  return payload.brand === 'skillup';
}

export function requireStudentAuth(request: NextRequest): Promise<PeopleIdentity | StudentAuthFailure>;
export function requireStudentAuth(request: NextRequest, options: { identity: 'people' }): Promise<PeopleIdentity | StudentAuthFailure>;
export function requireStudentAuth(request: NextRequest, options: { identity: 'learner' }): Promise<LearnerIdentity | StudentAuthFailure>;
export async function requireStudentAuth(
  request: NextRequest,
  options: { identity: 'learner' | 'people' } = { identity: 'people' },
): Promise<StudentAuthResult> {
  // console.log('[ILS-DEBUG][AUTH][requireStudentAuth] Starting authentication');
  
  const token = getRequestToken(request);
  if (token === null) {
    // console.warn('[ILS-DEBUG][AUTH][requireStudentAuth][FAILED] No token found');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  // console.log('[ILS-DEBUG][AUTH][requireStudentAuth] Token found, verifying...');

  try {
    const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
    // console.log('[ILS-DEBUG][AUTH][requireStudentAuth] Token verified', {
    //   hasBrand: !!payload.brand,
    //   brand: payload.brand,
    //   hasPlatforms: !!payload.platforms,
    //   platforms: payload.platforms
    // });
    
    const roles = getPayloadRoles(payload);
    const learnerUserId = typeof payload.userId === 'string' && payload.userId.trim().length > 0
      ? payload.userId.trim() : null;
    const shadow = personIdSchema.safeParse(payload.shadowUserId);
    const peoplePersonId = shadow.success ? shadow.data : null;

    if (learnerUserId === null) {
      // console.warn('[ILS-DEBUG][AUTH][requireStudentAuth][FAILED] No userId in payload');
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    // console.log('[ILS-DEBUG][AUTH][requireStudentAuth] Brand check', {
    //   hasSkillupAccess: hasSkillupAccess(payload)
    // });
    
    if (hasSkillupAccess(payload) === false) {
      // console.warn('[ILS-DEBUG][AUTH][requireStudentAuth][FAILED] Brand check failed - no SkillUp access');
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    // console.log('[ILS-DEBUG][AUTH][requireStudentAuth] Role check', {
    //   hasAllowedRole: roles.some((role) => ALLOWED_ROLES.has(role)),
    //   roles
    // });
    
    if (roles.some((role) => ALLOWED_ROLES.has(role)) === false) {
      // console.warn('[ILS-DEBUG][AUTH][requireStudentAuth][FAILED] Role check failed - no allowed role');
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      };
    }

    if (options.identity === 'learner') {
      // This mode deliberately does not resolve a PeopleDB relationship.
      return { ok: true, learnerUserId, peoplePersonId: null, payload };
    }
    if (peoplePersonId === null) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Access denied' }, {
          status: 403, headers: { 'Cache-Control': 'private, no-store' },
        }),
      };
    }
    try {
      // PeopleDB consumers require the signed person ID to map to this exact
      // brand-local subject. Equal UUID values alone never establish the link.
      const [{ db, users }, { and, eq, isNull }] = await Promise.all([
        import('@quiz/db-people'), import('drizzle-orm'),
      ]);
      const person = await db.query.users.findFirst({
        columns: { id: true },
        where: and(
          eq(users.id, peoplePersonId), eq(users.externalId, learnerUserId),
          eq(users.platform, 'skillup'), eq(users.isActive, true), isNull(users.deletedAt),
        ),
      });
      if (!person || person.id !== peoplePersonId) {
        return {
          ok: false,
          response: NextResponse.json({ error: 'Access denied' }, {
            status: 403, headers: { 'Cache-Control': 'private, no-store' },
          }),
        };
      }
    } catch {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Account verification unavailable' }, {
          status: 503, headers: { 'Cache-Control': 'private, no-store' },
        }),
      };
    }
    return { ok: true, learnerUserId, peoplePersonId, userId: peoplePersonId, payload };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SkillUp learner auth] token verification failed', {
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      });
    }
    // console.error('[ILS-DEBUG][AUTH][requireStudentAuth][ERROR] Token verification failed');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
}
