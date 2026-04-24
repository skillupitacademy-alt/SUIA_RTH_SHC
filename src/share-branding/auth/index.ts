/**
 * 🔐 SHARED AUTH UTILITIES - SINGLE SOURCE OF TRUTH
 * 
 * Central export point for all shared authentication utilities.
 */

// Core auth extraction and validation
export {
  extractAuthFromRequest,
  createInternalHeaders,
  getBrandFromHostname,
  requireBffAuth,
  BffAuthErrors,
  type BffAuthResult,
} from './unifiedBffAuth';

// Identity guard - enforce correct user ID usage
export {
  getDatabaseUserId,
  getObservabilityUserId,
  getIdentityContext,
  isValidIdentity,
  type IdentityContext,
} from './identityGuard';

// Server-side auth state fetching
export {
  fetchBackendAuthState,
  type BackendAuthUserState,
} from './serverAuthState';

// BFF route helpers
export {
  proxyAuthRequest,
  fetchAuthUpstream,
  createForwardHeaders,
} from './authBffRoute';
