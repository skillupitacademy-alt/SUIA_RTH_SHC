export * from './token.service';
export * from './password.service';
export * from './verify';
export * from './subscription.cache';
export * from './device-context';

// 🔥 NEW RBAC SYSTEM (Step 1B)
export * from './rbac';

// Feature Flags exports
export { FeatureFlagService, requireFeature } from './feature-flags.service';
export type { FeatureKey, FeatureFlag, FeatureFlagInput } from './feature-flags.types';
export { FeatureNotAvailableError } from './feature-flags.types';

// Session Management exports
export { SessionService } from './session.service';
export type { Session, CreateSessionInput, SessionInfo, DeviceInfo } from './session.types';
export { SessionExpiredError, SessionRevokedError, InvalidSessionError } from './session.types';

// Middleware exports
export { AuthMiddleware, handleAuthError } from './middleware/auth.middleware';
export type { AuthenticatedRequest, AuthMiddlewareOptions } from './middleware/auth.middleware';
export { 
  enforceBrandValidation, 
  validateBrandContext, 
  withBrandValidation,
  BrandValidationError 
} from './middleware/brand-validator.middleware';
export type { BrandId, BrandValidationContext } from './middleware/brand-validator.middleware';
export { validateBrandOrThrow } from './middleware/brand.guard';

// 🔐 Cookie Middleware exports (CRITICAL for multi-brand auth)
export {
  getCookieDomain,
  buildAuthCookie,
  buildAccessTokenCookie,
  buildRefreshTokenCookie,
  validateCookieDomain,
  setAuthCookies,
  clearAuthCookies,
  clearAllBrandCookies,
} from './middleware/cookie.middleware';
export type { AuthCookieOptions } from './middleware/cookie.middleware';

// Re-export Brand and resolver from canonical location
export { type Brand, SUPPORTED_BRANDS, isSupportedBrand, resolveBrandFromHostname } from '@quiz/types';

// Audit exports
export { logRBACDecision, logOwnershipCheck } from './audit/rbac.audit';
export type { RBACDecision } from './audit/rbac.audit';

// Utils exports
export {
  canonicalizeRoles,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  isAdmin,
  isRegularUser,
} from './utils/canonical-roles';
export type { Role } from './utils/canonical-roles';

// Schema exports
export { userRoleUpdate, roleEnum } from './schemas/rbac.schema';
export { createFeatureFlagsTable, insertDefaultFeatureFlags } from './schemas/feature-flags.schema';
export { createSessionsTable, createCleanupFunction } from './schemas/sessions.schema';

// Error classes
export {
  AuthError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  isAuthError,
} from './errors/auth-errors';
