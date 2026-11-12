/**
 * ============================================================================
 * REQUEST BRAND RESOLUTION
 * ============================================================================
 *
 * Determines the brand for a gateway request.
 *
 * There are two possible hostname sources:
 *
 * 1. Gateway's own request URL
 * 2. X-Original-Host supplied by a trusted internal application request
 *
 * X-Original-Host MUST NOT automatically become trusted merely because
 * the header exists.
 * ============================================================================
 */

import type { Context } from 'hono';

import {
  type Brand,
  resolveBrandFromHostname,
} from './brand-resolution';

export interface TrustedRequestBrand {
  brand: Brand;
  hostname: string;
  source:
    | 'gateway-hostname'
    | 'trusted-original-host';
}

/**
 * Read the gateway's actual request hostname.
 */
function getGatewayHostname(c: Context): string {
  return new URL(c.req.url).hostname.toLowerCase();
}

/**
 * Normalize a hostname header.
 *
 * Header may contain:
 *
 *   skillup.localhost
 *   skillup.localhost:3009
 */
function normalizeHostHeader(
  value: string,
): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    /**
     * URL requires a scheme in order to parse a host:port pair.
     */
    const parsed = new URL(`http://${trimmed}`);

    return parsed.hostname
      .toLowerCase()
      .replace(/\.$/, '');
  } catch {
    return undefined;
  }
}

/**
 * Determine whether the request has authenticated internal origin.
 *
 * IMPORTANT:
 *
 * This validates the X-Internal-Secret header to establish trust boundary
 * for X-Original-Host forwarding from application servers (Next.js SSR).
 */
export function hasTrustedInternalRequest(
  c: Context,
): boolean {
  const expected =
    c.env.INTERNAL_GATEWAY_SECRET;

  if (
    typeof expected !== 'string' ||
    expected.length === 0
  ) {
    return false;
  }

  const supplied =
    c.req.header('x-internal-secret');

  if (
    typeof supplied !== 'string' ||
    supplied.length === 0
  ) {
    return false;
  }

  return supplied === expected;
}

/**
 * Resolve the request brand.
 *
 * Priority:
 *
 *   1. Trusted X-Forwarded-Host (when X-Internal-Secret is valid)
 *   2. Trusted X-Original-Host (when X-Internal-Secret is valid) [legacy]
 *   3. Actual gateway hostname
 *
 * We deliberately DO NOT use X-Brand here as an unauthenticated
 * tenant selector.
 */
export function resolveTrustedRequestBrand(
  c: Context,
): TrustedRequestBrand | undefined {
  const gatewayHostname =
    getGatewayHostname(c);

  // Check both x-forwarded-host (standard) and x-original-host (legacy)
  const forwardedHost =
    c.req.header('x-forwarded-host');
  const originalHost =
    c.req.header('x-original-host');

  if (hasTrustedInternalRequest(c)) {
    // Try x-forwarded-host first (standard header)
    if (forwardedHost) {
      const normalizedForwardedHost =
        normalizeHostHeader(forwardedHost);

      if (normalizedForwardedHost) {
        const forwardedBrand =
          resolveBrandFromHostname(
            normalizedForwardedHost,
          );

        if (forwardedBrand) {
          return {
            brand: forwardedBrand,
            hostname: normalizedForwardedHost,
            source: 'trusted-original-host',
          };
        }
      }
    }

    // Fall back to x-original-host (legacy)
    if (originalHost) {
      const normalizedOriginalHost =
        normalizeHostHeader(originalHost);

      if (normalizedOriginalHost) {
        const originalBrand =
          resolveBrandFromHostname(
            normalizedOriginalHost,
          );

        if (originalBrand) {
          return {
            brand: originalBrand,
            hostname: normalizedOriginalHost,
            source: 'trusted-original-host',
          };
        }
      }
    }
  }

  const gatewayBrand =
    resolveBrandFromHostname(
      gatewayHostname,
    );

  if (!gatewayBrand) {
    return undefined;
  }

  return {
    brand: gatewayBrand,
    hostname: gatewayHostname,
    source: 'gateway-hostname',
  };
}
