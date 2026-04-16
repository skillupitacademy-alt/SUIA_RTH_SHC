export * from './token.service';
export * from './password.service';
export * from './verify';
export * from './subscription.cache';

// RBAC exports
export { RBACService, requirePermission, requireRole, requireAdmin } from './rbac.service';
export type { Role, Permission, RBACUser } from './rbac.types';
export { ForbiddenError, UnauthorizedError } from './rbac.types';

// Feature Flags exports
export { FeatureFlagService, requireFeature } from './feature-flags.service';
export type { FeatureKey, Brand, FeatureFlag, FeatureFlagInput } from './feature-flags.types';
export { FeatureNotAvailableError } from './feature-flags.types';

// Session Management exports
export { SessionService } from './session.service';
export type { Session, CreateSessionInput, SessionInfo, DeviceInfo } from './session.types';
export { SessionExpiredError, SessionRevokedError, InvalidSessionError } from './session.types';

// Middleware exports
export { AuthMiddleware, handleAuthError } from './middleware/auth.middleware';
export type { AuthenticatedRequest, AuthMiddlewareOptions } from './middleware/auth.middleware';

// Schema exports
export { userRoleUpdate, roleEnum } from './schemas/rbac.schema';
export { createFeatureFlagsTable, insertDefaultFeatureFlags } from './schemas/feature-flags.schema';
export { createSessionsTable, createCleanupFunction } from './schemas/sessions.schema';
