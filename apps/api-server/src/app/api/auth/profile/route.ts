// 🔥 STEP 1C: RBAC Integration (First Route) - WITH OWNERSHIP
import { validateBrandOrThrow } from '@quiz/auth';
import type { OwnershipContext } from '@quiz/auth/rbac/ownership.service';
import { OwnershipRBACService } from '@quiz/auth/rbac/ownership.service';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import type { Role } from '@quiz/auth/rbac/roles';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth-context';
import { withCacheHeaders } from '@/lib/cache-headers';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext } from '@/modules/auth/brand-db';

export const dynamic = 'force-dynamic';

// 🔥 RBAC: Role normalization function (local copy to avoid import issues)
const VALID_ROLES: Set<Role> = new Set(['student', 'admin', 'super_admin', 'faculty']);

function normalizeRoles(roles: string[] = []): Role[] {
  const normalized = roles
    .map(role => role.toLowerCase().trim())
    .filter(role => role.length > 0)
    // 🔥 UNIFY: Convert 'user' → 'student'
    .map(role => role === 'user' ? 'student' : role);
  
  // Filter out unknown roles for security
  const validRoles = normalized.filter((role): role is Role => VALID_ROLES.has(role as Role));
  
  // 🚨 CRITICAL SECURITY: Return empty array if no valid roles
  // DO NOT fallback to ['student'] here - that would make RBAC fake
  // Let the caller decide what to do with empty roles
  return [...new Set(validRoles)];
}

// 🚨 CRITICAL SECURITY: Helper to get roles for RBAC (no fallback to 'user')
function getRBACRoles(authRoles: string[] | undefined): Role[] {
  const normalized = normalizeRoles(authRoles || []);
  // Return empty array if no valid roles - this will cause RBAC denial
  return normalized;
}

// Parse the existing mutable contract before constructing a persistence update.
// Unknown identity, ownership and database fields are discarded here.
const profileUpdateSchema = z.object({
  name: z.string().optional(),
  professionalStatus: z.string().optional(),
  educationLevel: z.string().optional(),
  ageGroup: z.string().optional(),
  experienceYears: z.number().finite().optional(),
  domainInterest: z.array(z.string()).optional(),
  adaptiveLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  primaryGoal: z.string().optional(),
  domain: z.string().optional(),
  subDomain: z.string().optional(),
  timeCommitment: z.string().optional(),
  journeyStatus: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
});
type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>;

async function getHandler(_req: NextRequest) {
  const perfStart = Date.now();

  try {
    // 🔐 EXISTING AUTH: Keep existing auth check (no changes)
    const auth = await getAuthContext(_req);
    if (!auth) {
      return ApiResponse.error(unauthorized('Unauthorized'));
    }

    // 🔥 SECURITY FIX: Validate brand context (defense in depth)
    try {
      validateBrandOrThrow(auth, _req);
    } catch (brandError) {
      console.error(`[Profile GET][${auth.correlationId}] Brand validation failed:`, brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }

    const { userId, brand, correlationId } = auth;
    console.log(`[Profile GET][${correlationId}] Auth SUCCESS - userId: ${userId}, brand: ${brand}`);

    // Only the two physically segregated learner bindings establish provenance here.
    if ((brand !== 'skillup' && brand !== 'realtutorialhub') || !userId?.trim()) {
      return ApiResponse.error({ code: 'PERMISSION_DENIED', message: 'Profile provenance unavailable' }, 403);
    }
    const brandContext = getAuthBrandContext(brand);
    const brandDb = brandContext.db;
    const { userProfiles, users } = brandContext.tables;
    const ownershipContext: OwnershipContext = {
      requestingUserId: userId, requestingTenant: brand,
      resourceOwnerId: userId, resourceTenant: brand, userRoles: getRBACRoles(auth.roles),
    };
    OwnershipRBACService.requirePermissionOrOwnership(ownershipContext, PERMISSIONS.PROFILE_READ);

    const timings = {
      afterAuth: Date.now(),
      afterDbQuery: 0
    };

    const dbQueryStart = Date.now();
    const profile = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    const dbQueryDuration = Date.now() - dbQueryStart;
    timings.afterDbQuery = Date.now();

    console.log(`[PERF][DB][PROFILE_QUERY][${correlationId}]`, {
      duration: dbQueryDuration,
      userId,
      brand,
      found: profile !== undefined,
    });

    if (profile === undefined) {
      // Check if user has onboardingCompleted = true
      const user = await brandDb.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (user?.isOnboarded === true) {
        console.error(`[ERROR][${correlationId}] DATA INTEGRITY: onboarded but profile missing`);
        return ApiResponse.error({
          code: 'DATA_INTEGRITY_ERROR',
          message: 'User marked as onboarded but profile does not exist',
          userId,
          correlationId
        }, 500);
      }

      return ApiResponse.error(notFound('Profile', userId));
    }

    const totalDuration = Date.now() - perfStart;
    console.log(`[PERF][API][PROFILE][${correlationId}]`, {
      total: totalDuration,
      auth: timings.afterAuth - perfStart,
      dbQuery: timings.afterDbQuery - timings.afterAuth,
      source: auth.source,
      brand,
    });

    return withCacheHeaders(ApiResponse.success(profile), 'SESSION');
  } catch (_error: unknown) {
    const correlationId = _req.headers.get('x-correlation-id') ?? 'unknown';
    console.error(`[Profile GET][${correlationId}] Error:`, _error);
    return ApiResponse.error(_error, 500);
  }
}

async function patchHandler(_req: NextRequest) {
  try {
    // 🔐 EXISTING AUTH: Keep existing auth check (no changes)
    const auth = await getAuthContext(_req);
    if (!auth) {
      return ApiResponse.error(unauthorized('Unauthorized'));
    }

    // 🔥 SECURITY FIX: Validate brand context (defense in depth)
    try {
      validateBrandOrThrow(auth, _req);
    } catch (brandError) {
      console.error(`[Profile PATCH][${auth.correlationId}] Brand validation failed:`, brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }

    const { userId, brand, correlationId } = auth;
    console.log(`[Profile PATCH][${correlationId}] Auth SUCCESS - userId: ${userId}, brand: ${brand}`);

    if ((brand !== 'skillup' && brand !== 'realtutorialhub') || !userId?.trim()) {
      return ApiResponse.error({ code: 'PERMISSION_DENIED', message: 'Profile provenance unavailable' }, 403);
    }
    const brandContext = getAuthBrandContext(brand);
    const brandDb = brandContext.db;
    const { userProfiles } = brandContext.tables;
    const ownershipContext: OwnershipContext = {
      requestingUserId: userId, requestingTenant: brand,
      resourceOwnerId: userId, resourceTenant: brand, userRoles: getRBACRoles(auth.roles),
    };
    OwnershipRBACService.requirePermissionOrOwnership(ownershipContext, PERMISSIONS.PROFILE_WRITE);

    const rawBody = await _req.json().catch(() => ({}));

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const parsedBody = profileUpdateSchema.safeParse(sanitizeJsonField(rawBody));
    if (!parsedBody.success) return ApiResponse.error(badRequest('Invalid profile fields'));
    const body = parsedBody.data;
    console.log(`[Profile PATCH][${correlationId}] Update fields:`, Object.keys(body));

    // Check if profile exists first
    const existing = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (existing !== undefined) {
      console.log(`[Profile PATCH][${correlationId}] Updating existing profile`);

      const updateData: Partial<ProfileUpdateBody> & { updatedAt: Date } = {
        ...body,
        updatedAt: new Date()
      };

      if (body.domainInterest !== undefined) {
        updateData.domainInterest = Array.isArray(body.domainInterest)
          ? body.domainInterest
          : [];
      }

      const [updated] = await brandDb.update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId))
        .returning();

      console.log(`[Profile PATCH][${correlationId}] Profile updated successfully`);
      return ApiResponse.success(updated);
    } else {
      console.log(`[Profile PATCH][${correlationId}] Creating new profile`);

      let domainInterestArray: string[] = [];
      const di = body.domainInterest as unknown;
      if (Array.isArray(di)) {
        domainInterestArray = di as string[];
      } else if (typeof di === 'string' && di.length > 0) {
        domainInterestArray = [di];
      }

      const [inserted] = await brandDb.insert(userProfiles).values({
        userId,
        name: (typeof body.name === 'string' && body.name.length > 0) ? body.name : 'User',
        professionalStatus: body.professionalStatus,
        educationLevel: body.educationLevel,
        ageGroup: body.ageGroup,
        experienceYears: body.experienceYears,
        domainInterest: domainInterestArray,
        adaptiveLevel: body.adaptiveLevel || 'beginner',
        primaryGoal: body.primaryGoal,
        domain: body.domain,
        subDomain: body.subDomain,
        timeCommitment: body.timeCommitment,
        journeyStatus: body.journeyStatus,
        onboardingCompleted: body.onboardingCompleted === true,
      }).returning();

      console.log(`[Profile PATCH][${correlationId}] Profile created successfully`);
      return ApiResponse.success(inserted);
    }
  } catch (_error: unknown) {
    const correlationId = _req.headers.get('x-correlation-id') ?? 'unknown';
    console.error(`[Profile PATCH][${correlationId}] Error:`, _error);
    return ApiResponse.error(_error, 500);
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'get_profile' });
export const PATCH = withLogging(patchHandler, { component: 'auth', operation: 'update_profile' });
export const POST = withLogging(patchHandler, { component: 'auth', operation: 'update_profile_alias' });
