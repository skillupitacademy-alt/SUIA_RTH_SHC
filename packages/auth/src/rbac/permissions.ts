/**
 * 🔐 RBAC PERMISSIONS - GRANULAR ACCESS CONTROL
 * 
 * Define what actions users can perform.
 * Use dot notation for hierarchical permissions.
 */

export const PERMISSIONS = {
  // Profile permissions
  PROFILE_READ: 'profile.read',
  PROFILE_WRITE: 'profile.write',
  
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard.view',
  
  // Exam permissions
  EXAM_START: 'exam.start',
  EXAM_SUBMIT: 'exam.submit',
  EXAM_GRADE: 'exam.grade',
  EXAM_VIEW_RESULTS: 'exam.view_results',
  
  // Course permissions
  COURSE_READ: 'course.read',
  COURSE_CREATE: 'course.create',
  COURSE_EDIT: 'course.edit',
  COURSE_DELETE: 'course.delete',
  
  // Tutorial permissions
  TUTORIAL_READ: 'tutorial.read',
  TUTORIAL_VIEW: 'tutorial.view',
  TUTORIAL_PROGRESS: 'tutorial.progress',
  TUTORIAL_ASSIGNMENTS: 'tutorial.assignments',
  
  // Admin permissions
  ADMIN_PANEL: 'admin.panel',
  USER_MANAGE: 'user.manage',
  SYSTEM_MANAGE: 'system.manage',
  
  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * 🔒 SECURITY: Validate if a string is a valid permission
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission);
}