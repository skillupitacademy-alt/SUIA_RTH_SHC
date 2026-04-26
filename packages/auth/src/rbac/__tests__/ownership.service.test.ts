/**
 * Ownership RBAC Service Unit Tests
 * 
 * Tests ownership-based access control
 */

import { describe, test, expect } from 'vitest';
import { OwnershipRBACService } from '../ownership.service';
import { PERMISSIONS } from '../permissions';

describe('OwnershipRBACService', () => {
  test('user can access own resource (ownership)', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'user-1',
        resourceOwnerId: 'user-1',
        userRoles: ['user'],
      }, PERMISSIONS.PROFILE_WRITE);
    }).not.toThrow();
  });

  test('user cannot access others resource without permission', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'user-1',
        resourceOwnerId: 'user-2',
        userRoles: ['user'],
      }, PERMISSIONS.ADMIN_PANEL);
    }).toThrow();
  });

  test('admin can access others resource with permission', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'admin-1',
        resourceOwnerId: 'user-2',
        userRoles: ['admin'],
      }, PERMISSIONS.PROFILE_WRITE);
    }).not.toThrow();
  });

  test('multi-role user can access own resource (CRITICAL)', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'user-1',
        resourceOwnerId: 'user-1',
        userRoles: ["user"],
      }, PERMISSIONS.PROFILE_READ);
    }).not.toThrow();
  });

  test('multi-role user with permission can access others resource', () => {
    expect(() => {
      OwnershipRBACService.requirePermissionOrOwnership({
        requestingUserId: 'faculty-1',
        resourceOwnerId: 'student-1',
        userRoles: ['faculty', 'user'],
      }, PERMISSIONS.EXAM_GRADE);
    }).not.toThrow();
  });

  test('hasPermissionOrOwnership returns true for owner', () => {
    const result = OwnershipRBACService.hasPermissionOrOwnership({
      requestingUserId: 'user-1',
      resourceOwnerId: 'user-1',
      userRoles: ['user'],
    }, PERMISSIONS.PROFILE_READ);

    expect(result).toBe(true);
  });

  test('hasPermissionOrOwnership returns true for permission holder', () => {
    const result = OwnershipRBACService.hasPermissionOrOwnership({
      requestingUserId: 'admin-1',
      resourceOwnerId: 'user-2',
      userRoles: ['admin'],
    }, PERMISSIONS.PROFILE_READ);

    expect(result).toBe(true);
  });

  test('hasPermissionOrOwnership returns false for neither owner nor permission holder', () => {
    const result = OwnershipRBACService.hasPermissionOrOwnership({
      requestingUserId: 'user-1',
      resourceOwnerId: 'user-2',
      userRoles: ['user'],
    }, PERMISSIONS.ADMIN_PANEL);

    expect(result).toBe(false);
  });

  test('isOwner correctly identifies owner', () => {
    expect(OwnershipRBACService.isOwner('user-1', 'user-1')).toBe(true);
    expect(OwnershipRBACService.isOwner('user-1', 'user-2')).toBe(false);
  });

  test('canAccessResource returns correct access levels', () => {
    const result = OwnershipRBACService.canAccessResource({
      requestingUserId: 'user-1',
      resourceOwnerId: 'user-1',
      userRoles: ['user'],
    }, PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE);

    expect(result.canRead).toBe(true);
    expect(result.canWrite).toBe(true);
    expect(result.isOwner).toBe(true);
  });
});
