/**
 * 🔐 ROLE → PERMISSION MAPPING
 * 
 * This is the heart of RBAC - defines what each role can do.
 * Follows principle of least privilege.
 */

import { ROLES } from './roles';
import { PERMISSIONS } from './permissions';
import type { Role } from './roles';
import type { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[] | readonly ['*']> = {
  // Student - standard access for all authenticated learners
  [ROLES.STUDENT]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.EXAM_START,
    PERMISSIONS.EXAM_SUBMIT,
    PERMISSIONS.EXAM_VIEW_RESULTS,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.TUTORIAL_READ,
    PERMISSIONS.TUTORIAL_PROGRESS,
    PERMISSIONS.TUTORIAL_ASSIGNMENTS,
  ],
  
  // Faculty - teaching access
  [ROLES.FACULTY]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_EDIT,
    PERMISSIONS.EXAM_START,
    PERMISSIONS.EXAM_GRADE,
    PERMISSIONS.EXAM_VIEW_RESULTS,
    PERMISSIONS.TUTORIAL_READ,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  // Admin - management access
  [ROLES.ADMIN]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_EDIT,
    PERMISSIONS.COURSE_DELETE,
    PERMISSIONS.EXAM_START,
    PERMISSIONS.EXAM_GRADE,
    PERMISSIONS.EXAM_VIEW_RESULTS,
    PERMISSIONS.TUTORIAL_READ,
    PERMISSIONS.TUTORIAL_AUTHOR_CREATE,
    PERMISSIONS.TUTORIAL_AUTHOR_EDIT,
    PERMISSIONS.TUTORIAL_AUTHOR_DELETE,
    PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  
  // Super Admin - full access (wildcard)
  [ROLES.SUPER_ADMIN]: ['*'],
} as const;

/**
 * 🔍 Get all permissions for a role
 */
export function getRolePermissions(role: Role): readonly Permission[] | readonly ['*'] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * 🔍 Check if role has wildcard access
 */
export function hasWildcardAccess(role: Role): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return Array.isArray(permissions) && permissions.includes('*' as any);
}