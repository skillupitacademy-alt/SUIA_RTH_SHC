/**
 * ============================================================================
 * CANONICAL BRAND RESOLUTION
 * ============================================================================
 *
 * Single source of truth for hostname → brand mapping.
 *
 * This is the ONLY place where hostname resolution logic should exist.
 * All packages, services, and applications must import from here.
 *
 * SECURITY:
 * - Uses exact hostname matching and DNS suffix boundaries
 * - No substring matching (prevents spoofing attacks)
 * - Unknown hostnames return undefined (no silent fallback)
 *
 * IMPORTANT:
 * - Gateway infrastructure hostname (127.0.0.1:8787) is NOT a brand
 * - localhost without an explicit brand hostname is NOT a brand
 * - Unknown hostnames return undefined
 * - Production matching uses exact hostname / DNS suffix boundaries
 * ============================================================================
 */

import type { Brand } from './brand.types';

/**
 * Normalize a hostname for comparison
 *
 * @param hostname - Raw hostname from request
 * @returns Normalized lowercase hostname without trailing dot
 */
function normalizeHostname(hostname: string): string {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
}

/**
 * Resolve a logical hostname to a brand
 *
 * Uses DNS suffix matching for security. Does not use substring matching.
 *
 * Examples:
 *
 * Local Development:
 *   shc.localhost              -> skillhubcore
 *   skillhubcore.localhost     -> skillhubcore
 *   skillup.localhost          -> skillup
 *   rth.localhost              -> realtutorialhub
 *   realtutorialhub.localhost  -> realtutorialhub
 *   localhost                  -> undefined
 *   127.0.0.1                  -> undefined
 *
 * Production:
 *   skillhubcore.in            -> skillhubcore
 *   quiz.skillhubcore.in       -> skillhubcore
 *   admin.skillhubcore.in      -> skillhubcore
 *
 *   skillupitacademy.com       -> skillup
 *   user.skillupitacademy.com  -> skillup
 *
 *   realtutorialhub.com        -> realtutorialhub
 *   user.realtutorialhub.com   -> realtutorialhub
 *
 * Security (returns undefined):
 *   skillhubcore.in.evil.com   -> undefined
 *   evil-skillhubcore.in       -> undefined
 *   unknown.example.com        -> undefined
 *
 * @param hostname - The request hostname
 * @returns The brand identifier, or undefined if hostname is not recognized
 */
export function resolveBrandFromHostname(
  hostname: string,
): Brand | undefined {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return undefined;
  }

  // --------------------------------------------------------------------------
  // SKILLHUBCORE
  // --------------------------------------------------------------------------

  // SHC Local Development
  if (
    normalized === 'shc.localhost' ||
    normalized === 'skillhubcore.localhost' ||
    normalized.endsWith('.skillhubcore.localhost')
  ) {
    return 'skillhubcore';
  }

  // SHC Production
  if (
    normalized === 'skillhubcore.in' ||
    normalized.endsWith('.skillhubcore.in')
  ) {
    return 'skillhubcore';
  }

  // --------------------------------------------------------------------------
  // SKILLUP
  // --------------------------------------------------------------------------

  // SkillUp Local Development
  if (normalized === 'skillup.localhost') {
    return 'skillup';
  }

  // SkillUp Production
  if (
    normalized === 'skillupitacademy.com' ||
    normalized.endsWith('.skillupitacademy.com')
  ) {
    return 'skillup';
  }

  // --------------------------------------------------------------------------
  // REALTUTORIALHUB
  // --------------------------------------------------------------------------

  // RTH Local Development
  if (normalized === 'rth.localhost' || normalized === 'realtutorialhub.localhost') {
    return 'realtutorialhub';
  }

  // RTH Production
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

/**
 * Extract hostname from a host header, handling port numbers
 *
 * Examples:
 *   skillup.localhost:3009       -> skillup.localhost
 *   user.realtutorialhub.com     -> user.realtutorialhub.com
 *   shc.localhost:3007           -> shc.localhost
 *
 * @param hostHeader - The Host header value
 * @returns The hostname without port, or undefined if invalid
 */
export function extractHostnameFromHostHeader(
  hostHeader: string | null,
): string | undefined {
  if (!hostHeader) {
    return undefined;
  }

  const trimmed = hostHeader.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    // URL requires a scheme to parse host:port correctly
    const parsed = new URL(`http://${trimmed}`);
    return parsed.hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return undefined;
  }
}
