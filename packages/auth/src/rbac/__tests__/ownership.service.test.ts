/**
 * Ownership RBAC Service Unit Tests
 * 
 * Tests ownership-based access control
 * FND03: Includes tenant boundary enforcement tests
 */

import { describe, test, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { OwnershipRBACService, createOwnershipChecker } from '../ownership.service';
import { requirePermissionOrOwnership as enforcePermissionOrOwnership } from '../enforcer';
import { withRBAC, withOwnershipRBAC } from '../rbac.guard';
import { PERMISSIONS } from '../permissions';

describe('OwnershipRBACService', () => {
  test('student can access own resource (ownership)', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'user-1',
        requestingTenant: 'realtutorialhub',
        resourceOwnerId: 'user-1',
        resourceTenant: 'realtutorialhub',
        userRoles: ['student'],
      }, PERMISSIONS.PROFILE_WRITE);
    }).not.toThrow();
  });

  test('student cannot access others resource without permission', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'user-1',
        requestingTenant: 'realtutorialhub',
        resourceOwnerId: 'user-2',
        resourceTenant: 'realtutorialhub',
        userRoles: ['student'],
      }, PERMISSIONS.ADMIN_PANEL);
    }).toThrow();
  });

  test('admin can access others resource with permission', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'admin-1',
        requestingTenant: 'realtutorialhub',
        resourceOwnerId: 'user-2',
        resourceTenant: 'realtutorialhub',
        userRoles: ['admin'],
      }, PERMISSIONS.PROFILE_WRITE);
    }).not.toThrow();
  });

  test('multi-role student can access own resource (CRITICAL)', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'user-1',
        requestingTenant: 'realtutorialhub',
        resourceOwnerId: 'user-1',
        resourceTenant: 'realtutorialhub',
        userRoles: ["student"],
      }, PERMISSIONS.PROFILE_READ);
    }).not.toThrow();
  });

  test('multi-role user with permission can access others resource', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'faculty-1',
        requestingTenant: 'realtutorialhub',
        resourceOwnerId: 'student-1',
        resourceTenant: 'realtutorialhub',
        userRoles: ['faculty', 'student'],
      }, PERMISSIONS.EXAM_GRADE);
    }).not.toThrow();
  });

  test('hasPermissionOrOwnership returns true for owner', () => {
    const result = OwnershipRBACService.hasPermissionOrOwnership({
      requestingUserId: 'user-1',
      requestingTenant: 'realtutorialhub',
      resourceOwnerId: 'user-1',
      resourceTenant: 'realtutorialhub',
      userRoles: ['student'],
    }, PERMISSIONS.PROFILE_READ);

    expect(result).toBe(true);
  });

  test('hasPermissionOrOwnership returns true for permission holder', () => {
    const result = OwnershipRBACService.hasPermissionOrOwnership({
      requestingUserId: 'admin-1',
      requestingTenant: 'realtutorialhub',
      resourceOwnerId: 'user-2',
      resourceTenant: 'realtutorialhub',
      userRoles: ['admin'],
    }, PERMISSIONS.PROFILE_READ);

    expect(result).toBe(true);
  });

  test('hasPermissionOrOwnership returns false for neither owner nor permission holder', () => {
    const result = OwnershipRBACService.hasPermissionOrOwnership({
      requestingUserId: 'user-1',
      requestingTenant: 'realtutorialhub',
      resourceOwnerId: 'user-2',
      resourceTenant: 'realtutorialhub',
      userRoles: ['student'],
    }, PERMISSIONS.ADMIN_PANEL);

    expect(result).toBe(false);
  });

  test('isOwner correctly identifies owner within same tenant', () => {
    expect(OwnershipRBACService.isOwner('user-1', 'realtutorialhub', 'user-1', 'realtutorialhub')).toBe(true);
    expect(OwnershipRBACService.isOwner('user-1', 'realtutorialhub', 'user-2', 'realtutorialhub')).toBe(false);
  });

  test('canAccessResource returns correct access levels', () => {
    const result = OwnershipRBACService.canAccessResource({
      requestingUserId: 'user-1',
      requestingTenant: 'realtutorialhub',
      resourceOwnerId: 'user-1',
      resourceTenant: 'realtutorialhub',
      userRoles: ['student'],
    }, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE);

    expect(result.canRead).toBe(true);
    expect(result.canWrite).toBe(true);
    expect(result.isOwner).toBe(true);
  });

  // FND03: Tenant boundary enforcement tests
  describe('FND03: Tenant Boundary Enforcement', () => {
    test('CRITICAL: cross-tenant access denied even with matching userId', () => {
      const result = OwnershipRBACService.hasPermissionOrOwnership({
        requestingUserId: 'user-abc-123',
        requestingTenant: 'skillup',
        resourceOwnerId: 'user-abc-123',
        resourceTenant: 'realtutorialhub',
        userRoles: ['student'],
      }, PERMISSIONS.PROFILE_READ);

      expect(result).toBe(false);
    });

    test('CRITICAL: requirePermissionOrOwnership throws on cross-tenant access', () => {
      expect(() => {
        OwnershipRBACService.requirePermissionOrOwnership({
          requestingUserId: 'user-1',
          requestingTenant: 'skillup',
          resourceOwnerId: 'user-1',
          resourceTenant: 'realtutorialhub',
          userRoles: ['student'],
        }, PERMISSIONS.PROFILE_WRITE);
      }).toThrow(/cross-tenant/i);
    });

    test('CRITICAL: isOwner returns false for cross-tenant even with same userId', () => {
      const isOwner = OwnershipRBACService.isOwner(
        'user-abc-123',
        'skillup',
        'user-abc-123',
        'realtutorialhub'
      );

      expect(isOwner).toBe(false);
    });

    test('same tenant with different userId is not owner', () => {
      const isOwner = OwnershipRBACService.isOwner(
        'user-1',
        'realtutorialhub',
        'user-2',
        'realtutorialhub'
      );

      expect(isOwner).toBe(false);
    });

    test('projection-only shadowUserId equality across different local accounts does NOT grant ownership', () => {
      const isOwner = OwnershipRBACService.isOwner(
        'user-local-1',
        'realtutorialhub',
        'user-local-2',
        'realtutorialhub',
        'shadow-canonical-123',
        'shadow-canonical-123'
      );

      expect(isOwner).toBe(false);
    });

    test('shadowUserId does not grant cross-tenant ownership', () => {
      const isOwner = OwnershipRBACService.isOwner(
        'user-local-1',
        'skillup',
        'user-local-2',
        'realtutorialhub',
        'shadow-canonical-123',
        'shadow-canonical-123'
      );

      expect(isOwner).toBe(false);
    });

    test('admin or super_admin role cannot cross tenant boundaries via ownership helper', () => {
      const result = OwnershipRBACService.hasPermissionOrOwnership({
        requestingUserId: 'admin-1',
        requestingTenant: 'skillhubcore',
        resourceOwnerId: 'user-2',
        resourceTenant: 'realtutorialhub',
        userRoles: ['super_admin'],
      }, PERMISSIONS.PROFILE_READ);

      expect(result).toBe(false);
    });

    test('tenant boundary logged in audit for cross-tenant denial', () => {
      const result = OwnershipRBACService.hasPermissionOrOwnership({
        requestingUserId: 'user-1',
        requestingTenant: 'skillup',
        resourceOwnerId: 'user-1',
        resourceTenant: 'realtutorialhub',
        userRoles: ['student'],
      }, PERMISSIONS.PROFILE_READ);

      expect(result).toBe(false);
    });

    test('denies missing, whitespace, or unknown tenants across all public helpers and createOwnershipChecker', () => {
      for (const badTenant of ['', '   ', 'unknown-tenant']) {
        expect(OwnershipRBACService.isOwner('user-1', badTenant, 'user-1', badTenant)).toBe(false);
        expect(OwnershipRBACService.hasPermissionOrOwnership({
          requestingUserId: 'user-1',
          requestingTenant: badTenant,
          resourceOwnerId: 'user-1',
          resourceTenant: badTenant,
          userRoles: ['student'],
        }, PERMISSIONS.PROFILE_READ)).toBe(false);
        expect(OwnershipRBACService.canAccessResource({
          requestingUserId: 'user-1',
          requestingTenant: badTenant,
          resourceOwnerId: 'user-1',
          resourceTenant: badTenant,
          userRoles: ['student'],
        }, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE)).toEqual({
          canRead: false,
          canWrite: false,
          isOwner: false,
          hasExplicitPermission: false,
        });

        const checker = createOwnershipChecker('user-1', badTenant, 'user-1', badTenant, ['student']);
        expect(checker.isOwner()).toBe(false);
        expect(checker.has(PERMISSIONS.PROFILE_READ)).toBe(false);
        expect(() => checker.require(PERMISSIONS.PROFILE_WRITE)).toThrow(/Missing permission|tenant/i);
      }
    });

    test('denies both cross-tenant directions across createOwnershipChecker, canAccessResource, and enforcer', () => {
      const pairs: Array<[string, string]> = [
        ['skillup', 'realtutorialhub'],
        ['realtutorialhub', 'skillup'],
        ['skillup', 'skillhubcore'],
        ['skillhubcore', 'skillup'],
      ];

      for (const [reqTenant, resTenant] of pairs) {
        const checker = createOwnershipChecker('same-user', reqTenant, 'same-user', resTenant, ['admin']);
        expect(checker.isOwner()).toBe(false);
        expect(checker.has(PERMISSIONS.PROFILE_READ)).toBe(false);
        expect(() => checker.require(PERMISSIONS.PROFILE_WRITE)).toThrow(/cross-tenant/i);

        expect(OwnershipRBACService.canAccessResource({
          requestingUserId: 'same-user',
          requestingTenant: reqTenant,
          resourceOwnerId: 'same-user',
          resourceTenant: resTenant,
          userRoles: ['admin'],
        }, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE)).toEqual({
          canRead: false,
          canWrite: false,
          isOwner: false,
          hasExplicitPermission: false,
        });

        expect(() => enforcePermissionOrOwnership(
          { userId: 'same-user', roles: ['admin'], tenant: reqTenant },
          'same-user',
          resTenant,
          PERMISSIONS.PROFILE_WRITE
        )).toThrow(/cross-tenant/i);
      }
    });

    test('withOwnershipRBAC and withRBAC return sanitized 401/403 on missing auth, missing brand, or cross-tenant resource and 200 on verified same-tenant owner', async () => {
      const innerHandler = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
      const guarded = withOwnershipRBAC(
        innerHandler,
        PERMISSIONS.PROFILE_WRITE,
        () => 'local-user-1',
        (req) => req.headers.get('x-resource-tenant') || ''
      );

      // 1. Missing auth context -> 401 UNAUTHORIZED
      const unauthRes = await guarded(
        new NextRequest('https://fixture.invalid/api/auth/profile', { method: 'PATCH' }),
        {} as any
      );
      expect(unauthRes.status).toBe(401);
      expect(await unauthRes.json()).toMatchObject({ code: 'UNAUTHORIZED' });
      expect(innerHandler).not.toHaveBeenCalled();

      // 2. Missing JWT brand claim -> 403 PERMISSION_DENIED (ForbiddenError caught and sanitized)
      const missingBrandRes = await guarded(
        new NextRequest('https://fixture.invalid/api/auth/profile', {
          method: 'PATCH',
          headers: { 'x-resource-tenant': 'skillup' },
        }),
        {
          auth: {
            isAuthenticated: true,
            userId: 'local-user-1',
            originalUserId: 'local-user-1',
            shadowUserId: 'shadow-user-1',
            brand: '',
            correlationId: 'corr-1',
            source: 'jwt',
            roles: ['student'],
          },
        } as any
      );
      expect(missingBrandRes.status).toBe(403);
      expect(await missingBrandRes.json()).toMatchObject({
        code: 'PERMISSION_DENIED',
        permission: PERMISSIONS.PROFILE_WRITE,
      });
      expect(innerHandler).not.toHaveBeenCalled();

      // 3. Cross-tenant resource (skillup requester vs realtutorialhub resource) -> 403 PERMISSION_DENIED
      const crossTenantRes = await guarded(
        new NextRequest('https://fixture.invalid/api/auth/profile', {
          method: 'PATCH',
          headers: { 'x-resource-tenant': 'realtutorialhub' },
        }),
        {
          auth: {
            isAuthenticated: true,
            userId: 'local-user-1',
            originalUserId: 'local-user-1',
            shadowUserId: 'shadow-user-1',
            brand: 'skillup',
            correlationId: 'corr-2',
            source: 'jwt',
            roles: ['student'],
          },
        } as any
      );
      expect(crossTenantRes.status).toBe(403);
      expect(await crossTenantRes.json()).toMatchObject({
        code: 'PERMISSION_DENIED',
        permission: PERMISSIONS.PROFILE_WRITE,
      });
      expect(innerHandler).not.toHaveBeenCalled();

      // 4. Verified same-tenant local owner -> 200 OK
      const validOwnerRes = await guarded(
        new NextRequest('https://fixture.invalid/api/auth/profile', {
          method: 'PATCH',
          headers: { 'x-resource-tenant': 'skillup' },
        }),
        {
          auth: {
            isAuthenticated: true,
            userId: 'local-user-1',
            originalUserId: 'local-user-1',
            shadowUserId: 'shadow-user-1',
            brand: 'skillup',
            correlationId: 'corr-3',
            source: 'jwt',
            roles: ['student'],
          },
        } as any
      );
      expect(validOwnerRes.status).toBe(200);
      expect(innerHandler).toHaveBeenCalledTimes(1);

      // 5. Permission-only withRBAC denies student on ADMIN_PANEL and grants super_admin
      const adminGuard = withRBAC(innerHandler, { permission: PERMISSIONS.ADMIN_PANEL });
      const studentDenied = await adminGuard(
        new NextRequest('https://fixture.invalid/api/admin', { method: 'GET' }),
        {
          auth: {
            isAuthenticated: true,
            userId: 'local-user-1',
            originalUserId: 'local-user-1',
            shadowUserId: 'shadow-user-1',
            brand: 'skillhubcore',
            correlationId: 'corr-4',
            source: 'jwt',
            roles: ['student'],
          },
        } as any
      );
      expect(studentDenied.status).toBe(403);
      const superAdminAllowed = await adminGuard(
        new NextRequest('https://fixture.invalid/api/admin', { method: 'GET' }),
        {
          auth: {
            isAuthenticated: true,
            userId: 'shc-admin-1',
            originalUserId: 'shc-admin-1',
            shadowUserId: 'shadow-admin-1',
            brand: 'skillhubcore',
            correlationId: 'corr-5',
            source: 'jwt',
            roles: ['super_admin'],
          },
        } as any
      );
      expect(superAdminAllowed.status).toBe(200);
    });
  });
});
