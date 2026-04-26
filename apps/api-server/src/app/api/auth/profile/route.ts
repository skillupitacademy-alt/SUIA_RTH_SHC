// 🔥 STEP 1C: RBAC Integration (First Route) - WITH OWNERSHIP
import { createRBACUser, validateBrandOrThrow } from '@quiz/auth';
import type { OwnershipContext } from '@quiz/auth/rbac/ownership.service';
import { OwnershipRBACService } from '@quiz/auth/rbac/ownership.service';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import type { Role } from '@quiz/auth/rbac/roles';
import { db, userProfiles, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth-context';
import { withCacheHeaders } from '@/lib/cache-headers';
import type { RequestBrand } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';

export const dynamic = 'force-dynamic';

// 🔥 RBAC: Role normalization function (local copy to avoid import issues)
const VALID_ROLES: Set<Role> = new Set(['user', 'admin', 'super_admin', 'faculty']);

function normalizeRoles(roles: string[] = []): Role[] {
  const normalized = roles
    .map(role => role.toLowerCase().trim())
    .filter(role => role.length > 0);
  
  // Filter out unknown roles for security
  const validRoles = normalized.filter((role): role is Role => VALID_ROLES.has(role as Role));
  
  // 🚨 CRITICAL SECURITY: Return empty array if no valid roles
  // DO NOT fallback to ['user'] here - that would make RBAC fake
  // Let the caller decide what to do with empty roles
  return [...new Set(validRoles)];
}

// 🚨 CRITICAL SECURITY: Helper to get roles for RBAC (no fallback to 'user')
function getRBACRoles(authRoles: string[] | undefined): Role[] {
  const normalized = normalizeRoles(authRoles || []);
  // Return empty array if no valid roles - this will cause RBAC denial
  return normalized;
}

interface ProfileUpdateBody {
  name?: string;
  professionalStatus?: string;
  educationLevel?: string;
  ageGroup?: string;
  experienceYears?: number;
  domainInterest?: string[];
  adaptiveLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: string;
  domain?: string;
  subDomain?: string;
  timeCommitment?: string;
  journeyStatus?: string;
  onboardingCompleted?: boolean;
}

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

    // 🚨 DIAGNOSTIC: Prove deployment and role pipeline
    console.log('🔍 RBAC_VERSION_CHECK_V2 - Code is executing');
    console.log('🔍 RBAC_DEBUG_ROLES_RAW', JSON.stringify({
      authRoles: auth.roles,
      authRolesType: typeof auth.roles,
      authRolesIsArray: Array.isArray(auth.roles),
      authRolesValue: auth.roles,
      correlationId
    }));

    // 🔥 STEP 1C: RBAC LAYER WITH OWNERSHIP (NEW - Added on top of existing auth)
    try {
      // 🚨 CRITICAL DEBUG: Log raw auth.roles BEFORE normalization
      console.log('🔍 RBAC_DEBUG_RAW_INPUT', JSON.stringify({
        authRoles: auth.roles,
        authRolesType: typeof auth.roles,
        authRolesIsArray: Array.isArray(auth.roles),
        authRolesLength: Array.isArray(auth.roles) ? auth.roles.length : 'N/A',
        correlationId
      }));
      
      // Create RBAC user from existing auth context
      const normalizedRoles = getRBACRoles(auth.roles);
      
      console.log('🔍 RBAC_DEBUG_NORMALIZED', JSON.stringify({
        normalizedRoles,
        normalizedRolesLength: normalizedRoles.length,
        normalizedRolesType: typeof normalizedRoles,
        normalizedRolesIsArray: Array.isArray(normalizedRoles),
        correlationId
      }));
      
      // 🐛 DEBUG: Check if roles are empty
      if (normalizedRoles.length === 0) {
        console.error('🚨 RBAC_ERROR: No valid roles after normalization!', JSON.stringify({
          authRoles: auth.roles,
          authRolesType: typeof auth.roles,
          authRolesIsArray: Array.isArray(auth.roles),
          normalizedRoles,
          correlationId
        }));
        throw new Error('Cannot create RBAC user: No roles assigned');
      }
      
      const rbacUser = createRBACUser({
        isAuthenticated: true,
        userId: auth.userId,
        originalUserId: auth.userId,
        shadowUserId: auth.userId,
        roles: normalizedRoles,
        brand: auth.brand as 'realtutorialhub' | 'skillup',
        email: auth.email,
      });

      // 🔒 RBAC: Check permission WITH OWNERSHIP
      // User can read their OWN profile OR have explicit permission
      const ownershipContext: OwnershipContext = {
        requestingUserId: auth.userId,
        resourceOwnerId: userId, // Profile belongs to this user
        userRoles: rbacUser.roles,
      };

      OwnershipRBACService.requirePermissionOrOwnership(
        ownershipContext,
        PERMISSIONS.PROFILE_READ
      );

      // 📊 RBAC DEBUG: Temporary logging for validation
      console.log('🔐 RBAC DEBUG', JSON.stringify({
        tag: 'STEP_1C_OWNERSHIP',
        route: '/api/auth/profile',
        method: 'GET',
        userId: userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_READ,
        isOwner: auth.userId === userId,
        result: 'GRANTED',
        correlationId,
        timestamp: new Date().toISOString(),
      }));

    } catch (rbacError) {
      // 📊 RBAC DEBUG: Log permission denial
      console.warn('🔐 RBAC DENIED', JSON.stringify({
        tag: 'STEP_1C_OWNERSHIP',
        route: '/api/auth/profile',
        method: 'GET',
        userId: userId.slice(0, 8),
        permission: PERMISSIONS.PROFILE_READ,
        result: 'DENIED',
        error: rbacError instanceof Error ? rbacError.message : 'Unknown',
        correlationId,
        timestamp: new Date().toISOString(),
      }));

      return ApiResponse.error({
        code: 'PERMISSION_DENIED',
        message: `Permission required: ${PERMISSIONS.PROFILE_READ}`,
        permission: PERMISSIONS.PROFILE_READ,
      }, 403);
    }

    const timings = {
      afterAuth: Date.now(),
      afterDbQuery: 0
    };

    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand as RequestBrand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : db;
    
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

    // 🚨 DIAGNOSTIC: Prove deployment and role pipeline
    console.log('🔍 RBAC_VERSION_CHECK_V2 - Code is executing (PATCH)');
    console.log('🔍 RBAC_DEBUG_ROLES_RAW_PATCH', JSON.stringify({
      authRoles: auth.roles,
      authRolesType: typeof auth.roles,
      authRolesIsArray: Array.isArray(auth.roles),
      correlationId
    }));

    // 🔥 STEP 1C: RBAC LAYER WITH OWNERSHIP (NEW - Added on top of existing auth)
    try {
      // Create RBAC user from existing auth context
      const normalizedRoles = getRBACRoles(auth.roles);
      
      console.log('🔍 RBAC_DEBUG_NORMALIZED_PATCH', JSON.stringify({
        normalizedRoles,
        normalizedRolesLength: normalizedRoles.length,
        correlationId
      }));
      
      const rbacUser = createRBACUser({
        isAuthenticated: true,
        userId: auth.userId,
        originalUserId: auth.userId,
        shadowUserId: auth.userId,
        roles: normalizedRoles,
        brand: auth.brand as 'realtutorialhub' | 'skillup',
        email: auth.email,
      });

      // 🔒 RBAC: Check permission WITH OWNERSHIP (WRITE permission for updates)
      // User can update their OWN profile OR have explicit permission
      const ownershipContext: OwnershipContext = {
        requestingUserId: auth.userId,
        resourceOwnerId: userId, // Profile belongs to this user
        userRoles: rbacUser.roles,
      };

      // 🔍 DEBUG: Log ownership context before check
      console.log('🔍 OWNERSHIP_DEBUG_PATCH', JSON.stringify({
        requestingUserId: auth.userId,
        resourceOwnerId: userId,
        areEqual: auth.userId === userId,
        userRoles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_WRITE,
        correlationId,
      }));

      OwnershipRBACService.requirePermissionOrOwnership(
        ownershipContext,
        PERMISSIONS.PROFILE_WRITE
      );

      // 📊 RBAC DEBUG: Temporary logging for validation
      console.log('🔐 RBAC DEBUG', JSON.stringify({
        tag: 'STEP_1C_OWNERSHIP',
        route: '/api/auth/profile',
        method: 'PATCH',
        userId: userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_WRITE,
        isOwner: auth.userId === userId,
        result: 'GRANTED',
        correlationId,
        timestamp: new Date().toISOString(),
      }));

    } catch (rbacError) {
      // 📊 RBAC DEBUG: Log permission denial
      console.warn('🔐 RBAC DENIED', JSON.stringify({
        tag: 'STEP_1C_OWNERSHIP',
        route: '/api/auth/profile',
        method: 'PATCH',
        userId: userId.slice(0, 8),
        permission: PERMISSIONS.PROFILE_WRITE,
        result: 'DENIED',
        error: rbacError instanceof Error ? rbacError.message : 'Unknown',
        correlationId,
        timestamp: new Date().toISOString(),
      }));

      return ApiResponse.error({
        code: 'PERMISSION_DENIED',
        message: `Permission required: ${PERMISSIONS.PROFILE_WRITE}`,
        permission: PERMISSIONS.PROFILE_WRITE,
      }, 403);
    }

    const rawBody = await _req.json().catch(() => ({}));

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as ProfileUpdateBody;
    console.log(`[Profile PATCH][${correlationId}] Update fields:`, Object.keys(body));

    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand as RequestBrand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : db;

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
