/**
 * ============================================================================
 * BRAND RESOLUTION (SHARED)
 * ============================================================================
 *
 * Shared brand resolution for Next.js applications.
 * Uses the canonical resolver from @quiz/types.
 *
 * This file re-exports the canonical implementation for app-layer use.
 * ============================================================================
 */

export {
  type Brand,
  SUPPORTED_BRANDS,
  isSupportedBrand,
  resolveBrandFromHostname,
  extractHostnameFromHostHeader as extractHostnameFromRequest,
} from '@quiz/types';
