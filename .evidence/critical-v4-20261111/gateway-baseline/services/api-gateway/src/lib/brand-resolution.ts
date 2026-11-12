/**
 * ============================================================================
 * BRAND RESOLUTION (API GATEWAY)
 * ============================================================================
 *
 * Gateway-specific brand resolution logic.
 * Uses the canonical resolver from @quiz/types.
 *
 * This file re-exports the canonical implementation for gateway use.
 * ============================================================================
 */

export {
  type Brand,
  SUPPORTED_BRANDS,
  isSupportedBrand,
  resolveBrandFromHostname,
  extractHostnameFromHostHeader,
} from '@quiz/types';
