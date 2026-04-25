/**
 * 🔐 AUTH CONFIG — FEATURE FLAGS
 * 
 * Phase 5 Control: Gateway-first architecture with safety controls
 */

export const AUTH_CONFIG = {
  /**
   * Phase 5 Control:
   * false → Gateway ONLY (default)
   * true  → Enable fallback (emergency use)
   */
  ENABLE_FALLBACK: false,

  /**
   * Optional: Fail fast if gateway fails
   * true  → Return 503 immediately on gateway failure
   * false → Allow fallback if enabled
   */
  STRICT_GATEWAY: true,
} as const;