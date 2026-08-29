/**
 * ============================================================================
 * CANONICAL BRAND TYPE
 * ============================================================================
 *
 * Single source of truth for brand identity across the entire platform.
 *
 * This is the ONLY place where the Brand type should be defined.
 * All packages, services, and applications must import from here.
 *
 * IMPORTANT:
 * - Do not create duplicate Brand type definitions elsewhere
 * - Do not modify this without updating all brand-related infrastructure
 * ============================================================================
 */

/**
 * Supported brands in the platform
 */
export const SUPPORTED_BRANDS = [
  'skillup',
  'realtutorialhub',
  'skillhubcore',
] as const;

/**
 * Brand identifier type
 *
 * Represents the three educational platforms:
 * - realtutorialhub: Real Tutorial Hub
 * - skillup: SkillUp IT Academy
 * - skillhubcore: SkillHub Core
 */
export type Brand = (typeof SUPPORTED_BRANDS)[number];

/**
 * Type guard to check if a value is a supported brand
 *
 * @param value - The value to check
 * @returns True if the value is a supported brand
 */
export function isSupportedBrand(
  value: string | undefined | null,
): value is Brand {
  return (
    value === 'skillup' ||
    value === 'realtutorialhub' ||
    value === 'skillhubcore'
  );
}
