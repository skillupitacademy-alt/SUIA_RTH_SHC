/**
 * RBAC Service Unit Tests
 * 
 * CRITICAL: These tests prevent the multi-role bug from ever happening again
 */

import { describe, test, expect } from 'vitest';
import { RBACService } from '../rbac.service';
import { PERMISSIONS } from '../permissions';

describe('RBACService - Multi Role Logic', () => {
  test('single role - user has permission', () => {
    const roles = ['user'] as const;
    const result = RBACService.hasPermission([...roles], PERMISSIONS.PROFILE_READ);
    expect(result).toBe(true);
  });

  test('single role - user does NOT have admin permission', () => {
    const roles = ['user'] as const;
    const result = RBACService.hasPermission([...roles], PERMISSIONS.ADMIN_PANEL);
    expect(result).toBe(false);
  });

  test('multi-role - ANY role should grant access (CRITICAL REGRESSION TEST)', () => {
    const roles = ["user"] as const;

    const result = RBACService.hasPermission(
      [...roles],
      PERMISSIONS.PROFILE_READ
    );

    expect(result).toBe(true); // 🔥 THIS WAS THE BUG - MUST NEVER FAIL
  });

  test('multi-role - both roles have permission', () => {
    const roles = ["user"] as const;

    const result = RBACService.hasPermission(
      [...roles],
      PERMISSIONS.PROFILE_WRITE
    );

    expect(result).toBe(true);
  });

  test('multi-role - deny only if NONE have permission', () => {
    const roles = ['user'] as const;

    const result = RBACService.hasPermission(
      [...roles],
      PERMISSIONS.ADMIN_PANEL
    );

    expect(result).toBe(false);
  });

  test('unknown role should NOT break system', () => {
    const roles = ['user', 'invalid-role' as any] as const;

    const result = RBACService.hasPermission(
      [...roles],
      PERMISSIONS.PROFILE_READ
    );

    expect(result).toBe(true); // user role should still grant access
  });

  test('empty roles array should deny', () => {
    const roles: any[] = [];

    const result = RBACService.hasPermission(
      roles,
      PERMISSIONS.PROFILE_READ
    );

    expect(result).toBe(false);
  });

  test('admin role has admin panel permission', () => {
    const roles = ['admin'] as const;

    const result = RBACService.hasPermission(
      [...roles],
      PERMISSIONS.ADMIN_PANEL
    );

    expect(result).toBe(true);
  });

  test('faculty role has course permissions', () => {
    const roles = ['faculty'] as const;

    const result = RBACService.hasPermission(
      [...roles],
      PERMISSIONS.COURSE_CREATE
    );

    expect(result).toBe(true);
  });

  test('super_admin has wildcard access', () => {
    const roles = ['super_admin'] as const;

    // Should have access to ANY permission
    expect(RBACService.hasPermission([...roles], PERMISSIONS.PROFILE_READ)).toBe(true);
    expect(RBACService.hasPermission([...roles], PERMISSIONS.ADMIN_PANEL)).toBe(true);
    expect(RBACService.hasPermission([...roles], PERMISSIONS.USER_MANAGE)).toBe(true);
  });
});

describe('RBACService - requirePermission', () => {
  test('should not throw when user has permission', () => {
    const roles = ['user'] as const;

    expect(() => {
      RBACService.requirePermission([...roles], PERMISSIONS.PROFILE_READ);
    }).not.toThrow();
  });

  test('should throw when user lacks permission', () => {
    const roles = ['user'] as const;

    expect(() => {
      RBACService.requirePermission([...roles], PERMISSIONS.ADMIN_PANEL);
    }).toThrow();
  });

  test('should not throw for multi-role with ANY permission (CRITICAL)', () => {
    const roles = ["user"] as const;

    expect(() => {
      RBACService.requirePermission([...roles], PERMISSIONS.PROFILE_READ);
    }).not.toThrow();
  });
});
