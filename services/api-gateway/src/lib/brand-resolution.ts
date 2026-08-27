/**
 * ============================================================================
 * BRAND RESOLUTION
 * ============================================================================
 *
 * Single canonical mapping between a trusted logical hostname and a brand.
 *
 * IMPORTANT:
 * - Gateway infrastructure hostname (127.0.0.1:8787) is NOT a brand.
 * - localhost without an explicit brand hostname is NOT a brand.
 * - Unknown hostnames return undefined.
 * - Production matching uses exact hostname / DNS suffix boundaries.
 * - No substring-based "includes('skillup')" matching.
 * ============================================================================
 */

export const SUPPORTED_BRANDS = [
  'skillup',
  'realtutorialhub',
] as const;

export type Brand = (typeof SUPPORTED_BRANDS)[number];

function normalizeHostname(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
}

/**
 * Resolve a logical hostname to a brand.
 *
 * Examples:
 *
 *   skillup.localhost              -> skillup
 *   rth.localhost                  -> realtutorialhub
 *
 *   user.skillupitacademy.com      -> skillup
 *   admin.skillupitacademy.com     -> skillup
 *   skillupitacademy.com           -> skillup
 *
 *   user.realtutorialhub.com       -> realtutorialhub
 *   admin.realtutorialhub.com      -> realtutorialhub
 *   realtutorialhub.com            -> realtutorialhub
 *
 *   localhost                      -> undefined
 *   127.0.0.1                      -> undefined
 *   unknown.example.com            -> undefined
 */
export function resolveBrandFromHostname(
  hostname: string,
): Brand | undefined {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return undefined;
  }

  // --------------------------------------------------------------------------
  // LOCAL DEVELOPMENT
  // --------------------------------------------------------------------------

  if (normalized === 'skillup.localhost') {
    return 'skillup';
  }

  if (normalized === 'rth.localhost') {
    return 'realtutorialhub';
  }

  // --------------------------------------------------------------------------
  // SKILLUP PRODUCTION
  // --------------------------------------------------------------------------

  if (
    normalized === 'skillupitacademy.com' ||
    normalized.endsWith('.skillupitacademy.com')
  ) {
    return 'skillup';
  }

  // --------------------------------------------------------------------------
  // REALTUTORIALHUB PRODUCTION
  // --------------------------------------------------------------------------

  if (
    normalized === 'realtutorialhub.com' ||
    normalized.endsWith('.realtutorialhub.com')
  ) {
    return 'realtutorialhub';
  }

  // --------------------------------------------------------------------------
  // UNKNOWN / AMBIGUOUS HOST
  // --------------------------------------------------------------------------

  return undefined;
}

export function isSupportedBrand(
  value: string | undefined | null,
): value is Brand {
  return (
    value === 'skillup' ||
    value === 'realtutorialhub'
  );
}
