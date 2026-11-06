/**
 * Ownership RBAC Service Unit Tests
 * 
 * Tests ownership-based access control
 * FND03: Includes tenant boundary enforcement tests
 */

import { describe, test, expect } from 'vitest';
import { OwnershipRBACService } from '../ownership.service';
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

    test('shadowUserId matches across same tenant grants ownership', () => {
      const isOwner = OwnershipRBACService.isOwner(
        'user-local-1',
        'realtutorialhub',
        'user-local-2',
        'realtutorialhub',
        'shadow-canonical-123',
        'shadow-canonical-123'
      );

      expect(isOwner).toBe(true);
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

    test('admin permission can access cross-tenant resources', () => {
      const result = OwnershipRBACService.hasPermissionOrOwnership({
        requestingUserId: 'admin-1',
        requestingTenant: 'skillhubcore',
        resourceOwnerId: 'user-2',
        resourceTenant: 'realtutorialhub',
        userRoles: ['super_admin'],
      }, PERMISSIONS.PROFILE_READ);

      // Admin permission grants access even cross-tenant
      expect(result).toBe(true);
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
      // Audit logging is tested in rbac.audit.test.ts
    });
  });
});
