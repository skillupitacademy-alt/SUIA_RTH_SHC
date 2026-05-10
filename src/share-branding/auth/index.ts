/**
 * 🔐 SHARED AUTH UTILITIES - SINGLE SOURCE OF TRUTH
 * 
 * Central export point for all shared authentication utilities.
 */

// 🔥 NEW: Lightweight auth validation
export {
  validateAuthState,
  hasCompletedOnboarding,
  getUserRole,
  type AuthValidationState,
} from './validateAuthState';

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
  proxyUpstreamRequest,
  fetchAuthUpstream,
  createForwardHeaders,
  extractCookieValue,
  getSetCookies,
  rewriteSetCookie,
} from './authBffRoute';

// Constants and utilities
export {
  FALLBACK_API_BASE_RTH,
  FALLBACK_API_BASE_SKILLUP,
  FALLBACK_API_BASE_SKILLHUBCORE,
} from './constants';

// Configuration and feature flags
export {
  AUTH_CONFIG,
} from './config';
