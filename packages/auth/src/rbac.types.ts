/**
 * RBAC Types and Permissions
 * Role-Based Access Control system
 */

import type { Role } from './rbac/roles'; // 🔥 FIX: Import Role from correct location
import type { Permission } from './rbac/permissions'; // 🔥 FIX: Import Permission from correct location

// 🔥 DEPRECATED: Use role-permissions.ts instead
// This is kept for backward compatibility only
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  student: [
    'course.read',
    'exam.start'
  ],
  
  user: [
    'course.read',
    'exam.start'
  ],
  
  faculty: [
    'course.read',
    'course.create', 
    'course.edit',
    'exam.start',
    'exam.grade',
    'exam.view_results',
  ],
  
  admin: [
    'course.read',
    'course.create',
    'course.edit', 
    'course.delete',
    'exam.start',
    'exam.grade',
    'exam.view_results',
    'user.manage',
    'analytics.view',
    'reports.view',
    'reports.export',
  ],
  
  super_admin: ['*']
};

export interface RBACUser {
  id: string;
  email: string;
  role: Role; // 🔥 FIX: Now uses correct Role type
  brand: string; // Keep as string for flexibility, cast when needed
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class SessionRevokedError extends Error {
  constructor(message = 'Session revoked') {
    super(message);
    this.name = 'SessionRevokedError';
  }
}

export class FeatureNotAvailableError extends Error {
  constructor(message = 'Feature not available') {
    super(message);
    this.name = 'FeatureNotAvailableError';
  }
}

// Re-export for backward compatibility
export type { Role, Permission };