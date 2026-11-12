/**
 * ============================================================================
 * BRAND ASSERTION VALIDATION
 * ============================================================================
 *
 * Validates X-Brand header consistency with resolved brand.
 *
 * X-Brand should be treated as a consistency assertion from trusted
 * internal gateway paths, not as a tenant selector.
 * ============================================================================
 */

import type { Brand } from './brand-resolution';
import { isSupportedBrand } from './brand-resolution';

export function validateBrandAssertion(
  assertedBrand: string | undefined,
  resolvedBrand: Brand,
): boolean {
  if (assertedBrand === undefined) {
    return true;
  }

  if (!isSupportedBrand(assertedBrand)) {
    return false;
  }

  return assertedBrand === resolvedBrand;
}
