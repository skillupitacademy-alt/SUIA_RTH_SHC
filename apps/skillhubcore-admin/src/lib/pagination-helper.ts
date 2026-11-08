/**
 * Validates and clamps pagination limit parameters across list endpoints.
 * Enforces finite, safe integers within [1, maxLimit] with a documented fallback.
 * Safely handles non-integers, floats, negative numbers, NaN, and extreme values.
 */
export function parsePaginationLimit(
  raw: string | null | undefined,
  fallback = 20,
  maxLimit = 100
): number {
  if (!raw || typeof raw !== 'string') return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const num = Number(trimmed);

  // Reject non-finite, NaN, non-integers (e.g. floats '20.5'), or non-positive numbers
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) {
    return fallback;
  }

  return Math.min(num, maxLimit);
}
