/**
 * RBAC Types and Permissions
 * Role-Based Access Control system
 */

export type Role = 
  | 'student'
  | 'instructor' 
  | 'admin'
  | 'super_admin';

export type Permission = 
  // Course permissions
  | 'read:course'
  | 'create:course'
  | 'edit:course'
  | 'delete:course'
  
  // Exam permissions
  | 'attempt:exam'
  | 'create:exam'
  | 'grade:exam'
  | 'view:exam_results'
  
  // User management
  | 'read:users'
  | 'manage:users'
  | 'impersonate:user'
  
  // Analytics
  | 'view:analytics'
  | 'view:reports'
  | 'export:data'
  
  // System administration
  | 'manage:system'
  | 'manage:feature_flags'
  | 'view:logs'
  
  // Wildcard (super admin)
  | '*';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  student: [
    'read:course',
    'attempt:exam'
  ],
  
  instructor: [
    'read:course',
    'create:course', 
    'edit:course',
    'attempt:exam',
    'create:exam',
    'grade:exam',
    'view:exam_results',
    'read:users'
  ],
  
  admin: [
    'read:course',
    'create:course',
    'edit:course', 
    'delete:course',
    'attempt:exam',
    'create:exam',
    'grade:exam',
    'view:exam_results',
    'read:users',
    'manage:users',
    'view:analytics',
    'view:reports',
    'export:data',
    'manage:feature_flags'
  ],
  
  super_admin: ['*']
};

export interface RBACUser {
  id: string;
  email: string;
  role: Role;
  brand: string;
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